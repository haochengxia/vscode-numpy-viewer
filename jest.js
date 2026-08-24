const path = require('path')
const os = require('os')
const fs = require('fs')

let testTempDirectory

process.on('uncaughtException', err => {
  let msg = 'Uncaught exception: ' + err.stack
  console.error(msg)
})

process.on('exit', () => {
  if (testTempDirectory) {
    fs.rmSync(testTempDirectory, { recursive: true, force: true })
  }
})

module.exports = async () => {
  testTempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'vscode-numpy-viewer-test-'))
  const dataHome = path.join(testTempDirectory, 'data')
  fs.mkdirSync(dataHome, { recursive: true })
  process.env.NODE_ENV = 'test'
  process.env.COC_DATA_HOME = dataHome
  process.env.COC_VIMCONFIG = path.join(__dirname, 'src/__tests__')
  process.env.TMPDIR = testTempDirectory
}
