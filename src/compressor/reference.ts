import * as bufferLib from '../lib/buffer';

export class CompressRef {
  #started: boolean;
  start: number;
  length: number;

  constructor(length = 0, start = 0) {
    this.length = length;
    this.start = start;
    this.#started = false;
  }

  get started() {
    return this.#started;
  }

  set(ref: CompressRef) {
    this.#started = ref.#started;
    this.start = ref.start;
    this.length = ref.length;
  }

  isBiggerThan(ref: CompressRef) {
    return this.length > ref.length;
  }

  getBufferLength() {
    const maxValue = Math.max(this.start, this.length);

    return bufferLib.minUInt32Length(maxValue) * 2 + 1;
  }

  isSmallerThan(ref: CompressRef) {
    return this.length < ref.length;
  }

  grow() {
    return ++this.length;
  }

  startRef(index: number) {
    this.start = index;
    this.#started = true;
    this.length = 1;
  }

  reset() {
    this.length = 0;
    this.start = 0;
    this.#started = false;
  }

  toBuffer(bufferLength?: number) {
    let valueBufferLength = CompressRef.singleValueLength(bufferLength ?? this.getBufferLength());

    let len = bufferLib.fromUInt32(this.length, valueBufferLength);
    let start = bufferLib.fromUInt32(this.start, valueBufferLength);

    return Buffer.from([valueBufferLength - 1, ...start, ...len]);
  }
  
  static fromBuffer() {

  }
  
  static singleValueLength(bufferLength: number) {
    return (bufferLength - 1) / 2;
  }

  static create() {
    return new this();
  }
}