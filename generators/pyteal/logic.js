/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Generating PyTeal for logic blocks.
 */
'use strict';

goog.module('Blockly.PyTeal.logic');

const {pytealGenerator: PyTeal} = goog.require('Blockly.PyTeal');


PyTeal['controls_if'] = function(block) {
  // If/elseif/else condition.
  let n = 0;
  let code = '', branchCode, conditionCode;
  if (PyTeal.STATEMENT_PREFIX) {
    // Automatic prefix insertion is switched off for this block.  Add manually.
    code += PyTeal.injectId(PyTeal.STATEMENT_PREFIX, block);
  }
  do {
    conditionCode =
        PyTeal.valueToCode(block, 'IF' + n, PyTeal.ORDER_NONE) || 'False';
    branchCode = PyTeal.statementToCode(block, 'DO' + n) || PyTeal.PASS;
    if (PyTeal.STATEMENT_SUFFIX) {
      branchCode =
          PyTeal.prefixLines(
              PyTeal.injectId(PyTeal.STATEMENT_SUFFIX, block), PyTeal.INDENT) +
          branchCode;
    }
    code += (n === 0 ? 'if ' : 'elif ') + conditionCode + ':\n' + branchCode;
    n++;
  } while (block.getInput('IF' + n));

  if (block.getInput('ELSE') || PyTeal.STATEMENT_SUFFIX) {
    branchCode = PyTeal.statementToCode(block, 'ELSE') || PyTeal.PASS;
    if (PyTeal.STATEMENT_SUFFIX) {
      branchCode =
          PyTeal.prefixLines(
              PyTeal.injectId(PyTeal.STATEMENT_SUFFIX, block), PyTeal.INDENT) +
          branchCode;
    }
    code += 'else:\n' + branchCode;
  }
  return code;
};

PyTeal['controls_ifelse'] = PyTeal['controls_if'];

PyTeal['logic_compare'] = function(block) {
  // Comparison operator.
  const OPERATORS =
      {'EQ': '==', 'NEQ': '!=', 'LT': '<', 'LTE': '<=', 'GT': '>', 'GTE': '>='};
  const operator = OPERATORS[block.getFieldValue('OP')];
  const order = PyTeal.ORDER_RELATIONAL;
  const argument0 = PyTeal.valueToCode(block, 'A', order) || '0';
  const argument1 = PyTeal.valueToCode(block, 'B', order) || '0';
  const code = argument0 + ' ' + operator + ' ' + argument1;
  return [code, order];
};

PyTeal['logic_operation'] = function(block) {
  // Operations 'and', 'or'.
  const operator = (block.getFieldValue('OP') === 'AND') ? 'and' : 'or';
  const order =
      (operator === 'and') ? PyTeal.ORDER_LOGICAL_AND : PyTeal.ORDER_LOGICAL_OR;
  let argument0 = PyTeal.valueToCode(block, 'A', order);
  let argument1 = PyTeal.valueToCode(block, 'B', order);
  if (!argument0 && !argument1) {
    // If there are no arguments, then the return value is false.
    argument0 = 'False';
    argument1 = 'False';
  } else {
    // Single missing arguments have no effect on the return value.
    const defaultArgument = (operator === 'and') ? 'True' : 'False';
    if (!argument0) {
      argument0 = defaultArgument;
    }
    if (!argument1) {
      argument1 = defaultArgument;
    }
  }
  const code = argument0 + ' ' + operator + ' ' + argument1;
  return [code, order];
};

PyTeal['logic_negate'] = function(block) {
  // Negation.
  const argument0 =
      PyTeal.valueToCode(block, 'BOOL', PyTeal.ORDER_LOGICAL_NOT) || 'True';
  const code = 'not ' + argument0;
  return [code, PyTeal.ORDER_LOGICAL_NOT];
};

PyTeal['logic_boolean'] = function(block) {
  // Boolean values true and false.
  const code = (block.getFieldValue('BOOL') === 'TRUE') ? 'True' : 'False';
  return [code, PyTeal.ORDER_ATOMIC];
};

PyTeal['logic_null'] = function(block) {
  // Null data type.
  return ['None', PyTeal.ORDER_ATOMIC];
};

PyTeal['logic_ternary'] = function(block) {
  // Ternary operator.
  const value_if =
      PyTeal.valueToCode(block, 'IF', PyTeal.ORDER_CONDITIONAL) || 'False';
  const value_then =
      PyTeal.valueToCode(block, 'THEN', PyTeal.ORDER_CONDITIONAL) || 'None';
  const value_else =
      PyTeal.valueToCode(block, 'ELSE', PyTeal.ORDER_CONDITIONAL) || 'None';
  const code = value_then + ' if ' + value_if + ' else ' + value_else;
  return [code, PyTeal.ORDER_CONDITIONAL];
};
