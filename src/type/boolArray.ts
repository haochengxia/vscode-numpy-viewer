class BoolArray implements RelativeIndexable<boolean>{
    buffer: ArrayBuffer;
    offset: number = 0;
    eleSize: number = 1;
    eleNum: number = 0;
    data: Array<boolean> = [];

    constructor(buffer: ArrayBuffer, offset: number) {
        this.buffer = buffer;
        this.offset = offset;
        const boolArr = new Uint8Array(buffer, this.offset);
        this.eleNum = boolArr.length;

        boolArr.forEach(element => {
            if (element === 1) {
                this.data.push(true);
            } else {
                this.data.push(false);
            }
        });
    }

    at(index: number): boolean | undefined {
        if (index < 0 || index >= this.data.length) {
            new Error('Out of range');
        }
        return this.data[index];
    }
}

export { BoolArray };