/**
 * @license
 * Copyright 2023 @algochoi
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Generating PyTeal for variable blocks.
 */
'use strict';

goog.module('Blockly.PyTeal.variables');

const {NameType} = goog.require('Blockly.Names');
const {pytealGenerator: PyTeal} = goog.require('Blockly.PyTeal');


PyTeal['variables_get'] = function(block) {
  // Variable getter.
  const code =
      PyTeal.nameDB_.getName(block.getFieldValue('VAR'), NameType.VARIABLE);
  return [code, PyTeal.ORDER_ATOMIC];
};

PyTeal['variables_set'] = function(block) {
  // Variable setter.
  const argument0 =
      PyTeal.valueToCode(block, 'VALUE', PyTeal.ORDER_NONE) || '0';
  const varName =
      PyTeal.nameDB_.getName(block.getFieldValue('VAR'), NameType.VARIABLE);
  return varName + ' = ' + argument0 + '\n';
};
