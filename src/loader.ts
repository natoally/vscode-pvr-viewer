import * as vscode from 'vscode';
import sharp, { SharpOptions } from 'sharp';
import * as pvr from './pvr';
import * as pvrtc from './pvrtc';
import * as etc from './etc';

function srgbToLinear(x: number): number {
    return x <= 0.04045 ? x * 0.0773993808 : Math.pow((x + 0.055) / 1.055, 2.4);
}

function linearToSrgb(x: number): number {
    return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 0.41666) - 0.055;
}

export default class PVRLoader {

    public static async readFile(uri: vscode.Uri): Promise<Buffer> {
        const data = await vscode.workspace.fs.readFile(uri);
        const loader = new PVRLoader();
        return loader.parse(data);
    }

    private constructor() {
    }

    public async parse(data: Uint8Array): Promise<Buffer> {
        if (data.length < pvr.HEADER_SIZE) { throw new Error(); }

        // read fixed size header block
        const header = new DataView(data.buffer, data.byteOffset, pvr.HEADER_SIZE);
        const version = header.getUint32(0, true);
        if (version !== pvr.PVRTEX3_IDENT) { throw new Error(); }
        const flags = header.getUint32(4, true); // 0 = no flags, 2 = pre-multiplied alpha
        const pixelFormat: pvr.PixelFormat = header.getUint32(8, true);
        const pixelFormatHigh = header.getUint32(12, true); // 0
        const colourSpace: pvr.ColourSpace = header.getUint32(16, true);
        const channelType: pvr.VariableType = header.getUint32(20, true);
        const height = header.getUint32(24, true); // 512 pixels
        const width = header.getUint32(28, true); // 512 pixels
        const depth = header.getUint32(32, true); // 1 pixel
        const numSurfaces = header.getUint32(36, true); // 1 in array
        const numFaces = header.getUint32(40, true); // 1 in cubemap
        const mipMapCount = header.getUint32(44, true); // 1 mip only
        const metaDataSize = header.getUint32(48, true); // 0 bytes
    
        const premultiplied = ((flags & pvr.PVRTEX3_PREMULTIPLIED) !== 0);
        let flipX = false;
        let flipY = false;
        let flipZ = false;
    
        // read metadata, 0 or more key-value entries
        let metadata = new DataView(data.buffer, data.byteOffset + pvr.HEADER_SIZE, metaDataSize);
        while (metadata.byteLength > 12) {
            const creator = metadata.getUint32(0, true);
            const semantic: pvr.MetaData = metadata.getUint32(4, true);
            const length = metadata.getUint32(8, true);
            if (metadata.byteLength >= 12 + length) {
                const bytes = new DataView(metadata.buffer, metadata.byteOffset + 12, length);
                switch (semantic) {
                    case pvr.MetaData.TextureOrientation:
                        flipX = (bytes.getUint8(pvr.Axis.X) === pvr.Orientation.Left);
                        flipY = (bytes.getUint8(pvr.Axis.Y) === pvr.Orientation.Up);
                        flipZ = (bytes.getUint8(pvr.Axis.Z) === pvr.Orientation.Out);
                        break;
                }
                metadata = new DataView(metadata.buffer, metadata.byteOffset + 12 + length, metadata.byteLength - 12 - length);
            } else {
                break;
            }
        }
    
        // read bulk color data
        const encData = new DataView(data.buffer, data.byteOffset + pvr.HEADER_SIZE + metaDataSize, data.byteLength - pvr.HEADER_SIZE - metaDataSize);
        const decData = new Uint8Array(width * height * 4);
    
        switch (pixelFormat) {
            case pvr.PixelFormat.PVRTCI_2bpp_RGB:
                if (channelType === pvr.VariableType.UnsignedByteNorm) {
                    pvrtc.decompress_PVRTC(decData, encData, width, height, true); // linear and srgb
                }
                break;
            case pvr.PixelFormat.PVRTCI_2bpp_RGBA:
                if (channelType === pvr.VariableType.UnsignedByteNorm) {
                    pvrtc.decompress_PVRTC(decData, encData, width, height, true); // linear and srgb
                }
                break;
            case pvr.PixelFormat.PVRTCI_4bpp_RGB:
                if (channelType === pvr.VariableType.UnsignedByteNorm) {
                    pvrtc.decompress_PVRTC(decData, encData, width, height, false); // linear and srgb
                }
                break;
            case pvr.PixelFormat.PVRTCI_4bpp_RGBA:
                if (channelType === pvr.VariableType.UnsignedByteNorm) {
                    pvrtc.decompress_PVRTC(decData, encData, width, height, false); // linear and srgb
                }
                break;
            case pvr.PixelFormat.PVRTCII_2bpp:
                if (channelType === pvr.VariableType.UnsignedByteNorm) {
                    pvrtc.decompress_PVRTC2(decData, encData, width, height, true); // linear and srgb
                }
                break;
            case pvr.PixelFormat.PVRTCII_4bpp:
                if (channelType === pvr.VariableType.UnsignedByteNorm) {
                    pvrtc.decompress_PVRTC2(decData, encData, width, height, false); // linear and srgb
                }
                break;
            case pvr.PixelFormat.ETC1:
                if (channelType === pvr.VariableType.UnsignedByteNorm && colourSpace === pvr.ColourSpace.Linear) {
                    etc.decompress_ETC2_RGB(decData, encData, width, height);
                }
                break;
            case pvr.PixelFormat.ETC2_RGB:
                if (channelType === pvr.VariableType.UnsignedByteNorm) {
                    etc.decompress_ETC2_RGB(decData, encData, width, height); // linear and srgb
                }
                break;
            case pvr.PixelFormat.ETC2_RGBA:
                if (channelType === pvr.VariableType.UnsignedByteNorm) {
                    etc.decompress_ETC2_RGBA(decData, encData, width, height); // linear and srgb
                }
                break;
            case pvr.PixelFormat.ETC2_RGB_A1:
                if (channelType === pvr.VariableType.UnsignedByteNorm) {
                    etc.decompress_ETC2_RGB_A1(decData, encData, width, height); // linear and srgb
                }
                break;
            case pvr.PixelFormat.EAC_R11:
                if (channelType === pvr.VariableType.UnsignedShortNorm && colourSpace === pvr.ColourSpace.Linear) {
                    etc.decompress_EAC_R11(decData, encData, width, height, false);
                }
                break;
            case pvr.PixelFormat.EAC_R11:
                if (channelType === pvr.VariableType.SignedShortNorm && colourSpace === pvr.ColourSpace.Linear) {
                    etc.decompress_EAC_R11(decData, encData, width, height, true);
                }
                break;
            case pvr.PixelFormat.EAC_RG11:
                if (channelType === pvr.VariableType.UnsignedIntegerNorm && colourSpace === pvr.ColourSpace.Linear) {
                    etc.decompress_EAC_RG11(decData, encData, width, height, false);
                }
                break;
            case pvr.PixelFormat.EAC_RG11:
                if (channelType === pvr.VariableType.SignedIntegerNorm && colourSpace === pvr.ColourSpace.Linear) {
                    etc.decompress_EAC_RG11(decData, encData, width, height, true);
                }
                break;
            case pvr.PixelFormat.PVRTCI_HDR_6bpp:
                if (channelType === pvr.VariableType.SignedFloat && colourSpace === pvr.ColourSpace.Linear) {
                    // ...
                }
                break;
            case pvr.PixelFormat.PVRTCI_HDR_8bpp:
                if (channelType === pvr.VariableType.SignedFloat && colourSpace === pvr.ColourSpace.Linear) {
                    // ...
                }
                break;
            case pvr.PixelFormat.PVRTCII_HDR_6bpp:
                if (channelType === pvr.VariableType.SignedFloat && colourSpace === pvr.ColourSpace.Linear) {
                    // ...
                }
                break;
            case pvr.PixelFormat.PVRTCII_HDR_8bpp:
                if (channelType === pvr.VariableType.SignedFloat && colourSpace === pvr.ColourSpace.Linear) {
                    // ...
                }
                break;
        }
    
        if (colourSpace === pvr.ColourSpace.Linear) {
            for (let y = 0; y < width; y++) {
                for (let x = 0; x < width; x++) {
                    const i = (y * width + x) * 4;
                    for (let c = 0; c < 3; c++) {
                        decData[i + c] = Math.round(linearToSrgb(decData[i + c] / 255.0) * 255.0);
                    }
                }
            }
        }
    
        const options:SharpOptions = { raw: { width: width, height: height, channels: 4, premultiplied: premultiplied } };
        const image = sharp(decData, options);
        return await image
            .flip(flipY)
            .flop(flipX)
            .png({ compressionLevel: 0 })
            .toColourspace('srgb')
            .withMetadata()
            .toBuffer();
    }
}
