import * as vscode from 'vscode';

import { fromArrayBuffer, loadArrayBuffer, loadBuffer, getFileSize } from './numpyParser';
import * as safetensors from './safetensorsParser';
import { Disposable } from './disposable';
import { arrayValuesToHtml, escapeHtml } from './html';
import { OSUtils, toCLikeArray, toMultiDimArray, show2DArr, multiArrayToString, wrapWithSqBr, contentFormatting, getOption, setPrecision } from './utils';
import { updateStatusBarText } from './extension';

type PreviewState = 'Disposed' | 'Visible' | 'Active';

export class NumpyPreview extends Disposable {
  private _previewState: PreviewState = 'Visible';

  constructor(
    private readonly extensionRoot: vscode.Uri,
    private readonly resource: vscode.Uri,
    private readonly webviewEditor: vscode.WebviewPanel
  ) {
    super();
    const resourceRoot = resource.with({
      path: resource.path.replace(/\/[^/]+?\.\w+$/, '/'),
    });

    webviewEditor.webview.options = {
      enableScripts: false,
      localResourceRoots: [resourceRoot, extensionRoot],
    };

    this._register(
      webviewEditor.webview.onDidReceiveMessage((message) => {
        switch (message.type) {
          case 'reopen-as-text': {
            vscode.commands.executeCommand(
              'vscode.openWith',
              resource,
              'default',
              webviewEditor.viewColumn
            );
            break;
          }
        }
      })
    );

    this._register(
      webviewEditor.onDidChangeViewState(() => {
        this.update();
      })
    );

    this._register(
      webviewEditor.onDidDispose(() => {
        this._previewState = 'Disposed';
      })
    );

    const watcher = this._register(
      vscode.workspace.createFileSystemWatcher(resource.fsPath)
    );
    this._register(
      watcher.onDidChange((e) => {
        if (e.toString() === this.resource.toString()) {
          this.reload();
        }
      })
    );
    this._register(
      watcher.onDidDelete((e) => {
        if (e.toString() === this.resource.toString()) {
          this.webviewEditor.dispose();
        }
      })
    );
    let promiseString: Promise<string> = NumpyPreview.getWebviewContents(
      this.resource.path,
      false,
      '',
      false,
      this.webviewEditor.webview.cspSource
    );
    promiseString.then((stringValue) => {
      this.webviewEditor.webview.html = stringValue;
      this.update();
    });
    let shapeString: Promise<string> = NumpyPreview.getWebviewContents(this.resource.path, false, '', true);
    shapeString.then((stringValue) => {
      updateStatusBarText(stringValue);
    });
    
  }

  private reload(): void {
    if (this._previewState !== 'Disposed') {
      this.webviewEditor.webview.postMessage({ type: 'reload' });
    }
  }

  private update(): void {
    if (this._previewState === 'Disposed') {
      return;
    }

    if (this.webviewEditor.active) {
      this._previewState = 'Active';
      return;
    }
    this._previewState = 'Visible';
  }

  public static async getWebviewContents(
    resourcePath: string,
    tableViewFlag: boolean,
    tableCss = '',
    shapeFlag = false,
    cspSource = ''
  ): Promise<string> {
    var content: string = '';
    var shape: string = '';
    var path = resourcePath;
    switch (OSUtils.isWindows()) {
      case true:
        path = path.slice(1,);
        console.log('[+] Windows -> cut path', path);
        break;
      default:
        console.log('[+] NOT Windows', path);
    }
    // Catch large file
    if (getFileSize(path) > 50) {
      vscode.window.showInformationMessage("File too large (> 50MB)");
      return 'File too large (> 50MB), another extension <a href="https://marketplace.visualstudio.com/items?itemName=Percy.vscode-pydata-viewer" target="_blank">vscode-pydata-viewer</a>  may be helpful.';
    }
    if (path.endsWith('.npz')) {
      // Solve .npz file
      // comments are taken from https://docs.scipy.org/doc/numpy-1.14.1/neps/npy-format.html#format-specification-version-1-0
      // For a simple way to combine multiple arrays into a single file, one can use ZipFile to contain multiple “.npy” files. 
      // We recommend using the file extension “.npz” for these archives.
      var admZip = require('adm-zip');
      var zip = new admZip(loadBuffer(path));
      var zipEntries = zip.getEntries();
      console.log(`[+] There are ${zipEntries.length} files in .npz file.`);

      var names: Array<string> = [];
      var buffers: Array<ArrayBuffer> = [];

      zipEntries.forEach((entry: any) => {
        names.push(entry.entryName);
        buffers.push(new Uint8Array(entry.getData()).buffer);
      });
      var contents: Array<string> = [];
      for (var i = 0; i < zipEntries.length; i++) {
        contents.push(escapeHtml(names[i]));
        var {content: tempContent, shapeLength: sl}=  this.bufferToString(buffers[i], tableViewFlag, tableCss);
        if (sl >= 2) {
          tempContent = contentFormatting(tempContent, sl);
        }
        contents.push(tempContent);
        shape += `${names[i]} (${fromArrayBuffer(buffers[i]).shape}) `;
      }
      content = contents.join(`<p/>`);
    } else if (path.endsWith('.safetensors')) {
        const arrayBuffer = loadArrayBuffer(path);
        const tensors: {[key: string]: {data: DataView, shape: number[], dtype: string}} = safetensors.fromArrayBuffer(arrayBuffer);
        var contents: Array<string> = [];
        for (const key in tensors) {
            contents.push(escapeHtml(key));
            const { data, shape, dtype } = tensors[key];
            let {content: tempContent, shapeLength: sl}=  this.safetensorsToString({data, shape, dtype}, tableViewFlag, tableCss);
            if (sl >= 2) {
                tempContent = contentFormatting(tempContent, sl);
            }
            contents.push(tempContent);
        }
        content = contents.join(`<p/>`);
    }
    else {
      const arrayBuffer = loadArrayBuffer(path);
      var {content: tempContent, shapeLength: sl}=  this.bufferToString(arrayBuffer, tableViewFlag, tableCss);
      if (sl >= 2) {
        tempContent = contentFormatting(tempContent, sl);
      }
      content = tempContent;
      shape += `(${fromArrayBuffer(arrayBuffer).shape}) `;
    }

    console.log(`[+] Shape is: ${shape}.`);
    if (shapeFlag) {
      return shape;
    }

    // Introduce css file
    var resourceLink = '';
    if (tableCss !== '') {
      resourceLink = `<link rel="stylesheet" href="${escapeHtml(tableCss)}">`;
    }

    // Replace , with ,\n for reading
    var re = /,/gi;
    content = content.replace(re, `,\n`);
    const head = `<!DOCTYPE html>
    <html dir="ltr" mozdisallowselectionprint>
    <head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'none'; style-src ${cspSource} 'unsafe-inline'; base-uri 'none'; form-action 'none';">
    ${resourceLink}
    </head>`;
    const tail = ['</html>'].join('\n');
    const output = head + `<body>              
    <div id="x" style='font-family: Menlo, Consolas, "Ubuntu Mono",
    "Roboto Mono", "DejaVu Sans Mono",
    monospace'>` + content + `</div></body>` + tail;
    console.log(output);
    return output;
  }

  private static safetensorsToString(tensor: {data: DataView, shape: number[], dtype: string}, tableViewFlag: boolean, tableCss: string) {
    const { data, shape, dtype } = tensor;
    
    if (tableViewFlag && shape.length > 2) {
      return {content: `<div>Table view just support 1D or 2D array now</div>`, shapeLength: 0};
    }

    // Convert DataView to typed array based on dtype
    let array: any;
    const totalElements = shape.reduce((acc, dim) => acc * dim, 1);
    
    switch (dtype) {
      case 'F64':
        array = new Float64Array(data.buffer, data.byteOffset, totalElements);
        break;
      case 'F32':
        array = new Float32Array(data.buffer, data.byteOffset, totalElements);
        break;
      case 'F16':
        // For F16, we need to read as Uint16 and convert to float
        const f16Array = new Uint16Array(data.buffer, data.byteOffset, totalElements);
        array = new Float32Array(totalElements);
        for (let i = 0; i < totalElements; i++) {
          array[i] = this.float16ToFloat32(f16Array[i]);
        }
        break;
      case 'BF16':
        // For BF16, we need to read as Uint16 and convert to float
        const bf16Array = new Uint16Array(data.buffer, data.byteOffset, totalElements);
        array = new Float32Array(totalElements);
        for (let i = 0; i < totalElements; i++) {
          array[i] = this.bfloat16ToFloat32(bf16Array[i]);
        }
        break;
      case 'I64':
        array = new BigInt64Array(data.buffer, data.byteOffset, totalElements);
        break;
      case 'U64':
        array = new BigUint64Array(data.buffer, data.byteOffset, totalElements);
        break;
      case 'I32':
        array = new Int32Array(data.buffer, data.byteOffset, totalElements);
        break;
      case 'U32':
        array = new Uint32Array(data.buffer, data.byteOffset, totalElements);
        break;
      case 'I16':
        array = new Int16Array(data.buffer, data.byteOffset, totalElements);
        break;
      case 'U16':
        array = new Uint16Array(data.buffer, data.byteOffset, totalElements);
        break;
      case 'I8':
        array = new Int8Array(data.buffer, data.byteOffset, totalElements);
        break;
      case 'U8':
        array = new Uint8Array(data.buffer, data.byteOffset, totalElements);
        break;
      case 'BOOL':
        array = new Uint8Array(data.buffer, data.byteOffset, totalElements);
        break;
      default:
        throw new Error(`Unsupported safetensors dtype: ${dtype}`);
    }

    // Apply precision formatting for float types
    if (dtype.startsWith('F') || dtype.startsWith('BF')) {
      array = setPrecision(array);
    }

    var content: string = '';
    
    // Create multi-dim array display
    console.log('[+] Safetensors array shape is', shape);

    if (shape.length === 0) {
      return {content: arrayValuesToHtml(array), shapeLength: shape.length};
    }

    if (shape.length > 1) {
      // For multi dim arrays, use the same logic as numpy arrays
      var multiArr = toMultiDimArray(array, shape);
      switch (shape.length) {
        case 2:
          if (tableViewFlag) {
            console.log('[*] Table view enabled, create html table');
            content = show2DArr(multiArr);
          }
          else {
            content = multiArrayToString(multiArr, shape);
          }
          break;
        default:
          content = multiArrayToString(multiArr, shape);
      }
    } else {
      // For 1D array
      if (tableViewFlag) {
        // Support single dim table view
        var multiArr = toMultiDimArray(array, [shape[0], 1]);
        content = show2DArr(multiArr);
      } else {
        content = wrapWithSqBr(arrayValuesToHtml(array));
      }
    }
    
    return {content: content, shapeLength: shape.length};
  }

  // Helper methods for float16 and bfloat16 conversion
  private static float16ToFloat32(f16: number): number {
    const sign = (f16 & 0x8000) >> 15;
    const exp = (f16 & 0x7C00) >> 10;
    const mant = f16 & 0x03FF;

    if (exp === 0) {
      return sign === 0 ? Math.pow(2, -24) * mant : -Math.pow(2, -24) * mant;
    } else if (exp === 31) {
      return mant === 0 ? (sign === 0 ? Infinity : -Infinity) : NaN;
    } else {
      return sign === 0 
        ? Math.pow(2, exp - 15) * (1 + mant / 1024)
        : -Math.pow(2, exp - 15) * (1 + mant / 1024);
    }
  }

  private static bfloat16ToFloat32(bf16: number): number {
    // BF16 format: 1 sign bit, 8 exponent bits, 7 mantissa bits
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    // BF16 to F32: extend mantissa with zeros
    view.setUint32(0, bf16 << 16);
    return view.getFloat32(0);
  }

  private static bufferToString(arrayBuffer: ArrayBuffer, tableViewFlag: boolean, tableCss: string) {
    var { data: array, shape: arrayShape, order: order, decr: arrDecr } = fromArrayBuffer(arrayBuffer);
    if (arrDecr.startsWith('float')) { array = setPrecision(array); }
    if (tableViewFlag && arrayShape.length > 2) {
      return {content: `<div>Table view just support 1D or 2D array now</div>`, shapeLength: 0};
    }

    var content: string = '';
    // Create multi-dim array
    console.log('[+] Array order is', order);
    console.log('[+] Array shape is', arrayShape);

    if (arrayShape.length === 0) {
      return {content: arrayValuesToHtml(array), shapeLength: arrayShape.length};
    }

    if (arrayShape.length > 1) {
      // For multi dim
      console.log('[*] Process to show structure');
      if (order === 'F') {
        if (getOption('vscode-numpy-viewer.fortran2CLikeOrder')) {
          // Process to get C-like array
          // TODO: optim performance
          array = toCLikeArray(array, arrayShape);
          // Shape is correct, so we do not need to reverse
        } else {
          // Do not transform to c-like array, just reverse the shape
          arrayShape = arrayShape.reverse();
        }
      } 

      var multiArr = toMultiDimArray(array, arrayShape);
      switch (arrayShape.length) {
        case 2:
          if (tableViewFlag) {
            console.log('[*] Table view enabled, create html table');
            content = show2DArr(multiArr);
          }
          else {
            content = multiArrayToString(multiArr, arrayShape);
          }
          break;
        default:
          content = multiArrayToString(multiArr, arrayShape);
      }
    }
    else {
      // For single dim
      if (tableViewFlag) {
        // Support single dim table view
        var multiArr = toMultiDimArray(array, [arrayShape[0], 1]);
        content = show2DArr(multiArr);
      } else {
        content = wrapWithSqBr(arrayValuesToHtml(array));
      }
    }

    return {content: content, shapeLength: arrayShape.length};
  }
}
