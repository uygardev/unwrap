# Unwrap

A small menu bar app that copies text (for example from a PDF) as plain text without styles, line breaks and
end-of-line hyphens, so that translators such as Google Translate can translate it properly.

## Usage

### Right-click menu

Select text anywhere (Preview, Safari, Chrome, Acrobat, …), right-click it and choose:

- **Copy without Line Breaks**: the cleaned text is put on the clipboard, ready to paste.
- **Translate with DeepL without Line Breaks**: the cleaned text is also opened in the
  [DeepL app](https://www.deepl.com/macos-app). DeepL's own service removes all line breaks, so when the text
  keeps paragraphs or headings, the app brings DeepL to the front and pastes the text again with ⌘A ⌘V. That
  step needs the Accessibility permission (asked the first time); without it DeepL gets the text on one line.

Depending on the app, the items are either directly in the menu or under **Services**. Copying needs no extra
permission. If they don't show up right after installing, open the app once, or log out and back in. You can turn
them off, or give them your own keyboard shortcut, in System Settings › Keyboard › Keyboard Shortcuts › Services ›
Text.

### Keyboard shortcuts

Select text and press:

- **⇧⌘C** (Shift + Command + C): **Copy without Line Breaks**
- **⇧⌘X** (Shift + Command + X): **Translate with DeepL without Line Breaks**

A normal ⌘C keeps working as usual. These are Services shortcuts, so they need no permission of their own, and in
apps that have their own ⇧⌘C or ⇧⌘X (for example Word's Copy Formatting) that one keeps working and Unwrap stays
out of the way. ⌃⌘C is deliberately not used: DeepL takes it for DeepL Write. You can change both in System
Settings › Keyboard › Keyboard Shortcuts › Services › Text. The menu bar menu lists them too.

Menu bar (¶) options:

- **Remove All Line Breaks**: everything becomes a single line.
- **Keep Paragraphs and Headings**: wrapped lines are joined, every heading and paragraph stays on its own
  line, with an empty line after each paragraph (a heading stays right above its paragraph). In PDFs, a
  paragraph ends at a clearly short line ending with `.` `!` `?` or `:`; headings are short lines like
  `4.7.1 Treatment and Follow-up Support`.
- **Only Remove Styles**: plain text, line breaks untouched.
- **Also Clean Every ⌘C Copy**: clean every copy automatically. Files, images and passwords copied from
  password managers are never touched.
- **Open at Login**

Cleaning also rejoins words hyphenated at the end of a line (`infor-↵mation` → `information`), and removes soft
hyphens, zero width spaces and PDF ligatures (`ﬁ` → `fi`).

## Install

Open `Unwrap-<version>.dmg` and drag the app to Applications. The app is not notarized, so if
macOS refuses to open a DMG downloaded from the internet, either choose **Open Anyway** in System Settings ›
Privacy & Security, or run:

```bash
xattr -dr com.apple.quarantine "/Applications/Unwrap.app"
```

## Development

```bash
npm install
npm start      # run from source
npm test       # cleaning rules
npm run build:native   # compile the Services menu module (native/), needed once before npm start
npm run dist   # build dist/Unwrap-<version>.dmg (universal: Apple Silicon + Intel)
npm run build:icons    # after changing scripts/draw-icons.py; needs rsvg-convert (brew install librsvg)
```

`npm run dist` needs Xcode 26 or later: the app icon is an Icon Composer file (`assets/Unwrap.icon`), which
electron-builder compiles with Xcode's `actool`, so macOS draws it with its own icon shape and Liquid Glass.
`scripts/draw-icons.py` is the source of the icon, its PNG fallback (`icon.png`) and the menu bar icon.

After a rebuild, macOS may ask for the Accessibility permission (used only for DeepL) again because the app
is ad-hoc signed.
