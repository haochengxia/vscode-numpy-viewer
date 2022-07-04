import * as vscode from 'vscode';

import * as fs from 'fs';
import { fromArrayBuffer } from 'numpy-parser';

import { Disposable } from './disposable';
import { OSUtils } from './utils';

type PreviewState = 'Disposed' | 'Visible' | 'Active';

function loadArrayBuffer(file : string) {
    const buffer = fs.readFileSync(file);                                                                                                                                                                                                                                                                                                                                                                                                                                                 
    return new Uint8Array(buffer).buffer; // only needed for node conversion
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
    const { data: array } = fromArrayBuffer(arrayBuffer);
    console.log(array);
    var content : string = array.toString();

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