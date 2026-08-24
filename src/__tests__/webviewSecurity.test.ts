'use strict';

jest.mock('vscode', () => ({
  commands: { executeCommand: jest.fn() },
  window: { showInformationMessage: jest.fn() },
  workspace: {
    getConfiguration: () => ({ get: () => false }),
  },
}), { virtual: true });

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { NumpyPreview } from '../numpyPreview';

const admZip = require('adm-zip');

function makeBytesNpy(value: string, elementSize = 32): Buffer {
  const headerBody = `{'descr': '|S${elementSize}', 'fortran_order': False, 'shape': (1,), }`;
  const paddingLength = 16 - ((10 + headerBody.length + 1) % 16);
  const header = Buffer.from(headerBody + ' '.repeat(paddingLength) + '\n', 'ascii');
  const prelude = Buffer.alloc(10);
  Buffer.from([0x93, 0x4e, 0x55, 0x4d, 0x50, 0x59, 0x01, 0x00]).copy(prelude);
  prelude.writeUInt16LE(header.length, 8);
  const data = Buffer.alloc(elementSize);
  data.write(value, 'ascii');
  return Buffer.concat([prelude, header, data]);
}

describe('WebView HTML security', () => {
  let tempDirectory: string;
  let consoleLog: jest.SpyInstance;

  beforeAll(() => {
    consoleLog = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterAll(() => {
    consoleLog.mockRestore();
  });

  beforeEach(() => {
    tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'numpy-viewer-security-'));
  });

  afterEach(() => {
    if (tempDirectory) {
      fs.rmSync(tempDirectory, { recursive: true, force: true });
    }
  });

  it('renders a script stored in an npy byte string as text', async () => {
    const file = path.join(tempDirectory, 'payload.npy');
    fs.writeFileSync(file, makeBytesNpy('<script>alert(3)</script>'));

    const html = await NumpyPreview.getWebviewContents(file, false, '', false, 'vscode-resource:');
    const tableHtml = await NumpyPreview.getWebviewContents(file, true, '', false, 'vscode-resource:');

    expect(html).toContain('&lt;script&gt;alert(3)&lt;/script&gt;');
    expect(html).not.toContain('<script>alert(3)</script>');
    expect(tableHtml).toContain('&lt;script&gt;alert(3)&lt;/script&gt;');
    expect(tableHtml).not.toContain('<script>alert(3)</script>');
    expect(html).toContain("default-src 'none'");
    expect(html).toContain("script-src 'none'");
  });

  it('renders a malicious npz entry name as text', async () => {
    const file = path.join(tempDirectory, 'payload.npz');
    const zip = new admZip();
    zip.addFile('arr<img src=x onerror=alert(4)>.npy', makeBytesNpy('safe'));
    zip.writeZip(file);

    const html = await NumpyPreview.getWebviewContents(file, false, '', false, 'vscode-resource:');

    expect(html).toContain('arr&lt;img src=x onerror=alert(4)&gt;.npy');
    expect(html).not.toContain('<img src=x onerror=alert(4)>');
  });
});
