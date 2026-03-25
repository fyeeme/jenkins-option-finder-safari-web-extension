const test = require('node:test');
const assert = require('node:assert/strict');

const { createBundle } = require('../scripts/build');

test('createBundle concatenates source files in dependency order', () => {
  const bundle = createBundle({
    readFile(filePath) {
      return `/* ${filePath} */`;
    },
    sourceFiles: ['src/core.js', 'src/position.js', 'src/selection.js', 'src/injector.js'],
  });

  assert.equal(
    bundle,
    [
      '/* src/core.js */',
      '/* src/position.js */',
      '/* src/selection.js */',
      '/* src/injector.js */',
    ].join('\n\n')
  );
});
