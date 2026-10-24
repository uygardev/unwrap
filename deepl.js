// Hands text to the DeepL app through the "Translate with DeepL" macOS service it registers.
// A private pasteboard is used so the clipboard keeps the cleaned text untouched.
const { execFile } = require('child_process')

// JavaScript for Automation, run by osascript. The text arrives on stdin.
// NSPerformService matches the untranslated menu item key first, the English title is a fallback.
const SCRIPT = `
ObjC.import('AppKit')
function run () {
  const data = $.NSFileHandle.fileHandleWithStandardInput.readDataToEndOfFile
  const text = $.NSString.alloc.initWithDataEncoding(data, $.NSUTF8StringEncoding)
  const pb = $.NSPasteboard.pasteboardWithUniqueName
  pb.declareTypesOwner($([$.NSPasteboardTypeString]), null)
  pb.setStringForType(text, $.NSPasteboardTypeString)
  const sent = ['finder.contextMenu.translateWithDeepL', 'Translate with DeepL']
    .some((name) => $.NSPerformService($(name), pb))
  pb.releaseGlobally
  return sent ? 'sent' : 'failed'
}
`

const sendToDeepL = (text) => new Promise((resolve) => {
  const child = execFile('osascript', ['-l', 'JavaScript', '-e', SCRIPT], { timeout: 10000 }, (error, stdout) => {
    resolve(!error && stdout.trim() === 'sent')
  })
  child.stdin.end(text)
})

module.exports = { sendToDeepL }
