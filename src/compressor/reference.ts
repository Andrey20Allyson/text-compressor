import * as bufferLib from '../lib/buffer';

export class CompressRef {
  #fixedBufferLength?: number;
  #started: boolean;
  distance: number;
  length: number;

  private constructor(length = 0, distance = 0, started = false) {
    this.length = length;
    this.distance = distance;
    this.#started = started;
  }

  get started() {
    return this.#started;
  }

  set(ref: CompressRef) {
    this.#started = ref.#started;
    this.distance = ref.distance;
    this.length = ref.length;
  }

  isBiggerThan(ref: CompressRef) {
    return this.length > ref.length;
  }

  getBufferLength() {
    if (this.#fixedBufferLength) this.#fixedBufferLength;

    const maxValue = Math.max(this.distance, this.length);

    return bufferLib.minUInt32Length(maxValue) * 2 + 1;
  }

  isSmallerThan(ref: CompressRef) {
    return this.length < ref.length;
  }

  grow() {
    return ++this.length;
  }

  startRef(distance: number) {
    this.distance = distance;
    this.#started = true;
    this.length = 1;
  }

  reset() {
    this.length = 0;
    this.distance = 0;
    this.#started = false;
  }

  toBuffer(bufferLength?: number) {
    const valueBufferLength = CompressRef.singleValueLength(bufferLength ?? this.getBufferLength());

    const length = bufferLib.fromUInt32(this.length, valueBufferLength);
    const distance = bufferLib.fromUInt32(this.distance, valueBufferLength);

    return Buffer.from([valueBufferLength - 1, ...distance, ...length]);
  }

  static fromBuffer(buffer: Buffer, offset: number = 0) {
    for (let i = offset; i < buffer.length; i++) {
      const byte = buffer[i];

      if (byte < 4) {
        const singleValueLength = byte + 1;
        const startOffset = i + 1;
        const lenOffset = i + 1 + singleValueLength;
        const distance = bufferLib.toUInt32(buffer.subarray(startOffset, startOffset + singleValueLength));
        const length = bufferLib.toUInt32(buffer.subarray(lenOffset, lenOffset + singleValueLength));

        const ref = new this(length, distance, true);

        ref.#fixedBufferLength = singleValueLength * 2 + 1;

        return ref;
      }
    }
  }

  static singleValueLength(bufferLength: number) {
    return (bufferLength - 1) / 2;
  }

  static create() {
    return new this();
  }
}