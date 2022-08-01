// Example: np.asarray({"a": 1, "b": 2})
// 00000000: 8004 9595 0000 0000 0000 008c 156e 756d  .............num
// 00000010: 7079 2e63 6f72 652e 6d75 6c74 6961 7272  py.core.multiarr
// 00000020: 6179 948c 0c5f 7265 636f 6e73 7472 7563  ay..._reconstruc
// 00000030: 7494 9394 8c05 6e75 6d70 7994 8c07 6e64  t.....numpy...nd
// 00000040: 6172 7261 7994 9394 4b00 8594 4301 6294  array...K...C.b.
// 00000050: 8794 5294 284b 0129 6803 8c05 6474 7970  ..R.(K.)h...dtyp
// 00000060: 6594 9394 8c02 4f38 9489 8887 9452 9428  e.....O8.....R.(
// 00000070: 4b03 8c01 7c94 4e4e 4e4a ffff ffff 4aff  K...|.NNNJ....J.
// 00000080: ffff ff4b 3f74 9462 895d 947d 9428 8c01  ...K?t.b.].}.(..
// 00000090: 6194 4b01 8c01 6294 4b02 7561 7494 622e  a.K...b.K.uat.b.

class ObjectArray implements RelativeIndexable<string>{
    buffer: ArrayBuffer;
    offset: number = 0;
    eleSize: number = -1;
    data: Array<string> = [];

    constructor(buffer: ArrayBuffer, offset: number) {
        this.buffer = buffer;
        this.offset = offset;
    }

    at(index: number): string | undefined {
        if (index < 0 || index >= this.data.length) {
            new Error('Out of range');
        }
        return this.data[index];
    }
}

export { ObjectArray };