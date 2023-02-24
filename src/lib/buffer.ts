import { digits } from "./number";

export function minUInt32Length(value: number) {
  if (value < 0 || value >= 256 ** 4) throw Error('value dont is a 32UInt');
  return value < 256 ? 1 : digits(value, 256);
}

export function fromUInt32(value: number, len: number = 4) {
  const baseBuffer = Buffer.alloc(4);

  baseBuffer.writeUInt32BE(value);

  return baseBuffer.subarray(4 - len);
}

export function toUInt32(buffer: Buffer) {
  const intBuffer = Buffer.alloc(4);

  intBuffer.set(buffer, 4 - buffer.length);

  return intBuffer.readUInt32BE();
}