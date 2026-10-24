// Sends Cmd+C to the frontmost app and waits until the pasteboard changes.
// Posting key events needs the Accessibility permission (System Settings > Privacy & Security).
const { execFile } = require('child_process')

// JavaScript for Automation, run by osascript so no native module has to be compiled.
const SCRIPT = `
ObjC.import('AppKit')
function run () {
  const pb = $.NSPasteboard.generalPasteboard
  const before = pb.changeCount
  const source = $.CGEventSourceCreate(-1) // kCGEventSourceStatePrivate: ignore the keys held for the shortcut
  for (const down of [true, false]) {
    const event = $.CGEventCreateKeyboardEvent(source, 8, down) // 8 = kVK_ANSI_C
    $.CGEventSetFlags(event, 0x100000) // kCGEventFlagMaskCommand
    $.CGEventPost(0, event) // kCGHIDEventTap
  }
  for (let i = 0; i < 40 && pb.changeCount === before; i++) delay(0.025)
  return pb.changeCount !== before ? 'copied' : 'unchanged'
}
`

const copySelection = () => new Promise((resolve) => {
  execFile('osascript', ['-l', 'JavaScript', '-e', SCRIPT], { timeout: 3000 }, (error, stdout) => {
    resolve(!error && stdout.trim() === 'copied')
  })
})

module.exports = { copySelection }
