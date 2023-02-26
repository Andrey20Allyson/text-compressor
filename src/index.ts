import fs from 'fs/promises';
import path from 'path';
import { compress, decompress } from './compressor';

const EXAMPLE_DIR = 'example';

const INPUT_FILE_NAME = 'input.md';
const COMPRESSED_FILE_NAME = 'compressed'
const DECOMPRESSED_FILE_NAME = 'decompressed.md';

const INPUT_FILE_DIR = path.join(EXAMPLE_DIR, INPUT_FILE_NAME);
const COMPRESSED_FILE_DIR = path.join(EXAMPLE_DIR, COMPRESSED_FILE_NAME);
const DECOMPRESSED_FILE_DIR = path.join(EXAMPLE_DIR, DECOMPRESSED_FILE_NAME);

async function main() {
  const debug = process.argv.includes('debug-mode');

  const data = await fs.readFile(INPUT_FILE_DIR);

  const cinit = Date.now();
  const cdata = compress(data, { debug });
  const cend = Date.now();

  console.log('compression time: %sms', cend - cinit);
  console.log('original data length: %s', data.length);
  console.log('compressed data length: %s', cdata.length);
  console.log('compression rate: %s%', (((data.length - cdata.length) / data.length) * 100).toFixed(2));

  await fs.writeFile(COMPRESSED_FILE_DIR, cdata);

  const cfdata = await fs.readFile(COMPRESSED_FILE_DIR);

  const dcdata = decompress(cfdata, { debug });

  console.log('decompression works: %s', dcdata.equals(data));

  await fs.writeFile(DECOMPRESSED_FILE_DIR, dcdata);
}

main().catch(console.error);