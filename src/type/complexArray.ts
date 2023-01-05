// An complex number element a + bj contains two numner a and b.
class Complex {
    public real: number = 0;
    public virtual: number = 0;

    public toString = () : string => {
        return `${this.real}+${this.virtual}j`
    }
}
class ComplexArray implements RelativeIndexable<Complex>{
    buffer: ArrayBuffer;
    offset: number = 0;
    eleSize: number = -1;
    data: Array<Complex> = [];

    constructor(buffer: ArrayBuffer, offset: number) {
        this.buffer = buffer;
        this.offset = offset;
        // this.eleSize = eleSize;

        var temp_data = new Float64Array(buffer, offset)
        for (var i = 0; i < Math.ceil(temp_data.length / 2); i++) {
            const ele: Complex = {
                real: temp_data[2*i],
                virtual: temp_data[2*i+1]
            }
            this.data.push(ele);
        }
    }

    at(index: number): Complex | undefined {
        if (index < 0 || index >= this.data.length) {
            new Error('Out of range');
        }
        return this.data[index];
    }
}

export { ComplexArray };