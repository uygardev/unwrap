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

test('keeps blank-line paragraph breaks in paragraphs mode', () => {
  const input = 'First line\nof paragraph one.\n\n  \nSecond para-\ngraph\nhere.\n'
  assert.equal(cleanText(input, MODES.PARAGRAPHS), 'First line of paragraph one.\n\nSecond paragraph here.')
})

test('finds headings and paragraphs in text copied from a PDF, with an empty line between them', () => {
  const input = [
    '4.7 RQ2. Effectiveness of Computational Techniques',
    'RQ2 investigates how various machine learning, deep learning, and other computa-',
    'tional techniques can effectively support the diagnosis, treatment, and follow-up of',
    'psychiatric disorders. The studies on diagnosis are further divided into two',
    'subcategories: those that include basic classification stages and those that employ',
    'attention-based and spatio-temporal-based approaches.',
    '4.7.1 Treatment and Follow-up Support',
    'Although the studies examined primarily aimed to develop models for directly diag-',
    'nosing or identifying depression, a limited number of studies focused on predicting',
    'the severity of psychiatric conditions or forecasting their future course and recurrence.',
    'These studies were generally based on regression models or long-term monitoring',
    'systems.',
    'Among the reviewed studies, only Hall et al. [93] focused on supporting treatment.',
    'Additionally, this was the sole example of a study on psychotic disorders, in which',
    'participants\u2019 video recordings were obtained.'
  ].join('\n')
  assert.equal(cleanText(input, MODES.PARAGRAPHS), [
    '4.7 RQ2. Effectiveness of Computational Techniques',
    'RQ2 investigates how various machine learning, deep learning, and other computational techniques can ' +
      'effectively support the diagnosis, treatment, and follow-up of psychiatric disorders. The studies on ' +
      'diagnosis are further divided into two subcategories: those that include basic classification stages ' +
      'and those that employ attention-based and spatio-temporal-based approaches.',
    '',
    '4.7.1 Treatment and Follow-up Support',
    'Although the studies examined primarily aimed to develop models for directly diagnosing or identifying ' +
      'depression, a limited number of studies focused on predicting the severity of psychiatric conditions or ' +
      'forecasting their future course and recurrence. These studies were generally based on regression models ' +
      'or long-term monitoring systems.',
    '',
    'Among the reviewed studies, only Hall et al. [93] focused on supporting treatment. Additionally, this was ' +
      'the sole example of a study on psychotic disorders, in which participants\u2019 video recordings were obtained.'
  ].join('\n'))
})

test('does not break on short lines that continue in lowercase', () => {
  const input = 'Depression Activation Map to highlight signs of depression\nin facial expressions. This\n' +
    'approach outperformed traditional face-recognition\nmethods, capturing detailed signs\n' +
    'of depression with a Mean Absolute Error (MAE) of 6.21 and a Root Mean Square\nError (RMSE) of 8.39.'
  assert.equal(cleanText(input, MODES.PARAGRAPHS),
    'Depression Activation Map to highlight signs of depression in facial expressions. This approach ' +
    'outperformed traditional face-recognition methods, capturing detailed signs of depression with a Mean ' +
    'Absolute Error (MAE) of 6.21 and a Root Mean Square Error (RMSE) of 8.39.')
})

test('plain mode leaves the text untouched', () => {
  const input = 'line one\n  line two\n'
  assert.equal(cleanText(input, MODES.PLAIN), input)
})

test('cleans a real copy from a PDF viewer', () => {
  const input = [
    'Researchers have used different methods to classify data',
    'alongside CNN-based clas-',
    'sification. Sun et al. [101] worked with audio data and developed a model using Graph Neu-',
    'ral Networks. A Gated Recurrent Unit (GRU) was used to cap-',
    'ture time-series patterns, treating each frame’s features as a node in a graph. This method',
    'outperformed standard CNN and RNN approaches in accuracy, F1-score, precision,',
    'and recall.'
  ].join('\n')
  assert.equal(cleanText(input),
    'Researchers have used different methods to classify data alongside CNN-based classification. ' +
    'Sun et al. [101] worked with audio data and developed a model using Graph Neural Networks. ' +
    'A Gated Recurrent Unit (GRU) was used to capture time-series patterns, treating each frame’s ' +
    'features as a node in a graph. This method outperformed standard CNN and RNN approaches in ' +
    'accuracy, F1-score, precision, and recall.')
})

test('starts every list item on its own line and keeps the list together', () => {
  const input = [
    'The model has three parts, which are described in detail in the following sections of this',
    'chapter:',
    '• an encoder that reads the',
    'input sequence,',
    ' an attention layer',
    '•',
    'a decoder',
    'After the list, the paragraph continues with a long enough line of text to set the',
    'full line length.'
  ].join('\n')
  assert.equal(cleanText(input, MODES.PARAGRAPHS), [
    'The model has three parts, which are described in detail in the following sections of this chapter:',
    '',
    '• an encoder that reads the input sequence,',
    '• an attention layer',
    '• a decoder',
    '',
    'After the list, the paragraph continues with a long enough line of text to set the full line length.'
  ].join('\n'))
})

test('recognises numbered and lettered list items', () => {
  const input = '1. Collect the data\n2. Train the model on the\ncollected data\n3) Evaluate\n(a) first\n(iv) fourth\n- dash item'
  assert.equal(cleanText(input, MODES.PARAGRAPHS),
    '1. Collect the data\n2. Train the model on the collected data\n3) Evaluate\n(a) first\n(iv) fourth\n- dash item')
})

test('does not mistake negative numbers or numbered headings for list items', () => {
  const input = [
    '1 Introduction',
    'Earlier studies of facial expressions in psychotic disorders reported a correlation of',
    '-0.42 between the two scores, which the present study set out to replicate.'
  ].join('\n')
  assert.equal(cleanText(input, MODES.PARAGRAPHS), [
    '1 Introduction',
    'Earlier studies of facial expressions in psychotic disorders reported a correlation of ' +
      '-0.42 between the two scores, which the present study set out to replicate.'
  ].join('\n'))
})
