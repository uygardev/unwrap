// Text cleaning rules. Kept free of Electron APIs so it can be unit tested with plain Node.

const MODES = {
  SINGLE_LINE: 'single-line', // join everything into one line
  PARAGRAPHS: 'paragraphs', // join wrapped lines, keep blank-line paragraph breaks
  PLAIN: 'plain' // only drop styles, keep the text as it is
}

// PDFs often store these typographic ligatures as single code points.
const LIGATURES = {
  '\uFB00': 'ff',
  '\uFB01': 'fi',
  '\uFB02': 'fl',
  '\uFB03': 'ffi',
  '\uFB04': 'ffl',
  '\uFB05': 'st',
  '\uFB06': 'st'
}

const normalize = (text) => text
  .replace(/\r\n?/g, '\n')
  .replace(/\u2029/g, '\n\n')
  .replace(/\u2028/g, '\n')
  // soft hyphens, zero width spaces and BOMs left behind by PDF viewers
  .replace(/[\u00AD\u200B\uFEFF]/g, '')
  .replace(/[\uFB00-\uFB06]/g, (ch) => LIGATURES[ch])

// "exam-\nple" -> "example", but only when a lowercase letter continues the word,
// so "Covid-\n19" or "Anglo-\nSaxon" keep their hyphen (without a stray space).
const joinHyphenatedWords = (text) => text
  .replace(/(\p{L})[-\u2010][ \t]*\n[ \t]*(?=\p{Ll})/gu, '$1')
  .replace(/([\p{L}\p{N}])([-\u2010])[ \t]*\n[ \t]*(?=[\p{L}\p{N}])/gu, '$1$2')

const collapseWhitespace = (text) => text.replace(/\s+/g, ' ').trim()

function cleanText (text, mode = MODES.SINGLE_LINE) {
  if (mode === MODES.PLAIN) return text

  const joined = joinHyphenatedWords(normalize(text))

  if (mode === MODES.PARAGRAPHS) {
    return joined
      .split(/\n[ \t]*\n/)
      .map(collapseWhitespace)
      .filter(Boolean)
      .join('\n\n')
  }

  return collapseWhitespace(joined)
}

module.exports = { MODES, cleanText }
