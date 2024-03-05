import * as vscode from 'vscode';

import { fromArrayBuffer, loadArrayBuffer, loadBuffer, getFileSize } from './numpyParser';
import { Disposable } from './disposable';
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
      enableScripts: true,
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
    let promiseString: Promise<string> = NumpyPreview.getWebviewContents(this.resource.path, false);
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

  public  static async getWebviewContents(resourcePath: string, tableViewFlag: boolean, tableCss = '', shapeFlag=false): Promise<string> {
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
    if (path.endsWith('npz')) {
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
        contents.push(names[i]);
        var {content: temp_content, shapeLength: sl}=  this.bufferToString(buffers[i], tableViewFlag, tableCss);
        if (sl >= 2) {
          temp_content = contentFormatting(temp_content, sl);
        }
        contents.push(temp_content);
        shape += `${names[i]} (${fromArrayBuffer(buffers[i]).shape}) `
      }
      content = contents.join(`<p/>`);
    }
    else {
      const arrayBuffer = loadArrayBuffer(path);
      var {content: temp_content, shapeLength: sl}=  this.bufferToString(arrayBuffer, tableViewFlag, tableCss);
      if (sl >= 2) {
        temp_content = contentFormatting(temp_content, sl);
      }
      content = temp_content;
      shape += `(${fromArrayBuffer(arrayBuffer).shape}) `;
    }

    console.log(`[+] Shape is: ${shape}.`);
    if (shapeFlag) {
      return shape;
    }

    // Introduce css file
    var resourceLink = '';
    if (tableCss !== '') {
      resourceLink = `<link rel="stylesheet" href="${tableCss}">`;
    }

    // Replace , with ,\n for reading
    var re = /,/gi;
    content = content.replace(re, `,\n`);
    const head = `<!DOCTYPE html>
    <html dir="ltr" mozdisallowselectionprint>
    <head>
    <meta charset="utf-8">
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

  private static bufferToString(arrayBuffer: ArrayBuffer, tableViewFlag: boolean, tableCss: string) {
    var { data: array, shape: arrayShape, order: order, decr: arrDecr } = fromArrayBuffer(arrayBuffer);
    if (arrDecr.startsWith('float')) array = setPrecision(array);
    if (tableViewFlag && arrayShape.length > 2) {
      return {content: `<div>Table view just support 1D or 2D array now</div>`, shapeLength: 0};
    }

    var content: string = '';
    // Create multi-dim array
    console.log('[+] Array order is', order);
    console.log('[+] Array shape is', arrayShape);

    if (arrayShape.length === 0) {
      return {content: array.toString(), shapeLength: arrayShape.length};
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
        content = wrapWithSqBr(array.toString());
      }
    }

    return {content: content, shapeLength: arrayShape.length};
  }
}