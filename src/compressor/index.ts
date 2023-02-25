import * as bufferLib from "../lib/buffer";
import { CompressRef } from "./reference";

export function compress(data: Buffer, memoryLen: number) {
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
        } else {
          const { length } = actualRef;

          if (actualRef.isBiggerThan(betterRef)) betterRef.set(actualRef);
          
          actualRef.reset();

          j += 2 - length;
        }
      } else if (data[i] === data[memoryIndex]) {
        actualRef.startRef(memoryLimit - j);
      }
    }

    const refBufferLength = betterRef.getBufferLength();

    if (betterRef.length < refBufferLength) {
      result.push(data[i]);
    } else {
      result.push(...betterRef.toBuffer(refBufferLength));

      i += betterRef.length - 1;
    }
  }

  return Buffer.from(result);
}

export function decompress(data: Buffer) {
  const result: number[] = [];
  let dif = 0;

  for (let i = 0; i < data.length; i++) {
    const byte = data[i];

    if (byte >= 4) {
      result.push(byte);
      continue;
    }

    const refLen = byte + 1;
    const startOffset = i + 1;
    const lenOffset = i + 1 + refLen;
    const start = bufferLib.toUInt32(data.subarray(startOffset, startOffset + refLen));
    const len = bufferLib.toUInt32(data.subarray(lenOffset, lenOffset + refLen));
    const fullRefLen = refLen * 2 + 1;

    for (let j = 0; j < len; j++) {
      const refByte = result[dif + i - start + j];

      result.push(refByte);
    }

    i += fullRefLen - 1;
    dif += len - fullRefLen;
  }

  return Buffer.from(result);
}
