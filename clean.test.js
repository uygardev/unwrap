const test = require('node:test')
const assert = require('node:assert/strict')
const { MODES, cleanText } = require('./clean')

test('joins wrapped lines into a single line', () => {
  assert.equal(cleanText('The TC39 committee is\r\ncomprised of between\n 50 and  100 people.\n'),
    'The TC39 committee is comprised of between 50 and 100 people.')
})

test('rejoins words hyphenated at the end of a line', () => {
  assert.equal(cleanText('an infor-\nmation retrieval sys-\n  tem'), 'an information retrieval system')
  assert.equal(cleanText('bilgisa-\nyar mühen-\ndisliği'), 'bilgisayar mühendisliği')
})

test('keeps hyphens that are not line-end hyphenation', () => {
  assert.equal(cleanText('A - B and well-known'), 'A - B and well-known')
  assert.equal(cleanText('Covid-\n19 and Anglo-\nSaxon'), 'Covid-19 and Anglo-Saxon')
})

test('removes soft hyphens, zero width spaces and ligatures', () => {
  assert.equal(cleanText('con\u00ADtent\u200B is \uFB01ne and e\uFB00ective'), 'content is fine and effective')
})

test('keeps paragraph breaks in paragraphs mode', () => {
  const input = 'First line\nof paragraph one.\n\n  \nSecond para-\ngraph\nhere.\n'
  assert.equal(cleanText(input, MODES.PARAGRAPHS), 'First line of paragraph one.\n\nSecond paragraph here.')
})

test('plain mode leaves the text untouched', () => {
  const input = 'line one\n  line two\n'
  assert.equal(cleanText(input, MODES.PLAIN), input)
})
