/**
 * @license
 * Copyright 2023 @algochoi
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Generating Tealx for text blocks.
 */
'use strict';

goog.module('Blockly.Tealx.texts');

const stringUtils = goog.require('Blockly.utils.string');
const {NameType} = goog.require('Blockly.Names');
const {tealxGenerator: Tealx} = goog.require('Blockly.Tealx');


Tealx['text'] = function(block) {
  // Text value.
  const code = '<bytes value="' + (block.getFieldValue('TEXT')) + '" format="utf-8" />';
  return [code, Tealx.ORDER_ATOMIC];
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
    return [value, Tealx.ORDER_ATOMIC];
  }
  return [value, Tealx.ORDER_FUNCTION_CALL];
};

Tealx['text_join'] = function(block) {
  // Create a string made up of any number of elements of any type.
  // Should we allow joining by '-' or ',' or any other characters?
  switch (block.itemCount_) {
    case 0:
      return ['Bytes("")', Tealx.ORDER_ATOMIC];
    case 1: {
      const element =
          Tealx.valueToCode(block, 'ADD0', Tealx.ORDER_NONE) || 'Bytes("")';
      const codeAndOrder = forceString(element);
      return codeAndOrder;
    }
    default: {
      const element0 =
          Tealx.valueToCode(block, 'ADD0', Tealx.ORDER_NONE) || 'Bytes("")';
      const element1 =
          Tealx.valueToCode(block, 'ADD1', Tealx.ORDER_NONE) || 'Bytes("")';
      const code = 'Concat(' + forceString(element0)[0] + ', ' + forceString(element1)[0] + ')';
      return [code, Tealx.ORDER_ADDITIVE];
    }
    // TODO: Support multiple Concats

    // default: {
    //   const elements = [];
    //   for (let i = 0; i < block.itemCount_; i++) {
    //     elements[i] =
    //         Tealx.valueToCode(block, 'ADD' + i, Tealx.ORDER_NONE) || 'Bytes("")';
    //   }
    //   const tempVar = Tealx.nameDB_.getDistinctName('x', NameType.VARIABLE);
    //   const code = '\'\'.join([str(' + tempVar + ') for ' + tempVar + ' in [' +
    //       elements.join(', ') + ']])';
    //   return [code, Tealx.ORDER_FUNCTION_CALL];
    // }
  }
};

Tealx['text_length'] = function(block) {
  // Is the string null or array empty?
  const text = Tealx.valueToCode(block, 'VALUE', Tealx.ORDER_NONE) || 'Bytes("")';
  return ['Len(' + text + ')', Tealx.ORDER_FUNCTION_CALL];
};

Tealx['text_getSubstring'] = function(block) {
  // Get substring.
  const where1 = block.getFieldValue('WHERE1');
  const where2 = block.getFieldValue('WHERE2');
  const text =
      Tealx.valueToCode(block, 'STRING', Tealx.ORDER_MEMBER) || 'Bytes("")';
  let at1;
  switch (where1) {
    case 'FROM_START':
      at1 = Tealx.getAdjustedInt(block, 'AT1');
      break;
    case 'FROM_END':
    case 'FIRST':
      throw Error('Unsupported in Tealx: (text_getSubstring)');
    default:
      throw Error('Unhandled option (text_getSubstring)');
  }

  let at2;
  switch (where2) {
    case 'FROM_START':
      at2 = Tealx.getAdjustedInt(block, 'AT2');
      break;
    case 'FROM_END':
    case 'FIRST':
      throw Error('Unsupported in Tealx: (text_getSubstring)');
    default:
      throw Error('Unhandled option (text_getSubstring)');
  }
  const code = 'Substring(' + text + ', ' + at1 + ', ' + at2 + ')';
  return [code, Tealx.ORDER_MEMBER];
};

Tealx['text_print'] = function(block) {
  // Print statement.
  const msg = Tealx.valueToCode(block, 'TEXT', Tealx.ORDER_NONE) || 'Bytes("")';
  return '<log>' + msg + '</log>\n';
};

Tealx['text_prompt_ext'] = function(block) {
  // Prompt function.
  const functionName = Tealx.provideFunction_('text_prompt', `
def ${Tealx.FUNCTION_NAME_PLACEHOLDER_}(msg):
  try:
    return raw_input(msg)
  except NameError:
    return input(msg)
`);
  let msg;
  if (block.getField('TEXT')) {
    // Internal message.
    msg = Tealx.quote_(block.getFieldValue('TEXT'));
  } else {
    // External message.
    msg = Tealx.valueToCode(block, 'TEXT', Tealx.ORDER_NONE) || 'Bytes("")';
  }
  let code = functionName + '(' + msg + ')';
  const toNumber = block.getFieldValue('TYPE') === 'NUMBER';
  if (toNumber) {
    code = 'float(' + code + ')';
  }
  return [code, Tealx.ORDER_FUNCTION_CALL];
};

Tealx['text_isEmpty'] = function(block) {
  // Is the string null or array empty?
  const text = Tealx.valueToCode(block, 'VALUE', Tealx.ORDER_NONE) || 'Bytes("")';
  const code = 'Btoi(' + text + ')';
  return [code, Tealx.ORDER_LOGICAL_NOT];
};

Tealx['text_prompt'] = Tealx['text_prompt_ext'];
