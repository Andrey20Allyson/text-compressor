import { CompressRef } from "./reference";

export type BaseOptions = {
  debug?: boolean;
}

export type CompressOptions = BaseOptions;
export type DecompressOptions = BaseOptions;

export function compress(data: Buffer, memoryLen: number, options?: CompressOptions) {
  const result: number[] = [];

  for (let i = 0; i < data.length; i++) {
    const actualRef = CompressRef.create();
    const betterRef = CompressRef.create();

    const memoryLimit = Math.min(memoryLen, i);

    for (let j = 0; j < memoryLimit; j++) {
      const memoryIndex = i - memoryLimit + j;

      if (actualRef.started) {
        if (data[i + actualRef.length] === data[memoryIndex]) {
          actualRef.grow();
          if (j === memoryLimit - 1 && data[i - actualRef.distance] === data[i + actualRef.length]) {
            j = memoryLimit - actualRef.distance - 1;
          }
        } else {
          const { distance } = actualRef;

          if (actualRef.length >= betterRef.length) betterRef.set(actualRef);

          actualRef.reset();

          j = memoryLimit - distance;
        }
      } else if (data[i] === data[memoryIndex]) {
        actualRef.startRef(memoryLimit - j);
      }
    }

    if (actualRef.length >= betterRef.length) betterRef.set(actualRef);

    const refBufferLength = betterRef.getBufferLength();

    if (betterRef.length < refBufferLength) {
      result.push(data[i]);
    } else {
      if (options?.debug) {
        result.push(...Buffer.from(`\0[D=${betterRef.distance}; L=${betterRef.length}]`))
      } else {
        result.push(...betterRef.toBuffer(refBufferLength));
      }
      i += betterRef.length - 1;
    }
  }

  return Buffer.from(result);
}

export function decompress(data: Buffer, options?: DecompressOptions) {
  const result: number[] = [];
  let dif = 0;

  for (let i = 0; i < data.length; i++) {
    const byte = data[i];

    if (byte >= 4) {
      result.push(byte);
      continue;
    }

    if (options?.debug) {
      const distanceStart = data.indexOf('D=', i) + 2;
      const distanceEnd = data.indexOf(';', distanceStart);
      const distance = +data.subarray(distanceStart, distanceEnd).toString('utf-8');

      const lengthStart = data.indexOf('L=', distanceEnd) + 2;
      const lengthEnd = data.indexOf(']', lengthStart);
      const length = +data.subarray(lengthStart, lengthEnd).toString('utf-8');

      const fullRefLen = lengthEnd - i + 1;

      if (Number.isNaN(length) || Number.isNaN(distance)) throw Error('NaN Error');

      for (let j = 0; j < length; j++) {
        const refByte = result[dif + i - distance + j % distance];

        result.push(refByte);
      }

      i += fullRefLen - 1;
      dif += length - fullRefLen;
    } else {
      const ref = CompressRef.fromBuffer(data, i);
      if (!ref) continue;

      const { distance, length } = ref;
      const bufferLength = ref.getBufferLength();

      for (let j = 0; j < length; j++) {
        const refByte = result[dif + i - distance + j % distance];

        result.push(refByte);
      }

      i += bufferLength - 1;
      dif += length - bufferLength;
    }
  }

  return Buffer.from(result);
}
