// Text cleaning rules. Kept free of Electron APIs so it can be unit tested with plain Node.

const MODES = {
  SINGLE_LINE: 'single-line', // join everything into one line
  PARAGRAPHS: 'paragraphs', // join wrapped lines, keep one line per paragraph and heading
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
  .replace(new RegExp(`^([ \\t]*)[${SYMBOL_FONT_BULLETS}]`, 'gmu'), '$1\u2022')

// "exam-\nple" -> "example", but only when a lowercase letter continues the word,
// so "Covid-\n19" or "Anglo-\nSaxon" keep their hyphen (without a stray space).
const joinHyphenatedWords = (text) => text
  .replace(/(\p{L})[-\u2010][ \t]*\n[ \t]*(?=\p{Ll})/gu, '$1')
  .replace(/([\p{L}\p{N}])([-\u2010])[ \t]*\n[ \t]*(?=[\p{L}\p{N}])/gu, '$1$2')

const collapseWhitespace = (text) => text.replace(/\s+/g, ' ').trim()

const SENTENCE_END = /[.!?:]['"\u2019\u201D)\]]*$/u
// "4.7 Results", "4.7.1. Treatment", "IV. Discussion", "A. Appendix"
const NUMBERED_HEADING = /^(\d+(\.\d+)*\.?|[IVXLC]+\.|[A-Z]\.)\s+\p{Lu}/u

// Bullets as PDF viewers copy them. Word's default bullets come out as private-use code points of the
// Symbol and Wingdings fonts, which normalize() turns into "\u2022".
const SYMBOL_FONT_BULLETS = '\uF0A7\uF0B7\uF076\uF0D8'
const BULLETS = '\u2022\u2023\u2043\u2219\u00B7\u25AA\u25AB\u25A0\u25A1\u25CF\u25CB\u25E6\u25B8\u25BA\u27A2\u2794' +
  '\u2713\u2714\u2013\u2014*-'
// "\u2022 item", "- item", "1. item", "1) item", "(1) item", "a) item", "(iv) item"
const LIST_ITEM = new RegExp(`^([${BULLETS}]|\\d{1,3}[.)]|\\(\\d{1,3}\\)|\\(?[a-z]\\)|\\(?[ivx]{1,5}\\))\\s+\\S`, 'u')
const LONE_BULLET = new RegExp(`^[${BULLETS}]$`, 'u')
const startsBlock = (line) => /^[\p{Lu}\p{N}([]/u.test(line) || LIST_ITEM.test(line)

// Some PDFs put the bullet on a line of its own, followed by the item text.
function attachLoneBullets (lines) {
  const result = []
  for (const line of lines) {
    const last = result[result.length - 1]
    if (line && last && LONE_BULLET.test(last)) result[result.length - 1] = `${last} ${line}`
    else result.push(line)
  }
  return result
}

// PDF viewers end every visual line with a newline, also inside paragraphs. A paragraph or heading
// ends where a line is clearly shorter than the full lines around it and the next line starts a new block.
// Every list item starts a block of its own.
function splitBlocks (text) {
  const lines = attachLoneBullets(text.split('\n').map((line) => line.trim()))
  // Short list items would make full lines look long, so they are measured on the other lines when possible.
  const proseLines = lines.filter((line) => line && !LIST_ITEM.test(line))
  const lengths = (proseLines.length ? proseLines : lines.filter(Boolean)).map((line) => line.length).sort((a, b) => a - b)
  const fullLength = lengths[Math.floor((lengths.length - 1) * 0.75)] || 0
  const isShort = (line) => line.length < fullLength * 0.8

  const blocks = []
  let current = []
  let kind = 'paragraph'
  const flush = (heading = false) => {
    if (current.length) blocks.push({ text: current.join('\n'), kind: heading && current.length === 1 ? 'heading' : kind })
    current = []
    kind = 'paragraph'
  }

  lines.forEach((line, i) => {
    if (!line) return flush()
    const next = lines[i + 1] || ''
    const previous = current[current.length - 1]
    const isItem = LIST_ITEM.test(line)
    const isHeading = !isItem && isShort(line) && !SENTENCE_END.test(line) && startsBlock(next) &&
      (NUMBERED_HEADING.test(line) || (current.length === 0 && /^\p{Lu}/u.test(line)))

    if (isItem) {
      flush()
      kind = 'item'
    } else if (isHeading && previous && SENTENCE_END.test(previous)) {
      // A numbered heading right after a full last line of a paragraph.
      flush()
    }
    current.push(line)

    // List items often have no full stop, so any clearly short line ends one.
    const endsBlock = isShort(line) && startsBlock(next) && (SENTENCE_END.test(line) || kind === 'item')
    if (isHeading || endsBlock) flush(isHeading)
  })
  flush()
  return blocks
}

const cleanBlock = (block) => collapseWhitespace(joinHyphenatedWords(block))

function cleanText (text, mode = MODES.SINGLE_LINE) {
  if (mode === MODES.PLAIN) return text

  const normalized = normalize(text)

  if (mode === MODES.PARAGRAPHS) {
    // One line per paragraph, heading or list item, with an empty line between blocks; a heading stays
    // right above the paragraph it introduces and the items of a list stay together.
    const blocks = splitBlocks(normalized)
      .map((block) => ({ ...block, text: cleanBlock(block.text) }))
      .filter((block) => block.text)
    return blocks
      .map((block, i) => {
        if (i === 0) return block.text
        const previous = blocks[i - 1].kind
        const together = (previous === 'heading' && block.kind !== 'heading') ||
          (previous === 'item' && block.kind === 'item')
        return (together ? '\n' : '\n\n') + block.text
      })
      .join('')
  }

  return cleanBlock(normalized)
}

module.exports = { MODES, cleanText }
