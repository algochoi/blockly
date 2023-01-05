/**
 * @license
 * Copyright 2023 @algochoi
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Generating PyTeal for math blocks.
 */
'use strict';

goog.module('Blockly.PyTeal.math');

const {NameType} = goog.require('Blockly.Names');
const {pytealGenerator: PyTeal} = goog.require('Blockly.PyTeal');


// If any new block imports any library, add that library name here.
PyTeal.addReservedWords('math,random,Number');

PyTeal['math_number'] = function(block) {
  // Numeric value.
  let code = 'Int(' + Number(block.getFieldValue('NUM')) + ')';
  const order = code < 0 ? PyTeal.ORDER_UNARY_SIGN : PyTeal.ORDER_ATOMIC;
  
  return [code, order];
};

PyTeal['math_arithmetic'] = function(block) {
  // Basic arithmetic operators, and power.
  const OPERATORS = {
    'ADD': ['Add', PyTeal.ORDER_ADDITIVE],
    'MINUS': ['Minus', PyTeal.ORDER_ADDITIVE],
    'MULTIPLY': ['Mul', PyTeal.ORDER_MULTIPLICATIVE],
    'DIVIDE': ['Div', PyTeal.ORDER_MULTIPLICATIVE],
    'POWER': ['Exp', PyTeal.ORDER_EXPONENTIATION],
  };
  const tuple = OPERATORS[block.getFieldValue('OP')];
  const operator = tuple[0];
  const order = tuple[1];
  const argument0 = PyTeal.valueToCode(block, 'A', order) || '0';
  const argument1 = PyTeal.valueToCode(block, 'B', order) || '0';
  const code = operator + '(' + argument0+ ', ' + argument1 + ')';
  return [code, order];
};

// PyTeal['math_single'] = function(block) {
//   // Math operators with single operand.
//   const operator = block.getFieldValue('OP');
//   let code;
//   let arg;
//   if (operator === 'NEG') {
//     // Negation is a special case given its different operator precedence.
//     code = PyTeal.valueToCode(block, 'NUM', PyTeal.ORDER_UNARY_SIGN) || '0';
//     return ['-' + code, PyTeal.ORDER_UNARY_SIGN];
//   }
//   PyTeal.definitions_['import_math'] = 'import math';
//   if (operator === 'SIN' || operator === 'COS' || operator === 'TAN') {
//     arg = PyTeal.valueToCode(block, 'NUM', PyTeal.ORDER_MULTIPLICATIVE) || '0';
//   } else {
//     arg = PyTeal.valueToCode(block, 'NUM', PyTeal.ORDER_NONE) || '0';
//   }
//   // First, handle cases which generate values that don't need parentheses
//   // wrapping the code.
//   switch (operator) {
//     case 'ABS':
//       code = 'math.fabs(' + arg + ')';
//       break;
//     case 'ROOT':
//       code = 'math.sqrt(' + arg + ')';
//       break;
//     case 'LN':
//       code = 'math.log(' + arg + ')';
//       break;
//     case 'LOG10':
//       code = 'math.log10(' + arg + ')';
//       break;
//     case 'EXP':
//       code = 'math.exp(' + arg + ')';
//       break;
//     case 'POW10':
//       code = 'math.pow(10,' + arg + ')';
//       break;
//     case 'ROUND':
//       code = 'round(' + arg + ')';
//       break;
//     case 'ROUNDUP':
//       code = 'math.ceil(' + arg + ')';
//       break;
//     case 'ROUNDDOWN':
//       code = 'math.floor(' + arg + ')';
//       break;
//     case 'SIN':
//       code = 'math.sin(' + arg + ' / 180.0 * math.pi)';
//       break;
//     case 'COS':
//       code = 'math.cos(' + arg + ' / 180.0 * math.pi)';
//       break;
//     case 'TAN':
//       code = 'math.tan(' + arg + ' / 180.0 * math.pi)';
//       break;
//   }
//   if (code) {
//     return [code, PyTeal.ORDER_FUNCTION_CALL];
//   }
//   // Second, handle cases which generate values that may need parentheses
//   // wrapping the code.
//   switch (operator) {
//     case 'ASIN':
//       code = 'math.asin(' + arg + ') / math.pi * 180';
//       break;
//     case 'ACOS':
//       code = 'math.acos(' + arg + ') / math.pi * 180';
//       break;
//     case 'ATAN':
//       code = 'math.atan(' + arg + ') / math.pi * 180';
//       break;
//     default:
//       throw Error('Unknown math operator: ' + operator);
//   }
//   return [code, PyTeal.ORDER_MULTIPLICATIVE];
// };

PyTeal['math_modulo'] = function(block) {
  // Remainder computation.
  const argument0 =
      PyTeal.valueToCode(block, 'DIVIDEND', PyTeal.ORDER_MULTIPLICATIVE) || '0';
  const argument1 =
      PyTeal.valueToCode(block, 'DIVISOR', PyTeal.ORDER_MULTIPLICATIVE) || '0';
  const code = 'Mod(' + argument0 + ', ' + argument1 + ')';
  return [code, PyTeal.ORDER_MULTIPLICATIVE];
};
