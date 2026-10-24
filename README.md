# Paste without Line Breaks

A small menu bar app that copies text (for example from a PDF) as plain text without styles, line breaks and
end-of-line hyphens, so that translators such as Google Translate can translate it properly.

## Usage

Select text anywhere and press **⌃⌘C** (Control + Command + C). The selection is copied and cleaned in one step;
a normal ⌘C keeps working as usual. If ⌃⌘C is taken by another app, ⌃⌥⌘C is used instead (the menu shows which).

The first time, macOS asks for **Accessibility** access (System Settings › Privacy & Security › Accessibility).
The app needs it only to press ⌘C for you.

Menu bar (¶) options:

- **Remove All Line Breaks**: everything becomes a single line.
- **Keep Paragraphs**: wrapped lines are joined, empty lines between paragraphs stay.
- **Only Remove Styles**: plain text, line breaks untouched.
- **Also Clean Every ⌘C Copy**: clean every copy automatically. Files, images and passwords copied from
  password managers are never touched.
- **Open at Login**

Cleaning also rejoins words hyphenated at the end of a line (`infor-↵mation` → `information`), and removes soft
hyphens, zero width spaces and PDF ligatures (`ﬁ` → `fi`).

## Install

Open `Paste-without-Line-Breaks-<version>.dmg` and drag the app to Applications. The app is not notarized, so if
macOS refuses to open a DMG downloaded from the internet, either choose **Open Anyway** in System Settings ›
Privacy & Security, or run:

```bash
xattr -dr com.apple.quarantine "/Applications/Paste without Line Breaks.app"
```

## Development

```bash
npm install
npm start      # run from source
npm test       # cleaning rules
npm run dist   # build dist/Paste-without-Line-Breaks-<version>.dmg (universal: Apple Silicon + Intel)
```

After a rebuild, macOS may ask for the Accessibility permission again because the app is ad-hoc signed.
