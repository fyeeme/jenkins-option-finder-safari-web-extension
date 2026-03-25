const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.join(__dirname, '..');
const SOURCE_FILES = [
  'src/core.js',
  'src/position.js',
  'src/selection.js',
  'src/injector.js',
];
const DIST_BUNDLE_PATH = 'dist/jenkins-option-finder.bundle.js';
const SAFARI_BUNDLE_PATH = 'safari-web-extension/content-script.js';

function createBundle({
  readFile = (filePath) => fs.readFileSync(path.join(ROOT_DIR, filePath), 'utf8'),
  sourceFiles = SOURCE_FILES,
} = {}) {
  return sourceFiles.map((filePath) => readFile(filePath)).join('\n\n');
}

function writeBundle(outputPath, contents) {
  const absolutePath = path.join(ROOT_DIR, outputPath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, contents);
}

function build() {
  const bundle = createBundle();
  writeBundle(DIST_BUNDLE_PATH, bundle);
  writeBundle(SAFARI_BUNDLE_PATH, bundle);
}

if (require.main === module) {
  build();
}

module.exports = {
  SOURCE_FILES,
  DIST_BUNDLE_PATH,
  SAFARI_BUNDLE_PATH,
  createBundle,
  build,
};
