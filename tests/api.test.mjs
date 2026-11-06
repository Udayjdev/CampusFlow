import test from 'node:test';
import assert from 'node:assert/strict';

// Run against an isolated local database, never against a shared deployment.
const base = process.env.CAMPUSFLOW_TEST_URL;
const integration = (name, fn) => test(name, { skip: !base }, fn);

async function post(path, body, cookie = '') {
  return fetch(`${base}/api/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify(body),
  });
}

integration('API rejects null, arrays and primitive JSON bodies', async () => {
  for (const body of [null, [], 'faculty', 42]) {
    const response = await post('session', body);
    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /object/);
  }
});

integration('demo roles must be explicitly registered', async () => {
  for (const role of ['toString', '__proto__', 'constructor', 'unknown']) {
    const response = await post('session', { role });
    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /valid demo role/);
  }
});

integration('student role cannot create bookings', async () => {
  const session = await post('session', { role: 'student' });
  assert.equal(session.status, 200);
  const cookie = session.headers.get('set-cookie').split(';')[0];
  const response = await post('book', {}, cookie);
  assert.equal(response.status, 403);
});

integration('import rejects invalid rows without crashing', async () => {
  const session = await post('session', { role: 'admin' });
  assert.equal(session.status, 200);
  const cookie = session.headers.get('set-cookie').split(';')[0];
  const response = await post('import', { kind: 'students', rows: [null] }, cookie);
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /expected an object/);
});
