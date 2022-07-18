import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from '../../extension';

import { fromArrayBuffer } from '../../numpyParser';
import { loadArrayBuffer } from '../../numpyPreview';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});

	test('`int32` `C like` array test', () => {
		
		const {data : array} = fromArrayBuffer(loadArrayBuffer('../../src/test/example_files/example_int32_1D.npy'));
		assert.notStrictEqual(array, new Int32Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]));
	});
});
