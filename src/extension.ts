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
}

// this method is called when your extension is deactivated
export function deactivate(): void { }
