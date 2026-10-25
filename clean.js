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

// "exam-\nple" -> "example", but only when a lowercase letter continues the word,
// so "Covid-\n19" or "Anglo-\nSaxon" keep their hyphen (without a stray space).
const joinHyphenatedWords = (text) => text
  .replace(/(\p{L})[-\u2010][ \t]*\n[ \t]*(?=\p{Ll})/gu, '$1')
  .replace(/([\p{L}\p{N}])([-\u2010])[ \t]*\n[ \t]*(?=[\p{L}\p{N}])/gu, '$1$2')

const collapseWhitespace = (text) => text.replace(/\s+/g, ' ').trim()

const SENTENCE_END = /[.!?:]['"\u2019\u201D)\]]*$/u
// "4.7 Results", "4.7.1. Treatment", "IV. Discussion", "A. Appendix"
const NUMBERED_HEADING = /^(\d+(\.\d+)*\.?|[IVXLC]+\.|[A-Z]\.)\s+\p{Lu}/u
const STARTS_BLOCK = /^[\p{Lu}\p{N}\u2022\u2013*([]/u

// PDF viewers end every visual line with a newline, also inside paragraphs. A paragraph or heading
// ends where a line is clearly shorter than the full lines around it and the next line starts a new block.
function splitBlocks (text) {
  const lines = text.split('\n').map((line) => line.trim())
  const lengths = lines.filter(Boolean).map((line) => line.length).sort((a, b) => a - b)
  const fullLength = lengths[Math.floor((lengths.length - 1) * 0.75)] || 0
  const isShort = (line) => line.length < fullLength * 0.8

  const blocks = []
  let current = []
  const flush = (heading = false) => {
    if (current.length) blocks.push({ text: current.join('\n'), heading: heading && current.length === 1 })
    current = []
  }

  lines.forEach((line, i) => {
    if (!line) return flush()
    const next = lines[i + 1] || ''
    const previous = current[current.length - 1]
    const startsBlock = current.length === 0
    const isHeading = isShort(line) && !SENTENCE_END.test(line) && STARTS_BLOCK.test(next) &&
      (NUMBERED_HEADING.test(line) || (startsBlock && /^\p{Lu}/u.test(line)))

    // A numbered heading right after a full last line of a paragraph.
    if (isHeading && previous && SENTENCE_END.test(previous)) flush()
    current.push(line)

    const endsParagraph = isShort(line) && SENTENCE_END.test(line) && STARTS_BLOCK.test(next)
    if (isHeading || endsParagraph) flush(isHeading)
  })
  flush()
  return blocks
}

const cleanBlock = (block) => collapseWhitespace(joinHyphenatedWords(block))

function cleanText (text, mode = MODES.SINGLE_LINE) {
  if (mode === MODES.PLAIN) return text

  const normalized = normalize(text)

  if (mode === MODES.PARAGRAPHS) {
    // One line per paragraph or heading, with an empty line between blocks; a heading stays right
    // above the paragraph it introduces.
    const blocks = splitBlocks(normalized)
      .map((block) => ({ ...block, text: cleanBlock(block.text) }))
      .filter((block) => block.text)
    return blocks
      .map((block, i) => {
        if (i === 0) return block.text
        const afterHeading = blocks[i - 1].heading && !block.heading
        return (afterHeading ? '\n' : '\n\n') + block.text
      })
      .join('')
  }

  return cleanBlock(normalized)
}

module.exports = { MODES, cleanText }
