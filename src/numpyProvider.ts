import * as vscode from 'vscode';
import { NumpyPreview } from './numpyPreview';

export class NumpyCustomProvider implements vscode.CustomReadonlyEditorProvider {
  public static readonly viewType = 'numpy.preview';

  private readonly _previews = new Set<NumpyPreview>();
  private _activePreview: NumpyPreview | undefined;

  constructor(private readonly extensionRoot: vscode.Uri) {}

  public openCustomDocument(uri: vscode.Uri): vscode.CustomDocument {
    return { uri, dispose: (): void => {} };
  }

  public async resolveCustomEditor(
    document: vscode.CustomDocument,
    webviewEditor: vscode.WebviewPanel
  ): Promise<void> {
    const preview = new NumpyPreview(
      this.extensionRoot,
      document.uri,
      webviewEditor
    );
    this._previews.add(preview);
    this.setActivePreview(preview);

    webviewEditor.onDidDispose(() => {
      this._previews.delete(preview);
    });

    webviewEditor.onDidChangeViewState(() => {
      if (webviewEditor.active) {
        this.setActivePreview(preview);
      } else if (this._activePreview === preview && !webviewEditor.active) {
        this.setActivePreview(undefined);
      }
    });
  }

  public get activePreview(): NumpyPreview | undefined {
    return this._activePreview;
  }

  private setActivePreview(value: NumpyPreview | undefined): void {
    this._activePreview = value;
  }
}