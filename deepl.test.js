const test = require('node:test')
const assert = require('node:assert/strict')
const { deeplWebUrl } = require('./deepl')

test('builds a DeepL web link that keeps line breaks and escapes separators', () => {
  assert.equal(deeplWebUrl('Path a\\b, x|y, c/d.\n\n100% & #1', 'tr'),
    'https://www.deepl.com/translator#en/tr/Path%20a%5C%5Cb%2C%20x%5C%7Cy%2C%20c%5C%2Fd.%0A%0A100%25%20%26%20%231')
})

test('uses a different placeholder source language when translating into English', () => {
  assert.ok(deeplWebUrl('Guten Morgen', 'en').startsWith('https://www.deepl.com/translator#de/en/'))
})
