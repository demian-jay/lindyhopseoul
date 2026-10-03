import test from 'node:test';
import assert from 'node:assert/strict';
import { safePath, safeFrames } from './diagnostics.js';

test('removes queries, identities and fragments from diagnostic paths', () => {
  assert.equal(safePath('https://example.com/api/members/alice/settings?email=a@b.com&token=secret#private'), '/api/members/:id/settings');
});
test('keeps stack locations without exception messages or URL secrets', () => {
  assert.equal(safeFrames('Error: secret email=a@b.com\n at https://example.com/assets/main-a.js:4:30?token=secret'), 'main-a.js:4:30');
});
test('retains Vite stack coordinates while dropping query parameters', () => {
  assert.equal(safeFrames('TypeError: private\n at http://localhost:5173/src/App.jsx?t=123:42:9'), 'App.jsx:42:9');
});
