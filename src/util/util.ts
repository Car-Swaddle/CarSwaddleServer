import Hashids from 'hashids';

// Lowercase alphanumeric except confusing characters - 0/o 1/l
const fiveCharacterHashids = new Hashids('5character', 5, "23456789abcdefghjkmnpqrstuvwxyz")

export class Util {

    static generateFiveCharacterReadableID(): string {
        // Use current time and random number 0-100
        const encoded = fiveCharacterHashids.encode([Date.now(), Math.round(Math.random() * 100)]);
        return encoded.substring(0, 5);
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
