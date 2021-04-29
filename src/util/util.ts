const crypto = require("crypto");
export class Util {
    static generateRandomHex(length: number): string {
        return crypto.randomBytes(length).toString('hex').slice(-1 * length);
    }

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

    static isNull(obj: any | null): boolean {
        return typeof obj === 'undefined' || obj === null;
    }

    static notNull(obj: any | null): boolean {
        return !this.isNull(obj);
    }
}
