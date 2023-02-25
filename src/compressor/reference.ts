import * as bufferLib from '../lib/buffer';

export interface RefData {
  distance: number;
  length: number;
}

export interface RefInfo extends RefData {
  singleValueLength: number
}

export class CompressRef implements RefData {
  protected _started: boolean;
  protected _fixedBufferLength?: number;
  distance: number;
  length: number;

  protected constructor(length = 0, distance = 0, started = false) {
    this.length = length;
    this.distance = distance;
    this._started = started;
  }

  get started() {
    return this._started;
  }

  set(ref: CompressRef) {
    this._started = ref._started;
    this.distance = ref.distance;
    this.length = ref.length;
  }

  isBiggerThan(ref: CompressRef) {
    return this.length > ref.length;
  }

  getBufferLength() {
    if (this._fixedBufferLength) return this._fixedBufferLength;

    const maxValue = Math.max(this.distance, this.length);

    return bufferLib.UInt32MinLength(maxValue) * 2 + 1;
  }

  calculateBufferLength(singleValueLength?: number) {
    this._fixedBufferLength = singleValueLength ? singleValueLength * 2 + 1 : this.getBufferLength();
    return this;
  }

  isSmallerThan(ref: CompressRef) {
    return this.length < ref.length;
  }

  grow() {
    return ++this.length;
  }

  startRef(distance: number) {
    this.distance = distance;
    this._started = true;
    this.length = 1;
  }

  reset() {
    this.length = 0;
    this.distance = 0;
    this._started = false;
  }

  toBuffer(bufferLength?: number) {
    const valueBufferLength = CompressRef.singleValueLength(bufferLength ?? this.getBufferLength());

    const length = bufferLib.fromUInt32(this.length, valueBufferLength);
    const distance = bufferLib.fromUInt32(this.distance, valueBufferLength);

    return Buffer.from([valueBufferLength - 1, ...distance, ...length]);
  }

  singleValueLength() {
    CompressRef.singleValueLength(this.getBufferLength());
  }

  static infoFromBuffer(buffer: Buffer, offset: number = 0): RefInfo {
    const byte = buffer[offset];

    const singleValueLength = byte + 1;

    const startOffset = offset + 1;
    const lenOffset = offset + 1 + singleValueLength;
    const distance = bufferLib.toUInt32(buffer.subarray(startOffset, startOffset + singleValueLength));
    const length = bufferLib.toUInt32(buffer.subarray(lenOffset, lenOffset + singleValueLength));

    return {
      distance,
      length,
      singleValueLength,
    }
  }

  static fromBuffer(buffer: Buffer, offset: number = 0) {
    for (let i = offset; i < buffer.length; i++) {
      const byte = buffer[i];

      if (byte < 4) {
        const { distance, length, singleValueLength } = this.infoFromBuffer(buffer, i);

        const ref = new this(length, distance, true)
          .calculateBufferLength(singleValueLength);

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