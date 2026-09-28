// IMPORTANT: no DB needed here — this file only exercises the upload guards.
process.env.NODE_ENV = 'test';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { isAllowedChatFile, chatStoredFilename } = require('../middlewares/upload');

// The chat attachment route used to have no fileFilter at all and used to keep
// the uploader's own extension. /uploads is served with express.static, which
// infers Content-Type from the extension, so `evil.svg` or `evil.html` came
// back as same-origin active content and the script ran in the app's origin.
const ACTIVE_TYPES = ['evil.svg', 'evil.html', 'evil.htm', 'evil.xml', 'evil.js', 'evil.mjs'];

test('active content types are rejected even with an innocent mimetype', () => {
  for (const name of ACTIVE_TYPES) {
    assert.equal(
      isAllowedChatFile(name, 'image/png'),
      false,
      `${name} must not be accepted — express.static would serve it same-origin`
    );
  }
});

test('active content types are rejected even with a matching mimetype', () => {
  // The mimetype in a multipart request is attacker-controlled, so it must
  // never be what decides acceptance. Belt and braces: both are checked.
  for (const name of ACTIVE_TYPES) {
    assert.equal(isAllowedChatFile(name, 'text/html'), false, `${name} + text/html must be rejected`);
  }
});

test('a double extension cannot smuggle a real type past the check', () => {
  // path.extname('report.pdf.svg') is '.svg', so the allow-list sees '.svg'.
  assert.equal(isAllowedChatFile('report.pdf.svg', 'image/svg+xml'), false);
});

test('ordinary attachments are still accepted', () => {
  const ok = [
    ['photo.png', 'image/png'],
    ['photo.jpg', 'image/jpeg'],
    ['photo.JPEG', 'image/jpeg'],
    ['spec.pdf', 'application/pdf'],
    ['notes.txt', 'text/plain'],
  ];
  for (const [name, mimetype] of ok) {
    assert.equal(isAllowedChatFile(name, mimetype), true, `${name} should be allowed`);
  }
});

test('the stored filename never keeps the uploader extension', () => {
  // The extension we write is the one that decides Content-Type later, so it
  // has to come from our own map rather than from the request.
  assert.equal(chatStoredFilename('evil.svg'), null, 'rejected files get no filename at all');
  assert.match(chatStoredFilename('spec.pdf'), /\.pdf$/);
  assert.match(chatStoredFilename('photo.PNG'), /\.png$/, 'extension is normalised to lower case');
  assert.match(chatStoredFilename('notes.txt'), /\.txt$/);
});

test('a stored filename is unique per upload', () => {
  assert.notEqual(chatStoredFilename('spec.pdf'), chatStoredFilename('spec.pdf'));
});
