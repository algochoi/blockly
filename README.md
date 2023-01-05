# Blockly for Algorand+

This is a modified fork of Google's Blockly tool. This repo contains some modifications to support Algorand-related language generators and demos in the playground (`tests/playground.html`)


### Installing Blockly

Blockly is [available on npm](https://www.npmjs.com/package/blockly).

```bash
npm install blockly
```

For more information on installing and using Blockly, see the [Getting Started article](https://developers.google.com/blockly/guides/get-started/web).

### Demo

```bash
npm install .
npm run start
```

The blockly playground should automatically open in your browser. If not, you can go to `localhost:8080/tests/playground.html` to access the playground. The advanced playground is not supported for PyTeal yet. 

### Motivation

From a pragmatic perspective, this exercise gives us a better idea of how to bridge smart-contract languages with other popular programming languages in a syntax-agnostic, visual setting. It's interesting to consider how code generation could be improved and look for common patterns in syntax. Also, blocks are fun to build with!

### Development Notes

This is still at an experimental stage. There have been custom modifications made in `tests/playground.html` to support Algorand smart-contract related blocks and a generator in `generators/pyteal.js` to generate smart-contract code.

### Contributions

Contributions are welcome! Make sure to run `npm run lint` as a sanity check to see if your contribution is properly formatted.
