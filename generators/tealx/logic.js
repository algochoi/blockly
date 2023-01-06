/**
 * @license
 * Copyright 2023 @algochoi
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Generating Tealx for logic blocks.
 */
'use strict';

goog.module('Blockly.Tealx.logic');

const {tealxGenerator: Tealx} = goog.require('Blockly.Tealx');

// Constants
// Since TEAL treats true values as int 1 and false values as int 0, alias them:
const TRUE_VALUE = '<int value="1"></int>';
const FALSE_VALUE = '<int value="0"></int>';


Tealx['controls_if'] = function(block) {
  // If/elseif/else condition.
  let n = 0;
  let code = '', branchCode, conditionCode;
  if (Tealx.STATEMENT_PREFIX) {
    // Automatic prefix insertion is switched off for this block.  Add manually.
    code += Tealx.injectId(Tealx.STATEMENT_PREFIX, block);
  }
  do {
    conditionCode =
        Tealx.valueToCode(block, 'IF' + n, Tealx.ORDER_NONE) || FALSE_VALUE;
    branchCode = Tealx.statementToCode(block, 'DO' + n) || Tealx.INDENT + FALSE_VALUE;
    if (Tealx.STATEMENT_SUFFIX) {
      branchCode =
          Tealx.prefixLines(
              Tealx.injectId(Tealx.STATEMENT_SUFFIX, block)) +
          branchCode;
    }
    // If code
    code += (n === 0 ? '<if>' : '<elseif>') + ' <condition> ' + conditionCode + ' </condition>\n'
    // Then code
    code += '<then>\n' + Tealx.INDENT + branchCode + '\n</then>\n';
    n++;
  } while (block.getInput('IF' + n));

  if (block.getInput('ELSE') || Tealx.STATEMENT_SUFFIX) {
    branchCode = Tealx.statementToCode(block, 'ELSE') || Tealx.INDENT + FALSE_VALUE;
    if (Tealx.STATEMENT_SUFFIX) {
      branchCode =
          Tealx.prefixLines(
              Tealx.injectId(Tealx.STATEMENT_SUFFIX, block)) +
          branchCode;
    }
    code += '<else>\n' + Tealx.INDENT + branchCode + '\n</else>\n';
  }
  return code + '</if>';
};

Tealx['controls_ifelse'] = Tealx['controls_if'];

Tealx['logic_compare'] = function(block) {
  // Comparison operator.
  const OPERATORS =
      {'EQ': '<equals>', 'NEQ': '<not-equals>', 'LT': '<less-than>', 'LTE': '<less-or-equal-than>', 'GT': '<greater-than>', 'GTE': '<greater-or-equal-than>'};
  const operator = OPERATORS[block.getFieldValue('OP')];
  const closingOp = operator.slice(0, 1) + '/' + operator.slice(1);
  const order = Tealx.ORDER_RELATIONAL;
  const argument0 = Tealx.valueToCode(block, 'A', order) || FALSE_VALUE;
  const argument1 = Tealx.valueToCode(block, 'B', order) || FALSE_VALUE;
  const code = operator + ' ' + argument0 + argument1 + ' ' + closingOp;
  return [code, order];
};

// Tealx['logic_operation'] = function(block) {
//   // Operations 'and', 'or'.
//   const operator = (block.getFieldValue('OP') === 'AND') ? 'And' : 'Or';
//   const order =
//       (operator === 'and') ? Tealx.ORDER_LOGICAL_AND : Tealx.ORDER_LOGICAL_OR;
//   let argument0 = Tealx.valueToCode(block, 'A', order);
//   let argument1 = Tealx.valueToCode(block, 'B', order);
//   if (!argument0 && !argument1) {
//     // If there are no arguments, then the return value is false.
//     argument0 = 'Int(0)';
//     argument1 = 'Int(0)';
//   } else {
//     // Single missing arguments have no effect on the return value.
//     const defaultArgument = (operator === 'and') ? 'Int(1)' : 'Int(0)';
//     if (!argument0) {
//       argument0 = defaultArgument;
//     }
//     if (!argument1) {
//       argument1 = defaultArgument;
//     }
//   }
//   const code = operator + '(' + argument0 + ', ' + argument1 + ')';
//   return [code, order];
// };

// Tealx['logic_negate'] = function(block) {
//   // Negation.
//   const argument0 =
//       Tealx.valueToCode(block, 'BOOL', Tealx.ORDER_LOGICAL_NOT) || 'Int(1)';
//   const code = 'Not(' + argument0 + ')';
//   return [code, Tealx.ORDER_LOGICAL_NOT];
// };

Tealx['logic_boolean'] = function(block) {
  // Boolean values true and false.
  const code = (block.getFieldValue('BOOL') === 'TRUE') ? TRUE_VALUE : FALSE_VALUE;
  return [code, Tealx.ORDER_ATOMIC];
};
