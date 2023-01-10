/**
 * @license
 * Copyright 2023 @algochoi
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Generating Tealx for procedure blocks.
 */
'use strict';

goog.module('Blockly.Tealx.procedures');

const Variables = goog.require('Blockly.Variables');
const {NameType} = goog.require('Blockly.Names');
const {tealxGenerator: Tealx} = goog.require('Blockly.Tealx');

// Defines a subroutine with a Int return. 
// Currently, Bytes returns are not supported.
Tealx['procedures_defreturn'] = function(block){
  // Define a procedure with a return value.
  const funcName =
      Tealx.nameDB_.getName(block.getFieldValue('NAME'), NameType.PROCEDURE);

  let generateSubroutineReturn = (value) => {
    return '<subroutine-return> ' + returnValue + ' </subroutine-return>';
  };
  let generateSubroutineDefinition = (prefix, body, suffix) => {
    return '<subroutine name="' + funcName + '">\n' + prefix + body + suffix + '\n</subroutine>';
  };
  if (funcName == "main") {
    generateSubroutineReturn = (value) => {
      return '<program-return> ' + returnValue + ' </program-return>'
    }
    generateSubroutineDefinition = (prefix, body, suffix) => {
      return '<main>\n' + body + '\n</main>';
    };
  }
  let xfix1 = '';
  if (Tealx.STATEMENT_PREFIX) {
    xfix1 += Tealx.injectId(Tealx.STATEMENT_PREFIX, block);
  }
  if (Tealx.STATEMENT_SUFFIX) {
    xfix1 += Tealx.injectId(Tealx.STATEMENT_SUFFIX, block);
  }
  if (xfix1) {
    xfix1 = Tealx.prefixLines(xfix1, Tealx.INDENT);
  }
  let loopTrap = '';
  if (Tealx.INFINITE_LOOP_TRAP) {
    loopTrap = Tealx.prefixLines(
        Tealx.injectId(Tealx.INFINITE_LOOP_TRAP, block), Tealx.INDENT);
  }
  let branch = Tealx.statementToCode(block, 'STACK');
  let returnValue =
      Tealx.valueToCode(block, 'RETURN', Tealx.ORDER_NONE) || '';
  let xfix2 = '';
  let returnType = '<returns type="uint64" />\n'
  if (branch && returnValue) {
    // After executing the function body, revisit this block for the return.
    xfix2 = xfix1;
  }
  if (returnValue) {
    returnValue = generateSubroutineReturn(returnValue);
  } else if (!branch) {
    returnValue = generateSubroutineReturn(Tealx.FALSE_VALUE);
  }
  const args = [];
  const variables = block.getVars();
  for (let i = 0; i < variables.length; i++) {
    args[i] = Tealx.nameDB_.getName(variables[i], NameType.VARIABLE);
  }

  // Build subroutine signature
  let argCode = '';
  if (args.length > 0) {
    for (const arg of args) {
        argCode += '<argument name="' + arg + '" type="uint64" />';
    }
    // argCode = Tealx.INDENT + '<arguments>' + argCode + '</arguments>\n';
  }
  // Define subroutine body
  let prefixBody = argCode + returnType + '<body>\n';
  let suffixBody = '</body>';
  let code = generateSubroutineDefinition(prefixBody, xfix1 + loopTrap + branch + xfix2 + returnValue, suffixBody);
  code = Tealx.scrub_(block, code);
  // Add % so as not to collide with helper functions in definitions list.
  Tealx.definitions_['%' + funcName] = code;
  return null;
};

// Defining a procedure without a return value uses the same generator as
// a procedure with a return value.
Tealx['procedures_defnoreturn'] = Tealx['procedures_defreturn'];

Tealx['procedures_callreturn'] = function(block) {
  // Call a procedure with a return value.
  const funcName =
      Tealx.nameDB_.getName(block.getFieldValue('NAME'), NameType.PROCEDURE);
  const args = [];
  const variables = block.getVars();
  for (let i = 0; i < variables.length; i++) {
    args[i] = Tealx.valueToCode(block, 'ARG' + i, Tealx.ORDER_NONE) || '';
  }

  // Format output code
  let code = '<subroutine-call name="' + funcName + '">\n';
  code += Tealx.INDENT + args.join('')
  code += '\n</subroutine-call>\n'
  return [code, Tealx.ORDER_FUNCTION_CALL];
};

Tealx['procedures_callnoreturn'] = function(block) {
  // Call a procedure with no return value.
  // Generated code is for a function call as a statement is the same as a
  // function call as a value, with the addition of line ending.
  const tuple = Tealx['procedures_callreturn'](block);
  return tuple[0] + '\n';
};

Tealx['procedures_ifreturn'] = function(block) {
  // Conditionally return value from a procedure.
  const condition =
      Tealx.valueToCode(block, 'CONDITION', Tealx.ORDER_NONE) || 'False';
  let code = 'if ' + condition + ':\n';
  if (Tealx.STATEMENT_SUFFIX) {
    // Inject any statement suffix here since the regular one at the end
    // will not get executed if the return is triggered.
    code += Tealx.prefixLines(
        Tealx.injectId(Tealx.STATEMENT_SUFFIX, block), Tealx.INDENT);
  }
  if (block.hasReturnValue_) {
    const value =
        Tealx.valueToCode(block, 'VALUE', Tealx.ORDER_NONE) || 'None';
    code += Tealx.INDENT + 'return ' + value + '\n';
  } else {
    code += Tealx.INDENT + 'return\n';
  }
  return code;
};
