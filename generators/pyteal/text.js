/**
 * @license
 * Copyright 2023 @algochoi
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Generating PyTeal for text blocks.
 */
'use strict';

goog.module('Blockly.PyTeal.texts');

const stringUtils = goog.require('Blockly.utils.string');
const {NameType} = goog.require('Blockly.Names');
const {pytealGenerator: PyTeal} = goog.require('Blockly.PyTeal');


PyTeal['text'] = function(block) {
  // Text value.
  const code = 'Bytes(' + PyTeal.quote_(block.getFieldValue('TEXT')) + ')';
  return [code, PyTeal.ORDER_ATOMIC];
};

/**
 * Regular expression to detect a single-quoted string literal.
 */
const strRegExp = /^\s*'([^']|\\')*'\s*$/;

/**
 * Enclose the provided value in 'str(...)' function.
 * Leave string literals alone.
 * @param {string} value Code evaluating to a value.
 * @return {Array<string|number>} Array containing code evaluating to a string
 *     and
 *    the order of the returned code.[string, number]
 */
const forceString = function(value) {
  if (strRegExp.test(value)) {
    return [value, PyTeal.ORDER_ATOMIC];
  }
  return [value, PyTeal.ORDER_FUNCTION_CALL];
};

PyTeal['text_join'] = function(block) {
  // Create a string made up of any number of elements of any type.
  // Should we allow joining by '-' or ',' or any other characters?
  switch (block.itemCount_) {
    case 0:
      return ['Bytes("")', PyTeal.ORDER_ATOMIC];
    case 1: {
      const element =
          PyTeal.valueToCode(block, 'ADD0', PyTeal.ORDER_NONE) || 'Bytes("")';
      const codeAndOrder = forceString(element);
      return codeAndOrder;
    }
    default: {
      const element0 =
          PyTeal.valueToCode(block, 'ADD0', PyTeal.ORDER_NONE) || 'Bytes("")';
      const element1 =
          PyTeal.valueToCode(block, 'ADD1', PyTeal.ORDER_NONE) || 'Bytes("")';
      const code = 'Concat(' + forceString(element0)[0] + ', ' + forceString(element1)[0] + ')';
      return [code, PyTeal.ORDER_ADDITIVE];
    }
    // TODO: Support multiple Concats

    // default: {
    //   const elements = [];
    //   for (let i = 0; i < block.itemCount_; i++) {
    //     elements[i] =
    //         PyTeal.valueToCode(block, 'ADD' + i, PyTeal.ORDER_NONE) || 'Bytes("")';
    //   }
    //   const tempVar = PyTeal.nameDB_.getDistinctName('x', NameType.VARIABLE);
    //   const code = '\'\'.join([str(' + tempVar + ') for ' + tempVar + ' in [' +
    //       elements.join(', ') + ']])';
    //   return [code, PyTeal.ORDER_FUNCTION_CALL];
    // }
  }
};

PyTeal['text_length'] = function(block) {
  const text = PyTeal.valueToCode(block, 'VALUE', PyTeal.ORDER_NONE) || 'Bytes("")';
  return ['Len(' + text + ')', PyTeal.ORDER_FUNCTION_CALL];
};

PyTeal['text_getSubstring'] = function(block) {
  // Get substring.
  const where1 = block.getFieldValue('WHERE1');
  const where2 = block.getFieldValue('WHERE2');
  const text =
      PyTeal.valueToCode(block, 'STRING', PyTeal.ORDER_MEMBER) || 'Bytes("")';
  let at1;
  switch (where1) {
    case 'FROM_START':
      at1 = PyTeal.getAdjustedInt(block, 'AT1');
      break;
    case 'FROM_END':
    case 'FIRST':
      throw Error('Unsupported in PyTeal: (text_getSubstring)');
    default:
      throw Error('Unhandled option (text_getSubstring)');
  }

  let at2;
  switch (where2) {
    case 'FROM_START':
      at2 = PyTeal.getAdjustedInt(block, 'AT2');
      break;
    case 'FROM_END':
    case 'FIRST':
      throw Error('Unsupported in PyTeal: (text_getSubstring)');
    default:
      throw Error('Unhandled option (text_getSubstring)');
  }
  const code = 'Substring(' + text + ', ' + at1 + ', ' + at2 + ')';
  return [code, PyTeal.ORDER_MEMBER];
};

// No-op statement
// If the message is either "APPROVE" or "REJECT", then it is interpreted as
// an Approve() and Reject() statement in PyTeal, respectively. 
// Otherwise, it will be interpreted as a Log(Bytes(msg)).
PyTeal['text_print'] = function(block) {
  // Print statement.
  const msg = PyTeal.valueToCode(block, 'TEXT', PyTeal.ORDER_NONE) || 'Bytes("")';
  if (msg.includes('APPROVE')) {
    return 'Approve()\n';
  } else if (msg.includes('REJECT')) {
    return 'Reject()\n';
  }
  return 'Log(' + msg + ')\n';
};

// Override to Btoi opcode
PyTeal['text_isEmpty'] = function(block) {
  // Is the string null or array empty?
  const text = PyTeal.valueToCode(block, 'VALUE', PyTeal.ORDER_NONE) || 'Bytes("")';
  const code = 'Btoi(' + text + ')';
  return [code, PyTeal.ORDER_LOGICAL_NOT];
};

PyTeal['text_prompt'] = PyTeal['text_prompt_ext'];
