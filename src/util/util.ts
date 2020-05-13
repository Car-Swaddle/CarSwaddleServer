
export class Util {
    static isString (obj: any | null): boolean {
        return obj && Object.prototype.toString.call(obj) === '[object String]';
    }

    static isNumber (obj: any | null): boolean {
        return obj && !isNaN(obj);
    }

    static isNullOrString(obj: any | null): boolean {
        return !obj || this.isString(obj);
    }

    static isNullOrNumber(obj: any | null): boolean {
        return !obj || this.isNumber(obj);
    }

    static areStrings(...arr: any[]): boolean {
        return arr.every(x => this.isString(x));
    }

    static areNumbers(...arr: any[]): boolean {
        return arr.every(x => this.isNumber(x));
    }

    static areNullOrStrings(...arr: any[]): boolean {
        return arr.every(x => this.isNullOrString(x));
    }

    static areNullOrNumbers(...arr: any[]): boolean {
        return arr.every(x => this.isNullOrNumber(x));
    }
}
