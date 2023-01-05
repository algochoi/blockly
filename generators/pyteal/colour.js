/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Generating PyTeal for colour blocks.
 */
'use strict';

goog.module('Blockly.PyTeal.colour');

const {pytealGenerator: PyTeal} = goog.require('Blockly.PyTeal');


PyTeal['colour_picker'] = function(block) {
  // Colour picker.
  const code = PyTeal.quote_(block.getFieldValue('COLOUR'));
  return [code, PyTeal.ORDER_ATOMIC];
};

PyTeal['colour_random'] = function(block) {
  // Generate a random colour.
  PyTeal.definitions_['import_random'] = 'import random';
  const code = '\'#%06x\' % random.randint(0, 2**24 - 1)';
  return [code, PyTeal.ORDER_FUNCTION_CALL];
};

PyTeal['colour_rgb'] = function(block) {
  // Compose a colour from RGB components expressed as percentages.
  const functionName = PyTeal.provideFunction_('colour_rgb', `
def ${PyTeal.FUNCTION_NAME_PLACEHOLDER_}(r, g, b):
  r = round(min(100, max(0, r)) * 2.55)
  g = round(min(100, max(0, g)) * 2.55)
  b = round(min(100, max(0, b)) * 2.55)
  return '#%02x%02x%02x' % (r, g, b)
`);
  const r = PyTeal.valueToCode(block, 'RED', PyTeal.ORDER_NONE) || 0;
  const g = PyTeal.valueToCode(block, 'GREEN', PyTeal.ORDER_NONE) || 0;
  const b = PyTeal.valueToCode(block, 'BLUE', PyTeal.ORDER_NONE) || 0;
  const code = functionName + '(' + r + ', ' + g + ', ' + b + ')';
  return [code, PyTeal.ORDER_FUNCTION_CALL];
};

PyTeal['colour_blend'] = function(block) {
  // Blend two colours together.
  const functionName = PyTeal.provideFunction_('colour_blend', `
def ${PyTeal.FUNCTION_NAME_PLACEHOLDER_}(colour1, colour2, ratio):
  r1, r2 = int(colour1[1:3], 16), int(colour2[1:3], 16)
  g1, g2 = int(colour1[3:5], 16), int(colour2[3:5], 16)
  b1, b2 = int(colour1[5:7], 16), int(colour2[5:7], 16)
  ratio = min(1, max(0, ratio))
  r = round(r1 * (1 - ratio) + r2 * ratio)
  g = round(g1 * (1 - ratio) + g2 * ratio)
  b = round(b1 * (1 - ratio) + b2 * ratio)
  return '#%02x%02x%02x' % (r, g, b)
`);
  const colour1 =
      PyTeal.valueToCode(block, 'COLOUR1', PyTeal.ORDER_NONE) || '\'#000000\'';
  const colour2 =
      PyTeal.valueToCode(block, 'COLOUR2', PyTeal.ORDER_NONE) || '\'#000000\'';
  const ratio = PyTeal.valueToCode(block, 'RATIO', PyTeal.ORDER_NONE) || 0;
  const code =
      functionName + '(' + colour1 + ', ' + colour2 + ', ' + ratio + ')';
  return [code, PyTeal.ORDER_FUNCTION_CALL];
};
