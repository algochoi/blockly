/**
 * @license
 * Copyright 2023 @algochoi
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Generating Tealx for variable blocks.
 */
'use strict';

goog.module('Blockly.Tealx.variables');

const {NameType} = goog.require('Blockly.Names');
const {tealxGenerator: Tealx} = goog.require('Blockly.Tealx');


Tealx['variables_get'] = function(block) {
  // Variable getter.
  const code =
      '<variable-get name="' + Tealx.nameDB_.getName(block.getFieldValue('VAR'), NameType.VARIABLE) + '"></variable-get>\n';
  return [code, Tealx.ORDER_ATOMIC];
};

Tealx['variables_set'] = function(block) {
  // Variable setter.
  const argument0 =
      Tealx.valueToCode(block, 'VALUE', Tealx.ORDER_NONE) || Tealx.FALSE_VALUE;
  const varName =
      Tealx.nameDB_.getName(block.getFieldValue('VAR'), NameType.VARIABLE);
  return '<variable-set name="' + varName + '">' + argument0 + '</variable-set>\n';
};
