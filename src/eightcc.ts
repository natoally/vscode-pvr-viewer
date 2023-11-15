import * as vscode from 'vscode';

type int = number;

const RGBforA8 = 255; // technically, sampling A8 textures should return black RGB, but this makes them harder to see

export function decompress_R8_G8_B8_A8(dec: Uint8Array, enc: DataView, width: int, height: int): void {
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const dst = (y * width + x) * 4;
            const src = (y * width + x) * 4;
            dec[dst + 0] = enc.getUint8(src + 0);
            dec[dst + 1] = enc.getUint8(src + 1);
            dec[dst + 2] = enc.getUint8(src + 2);
            dec[dst + 3] = enc.getUint8(src + 3);
        }
    }
}

export function decompress_B8_G8_R8_A8(dec: Uint8Array, enc: DataView, width: int, height: int): void {
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const dst = (y * width + x) * 4;
            const src = (y * width + x) * 4;
            dec[dst + 0] = enc.getUint8(src + 2);
            dec[dst + 1] = enc.getUint8(src + 1);
            dec[dst + 2] = enc.getUint8(src + 0);
            dec[dst + 3] = enc.getUint8(src + 3);
        }
    }
}

export function decompress_R10_G10_B10_A2(dec: Uint8Array, enc: DataView, width: int, height: int): void {
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const dst = (y * width + x) * 4;
            const src = (y * width + x) * 4;
            const dword = enc.getUint32(src, true);
            const r = (dword >> 22) & 0x3ff;
            const g = (dword >> 12) & 0x3ff;
            const b = (dword >> 2) & 0x3ff;
            const a = (dword >> 0) & 0x3;
            dec[dst + 0] = (r >> 2);
            dec[dst + 1] = (g >> 2);
            dec[dst + 2] = (b >> 2);
            dec[dst + 3] = (a << 6) | (a << 4) | (a << 2) | (a >> 0);
        }
    }
}

export function decompress_R4_G4_B4_A4(dec: Uint8Array, enc: DataView, width: int, height: int): void {
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const dst = (y * width + x) * 4;
            const src = (y * width + x) * 2;
            const word = enc.getUint16(src, true);
            const r = (word >> 12) & 0xf;
            const g = (word >> 8) & 0xf;
            const b = (word >> 4) & 0xf;
            const a = (word >> 0) & 0xf;
            dec[dst + 0] = (r << 4) | (r >> 0);
            dec[dst + 1] = (g << 4) | (g >> 0);
            dec[dst + 2] = (b << 4) | (b >> 0);
            dec[dst + 3] = (a << 4) | (a >> 0);
        }
    }
}

export function decompress_R5_G5_B5_A1(dec: Uint8Array, enc: DataView, width: int, height: int): void {
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const dst = (y * width + x) * 4;
            const src = (y * width + x) * 2;
            const word = enc.getUint16(src, true);
            const r = (word >> 11) & 0x1f;
            const g = (word >> 6) & 0x1f;
            const b = (word >> 1) & 0x1f;
            const a = (word >> 0) & 0x1;
            dec[dst + 0] = (r << 3) | (r >> 2);
            dec[dst + 1] = (g << 3) | (g >> 2);
            dec[dst + 2] = (b << 3) | (b >> 2);
            dec[dst + 3] = (a !== 0) ? 255 : 0;
        }
    }
}

export function decompress_R16_G16_B16_A16(dec: Uint8Array, enc: DataView, width: int, height: int): void {
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const dst = (y * width + x) * 4;
            const src = (y * width + x) * 8;
            const r = enc.getUint16(src + 0, true);
            const g = enc.getUint16(src + 2, true);
            const b = enc.getUint16(src + 4, true);
            const a = enc.getUint16(src + 6, true);
            dec[dst + 0] = (r >> 8);
            dec[dst + 1] = (g >> 8);
            dec[dst + 2] = (b >> 8);
            dec[dst + 3] = (a >> 8);
        }
    }
}

export function decompress_R32_G32_B32_A32(dec: Uint8Array, enc: DataView, width: int, height: int): void {
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const dst = (y * width + x) * 4;
            const src = (y * width + x) * 16;
            const r = enc.getUint32(src + 0, true);
            const g = enc.getUint32(src + 4, true);
            const b = enc.getUint32(src + 8, true);
            const a = enc.getUint32(src + 12, true);
            dec[dst + 0] = (r >> 24);
            dec[dst + 1] = (g >> 24);
            dec[dst + 2] = (b >> 24);
            dec[dst + 3] = (a >> 24);
        }
    }
}

export function decompress_R8_G8_B8(dec: Uint8Array, enc: DataView, width: int, height: int): void {
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const dst = (y * width + x) * 4;
            const src = (y * width + x) * 3;
            dec[dst + 0] = enc.getUint8(src + 0);
            dec[dst + 1] = enc.getUint8(src + 1);
            dec[dst + 2] = enc.getUint8(src + 2);
            dec[dst + 3] = 255;
        }
    }
}

export function decompress_R5_G6_B5(dec: Uint8Array, enc: DataView, width: int, height: int): void {
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const dst = (y * width + x) * 4;
            const src = (y * width + x) * 2;
            const word = enc.getUint16(src, true);
            const r = (word >> 11) & 0x1f;
            const g = (word >> 5) & 0x3f;
            const b = (word >> 0) & 0x1f;
            dec[dst + 0] = (r << 3) | (r >> 2);
            dec[dst + 1] = (g << 2) | (g >> 4);
            dec[dst + 2] = (b << 3) | (b >> 2);
            dec[dst + 3] = 255;
        }
    }
}

export function decompress_R16_G16_B16(dec: Uint8Array, enc: DataView, width: int, height: int): void {
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const dst = (y * width + x) * 4;
            const src = (y * width + x) * 6;
            const r = enc.getUint16(src + 0, true);
            const g = enc.getUint16(src + 2, true);
            const b = enc.getUint16(src + 4, true);
            dec[dst + 0] = (r >> 8);
            dec[dst + 1] = (g >> 8);
            dec[dst + 2] = (b >> 8);
            dec[dst + 3] = 255;
        }
    }
}

export function decompress_R32_G32_B32(dec: Uint8Array, enc: DataView, width: int, height: int): void {
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const dst = (y * width + x) * 4;
            const src = (y * width + x) * 12;
            const r = enc.getUint32(src + 0, true);
            const g = enc.getUint32(src + 4, true);
            const b = enc.getUint32(src + 8, true);
            dec[dst + 0] = (r >> 24);
            dec[dst + 1] = (g >> 24);
            dec[dst + 2] = (b >> 24);
            dec[dst + 3] = 255;
        }
    }
}

export function decompress_R8_G8(dec: Uint8Array, enc: DataView, width: int, height: int): void {
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const dst = (y * width + x) * 4;
            const src = (y * width + x) * 2;
            dec[dst + 0] = enc.getUint8(src + 0);
            dec[dst + 1] = enc.getUint8(src + 1);
            dec[dst + 2] = 0;
            dec[dst + 3] = 255;
        }
    }
}

export function decompress_L8_A8(dec: Uint8Array, enc: DataView, width: int, height: int): void {
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const dst = (y * width + x) * 4;
            const src = (y * width + x) * 2;
            const l = enc.getUint8(src + 0);
            dec[dst + 0] = l;
            dec[dst + 1] = l;
            dec[dst + 2] = l;
            dec[dst + 3] = enc.getUint8(src + 1);
        }
    }
}

export function decompress_R16_G16(dec: Uint8Array, enc: DataView, width: int, height: int): void {
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const dst = (y * width + x) * 4;
            const src = (y * width + x) * 4;
            const r = enc.getUint16(src + 0, true);
            const g = enc.getUint16(src + 2, true);
            dec[dst + 0] = (r >> 8);
            dec[dst + 1] = (g >> 8);
            dec[dst + 2] = 0;
            dec[dst + 3] = 255;
        }
    }
}

export function decompress_R32_G32(dec: Uint8Array, enc: DataView, width: int, height: int): void {
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const dst = (y * width + x) * 4;
            const src = (y * width + x) * 8;
            const r = enc.getUint32(src + 0, true);
            const g = enc.getUint32(src + 4, true);
            dec[dst + 0] = (r >> 24);
            dec[dst + 1] = (g >> 24);
            dec[dst + 2] = 0;
            dec[dst + 3] = 255;
        }
    }
}

export function decompress_R8(dec: Uint8Array, enc: DataView, width: int, height: int): void {
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const dst = (y * width + x) * 4;
            const src = (y * width + x) * 1;
            dec[dst + 0] = enc.getUint8(src + 0);
            dec[dst + 1] = 0;
            dec[dst + 2] = 0;
            dec[dst + 3] = 255;
        }
    }
}

export function decompress_A8(dec: Uint8Array, enc: DataView, width: int, height: int): void {
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const dst = (y * width + x) * 4;
            const src = (y * width + x) * 1;
            dec[dst + 0] = RGBforA8;
            dec[dst + 1] = RGBforA8;
            dec[dst + 2] = RGBforA8;
            dec[dst + 3] = enc.getUint8(src + 0);
        }
    }
}

export function decompress_L8(dec: Uint8Array, enc: DataView, width: int, height: int): void {
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const dst = (y * width + x) * 4;
            const src = (y * width + x) * 1;
            const l = enc.getUint8(src + 0);
            dec[dst + 0] = l;
            dec[dst + 1] = l;
            dec[dst + 2] = l;
            dec[dst + 3] = 255;
        }
    }
}

export function decompress_R16(dec: Uint8Array, enc: DataView, width: int, height: int): void {
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const dst = (y * width + x) * 4;
            const src = (y * width + x) * 2;
            const r = enc.getUint16(src + 0, true);
            dec[dst + 0] = (r >> 8);
            dec[dst + 1] = 0;
            dec[dst + 2] = 0;
            dec[dst + 3] = 255;
        }
    }
}

export function decompress_R32(dec: Uint8Array, enc: DataView, width: int, height: int): void {
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const dst = (y * width + x) * 4;
            const src = (y * width + x) * 4;
            const r = enc.getUint32(src + 0, true);
            dec[dst + 0] = (r >> 24);
            dec[dst + 1] = 0;
            dec[dst + 2] = 0;
            dec[dst + 3] = 255;
        }
    }
}