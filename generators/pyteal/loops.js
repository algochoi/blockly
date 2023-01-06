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
    repeats = PyTeal.valueToCode(block, 'TIMES', PyTeal.ORDER_NONE) || 'Int(0)';
  }
  // if (stringUtils.isNumber(repeats)) {
  //   repeats = parseInt(repeats, 10);
  // } else {
  //   repeats = 'Int(' + repeats + ')';
  // }
  let branch = PyTeal.pytealStatementToCode(block, 'DO');
  branch = PyTeal.addLoopTrap(branch, block) || 'Reject()';
  const loopVar = PyTeal.nameDB_.getDistinctName('count', NameType.VARIABLE);
  const code = 'count = ScratchVar(TealType.uint64)\nFor(count.store(Int(0)), count.load() < ' + repeats + ', count.store(count.load() + Int(1))).Do(\n' + branch + '\n)';
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
      return xfix + 'Break()\n';
    case 'CONTINUE':
      return xfix + 'Continue()\n';
  }
  throw Error('Unknown flow statement.');
};
