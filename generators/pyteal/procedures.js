/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Generating PyTeal for procedure blocks.
 */
'use strict';

goog.module('Blockly.PyTeal.procedures');

const Variables = goog.require('Blockly.Variables');
const {NameType} = goog.require('Blockly.Names');
const {pytealGenerator: PyTeal} = goog.require('Blockly.PyTeal');


PyTeal['procedures_defreturn'] = function(block){
  // Define a procedure with a return value.
  const funcName =
      PyTeal.nameDB_.getName(block.getFieldValue('NAME'), NameType.PROCEDURE);
  let xfix1 = '';
  if (PyTeal.STATEMENT_PREFIX) {
    xfix1 += PyTeal.injectId(PyTeal.STATEMENT_PREFIX, block);
  }
  if (PyTeal.STATEMENT_SUFFIX) {
    xfix1 += PyTeal.injectId(PyTeal.STATEMENT_SUFFIX, block);
  }
  if (xfix1) {
    xfix1 = PyTeal.prefixLines(xfix1, PyTeal.INDENT);
  }
  let loopTrap = '';
  if (PyTeal.INFINITE_LOOP_TRAP) {
    loopTrap = PyTeal.prefixLines(
        PyTeal.injectId(PyTeal.INFINITE_LOOP_TRAP, block), PyTeal.INDENT);
  }
  let branch = PyTeal.statementToCode(block, 'STACK');
  let returnValue =
      PyTeal.valueToCode(block, 'RETURN', PyTeal.ORDER_NONE) || '';
  let xfix2 = '';
  if (branch && returnValue) {
    // After executing the function body, revisit this block for the return.
    xfix2 = xfix1;
  }
  if (returnValue) {
    returnValue = PyTeal.INDENT + 'return ' + returnValue + '\n';
  } else if (!branch) {
    branch = PyTeal.PASS;
  }
  const args = [];
  const variables = block.getVars();
  for (let i = 0; i < variables.length; i++) {
    args[i] = PyTeal.nameDB_.getName(variables[i], NameType.VARIABLE);
  }
  let code = '@Subroutine(TealType.uint64)\n' + 
      'def ' + funcName + '(' + args.join(', ') + '):\n' +
      xfix1 + loopTrap + branch + xfix2 + returnValue;
  code = PyTeal.scrub_(block, code);
  // Add % so as not to collide with helper functions in definitions list.
  PyTeal.definitions_['%' + funcName] = code;
  return null;
};

// Defining a procedure without a return value uses the same generator as
// a procedure with a return value.
PyTeal['procedures_defnoreturn'] = PyTeal['procedures_defreturn'];

PyTeal['procedures_callreturn'] = function(block) {
  // Call a procedure with a return value.
  const funcName =
      PyTeal.nameDB_.getName(block.getFieldValue('NAME'), NameType.PROCEDURE);
  const args = [];
  const variables = block.getVars();
  for (let i = 0; i < variables.length; i++) {
    args[i] = PyTeal.valueToCode(block, 'ARG' + i, PyTeal.ORDER_NONE) || 'None';
  }
  const code = funcName + '(' + args.join(', ') + ')';
  return [code, PyTeal.ORDER_FUNCTION_CALL];
};

PyTeal['procedures_callnoreturn'] = function(block) {
  // Call a procedure with no return value.
  // Generated code is for a function call as a statement is the same as a
  // function call as a value, with the addition of line ending.
  const tuple = PyTeal['procedures_callreturn'](block);
  return tuple[0] + '\n';
};

PyTeal['procedures_ifreturn'] = function(block) {
  // Conditionally return value from a procedure.
  const condition =
      PyTeal.valueToCode(block, 'CONDITION', PyTeal.ORDER_NONE) || 'False';
  let code = 'if ' + condition + ':\n';
  if (PyTeal.STATEMENT_SUFFIX) {
    // Inject any statement suffix here since the regular one at the end
    // will not get executed if the return is triggered.
    code += PyTeal.prefixLines(
        PyTeal.injectId(PyTeal.STATEMENT_SUFFIX, block), PyTeal.INDENT);
  }
  if (block.hasReturnValue_) {
    const value =
        PyTeal.valueToCode(block, 'VALUE', PyTeal.ORDER_NONE) || 'None';
    code += PyTeal.INDENT + 'return ' + value + '\n';
  } else {
    code += PyTeal.INDENT + 'return\n';
  }
  return code;
};
