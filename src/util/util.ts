
export class Util {
    static isString (obj: any | null): boolean {
        return Object.prototype.toString.call(obj) === '[object String]';
    }

    static isNumber (obj: any | null): boolean {
        return !isNaN(obj);
    }

    static isNullOrString(obj: any | null): boolean {
        return !obj || this.isString(obj);
    }

    static isNullOrNumber(obj: any | null): boolean {
        return !obj || this.isNumber(obj);
    }

    static areNullOrString(arr: any[]): boolean {
        return arr.every(x => this.isNullOrString(x));
    }

    static areNullOrNumber(arr: any[]): boolean {
        return arr.every(x => this.isNullOrNumber(x));
    }
}
