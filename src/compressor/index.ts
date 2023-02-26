import { DebugCompressRef } from "./debug";
import { CompressRef } from "./reference";

export interface BaseOptions {
  debug?: boolean;
}

export interface CompressOptions extends BaseOptions {
  searchLength?: number;
}

export interface DecompressOptions extends BaseOptions { }

export function compress(data: Buffer, options?: CompressOptions) {
  const {
    debug = false,
    searchLength = data.length < 256 ** 2 ? data.length : 256 ** 2
  } = options ?? {};

  const result: number[] = [];

  const actualRef = CompressRef.create();

  const BetterRefClass = debug ? DebugCompressRef : CompressRef;
  const betterRef = BetterRefClass.create();

  for (let i = 0; i < data.length; i++) {
    const searchInit = Math.min(searchLength, i);

    for (let j = 0; j < searchInit; j++) {
      const memoryIndex = i - searchInit + j;

      if (actualRef.started) {
        if (data[i + actualRef.length] === data[memoryIndex]) {
          actualRef.grow();
          if (j === searchInit - 1 && data[i - actualRef.distance] === data[i + actualRef.length]) {
            j = searchInit - actualRef.distance - 1;
          }
        } else {
          const { distance } = actualRef;

          if (actualRef.length >= betterRef.length) betterRef.set(actualRef);

          actualRef.reset();

          j = searchInit - distance;
        }
      } else if (data[i] === data[memoryIndex]) {
        actualRef.startRef(searchInit - j);
      }
    }

    if (actualRef.length >= betterRef.length) betterRef.set(actualRef);

    const refBufferLength = betterRef.getBufferLength();

    const dontUseRef = debug
      ? betterRef.length <= 3
      : betterRef.length <= refBufferLength;

    if (dontUseRef) {
      result.push(data[i]);
    } else {
      result.push(...betterRef.toBuffer(refBufferLength));
      i += betterRef.length - 1;
    }

    actualRef.reset();
    betterRef.reset();
  }

  return Buffer.from(result);
}

export function decompress(data: Buffer, options?: DecompressOptions) {
  const result: number[] = [];
  let diference = 0;

  for (let i = 0; i < data.length; i++) {
    const byte = data[i];

    if (byte >= 4) {
      result.push(byte);
      continue;
    }

    const RefClass = options?.debug ? DebugCompressRef : CompressRef;

    const ref = RefClass.fromBuffer(data, i);
    if (!ref) continue;

    const { distance, length } = ref;
    const bufferLength = ref.getBufferLength();

    for (let j = 0; j < length; j++) {
      const refByte = result[diference + i - distance + j % distance];

      result.push(refByte);
    }

    i += bufferLength - 1;
    diference += length - bufferLength;
  }

  return Buffer.from(result);
}
