/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Generating PyTeal for dynamic variable blocks.
 */
'use strict';

goog.module('Blockly.PyTeal.variablesDynamic');

const {pytealGenerator: PyTeal} = goog.require('Blockly.PyTeal');
/** @suppress {extraRequire} */
goog.require('Blockly.PyTeal.variables');


// PyTeal is dynamically typed.
PyTeal['variables_get_dynamic'] = PyTeal['variables_get'];
PyTeal['variables_set_dynamic'] = PyTeal['variables_set'];
