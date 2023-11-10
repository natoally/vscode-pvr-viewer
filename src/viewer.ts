import * as vscode from 'vscode';
import * as path from 'path';

function generateHTMLCanvas(imageData: string, width: number, height: number): string {
    const styles = {
        canvas: `padding: 0;
                 margin: auto;
                 display: block;`,
        info: `position: fixed;
               background-color: #ec5340;
               padding: 0px 15px;
               margin: 15px 15px;
               width: 100px;
               left: 20px;
               -webkit-touch-callout: none;
               -webkit-user-select: none;`,
        sizingButton: `width: 48%;
                       background-color: #dd4535;
                       display: inline-block;
                       text-align: center;
                       cursor: pointer;
                       user-select: none;`,
        wideButton: `background-color: #dd4535;
                     text-align: center;
                     margin-bottom: 15px;
                     cursor: pointer;
                     user-select: none;`
    };

    return `<!DOCTYPE html>
        <html lang="en">
            <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body>
            <div style="${styles.info}">
                <p id="width-display">Width: ${width}px</p>
                <p id="height-display">Height: ${height}px</p>
                <p id="scale-display">Zoom: 100%</p>
                <div style="margin-bottom: 5px">
                <div onclick="scale = scale * 2; showImg(scale);" style="${styles.sizingButton}">+</div>
                <div onclick="scale = scale / 2; showImg(scale);" style="${styles.sizingButton}">-</div>
                </div>
                <div onclick="scale = 1; showImg(scale);" style="${styles.wideButton}">Reset</div>
            </div>
            <div id="canvas-container" style="overflow: auto">
                <canvas width="${width}" height="${height}" id="canvas-area" style="${styles.canvas}"></canvas>
            </div>
            <script>
                let scale = 1;
                const jsonStr = '${imageData}';
                let message = JSON.parse(jsonStr);
                const canvas = document.getElementById('canvas-area');
                const widthDisplay = document.getElementById('width-display');
                const heightDisplay = document.getElementById('height-display');
                const scaleDisplay = document.getElementById('scale-display');
    
                function scaleCanvas(targetCanvas, scale) {
                    const { pixels, width, height } = message;
    
                    // Write the pixels to an ImageData object
                    const data = new Uint8ClampedArray(width * height * 4);
                    for (let row = 0; row < height; row++) {
                        for (let col = 0; col < width; col++) {
                            let color = pixels[row * width + col];
                            let i = row * 4 * width + col * 4;
                            data[i + 0] = color.r;
                            data[i + 1] = color.g;
                            data[i + 2] = color.b;
                            data[i + 3] = 255;
                        }
                    }
                    const id = new ImageData(data, width, height);
    
                    // Write the ImageData to a background canvas
                    const backCanvas = document.createElement('canvas');
                    backCanvas.width = id.width;
                    backCanvas.height = id.height;
                    backCanvas.getContext('2d').putImageData(id, 0, 0);
    
                    // Scale the target canvas and write the background canvas to it
                    const ctx = targetCanvas.getContext('2d');
                    targetCanvas.width = width * scale;
                    targetCanvas.height = height * scale;
                    ctx.scale(scale, scale);
                    ctx.imageSmoothingEnabled = false;
                    ctx.drawImage(backCanvas, 0, 0);
                }
    
                function showImg(scale) {
                    const { width, height } = message;
                    scaleCanvas(canvas, scale);
                    widthDisplay.innerHTML = "Width: " + String(width) + "px";
                    heightDisplay.innerHTML = "Height: " + String(height) + "px";
                    scaleDisplay.innerHTML = "Zoom: " + String(scale * 100) + "%";
                }
                showImg(scale);
    
                function zoom(e) {
                    e.preventDefault();
                    if (!e.ctrlKey) return;
                    if (e.deltaY < 0) {
                        scale = scale * 2;
                    } else {
                        scale = scale / 2;
                    }
                    showImg(scale);
                }
    
                window.addEventListener('wheel', zoom);
    
                const lastPos = { x: 0, y: 0 };
                let isDragging = false;
                const canvasContainer = document.getElementById('canvas-container');
                const root = document.documentElement;
    
                function onMouseDown(e) {
                    lastPos.x = e.clientX;
                    lastPos.y = e.clientY;
                    canvasContainer.style.cursor = 'grabbing';
                    isDragging = true;
                };
    
                function onMouseMove(e) {
                    if (isDragging) {
                        canvasContainer.style.cursor = 'grabbing';
        
                        const dx = lastPos.x - e.clientX;
                        const dy = lastPos.y - e.clientY;
        
                        canvasContainer.scrollLeft += dx;
                        root.scrollTop += dy;
        
                        lastPos.x = e.clientX;
                        lastPos.y = e.clientY;
                    }
                };
    
                function onMouseUp(e) {
                    canvasContainer.style.cursor = 'grab';
                    isDragging = false;
                };
    
                canvasContainer.onmousedown = onMouseDown;
                canvasContainer.onmousemove = onMouseMove;
                canvasContainer.onmouseup = onMouseUp;
    
                window.addEventListener('message', event => {
                    message = event.data;
                    showImg(scale);
                });
            </script>
            </body>
        </html>`;
}

function parseByteFormat(byteData: Uint8Array) {
    return { pixels: true, width: 256, height: 128 };
}

class ImagePreviewDocument extends vscode.Disposable implements vscode.CustomDocument {

    private readonly _uri: vscode.Uri;
    private _documentData: Uint8Array;

    private static async readFile(uri: vscode.Uri) {
        return vscode.workspace.fs.readFile(uri);
    }

    static async create(uri: vscode.Uri): Promise<ImagePreviewDocument | PromiseLike<ImagePreviewDocument>> {
        const data = await ImagePreviewDocument.readFile(uri);
        return new ImagePreviewDocument(uri, data);
    }

    private constructor(uri: vscode.Uri, initialContent: Uint8Array) {
        super(() => { });
        this._uri = uri;
        this._documentData = initialContent;
    }

    public get uri(): vscode.Uri {
        return this._uri;
    }

    public get documentData(): Uint8Array {
        return this._documentData;
    }

    public get imageData(): string {
        const imageDesc = parseByteFormat(this._documentData);
        return JSON.stringify(imageDesc);
    }

    dispose() {
        super.dispose();
    }
}

export default class ImagePreviewProvider implements vscode.CustomReadonlyEditorProvider<ImagePreviewDocument> {

    private static readonly viewType = 'pvr-viewer';

    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        return vscode.window.registerCustomEditorProvider(
            ImagePreviewProvider.viewType,
            new ImagePreviewProvider(context),
            {
                webviewOptions: {
                    retainContextWhenHidden: false
                },
                supportsMultipleEditorsPerDocument: false
            });
    }

    constructor(private readonly _context: vscode.ExtensionContext) { }

    async openCustomDocument(uri: vscode.Uri, _openContext: vscode.CustomDocumentOpenContext, _token: vscode.CancellationToken): Promise<ImagePreviewDocument> {
        const document = await ImagePreviewDocument.create(uri);
        return document;
    }

    async resolveCustomEditor(document: ImagePreviewDocument, webviewPanel: vscode.WebviewPanel, _token: vscode.CancellationToken): Promise<void> {
        // setup initial content for the webview
        webviewPanel.webview.options = { enableScripts: true };
        webviewPanel.webview.html = generateHTMLCanvas(document.imageData, 0, 0);

        const watcherAction = async (e: vscode.Uri) => {
            const docUriPath = document.uri.path.replace(/(\/[A-Z]:\/)/, (match) => match.toLowerCase());
            if (docUriPath === e.path) {
                const newDocument = await ImagePreviewDocument.create(vscode.Uri.parse(e.path));
                webviewPanel.webview.postMessage(newDocument.imageData);
            }
        };

        const absolutePath = document.uri.path;
        const fileName = path.parse(absolutePath).base;
        const dirName = path.parse(absolutePath).dir;
        const fileUri = vscode.Uri.file(dirName);
        const pattern = new vscode.RelativePattern(fileUri, fileName);
        const globalWatcher = vscode.workspace.createFileSystemWatcher(pattern);
        const globalChangeFileSubscription = globalWatcher.onDidChange(watcherAction);

        webviewPanel.onDidDispose(() => {
            globalChangeFileSubscription.dispose();
        });
    }
}
