/**
 * @license
 * Copyright 2023 @algochoi
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

// Defines a subroutine in PyTeal with a Int return.
// Since blockly is mostly supported for dynamically typed languages,
// we may need a separate blocks to define operations on separate types.
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

// This is an alias for defining a Seq() in PyTeal.
PyTeal['procedures_defnoreturn'] = function(block) {
  const funcName =
      PyTeal.nameDB_.getName(block.getFieldValue('NAME'), NameType.PROCEDURE);
  let branch = PyTeal.pytealStatementToCode(block, 'STACK');

  const args = [];
  const variables = block.getVars();
  for (let i = 0; i < variables.length; i++) {
    args[i] = PyTeal.nameDB_.getName(variables[i], NameType.VARIABLE);
  }

  // Return Seq
  if (!branch.trim()) {
    branch = PyTeal.INDENT + 'Int(0)';
  }
  let code = funcName + ' = Seq(\n' + branch + '\n)\n';
  code += 'print(compileTeal(' + funcName + ', mode=Mode.Application, version=8))'

  code = PyTeal.scrub_(block, code);
  PyTeal.definitions_['%' + funcName] = code;
  return null;
}

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
