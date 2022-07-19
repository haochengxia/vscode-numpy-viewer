import * as vscode from 'vscode';
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

	const tableViewCommmand = vscode.commands.registerCommand('numpy-viewer.createTableView', () => {
		vscode.window.showInformationMessage('Table View Mode');
		// TODO: with this command, open a new editor to show a table to show the data
	});
	context.subscriptions.push(tableViewCommmand);
}

// this method is called when your extension is deactivated
export function deactivate(): void {}
