// Hands text to the DeepL app through the "Translate with DeepL" macOS service it registers.
// A private pasteboard is used so the clipboard keeps the cleaned text untouched.
//
// The service deletes every line break, so with { paste: true } the DeepL window is then filled again
// with Cmd+A, Cmd+V from the clipboard, which must already hold the same text with its line breaks.
// Posting those keys needs the Accessibility permission.
const { execFile } = require('child_process')

// JavaScript for Automation, run by osascript. The text arrives on stdin, argv[0] is "paste" or "send".
// NSPerformService matches the untranslated menu item key first, the English title is a fallback.
const SCRIPT = `
ObjC.import('AppKit')

const DEEPL = 'com.linguee.DeepLCopyTranslator'

function deeplIsFrontmost () {
  const app = $.NSWorkspace.sharedWorkspace.frontmostApplication
  return !!app && ObjC.unwrap(app.bundleIdentifier) === DEEPL
}

function pressWithCommand (keyCode) {
  const source = $.CGEventSourceCreate(-1) // kCGEventSourceStatePrivate
  for (const down of [true, false]) {
    const event = $.CGEventCreateKeyboardEvent(source, keyCode, down)
    $.CGEventSetFlags(event, 0x100000) // kCGEventFlagMaskCommand
    $.CGEventPost(0, event) // kCGHIDEventTap
  }
}

function run (argv) {
  const data = $.NSFileHandle.fileHandleWithStandardInput.readDataToEndOfFile
  const text = $.NSString.alloc.initWithDataEncoding(data, $.NSUTF8StringEncoding)
  const pb = $.NSPasteboard.pasteboardWithUniqueName
  pb.declareTypesOwner($(['public.utf8-plain-text']), null)
  pb.setStringForType(text, $('public.utf8-plain-text'))
  const sent = ['finder.contextMenu.translateWithDeepL', 'Translate with DeepL']
    .some((name) => $.NSPerformService($(name), pb))

  let result = sent ? 'sent' : 'failed'
  if (sent && argv[0] === 'paste') {
    // The service does not bring DeepL to the front; LaunchServices (open -b) does.
    const shell = Application.currentApplication()
    shell.includeStandardAdditions = true
    shell.doShellScript('open -b ' + DEEPL)
    // Wait for the DeepL window to come up and receive the service text before replacing it.
    for (let i = 0; i < 50 && !deeplIsFrontmost(); i++) delay(0.1)
    delay(0.8)
    // Never press Cmd+A, Cmd+V anywhere but in DeepL.
    if (deeplIsFrontmost()) {
      pressWithCommand(0) // kVK_ANSI_A
      pressWithCommand(9) // kVK_ANSI_V
      result = 'pasted'
    }
  }

  // DeepL reads the pasteboard after NSPerformService returns, so keep it alive for a moment.
  delay(3)
  pb.releaseGlobally
  return result
}
`

const sendToDeepL = (text, { paste = false } = {}) => new Promise((resolve) => {
  const args = ['-l', 'JavaScript', '-e', SCRIPT, paste ? 'paste' : 'send']
  const child = execFile('osascript', args, { timeout: 15000 }, (error, stdout) => {
    resolve(!error && ['sent', 'pasted'].includes(stdout.trim()))
  })
  child.stdin.end(text)
})

const INSTALLED_SCRIPT = `
ObjC.import('AppKit')
function run () {
  const url = $.NSWorkspace.sharedWorkspace.URLForApplicationWithBundleIdentifier($('com.linguee.DeepLCopyTranslator'))
  return url.isNil() ? 'missing' : 'installed'
}
`

const isDeepLInstalled = () => new Promise((resolve) => {
  execFile('osascript', ['-l', 'JavaScript', '-e', INSTALLED_SCRIPT], { timeout: 5000 }, (error, stdout) => {
    resolve(!error && stdout.trim() === 'installed')
  })
})

// DeepL's web translator reads "#<source>/<target>/<text>" and keeps line breaks. "\", "/" and "|" separate
// the parts, so they are escaped with a backslash. DeepL detects the source language itself; the source code
// only has to differ from the target.
function deeplWebUrl (text, targetLanguage) {
  const escaped = text.replace(/[\\/|]/g, (ch) => '\\' + ch)
  const source = targetLanguage === 'en' ? 'de' : 'en'
  return `https://www.deepl.com/translator#${source}/${targetLanguage}/${encodeURIComponent(escaped)}`
}

module.exports = { sendToDeepL, isDeepLInstalled, deeplWebUrl }
