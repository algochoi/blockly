/**
 * @license
 * Copyright 2023 @algochoi
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Generating Tealx for math blocks.
 */
'use strict';

goog.module('Blockly.Tealx.math');

const {NameType} = goog.require('Blockly.Names');
const {tealxGenerator: Tealx} = goog.require('Blockly.Tealx');


// If any new block imports any library, add that library name here.
Tealx.addReservedWords('math,random,Number');

Tealx['math_number'] = function(block) {
  // Numeric value.
  let code = '<int value="' + Number(block.getFieldValue('NUM')) + '"></int>';
  const order = code < 0 ? Tealx.ORDER_UNARY_SIGN : Tealx.ORDER_ATOMIC;
  
  return [code, order];
};

Tealx['math_arithmetic'] = function(block) {
  // Basic arithmetic operators, and power.
  const OPERATORS = {
    'ADD': ['<add>', PyTeal.ORDER_ADDITIVE, '</add>'],
    'MINUS': ['<minus>', PyTeal.ORDER_ADDITIVE, '</minus>'],
    'MULTIPLY': ['<mul>', PyTeal.ORDER_MULTIPLICATIVE, '</mul>'],
    'DIVIDE': ['<divide>', PyTeal.ORDER_MULTIPLICATIVE, '</divide>'],
    'POWER': ['<exp>', PyTeal.ORDER_EXPONENTIATION, '</exp>'],
  };
  const tuple = OPERATORS[block.getFieldValue('OP')];
  const operator = tuple[0];
  const order = tuple[1];
  const closingOp = tuple[2];
  const argument0 = Tealx.valueToCode(block, 'A', order) || '<int value="0"></int>';
  const argument1 = Tealx.valueToCode(block, 'B', order) || '<int value="0"></int>';
  const code = operator + argument0 + ' ' + argument1 + closingOp;
  return [code, order];
};

// Tealx['math_single'] = function(block) {
//   // Math operators with single operand.
//   const operator = block.getFieldValue('OP');
//   let code;
//   let arg;
//   if (operator === 'NEG') {
//     // Negation is a special case given its different operator precedence.
//     code = Tealx.valueToCode(block, 'NUM', Tealx.ORDER_UNARY_SIGN) || '0';
//     return ['-' + code, Tealx.ORDER_UNARY_SIGN];
//   }
//   Tealx.definitions_['import_math'] = 'import math';
//   if (operator === 'SIN' || operator === 'COS' || operator === 'TAN') {
//     arg = Tealx.valueToCode(block, 'NUM', Tealx.ORDER_MULTIPLICATIVE) || '0';
//   } else {
//     arg = Tealx.valueToCode(block, 'NUM', Tealx.ORDER_NONE) || '0';
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
//     return [code, Tealx.ORDER_FUNCTION_CALL];
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
//   return [code, Tealx.ORDER_MULTIPLICATIVE];
// };

// Tealx['math_modulo'] = function(block) {
//   // Remainder computation.
//   const argument0 =
//       Tealx.valueToCode(block, 'DIVIDEND', Tealx.ORDER_MULTIPLICATIVE) || '0';
//   const argument1 =
//       Tealx.valueToCode(block, 'DIVISOR', Tealx.ORDER_MULTIPLICATIVE) || '0';
//   const code = 'Mod(' + argument0 + ', ' + argument1 + ')';
//   return [code, Tealx.ORDER_MULTIPLICATIVE];
// };
