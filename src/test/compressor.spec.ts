import { test, expect } from 'vitest';
import { compress, decompress } from '../compressor';
import { readFile, readdir } from 'fs/promises'
import path = require('path');

const TEST_INPUT_DIR = process.env.npm_package_config_testInputDir ;
if (!TEST_INPUT_DIR) throw Error('Cant find testInputDir in npm_package_config');

const FILES_DIR = path.join(TEST_INPUT_DIR, 'compressor');

async function getInputFileNames() {
  const files = await readdir(FILES_DIR);

  return files;
}

test('decompress output shold be equals to original data', async () => {
  const files = await getInputFileNames();
  let testedFiles = 0;

  for (const file of files) {
    const data = await readFile(path.join(FILES_DIR, file)).catch(console.error);
    if (!data) continue;

    const compressed = compress(data);

    const decompressed = decompress(compressed);

    testedFiles++;
    const sameValue = data.equals(decompressed);

    if (!sameValue) {
      expect.fail(`decompress output don't is equals to original data`);
    }
  }

  if (testedFiles === 0) expect.fail('Cant test because cant all files are inaccessible');
});

test('compress output shold be smaller than input', async () => {
  const files = await getInputFileNames();
  let testedFiles = 0;

  for (const file of files) {
    const data = await readFile(path.join(FILES_DIR, file)).catch(console.error);
    if (!data) continue;

    const compressed = compress(data);

    testedFiles++;
    const isSmaller = compressed.length < data.length;

    if (!isSmaller) {
      expect.fail('compressed data don\'t is smaller than original data');
    }
  }

  if (testedFiles === 0) expect.fail('Can\'t test because cant all files are inaccessible');
});