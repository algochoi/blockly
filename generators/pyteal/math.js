/**
 * @license
 * Copyright 2012 Google LLC
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
    'ADD': [' + ', PyTeal.ORDER_ADDITIVE],
    'MINUS': [' - ', PyTeal.ORDER_ADDITIVE],
    'MULTIPLY': [' * ', PyTeal.ORDER_MULTIPLICATIVE],
    'DIVIDE': [' / ', PyTeal.ORDER_MULTIPLICATIVE],
    'POWER': [' ** ', PyTeal.ORDER_EXPONENTIATION],
  };
  const tuple = OPERATORS[block.getFieldValue('OP')];
  const operator = tuple[0];
  const order = tuple[1];
  const argument0 = PyTeal.valueToCode(block, 'A', order) || '0';
  const argument1 = PyTeal.valueToCode(block, 'B', order) || '0';
  const code = argument0 + operator + argument1;
  return [code, order];
  // In case of 'DIVIDE', division between integers returns different results
  // in PyTeal 2 and 3. However, is not an issue since Blockly does not
  // guarantee identical results in all languages.  To do otherwise would
  // require every operator to be wrapped in a function call.  This would kill
  // legibility of the generated code.
};

PyTeal['math_single'] = function(block) {
  // Math operators with single operand.
  const operator = block.getFieldValue('OP');
  let code;
  let arg;
  if (operator === 'NEG') {
    // Negation is a special case given its different operator precedence.
    code = PyTeal.valueToCode(block, 'NUM', PyTeal.ORDER_UNARY_SIGN) || '0';
    return ['-' + code, PyTeal.ORDER_UNARY_SIGN];
  }
  PyTeal.definitions_['import_math'] = 'import math';
  if (operator === 'SIN' || operator === 'COS' || operator === 'TAN') {
    arg = PyTeal.valueToCode(block, 'NUM', PyTeal.ORDER_MULTIPLICATIVE) || '0';
  } else {
    arg = PyTeal.valueToCode(block, 'NUM', PyTeal.ORDER_NONE) || '0';
  }
  // First, handle cases which generate values that don't need parentheses
  // wrapping the code.
  switch (operator) {
    case 'ABS':
      code = 'math.fabs(' + arg + ')';
      break;
    case 'ROOT':
      code = 'math.sqrt(' + arg + ')';
      break;
    case 'LN':
      code = 'math.log(' + arg + ')';
      break;
    case 'LOG10':
      code = 'math.log10(' + arg + ')';
      break;
    case 'EXP':
      code = 'math.exp(' + arg + ')';
      break;
    case 'POW10':
      code = 'math.pow(10,' + arg + ')';
      break;
    case 'ROUND':
      code = 'round(' + arg + ')';
      break;
    case 'ROUNDUP':
      code = 'math.ceil(' + arg + ')';
      break;
    case 'ROUNDDOWN':
      code = 'math.floor(' + arg + ')';
      break;
    case 'SIN':
      code = 'math.sin(' + arg + ' / 180.0 * math.pi)';
      break;
    case 'COS':
      code = 'math.cos(' + arg + ' / 180.0 * math.pi)';
      break;
    case 'TAN':
      code = 'math.tan(' + arg + ' / 180.0 * math.pi)';
      break;
  }
  if (code) {
    return [code, PyTeal.ORDER_FUNCTION_CALL];
  }
  // Second, handle cases which generate values that may need parentheses
  // wrapping the code.
  switch (operator) {
    case 'ASIN':
      code = 'math.asin(' + arg + ') / math.pi * 180';
      break;
    case 'ACOS':
      code = 'math.acos(' + arg + ') / math.pi * 180';
      break;
    case 'ATAN':
      code = 'math.atan(' + arg + ') / math.pi * 180';
      break;
    default:
      throw Error('Unknown math operator: ' + operator);
  }
  return [code, PyTeal.ORDER_MULTIPLICATIVE];
};

PyTeal['math_constant'] = function(block) {
  // Constants: PI, E, the Golden Ratio, sqrt(2), 1/sqrt(2), INFINITY.
  const CONSTANTS = {
    'PI': ['math.pi', PyTeal.ORDER_MEMBER],
    'E': ['math.e', PyTeal.ORDER_MEMBER],
    'GOLDEN_RATIO': ['(1 + math.sqrt(5)) / 2', PyTeal.ORDER_MULTIPLICATIVE],
    'SQRT2': ['math.sqrt(2)', PyTeal.ORDER_MEMBER],
    'SQRT1_2': ['math.sqrt(1.0 / 2)', PyTeal.ORDER_MEMBER],
    'INFINITY': ['float(\'inf\')', PyTeal.ORDER_ATOMIC],
  };
  const constant = block.getFieldValue('CONSTANT');
  if (constant !== 'INFINITY') {
    PyTeal.definitions_['import_math'] = 'import math';
  }
  return CONSTANTS[constant];
};

PyTeal['math_number_property'] = function(block) {
   // Check if a number is even, odd, prime, whole, positive, or negative
   // or if it is divisible by certain number. Returns true or false.
  const PROPERTIES = {
    'EVEN': [' % 2 == 0', PyTeal.ORDER_MULTIPLICATIVE, PyTeal.ORDER_RELATIONAL],
    'ODD': [' % 2 == 1', PyTeal.ORDER_MULTIPLICATIVE, PyTeal.ORDER_RELATIONAL],
    'WHOLE': [' % 1 == 0', PyTeal.ORDER_MULTIPLICATIVE,
        PyTeal.ORDER_RELATIONAL],
    'POSITIVE': [' > 0', PyTeal.ORDER_RELATIONAL, PyTeal.ORDER_RELATIONAL],
    'NEGATIVE': [' < 0', PyTeal.ORDER_RELATIONAL, PyTeal.ORDER_RELATIONAL],
    'DIVISIBLE_BY': [null, PyTeal.ORDER_MULTIPLICATIVE,
        PyTeal.ORDER_RELATIONAL],
    'PRIME': [null, PyTeal.ORDER_NONE, PyTeal.ORDER_FUNCTION_CALL],
  }
  const dropdownProperty = block.getFieldValue('PROPERTY');
  const [suffix, inputOrder, outputOrder] = PROPERTIES[dropdownProperty];
  const numberToCheck = PyTeal.valueToCode(block, 'NUMBER_TO_CHECK',
      inputOrder) || '0';
  let code;
  if (dropdownProperty === 'PRIME') {
    // Prime is a special case as it is not a one-liner test.
    PyTeal.definitions_['import_math'] = 'import math';
    PyTeal.definitions_['from_numbers_import_Number'] =
        'from numbers import Number';
    const functionName = PyTeal.provideFunction_('math_isPrime', `
def ${PyTeal.FUNCTION_NAME_PLACEHOLDER_}(n):
  # https://en.wikipedia.org/wiki/Primality_test#Naive_methods
  # If n is not a number but a string, try parsing it.
  if not isinstance(n, Number):
    try:
      n = float(n)
    except:
      return False
  if n == 2 or n == 3:
    return True
  # False if n is negative, is 1, or not whole, or if n is divisible by 2 or 3.
  if n <= 1 or n % 1 != 0 or n % 2 == 0 or n % 3 == 0:
    return False
  # Check all the numbers of form 6k +/- 1, up to sqrt(n).
  for x in range(6, int(math.sqrt(n)) + 2, 6):
    if n % (x - 1) == 0 or n % (x + 1) == 0:
      return False
  return True
`);
       code = functionName + '(' + numberToCheck + ')';
  } else if (dropdownProperty === 'DIVISIBLE_BY') {
    const divisor = PyTeal.valueToCode(block, 'DIVISOR',
        PyTeal.ORDER_MULTIPLICATIVE) || '0';
    // If 'divisor' is some code that evals to 0, PyTeal will raise an error.
    if (divisor === '0') {
      return ['False', PyTeal.ORDER_ATOMIC];
    }
    code = numberToCheck + ' % ' + divisor + ' == 0';
  } else {
    code = numberToCheck + suffix;
  };
  return [code, outputOrder];
};

PyTeal['math_change'] = function(block) {
  // Add to a variable in place.
  PyTeal.definitions_['from_numbers_import_Number'] =
      'from numbers import Number';
  const argument0 =
      PyTeal.valueToCode(block, 'DELTA', PyTeal.ORDER_ADDITIVE) || '0';
  const varName =
      PyTeal.nameDB_.getName(block.getFieldValue('VAR'), NameType.VARIABLE);
  return varName + ' = (' + varName + ' if isinstance(' + varName +
      ', Number) else 0) + ' + argument0 + '\n';
};

// Rounding functions have a single operand.
PyTeal['math_round'] = PyTeal['math_single'];
// Trigonometry functions have a single operand.
PyTeal['math_trig'] = PyTeal['math_single'];

PyTeal['math_on_list'] = function(block) {
  // Math functions for lists.
  const func = block.getFieldValue('OP');
  const list = PyTeal.valueToCode(block, 'LIST', PyTeal.ORDER_NONE) || '[]';
  let code;
  switch (func) {
    case 'SUM':
      code = 'sum(' + list + ')';
      break;
    case 'MIN':
      code = 'min(' + list + ')';
      break;
    case 'MAX':
      code = 'max(' + list + ')';
      break;
    case 'AVERAGE': {
      PyTeal.definitions_['from_numbers_import_Number'] =
          'from numbers import Number';
      // This operation excludes null and values that aren't int or float:
      // math_mean([null, null, "aString", 1, 9]) -> 5.0
      const functionName = PyTeal.provideFunction_('math_mean', `
def ${PyTeal.FUNCTION_NAME_PLACEHOLDER_}(myList):
  localList = [e for e in myList if isinstance(e, Number)]
  if not localList: return
  return float(sum(localList)) / len(localList)
`);
      code = functionName + '(' + list + ')';
      break;
    }
    case 'MEDIAN': {
      PyTeal.definitions_['from_numbers_import_Number'] =
          'from numbers import Number';
      // This operation excludes null values:
      // math_median([null, null, 1, 3]) -> 2.0
      const functionName = PyTeal.provideFunction_( 'math_median', `
def ${PyTeal.FUNCTION_NAME_PLACEHOLDER_}(myList):
  localList = sorted([e for e in myList if isinstance(e, Number)])
  if not localList: return
  if len(localList) % 2 == 0:
    return (localList[len(localList) // 2 - 1] + localList[len(localList) // 2]) / 2.0
  else:
    return localList[(len(localList) - 1) // 2]
`);
      code = functionName + '(' + list + ')';
      break;
    }
    case 'MODE': {
      // As a list of numbers can contain more than one mode,
      // the returned result is provided as an array.
      // Mode of [3, 'x', 'x', 1, 1, 2, '3'] -> ['x', 1]
      const functionName = PyTeal.provideFunction_('math_modes', `
def ${PyTeal.FUNCTION_NAME_PLACEHOLDER_}(some_list):
  modes = []
  # Using a lists of [item, count] to keep count rather than dict
  # to avoid "unhashable" errors when the counted item is itself a list or dict.
  counts = []
  maxCount = 1
  for item in some_list:
    found = False
    for count in counts:
      if count[0] == item:
        count[1] += 1
        maxCount = max(maxCount, count[1])
        found = True
    if not found:
      counts.append([item, 1])
  for counted_item, item_count in counts:
    if item_count == maxCount:
      modes.append(counted_item)
  return modes
`);
      code = functionName + '(' + list + ')';
      break;
    }
    case 'STD_DEV': {
      PyTeal.definitions_['import_math'] = 'import math';
      const functionName = PyTeal.provideFunction_('math_standard_deviation', `
def ${PyTeal.FUNCTION_NAME_PLACEHOLDER_}(numbers):
  n = len(numbers)
  if n == 0: return
  mean = float(sum(numbers)) / n
  variance = sum((x - mean) ** 2 for x in numbers) / n
  return math.sqrt(variance)
`);
      code = functionName + '(' + list + ')';
      break;
    }
    case 'RANDOM':
      PyTeal.definitions_['import_random'] = 'import random';
      code = 'random.choice(' + list + ')';
      break;
    default:
      throw Error('Unknown operator: ' + func);
  }
  return [code, PyTeal.ORDER_FUNCTION_CALL];
};

PyTeal['math_modulo'] = function(block) {
  // Remainder computation.
  const argument0 =
      PyTeal.valueToCode(block, 'DIVIDEND', PyTeal.ORDER_MULTIPLICATIVE) || '0';
  const argument1 =
      PyTeal.valueToCode(block, 'DIVISOR', PyTeal.ORDER_MULTIPLICATIVE) || '0';
  const code = argument0 + ' % ' + argument1;
  return [code, PyTeal.ORDER_MULTIPLICATIVE];
};

PyTeal['math_constrain'] = function(block) {
  // Constrain a number between two limits.
  const argument0 =
      PyTeal.valueToCode(block, 'VALUE', PyTeal.ORDER_NONE) || '0';
  const argument1 = PyTeal.valueToCode(block, 'LOW', PyTeal.ORDER_NONE) || '0';
  const argument2 =
      PyTeal.valueToCode(block, 'HIGH', PyTeal.ORDER_NONE) || 'float(\'inf\')';
  const code =
      'min(max(' + argument0 + ', ' + argument1 + '), ' + argument2 + ')';
  return [code, PyTeal.ORDER_FUNCTION_CALL];
};

PyTeal['math_random_int'] = function(block) {
  // Random integer between [X] and [Y].
  PyTeal.definitions_['import_random'] = 'import random';
  const argument0 = PyTeal.valueToCode(block, 'FROM', PyTeal.ORDER_NONE) || '0';
  const argument1 = PyTeal.valueToCode(block, 'TO', PyTeal.ORDER_NONE) || '0';
  const code = 'random.randint(' + argument0 + ', ' + argument1 + ')';
  return [code, PyTeal.ORDER_FUNCTION_CALL];
};

PyTeal['math_random_float'] = function(block) {
  // Random fraction between 0 and 1.
  PyTeal.definitions_['import_random'] = 'import random';
  return ['random.random()', PyTeal.ORDER_FUNCTION_CALL];
};

PyTeal['math_atan2'] = function(block) {
  // Arctangent of point (X, Y) in degrees from -180 to 180.
  PyTeal.definitions_['import_math'] = 'import math';
  const argument0 = PyTeal.valueToCode(block, 'X', PyTeal.ORDER_NONE) || '0';
  const argument1 = PyTeal.valueToCode(block, 'Y', PyTeal.ORDER_NONE) || '0';
  return [
    'math.atan2(' + argument1 + ', ' + argument0 + ') / math.pi * 180',
    PyTeal.ORDER_MULTIPLICATIVE
  ];
};
