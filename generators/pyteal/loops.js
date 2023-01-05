/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Generating PyTeal for loop blocks.
 */
'use strict';

goog.module('Blockly.PyTeal.loops');

const stringUtils = goog.require('Blockly.utils.string');
const {NameType} = goog.require('Blockly.Names');
const {pytealGenerator: PyTeal} = goog.require('Blockly.PyTeal');


PyTeal['controls_repeat_ext'] = function(block) {
  // Repeat n times.
  let repeats;
  if (block.getField('TIMES')) {
    // Internal number.
    repeats = String(parseInt(block.getFieldValue('TIMES'), 10));
  } else {
    // External number.
    repeats = PyTeal.valueToCode(block, 'TIMES', PyTeal.ORDER_NONE) || '0';
  }
  if (stringUtils.isNumber(repeats)) {
    repeats = parseInt(repeats, 10);
  } else {
    repeats = 'int(' + repeats + ')';
  }
  let branch = PyTeal.statementToCode(block, 'DO');
  branch = PyTeal.addLoopTrap(branch, block) || PyTeal.PASS;
  const loopVar = PyTeal.nameDB_.getDistinctName('count', NameType.VARIABLE);
  const code = 'for ' + loopVar + ' in range(' + repeats + '):\n' + branch;
  return code;
};

PyTeal['controls_repeat'] = PyTeal['controls_repeat_ext'];

PyTeal['controls_whileUntil'] = function(block) {
  // Do while/until loop.
  const until = block.getFieldValue('MODE') === 'UNTIL';
  let argument0 = PyTeal.valueToCode(
                      block, 'BOOL',
                      until ? PyTeal.ORDER_LOGICAL_NOT : PyTeal.ORDER_NONE) ||
      'False';
  let branch = PyTeal.statementToCode(block, 'DO');
  branch = PyTeal.addLoopTrap(branch, block) || PyTeal.PASS;
  if (until) {
    argument0 = 'not ' + argument0;
  }
  return 'while ' + argument0 + ':\n' + branch;
};

PyTeal['controls_for'] = function(block) {
  // For loop.
  const variable0 =
      PyTeal.nameDB_.getName(block.getFieldValue('VAR'), NameType.VARIABLE);
  let argument0 = PyTeal.valueToCode(block, 'FROM', PyTeal.ORDER_NONE) || '0';
  let argument1 = PyTeal.valueToCode(block, 'TO', PyTeal.ORDER_NONE) || '0';
  let increment = PyTeal.valueToCode(block, 'BY', PyTeal.ORDER_NONE) || '1';
  let branch = PyTeal.statementToCode(block, 'DO');
  branch = PyTeal.addLoopTrap(branch, block) || PyTeal.PASS;

  let code = '';
  let range;

  // Helper functions.
  const defineUpRange = function() {
    return PyTeal.provideFunction_('upRange', `
def ${PyTeal.FUNCTION_NAME_PLACEHOLDER_}(start, stop, step):
  while start <= stop:
    yield start
    start += abs(step)
`);
  };
  const defineDownRange = function() {
    return PyTeal.provideFunction_('downRange', `
def ${PyTeal.FUNCTION_NAME_PLACEHOLDER_}(start, stop, step):
  while start >= stop:
    yield start
    start -= abs(step)
`);
  };
  // Arguments are legal PyTeal code (numbers or strings returned by scrub()).
  const generateUpDownRange = function(start, end, inc) {
    return '(' + start + ' <= ' + end + ') and ' + defineUpRange() + '(' +
        start + ', ' + end + ', ' + inc + ') or ' + defineDownRange() + '(' +
        start + ', ' + end + ', ' + inc + ')';
  };

  if (stringUtils.isNumber(argument0) && stringUtils.isNumber(argument1) &&
      stringUtils.isNumber(increment)) {
    // All parameters are simple numbers.
    argument0 = Number(argument0);
    argument1 = Number(argument1);
    increment = Math.abs(Number(increment));
    if (argument0 % 1 === 0 && argument1 % 1 === 0 && increment % 1 === 0) {
      // All parameters are integers.
      if (argument0 <= argument1) {
        // Count up.
        argument1++;
        if (argument0 === 0 && increment === 1) {
          // If starting index is 0, omit it.
          range = argument1;
        } else {
          range = argument0 + ', ' + argument1;
        }
        // If increment isn't 1, it must be explicit.
        if (increment !== 1) {
          range += ', ' + increment;
        }
      } else {
        // Count down.
        argument1--;
        range = argument0 + ', ' + argument1 + ', -' + increment;
      }
      range = 'range(' + range + ')';
    } else {
      // At least one of the parameters is not an integer.
      if (argument0 < argument1) {
        range = defineUpRange();
      } else {
        range = defineDownRange();
      }
      range += '(' + argument0 + ', ' + argument1 + ', ' + increment + ')';
    }
  } else {
    // Cache non-trivial values to variables to prevent repeated look-ups.
    const scrub = function(arg, suffix) {
      if (stringUtils.isNumber(arg)) {
        // Simple number.
        arg = Number(arg);
      } else if (!arg.match(/^\w+$/)) {
        // Not a variable, it's complicated.
        const varName = PyTeal.nameDB_.getDistinctName(
            variable0 + suffix, NameType.VARIABLE);
        code += varName + ' = ' + arg + '\n';
        arg = varName;
      }
      return arg;
    };
    const startVar = scrub(argument0, '_start');
    const endVar = scrub(argument1, '_end');
    const incVar = scrub(increment, '_inc');

    if (typeof startVar === 'number' && typeof endVar === 'number') {
      if (startVar < endVar) {
        range = defineUpRange();
      } else {
        range = defineDownRange();
      }
      range += '(' + startVar + ', ' + endVar + ', ' + incVar + ')';
    } else {
      // We cannot determine direction statically.
      range = generateUpDownRange(startVar, endVar, incVar);
    }
  }
  code += 'for ' + variable0 + ' in ' + range + ':\n' + branch;
  return code;
};

PyTeal['controls_forEach'] = function(block) {
  // For each loop.
  const variable0 =
      PyTeal.nameDB_.getName(block.getFieldValue('VAR'), NameType.VARIABLE);
  const argument0 =
      PyTeal.valueToCode(block, 'LIST', PyTeal.ORDER_RELATIONAL) || '[]';
  let branch = PyTeal.statementToCode(block, 'DO');
  branch = PyTeal.addLoopTrap(branch, block) || PyTeal.PASS;
  const code = 'for ' + variable0 + ' in ' + argument0 + ':\n' + branch;
  return code;
};

PyTeal['controls_flow_statements'] = function(block) {
  // Flow statements: continue, break.
  let xfix = '';
  if (PyTeal.STATEMENT_PREFIX) {
    // Automatic prefix insertion is switched off for this block.  Add manually.
    xfix += PyTeal.injectId(PyTeal.STATEMENT_PREFIX, block);
  }
  if (PyTeal.STATEMENT_SUFFIX) {
    // Inject any statement suffix here since the regular one at the end
    // will not get executed if the break/continue is triggered.
    xfix += PyTeal.injectId(PyTeal.STATEMENT_SUFFIX, block);
  }
  if (PyTeal.STATEMENT_PREFIX) {
    const loop = block.getSurroundLoop();
    if (loop && !loop.suppressPrefixSuffix) {
      // Inject loop's statement prefix here since the regular one at the end
      // of the loop will not get executed if 'continue' is triggered.
      // In the case of 'break', a prefix is needed due to the loop's suffix.
      xfix += PyTeal.injectId(PyTeal.STATEMENT_PREFIX, loop);
    }
  }
  switch (block.getFieldValue('FLOW')) {
    case 'BREAK':
      return xfix + 'break\n';
    case 'CONTINUE':
      return xfix + 'continue\n';
  }
  throw Error('Unknown flow statement.');
};
