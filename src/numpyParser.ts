// Modified from https://github.com/ludwigschubert/js-numpy-parser/blob/master/src/main.js
import * as fs from 'fs';


import { BytesArray } from './type/bytesArray';
import { BoolArray } from './type/boolArray';
import { StringArray } from './type/stringArray';

var stringArrEleSize = -1;
var bytesArrEleSize = -1;
const MAX_OUTPUT_BOOL_LIMIT = 10000;
// const MAX_ARR_LIMIT = 1000000;

export function loadArrayBuffer(file: string) {
  const buffer = fs.readFileSync(file);
  return new Uint8Array(buffer).buffer; // only needed for node conversion
}

export function loadBuffer(file: string) {
  return fs.readFileSync(file);
}

class DataViewReader {
  offset: number = 0;
  constructor(public dataView: DataView) {
    this.dataView = dataView;
  }

  /* Variable length accessors */

  readBytes(length: number) {
    const buffer = new DataView(this.dataView.buffer, this.offset, length);
    this.offset += length;
    return buffer;
  }

  readAndASCIIDecodeBytes(length: number) {
    const array = new Uint8Array(this.dataView.buffer, this.offset, length);
    this.offset += length;
    return this._decodeASCIIByteArray(array);
  }

  /* Fixed length accessors */

  readUint8() {
    const value = this.dataView.getUint8(this.offset);
    this.offset += Uint8Array.BYTES_PER_ELEMENT;
    return value;
  }

  readUint16(littleEndian = false) {
    const value = this.dataView.getUint16(this.offset, littleEndian);
    this.offset += Uint16Array.BYTES_PER_ELEMENT;
    return value;
  }

  readUint32(littleEndian = false) {
    const value = this.dataView.getUint32(this.offset, littleEndian);
    this.offset += Uint32Array.BYTES_PER_ELEMENT;
    return value;
  }

  readBigUInt64(littleEndian = false) {
    const value = this.dataView.getBigUint64(this.offset, littleEndian);
    this.offset += BigUint64Array.BYTES_PER_ELEMENT;
    return value;
  }
  /* Helpers */

  _decodeASCIIByteArray(array: any) {
    const characters = [];
    for (const byte of array) {
      const char = String.fromCharCode(byte);
      characters.push(char);
    }
    return characters.join('');
  }
}

export function fromArrayBuffer(buffer: ArrayBuffer) {
  const reader = new DataViewReader(new DataView(buffer));
  // comments are taken from https://docs.scipy.org/doc/numpy-1.14.1/neps/npy-format.html#format-specification-version-1-0
  // "The first 6 bytes are a magic string: exactly "x93NUMPY""
  const magicByte = reader.readUint8();
  const magicWord = reader.readAndASCIIDecodeBytes(5);
  if (magicByte !== 0x93 || magicWord !== 'NUMPY') {
    throw new Error(`unknown file type: "${magicByte}${magicWord}"`);
  }
  // "The next 1 byte is an unsigned byte: the major version number of the file format, e.g. x01.""
  const versionMajor = reader.readUint8();
  // "The next 1 byte is an unsigned byte: the minor version number of the file format, e.g. x00."
  const versionMinor = reader.readUint8();
  // Parse header length. This depends on the major file format version as follows:
  let headerLength;
  if (versionMajor <= 1) {
    // "The next 2 bytes form a little-endian unsigned short int: the length of the header data HEADER_LEN."
    headerLength = reader.readUint16(true);
  } else {
    // "The next 4 bytes form a little-endian unsigned int: the length of the header data HEADER_LEN."
    headerLength = reader.readUint32(true);
  }
  /* "The next HEADER_LEN bytes form the header data describing the array’s format.
  It is an ASCII string which contains a Python literal expression of a dictionary.
  It is terminated by a newline (‘n’) and padded with spaces (‘x20’) to make the total
  length of the magic string + 4 + HEADER_LEN be evenly divisible by 16." */
  const preludeLength = 6 + 4 + headerLength;
  if (preludeLength % 16 !== 0) {
    console.warn(`NPY file header is incorrectly padded. (${preludeLength} is not evenly divisible by 16.)`);
  }
  const headerStr = reader.readAndASCIIDecodeBytes(headerLength);
  const header = parseHeaderStr(headerStr);
  var order = 'C';
  if (header.fortran_order) {
    order = 'F';
    // throw new Error('NPY file is written in Fortran byte order, support for this byte order is not yet implemented.');
  }
  // Intepret the bytes according to the specified dtype
  var data;
  const constructor = typedArrayConstructorForDescription(header.descr);
  switch (constructor) {
    case String:
      var stringArray = new StringArray(buffer, reader.offset, stringArrEleSize);
      data = stringArray.data;
      break;
    case Number:
      var bytesArray = new BytesArray(buffer, reader.offset, bytesArrEleSize);
      data = bytesArray.data;
      break;
    case Boolean:
      var boolArray = new BoolArray(buffer, reader.offset);
      data = boolArray.data;
      // if (boolArray.eleNum > MAX_OUTPUT_BOOL_LIMIT) {
      //   data = new Uint8Array(buffer, reader.offset);
      //   console.log('[+] true and false have been replaced with numbers');
      // }
      break;
    default:
      data = new constructor(buffer, reader.offset);
  }
  // if (constructor === String) {
  //   var stringArray = new StringArray(buffer, reader.offset, stringArrEleSize);
  //   data = stringArray.data;
  // } else {
  //   data = new constructor(buffer, reader.offset);
  // }

  // Return object with same signature as NDArray expects: {data, shape}
  return { data: data, shape: header.shape, order: order };
}


function parseHeaderStr(headerStr: string) {
  const jsonHeader = headerStr
    .replace('L', '') // string array (116L,) -> (116,)
    .replace('U', 'str')
    .replace('S', 'bytes')
    .toLowerCase() // boolean literals: False -> false
    .replace('(', '[').replace('),', ']') // Python tuple to JS array: (10,) -> [10,]
    .replace('[,', '[1,]').replace(',]', ',1]') // implicit dimensions: [10,] -> [10,1]
    .replace(/'/g, '"'); // single quotes -> double quotes
  // console.log(jsonHeader);
  return JSON.parse(jsonHeader);
}



function typedArrayConstructorForDescription(dtypeDescription: string) {
  /* 'dtype' description strings consist of three characters, indicating one of three
     properties each: byte order, data type, and byte length.
     Byte order: '<' (little-endian), '>' (big-endian), or '|' (not applicable)
     Data type: 'u' (unsigned), 'i' (signed integer), 'f' (floating)
     Byte Length: 1, 2, 4 or 8 bytes
     Note that for 1 byte dtypes there is no byte order, thus the use of '|' (not applicable).
     Data types are specified in numpy source:
     https://github.com/numpy/numpy/blob/8aa121415760cc6839a546c3f84e238d1dfa1aa6/numpy/core/_dtype.py#L13
   */
  switch (dtypeDescription) {

    // Unsigned Integers
    case '|u1':
      return Uint8Array;
    case '<u2':
      return Uint16Array;
    case '<u4':
      return Uint32Array;
    case '<u8':
      return BigUint64Array;

    // Integers
    case '|i1': // "byte"
      return Int8Array;
    case '<i2': // "short"
      return Int16Array;
    case '<i4': // "intc"
      return Int32Array;
    case '<i8': // "longlong" (??)
      return BigInt64Array;

    // Floating
    case '<f2': // "half"
      throw new Error('Because JavaScript doesn\'t currently include standard support for 16-bit floating point values, support for this dtype is not yet implemented.');
    case '<f4': // "single"
      return Float32Array;
    case '<f8': // "double" "longfloat"
      return Float64Array;

    case '|b1':
      return Boolean;

    // No support for ComplexFloating, on-number types (flexible/character/void...) yet

    default:
      // check whether is string array
      if (dtypeDescription.startsWith('<str')) {
        const size = parseInt(dtypeDescription.slice(4));
        console.log('[+] String Array, element size is', size);
        stringArrEleSize = size;
        return String;
      }
      if (dtypeDescription.startsWith('|bytes')) {
          const size = parseInt(dtypeDescription.slice(6));
          console.log('[+] Bytes Array, element size is', size);
          bytesArrEleSize = size;
          // TODO change it, temp use this to identify
          return Number;
      }
      throw new Error('Unknown or not yet implemented numpy dtype description: ' + dtypeDescription);
  }
}