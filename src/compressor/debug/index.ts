import { CompressRef, RefData, RefInfo } from "../reference";

export class DebugCompressRef extends CompressRef {
  private static readonly structure = '\0[D=; L=]'

  getBufferLength(): number {
    if (this._fixedBufferLength) return this._fixedBufferLength;

    const distanceStringLength = this.distance.toString().length;
    const lengthStringLength = this.length.toFixed().length;
    const structureLength = DebugCompressRef.structure.length;

    return distanceStringLength + lengthStringLength + structureLength;
  }

  toBuffer(bufferLength?: number | undefined): Buffer {
    return Buffer.from(`\0[D=${this.distance}; L=${this.length}]`);
  }

  static infoFromBuffer(buffer: Buffer, offset?: number): RefInfo {
    const distanceStart = buffer.indexOf('D=', offset) + 2;
    const distanceEnd = buffer.indexOf(';', distanceStart);
    const distance = +buffer.subarray(distanceStart, distanceEnd).toString('utf-8');

    const lengthStart = buffer.indexOf('L=', distanceEnd) + 2;
    const lengthEnd = buffer.indexOf(']', lengthStart);
    const length = +buffer.subarray(lengthStart, lengthEnd).toString('utf-8');

    if (Number.isNaN(length) || Number.isNaN(distance)) throw Error('NaN Error');

    return {
      distance,
      length,
      singleValueLength: 0,
    }
  }

  static fromBuffer(buffer: Buffer, offset: number = 0) {
    for (let i = offset; i < buffer.length; i++) {
      const byte = buffer[i];

      if (byte === 0) {
        const { distance, length } = this.infoFromBuffer(buffer, i);

        const ref = new this(length, distance, true)
          .calculateBufferLength();

        return ref;
      }
    }
  }

  static create() {
    return new this();
  }
}