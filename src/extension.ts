import * as vscode from 'vscode';
import { NumpyPreview } from './numpyPreview';
import { NumpyCustomProvider } from './numpyProvider';

export function activate(context: vscode.ExtensionContext) {
	const extensionRoot = vscode.Uri.file(context.extensionPath);
	// Then register our provider
	const provider = new NumpyCustomProvider(extensionRoot);

	context.subscriptions.push(
		vscode.window.registerCustomEditorProvider(
			NumpyCustomProvider.viewType,
			provider,
			{
				webviewOptions: {
					enableFindWidget: true,
				}
			}
		)
	);

	function openTableView(uri?: vscode.Uri) {
		var HTML = '';
		if (uri instanceof vscode.Uri) {
			HTML = NumpyPreview.getWebviewContents(uri.path, true);
		}
		const panel = vscode.window.createWebviewPanel(
			'openWebview', // Identifies the type of the webview. Used internally
			'Example Page', // Title of the panel displayed to the user
			vscode.ViewColumn.One, // Editor column to show the new webview panel in.
			{ // Enable scripts in the webview
				enableScripts: true //Set this to true if you want to enable Javascript. 
			}
		);
		panel.webview.html = HTML;
	  }

	const tableViewCommmand = vscode.commands.registerCommand('numpy-viewer.openTableView', openTableView,
	// () => {
	// 	vscode.window.showInformationMessage('Table View Mode');
	// 	// TODO: with this command, open a new editor to show a table to show the data
	// }
	);
	context.subscriptions.push(tableViewCommmand,);
}

// this method is called when your extension is deactivated
export function deactivate(): void { }
