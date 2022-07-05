import * as vscode from 'vscode';

import * as fs from 'fs';
import { fromArrayBuffer } from 'numpy-parser';
import ndarray from "ndarray";

import { Disposable } from './disposable';
import { OSUtils } from './utils';

type PreviewState = 'Disposed' | 'Visible' | 'Active';

function loadArrayBuffer(file : string) {
  const buffer = fs.readFileSync(file);                                                                                                                                                                                                                                                                                                                                                                                                                                                 
  return new Uint8Array(buffer).buffer; // only needed for node conversion
}

function walkArr(arr : any) {
    var d = arr.shape.length
    if (d == 1) {
      console.log('reach bottom');
      var n = arr.shape[0]
      let data : Array<Number> = arr;
      console.log(data);

    } else if (d > 1) {
      var n = arr.shape[0]
      var r = new Array(n)
      for(var i=0; i<n; ++i) {
        r[i] = walkArr(arr.pick(i))
      }
      return r
    } else {
      return []
    }
}

function isLargerThanOne(element : any, index : any, array : any) 
{  
   return element > 1; 
} 

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

    this.webviewEditor.webview.html = this.getWebviewContents();
    this.update();
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

  private getWebviewContents(): string {
    var path = this.resource.path;
    switch (OSUtils.isWindows()) {
      case true: 
        path = this.resource.path.slice(1, );
        console.log('Windows -> cut path', path);
        break;
      default:
        console.log('NOT Windows', path);
    }
    const arrayBuffer = loadArrayBuffer(path);
    const { data: array, shape: arrayShape } = fromArrayBuffer(arrayBuffer);

    let tempShape : Array<Number> = arrayShape;
    var content : string = '';
    var realShape = tempShape.filter(isLargerThanOne);
    var realDim = realShape.length;
    // Create multi-dim array
    console.log('the dim of the current array is', realDim, ' shape is', arrayShape);
    if (realDim > 1) {
      console.log('process multi-dimension array');
      const multiArray = ndarray(array, arrayShape);
      console.log(content);
      content += walkArr(multiArray);
      console.log(content);
    } else {
      content += array.toString();
    }
    
    // Replace , with ,\n for reading
    var re = /,/gi;
    content = content.replace(re, `,\n`);
    const head = `<!DOCTYPE html>
    <html dir="ltr" mozdisallowselectionprint>
    <head>
    <meta charset="utf-8">
    </head>`;
    const tail = ['</html>'].join('\n');
    const output =  head + `<body><div id="x">` + content + `</div></body>` + tail;
    console.log(output);
    return output;
  }
}