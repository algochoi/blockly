/**
 * @license
 * Copyright 2012 Google LLC
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
      return ["''", PyTeal.ORDER_ATOMIC];
    case 1: {
      const element =
          PyTeal.valueToCode(block, 'ADD0', PyTeal.ORDER_NONE) || "''";
      const codeAndOrder = forceString(element);
      return codeAndOrder;
    }
    default: {
      const element0 =
          PyTeal.valueToCode(block, 'ADD0', PyTeal.ORDER_NONE) || "''";
      const element1 =
          PyTeal.valueToCode(block, 'ADD1', PyTeal.ORDER_NONE) || "''";
      const code = 'Concat(' + forceString(element0)[0] + ', ' + forceString(element1)[0] + ')';
      return [code, PyTeal.ORDER_ADDITIVE];
    }
    // TODO: Support multiple Concats
    // default: {
    //   const elements = [];
    //   for (let i = 0; i < block.itemCount_; i++) {
    //     elements[i] =
    //         PyTeal.valueToCode(block, 'ADD' + i, PyTeal.ORDER_NONE) || "''";
    //   }
    //   const tempVar = PyTeal.nameDB_.getDistinctName('x', NameType.VARIABLE);
    //   const code = '\'\'.join([str(' + tempVar + ') for ' + tempVar + ' in [' +
    //       elements.join(', ') + ']])';
    //   return [code, PyTeal.ORDER_FUNCTION_CALL];
    // }
  }
};

PyTeal['text_length'] = function(block) {
  // Is the string null or array empty?
  const text = PyTeal.valueToCode(block, 'VALUE', PyTeal.ORDER_NONE) || "''";
  return ['Len(' + text + ')', PyTeal.ORDER_FUNCTION_CALL];
};

PyTeal['text_indexOf'] = function(block) {
  // Search the text for a substring.
  // Should we allow for non-case sensitive???
  const operator = block.getFieldValue('END') === 'FIRST' ? 'find' : 'rfind';
  const substring =
      PyTeal.valueToCode(block, 'FIND', PyTeal.ORDER_NONE) || "''";
  const text =
      PyTeal.valueToCode(block, 'VALUE', PyTeal.ORDER_MEMBER) || "''";
  const code = text + '.' + operator + '(' + substring + ')';
  if (block.workspace.options.oneBasedIndex) {
    return [code + ' + 1', PyTeal.ORDER_ADDITIVE];
  }
  return [code, PyTeal.ORDER_FUNCTION_CALL];
};

PyTeal['text_charAt'] = function(block) {
  // Get letter at index.
  // Note: Until January 2013 this block did not have the WHERE input.
  const where = block.getFieldValue('WHERE') || 'FROM_START';
  const textOrder =
      (where === 'RANDOM') ? PyTeal.ORDER_NONE : PyTeal.ORDER_MEMBER;
  const text = PyTeal.valueToCode(block, 'VALUE', textOrder) || "''";
  switch (where) {
    case 'FIRST': {
      const code = text + '[0]';
      return [code, PyTeal.ORDER_MEMBER];
    }
    case 'LAST': {
      const code = text + '[-1]';
      return [code, PyTeal.ORDER_MEMBER];
    }
    case 'FROM_START': {
      const at = PyTeal.getAdjustedInt(block, 'AT');
      const code = text + '[' + at + ']';
      return [code, PyTeal.ORDER_MEMBER];
    }
    case 'FROM_END': {
      const at = PyTeal.getAdjustedInt(block, 'AT', 1, true);
      const code = text + '[' + at + ']';
      return [code, PyTeal.ORDER_MEMBER];
    }
    case 'RANDOM': {
      PyTeal.definitions_['import_random'] = 'import random';
      const functionName = PyTeal.provideFunction_('text_random_letter', `
def ${PyTeal.FUNCTION_NAME_PLACEHOLDER_}(text):
  x = int(random.random() * len(text))
  return text[x]
`);
      const code = functionName + '(' + text + ')';
      return [code, PyTeal.ORDER_FUNCTION_CALL];
    }
  }
  throw Error('Unhandled option (text_charAt).');
};

PyTeal['text_getSubstring'] = function(block) {
  // Get substring.
  const where1 = block.getFieldValue('WHERE1');
  const where2 = block.getFieldValue('WHERE2');
  const text =
      PyTeal.valueToCode(block, 'STRING', PyTeal.ORDER_MEMBER) || "''";
  let at1;
  switch (where1) {
    case 'FROM_START':
      at1 = PyTeal.getAdjustedInt(block, 'AT1');
      if (at1 === 0) {
        at1 = '';
      }
      break;
    case 'FROM_END':
      at1 = PyTeal.getAdjustedInt(block, 'AT1', 1, true);
      break;
    case 'FIRST':
      at1 = '';
      break;
    default:
      throw Error('Unhandled option (text_getSubstring)');
  }

  let at2;
  switch (where2) {
    case 'FROM_START':
      at2 = PyTeal.getAdjustedInt(block, 'AT2', 1);
      break;
    case 'FROM_END':
      at2 = PyTeal.getAdjustedInt(block, 'AT2', 0, true);
      // Ensure that if the result calculated is 0 that sub-sequence will
      // include all elements as expected.
      if (!stringUtils.isNumber(String(at2))) {
        PyTeal.definitions_['import_sys'] = 'import sys';
        at2 += ' or sys.maxsize';
      } else if (at2 === 0) {
        at2 = '';
      }
      break;
    case 'LAST':
      at2 = '';
      break;
    default:
      throw Error('Unhandled option (text_getSubstring)');
  }
  const code = text + '[' + at1 + ' : ' + at2 + ']';
  return [code, PyTeal.ORDER_MEMBER];
};

PyTeal['text_changeCase'] = function(block) {
  // Change capitalization.
  const OPERATORS = {
    'UPPERCASE': '.upper()',
    'LOWERCASE': '.lower()',
    'TITLECASE': '.title()'
  };
  const operator = OPERATORS[block.getFieldValue('CASE')];
  const text = PyTeal.valueToCode(block, 'TEXT', PyTeal.ORDER_MEMBER) || "''";
  const code = text + operator;
  return [code, PyTeal.ORDER_FUNCTION_CALL];
};

PyTeal['text_trim'] = function(block) {
  // Trim spaces.
  const OPERATORS = {
    'LEFT': '.lstrip()',
    'RIGHT': '.rstrip()',
    'BOTH': '.strip()'
  };
  const operator = OPERATORS[block.getFieldValue('MODE')];
  const text = PyTeal.valueToCode(block, 'TEXT', PyTeal.ORDER_MEMBER) || "''";
  const code = text + operator;
  return [code, PyTeal.ORDER_FUNCTION_CALL];
};

PyTeal['text_print'] = function(block) {
  // Print statement.
  const msg = PyTeal.valueToCode(block, 'TEXT', PyTeal.ORDER_NONE) || "''";
  return 'print(' + msg + ')\n';
};

PyTeal['text_prompt_ext'] = function(block) {
  // Prompt function.
  const functionName = PyTeal.provideFunction_('text_prompt', `
def ${PyTeal.FUNCTION_NAME_PLACEHOLDER_}(msg):
  try:
    return raw_input(msg)
  except NameError:
    return input(msg)
`);
  let msg;
  if (block.getField('TEXT')) {
    // Internal message.
    msg = PyTeal.quote_(block.getFieldValue('TEXT'));
  } else {
    // External message.
    msg = PyTeal.valueToCode(block, 'TEXT', PyTeal.ORDER_NONE) || "''";
  }
  let code = functionName + '(' + msg + ')';
  const toNumber = block.getFieldValue('TYPE') === 'NUMBER';
  if (toNumber) {
    code = 'float(' + code + ')';
  }
  return [code, PyTeal.ORDER_FUNCTION_CALL];
};

PyTeal['text_prompt'] = PyTeal['text_prompt_ext'];

PyTeal['text_count'] = function(block) {
  const text = PyTeal.valueToCode(block, 'TEXT', PyTeal.ORDER_MEMBER) || "''";
  const sub = PyTeal.valueToCode(block, 'SUB', PyTeal.ORDER_NONE) || "''";
  const code = text + '.count(' + sub + ')';
  return [code, PyTeal.ORDER_FUNCTION_CALL];
};

PyTeal['text_replace'] = function(block) {
  const text = PyTeal.valueToCode(block, 'TEXT', PyTeal.ORDER_MEMBER) || "''";
  const from = PyTeal.valueToCode(block, 'FROM', PyTeal.ORDER_NONE) || "''";
  const to = PyTeal.valueToCode(block, 'TO', PyTeal.ORDER_NONE) || "''";
  const code = text + '.replace(' + from + ', ' + to + ')';
  return [code, PyTeal.ORDER_MEMBER];
};

PyTeal['text_reverse'] = function(block) {
  const text = PyTeal.valueToCode(block, 'TEXT', PyTeal.ORDER_MEMBER) || "''";
  const code = text + '[::-1]';
  return [code, PyTeal.ORDER_MEMBER];
};
