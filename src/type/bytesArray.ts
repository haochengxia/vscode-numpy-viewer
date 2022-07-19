class BytesArray implements RelativeIndexable<string>{
    buffer: ArrayBuffer;
    offset: number = 0;
    eleSize: number = -1;
    data: Array<string> = [];

    constructor(buffer: ArrayBuffer, offset: number, eleSize: number) {
        this.buffer = buffer;
        this.offset = offset;
        this.eleSize = eleSize;

        const charArr = new Uint8Array(buffer, this.offset);
        const BYTES_PER_ELEMENT = eleSize;
        const stringNum = charArr.length / BYTES_PER_ELEMENT;
        var begin = 0;
        var end = 0;
        end += BYTES_PER_ELEMENT;
        for (var i = 0; i < stringNum; i++) {
            this.data.push("b'" + String.fromCharCode.apply(null, Array.from(charArr.slice(begin, end))) + "'");
            begin += BYTES_PER_ELEMENT;
            end += BYTES_PER_ELEMENT;
        }
    }

    at(index: number): string | undefined {
        if (index < 0 || index >= this.data.length) {
            new Error('Out of range');
        }
        return this.data[index];
    }
}

export { BytesArray };