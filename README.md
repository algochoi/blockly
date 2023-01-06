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

From a pragmatic perspective, this exercise gives us a better idea of how to bridge and compare smart-contract languages with other popular programming languages in a syntax-agnostic, visual setting. It's interesting to consider how code generation could be improved and look for common patterns in syntax. Also, blocks are fun to build with!

Well-formed blocks will (theoretically) always return valid (syntactically correct) PyTeal. Future work can be extended to linters/static-analyzers that could help enforce certain rules within PyTeal.

### Development Notes

This is still at an experimental stage. There have been custom modifications made in `tests/playground.html` to support Algorand smart-contract related blocks and a generator in `generators/pyteal.js` to generate smart-contract code.

To add another language, 
* Add high-level language rules in `generators`
* Add a subdirectory in `generators` with your language. `all.js` will be the entry point and will organize your subfiles.
* Add a button that links to the generator in `tests/playground.html`.
* Add the generator in `tests/bootstrap.js` and `tests/bootstrap_helper.js` where the other languages are. Make sure you run `npm install .` so it generates some pre-compiled code in `build/` (local directory).

### Contributions

Contributions are welcome! Make sure to run `npm run lint` as a sanity check to see if your contribution is properly formatted.
