/**
 * @license
 * Copyright 2023 @algochoi
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
        PyTeal.valueToCode(block, 'IF' + n, PyTeal.ORDER_NONE) || 'Int(0)';
    branchCode = PyTeal.pytealStatementToCode(block, 'DO' + n) || PyTeal.INDENT + 'Reject()';
    if (PyTeal.STATEMENT_SUFFIX) {
      branchCode =
          PyTeal.prefixLines(
              PyTeal.injectId(PyTeal.STATEMENT_SUFFIX, block)) +
          branchCode;
    }
    code += (n === 0 ? 'If(' : 'ElseIf(') + conditionCode + ').Then(\n' + branchCode + '\n)\n';
    n++;
  } while (block.getInput('IF' + n));

  if (block.getInput('ELSE') || PyTeal.STATEMENT_SUFFIX) {
    branchCode = PyTeal.pytealStatementToCode(block, 'ELSE') || PyTeal.INDENT + 'Reject()';
    if (PyTeal.STATEMENT_SUFFIX) {
      branchCode =
          PyTeal.prefixLines(
              PyTeal.injectId(PyTeal.STATEMENT_SUFFIX, block)) +
          branchCode;
    }
    code += '.Else(\n' + branchCode + '\n)\n';
  }
  return code;
};

PyTeal['controls_ifelse'] = PyTeal['controls_if'];

PyTeal['logic_compare'] = function(block) {
  // Comparison operator.
  const OPERATORS =
      {'EQ': 'Eq', 'NEQ': 'Neq', 'LT': 'Lt', 'LTE': 'Le', 'GT': 'Gt', 'GTE': 'Ge'};
  const operator = OPERATORS[block.getFieldValue('OP')];
  const order = PyTeal.ORDER_RELATIONAL;
  const argument0 = PyTeal.valueToCode(block, 'A', order) || 'Int(0)';
  const argument1 = PyTeal.valueToCode(block, 'B', order) || 'Int(0)';
  const code = operator + '(' + argument0 + ', ' + argument1 + ')';
  return [code, order];
};

PyTeal['logic_operation'] = function(block) {
  // Operations 'and', 'or'.
  const operator = (block.getFieldValue('OP') === 'AND') ? 'And' : 'Or';
  const order =
      (operator === 'and') ? PyTeal.ORDER_LOGICAL_AND : PyTeal.ORDER_LOGICAL_OR;
  let argument0 = PyTeal.valueToCode(block, 'A', order);
  let argument1 = PyTeal.valueToCode(block, 'B', order);
  if (!argument0 && !argument1) {
    // If there are no arguments, then the return value is false.
    argument0 = 'Int(0)';
    argument1 = 'Int(0)';
  } else {
    // Single missing arguments have no effect on the return value.
    const defaultArgument = (operator === 'and') ? 'Int(1)' : 'Int(0)';
    if (!argument0) {
      argument0 = defaultArgument;
    }
    if (!argument1) {
      argument1 = defaultArgument;
    }
  }
  const code = operator + '(' + argument0 + ', ' + argument1 + ')';
  return [code, order];
};

PyTeal['logic_negate'] = function(block) {
  // Negation.
  const argument0 =
      PyTeal.valueToCode(block, 'BOOL', PyTeal.ORDER_LOGICAL_NOT) || 'Int(1)';
  const code = 'Not(' + argument0 + ')';
  return [code, PyTeal.ORDER_LOGICAL_NOT];
};

PyTeal['logic_boolean'] = function(block) {
  // Boolean values true and false.
  const code = (block.getFieldValue('BOOL') === 'TRUE') ? 'Int(1)' : 'Int(0)';
  return [code, PyTeal.ORDER_ATOMIC];
};
