/**
 * @license
 * Copyright 2023 @algochoi
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Helper functions for generating Tealx for blocks.
 * @suppress {checkTypes|globalThis}
 */
'use strict';

goog.module('Blockly.Tealx');

const stringUtils = goog.require('Blockly.utils.string');
const Variables = goog.require('Blockly.Variables');
const {Block} = goog.requireType('Blockly.Block');
const {Generator} = goog.require('Blockly.Generator');
const {inputTypes} = goog.require('Blockly.inputTypes');
const {Names, NameType} = goog.require('Blockly.Names');
const {Workspace} = goog.requireType('Blockly.Workspace');


/**
 * Tealx code generator.
 * @type {!Generator}
 */
const Tealx = new Generator('Tealx');

/**
 * Constants
 * Since TEAL treats true values as int 1 and false values as int 0, alias them:
 */
Tealx.TRUE_VALUE = '<int value="1"></int>';
Tealx.FALSE_VALUE = '<int value="0"></int>';

/**
 * List of illegal variable names.
 * This is not intended to be a security feature.  Blockly is 100% client-side,
 * so bypassing this list is trivial.  This is intended to prevent users from
 * accidentally clobbering a built-in object or function.
 */
Tealx.addReservedWords(
    'NULL');

/**
 * Order of operation ENUMs.
 * http://docs.python.org/reference/expressions.html#summary
 */
Tealx.ORDER_ATOMIC = 0;             // 0 "" ...
Tealx.ORDER_COLLECTION = 1;         // tuples, lists, dictionaries
Tealx.ORDER_STRING_CONVERSION = 1;  // `expression...`
Tealx.ORDER_MEMBER = 2.1;           // . []
Tealx.ORDER_FUNCTION_CALL = 2.2;    // ()
Tealx.ORDER_EXPONENTIATION = 3;     // **
Tealx.ORDER_UNARY_SIGN = 4;         // + -
Tealx.ORDER_BITWISE_NOT = 4;        // ~
Tealx.ORDER_MULTIPLICATIVE = 5;     // * / // %
Tealx.ORDER_ADDITIVE = 6;           // + -
Tealx.ORDER_BITWISE_SHIFT = 7;      // << >>
Tealx.ORDER_BITWISE_AND = 8;        // &
Tealx.ORDER_BITWISE_XOR = 9;        // ^
Tealx.ORDER_BITWISE_OR = 10;        // |
Tealx.ORDER_RELATIONAL = 11;        // in, not in, is, is not,
                                     //     <, <=, >, >=, <>, !=, ==
Tealx.ORDER_LOGICAL_NOT = 12;       // not
Tealx.ORDER_LOGICAL_AND = 13;       // and
Tealx.ORDER_LOGICAL_OR = 14;        // or
Tealx.ORDER_CONDITIONAL = 15;       // if else
Tealx.ORDER_LAMBDA = 16;            // lambda
Tealx.ORDER_NONE = 99;              // (...)

/**
 * List of outer-inner pairings that do NOT require parentheses.
 * @type {!Array<!Array<number>>}
 */
Tealx.ORDER_OVERRIDES = [
  // (foo()).bar -> foo().bar
  // (foo())[0] -> foo()[0]
  [Tealx.ORDER_FUNCTION_CALL, Tealx.ORDER_MEMBER],
  // (foo())() -> foo()()
  [Tealx.ORDER_FUNCTION_CALL, Tealx.ORDER_FUNCTION_CALL],
  // (foo.bar).baz -> foo.bar.baz
  // (foo.bar)[0] -> foo.bar[0]
  // (foo[0]).bar -> foo[0].bar
  // (foo[0])[1] -> foo[0][1]
  [Tealx.ORDER_MEMBER, Tealx.ORDER_MEMBER],
  // (foo.bar)() -> foo.bar()
  // (foo[0])() -> foo[0]()
  [Tealx.ORDER_MEMBER, Tealx.ORDER_FUNCTION_CALL],

  // not (not foo) -> not not foo
  [Tealx.ORDER_LOGICAL_NOT, Tealx.ORDER_LOGICAL_NOT],
  // a and (b and c) -> a and b and c
  [Tealx.ORDER_LOGICAL_AND, Tealx.ORDER_LOGICAL_AND],
  // a or (b or c) -> a or b or c
  [Tealx.ORDER_LOGICAL_OR, Tealx.ORDER_LOGICAL_OR]
];

/**
 * Whether the init method has been called.
 * @type {?boolean}
 */
Tealx.isInitialized = false;

/**
 * Initialise the database of variable names.
 * @param {!Workspace} workspace Workspace to generate code from.
 * @this {Generator}
 */
Tealx.init = function(workspace) {
  // Call Blockly.Generator's init.
  Object.getPrototypeOf(this).init.call(this);

  /**
   * Empty loops or conditionals are not allowed in Python.
   */
  this.PASS = this.INDENT + 'pass\n';

  if (!this.nameDB_) {
    this.nameDB_ = new Names(this.RESERVED_WORDS_);
  } else {
    this.nameDB_.reset();
  }

  this.nameDB_.setVariableMap(workspace.getVariableMap());
  this.nameDB_.populateVariables(workspace);
  this.nameDB_.populateProcedures(workspace);

  const defvars = [];
  // Add developer variables (not created or named by the user).
  const devVarList = Variables.allDeveloperVariables(workspace);
  for (let i = 0; i < devVarList.length; i++) {
    defvars.push(
        '<variable name="' +
        this.nameDB_.getName(devVarList[i], Names.DEVELOPER_VARIABLE_TYPE) +
        '" type="uint64"></variable>');
  }

  // Add user variables, but only ones that are being used.
  const variables = Variables.allUsedVarModels(workspace);
  for (let i = 0; i < variables.length; i++) {
    defvars.push(
        '<variable name="' +
        this.nameDB_.getName(variables[i].getId(), NameType.VARIABLE) +
        '" type="uint64"></variable>');
  }

  this.definitions_['variables'] = defvars.join('\n');
  this.isInitialized = true;
};

/**
 * Prepend the generated code with import statements and variable definitions.
 * @param {string} code Generated code.
 * @return {string} Completed code.
 */
Tealx.finish = function(code) {
  // Import Tealx
  // Convert the definitions dictionary into a list.
  const imports = ['<version value="8"></version>\n'];
  const definitions = [];
  for (let name in this.definitions_) {
    const def = this.definitions_[name];
    if (def.match(/^(from\s+\S+\s+)?import\s+\S+/)) {
      imports.push(def);
    } else {
      definitions.push(def);
    }
  }
  // Call Blockly.Generator's finish.
  code = Object.getPrototypeOf(this).finish.call(this, code);
  this.isInitialized = false;

  this.nameDB_.reset();
  const allDefs = imports.join('\n') + '\n\n' + definitions.join('\n\n');
  return allDefs.replace(/\n\n+/g, '\n\n').replace(/\n*$/, '\n\n\n') + code;
};

/**
 * Naked values are top-level blocks with outputs that aren't plugged into
 * anything.
 * @param {string} line Line of generated code.
 * @return {string} Legal line of code.
 */
Tealx.scrubNakedValue = function(line) {
  return line + '\n';
};

/**
 * Encode a string as a properly escaped Python string, complete with quotes.
 * @param {string} string Text to encode.
 * @return {string} Python string.
 * @protected
 */
Tealx.quote_ = function(string) {
  // Can't use goog.string.quote since % must also be escaped.
  string = string.replace(/\\/g, '\\\\').replace(/\n/g, '\\\n');

  // Follow the CPython behaviour of repr() for a non-byte string.
  let quote = '\'';
  if (string.indexOf('\'') !== -1) {
    if (string.indexOf('"') === -1) {
      quote = '"';
    } else {
      string = string.replace(/'/g, '\\\'');
    }
  }
  return quote + string + quote;
};

/**
 * Common tasks for generating Python from blocks.
 * Handles comments for the specified block and any connected value blocks.
 * Calls any statements following this block.
 * @param {!Block} block The current block.
 * @param {string} code The Python code created for this block.
 * @param {boolean=} opt_thisOnly True to generate code for only this statement.
 * @return {string} Python code with comments and subsequent blocks added.
 * @protected
 */
Tealx.scrub_ = function(block, code, opt_thisOnly) {
  let commentCode = '';
  // Only collect comments for blocks that aren't inline.
  if (!block.outputConnection || !block.outputConnection.targetConnection) {
    // Collect comment for this block.
    let comment = block.getCommentText();
    if (comment) {
      comment = stringUtils.wrap(comment, this.COMMENT_WRAP - 3);
      commentCode += this.prefixLines(comment + '\n', '# ');
    }
    // Collect comments for all value arguments.
    // Don't collect comments for nested statements.
    for (let i = 0; i < block.inputList.length; i++) {
      if (block.inputList[i].type === inputTypes.VALUE) {
        const childBlock = block.inputList[i].connection.targetBlock();
        if (childBlock) {
          comment = this.allNestedComments(childBlock);
          if (comment) {
            commentCode += this.prefixLines(comment, '# ');
          }
        }
      }
    }
  }
  const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  const nextCode = opt_thisOnly ? '' : this.blockToCode(nextBlock);
  return commentCode + code + nextCode;
};

/**
 * Gets a property and adjusts the value, taking into account indexing.
 * If a static int, casts to an integer, otherwise returns a code string.
 * @param {!Block} block The block.
 * @param {string} atId The property ID of the element to get.
 * @param {number=} opt_delta Value to add.
 * @param {boolean=} opt_negate Whether to negate the value.
 * @return {string|number}
 */
Tealx.getAdjustedInt = function(block, atId, opt_delta, opt_negate) {
  let delta = opt_delta || 0;
  if (block.workspace.options.oneBasedIndex) {
    delta--;
  }
  const defaultAtIndex = block.workspace.options.oneBasedIndex ? '1' : '0';
  const atOrder = delta ? this.ORDER_ADDITIVE : this.ORDER_NONE;
  let at = this.valueToCode(block, atId, atOrder) || defaultAtIndex;

  return at;
};

exports.tealxGenerator = Tealx;
