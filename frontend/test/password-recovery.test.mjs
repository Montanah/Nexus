import assert from 'node:assert/strict';
import test from 'node:test';
import { validateRecoveryEmail, validateRecoveryPassword } from '../src/Components/recoveryModel.js';

test('recovery email accepts surrounding whitespace but rejects missing or malformed addresses', () => {
  assert.equal(validateRecoveryEmail('  alex+orders@example.test  '), '');
  for (const email of ['', 'alex', 'alex@', 'alex @example.test', 'alex@example', 'a'.repeat(255) + '@example.test']) {
    assert.ok(validateRecoveryEmail(email), email);
  }
});

test('reset codes keep leading zeros and require exactly six digits', () => {
  const values = { code: '001234', password: 'a long passphrase', confirmation: 'a long passphrase' };
  assert.deepEqual(validateRecoveryPassword(values), {});
  assert.deepEqual(validateRecoveryPassword({ ...values, code: ' 001234 ' }), {});
  for (const code of ['', '12345', '1234567', '123abc']) assert.ok(validateRecoveryPassword({ ...values, code }).code);
});

test('password rules reject short, empty, and mismatching inputs without trimming passwords', () => {
  const values = { code: '001234', password: 'new password', confirmation: 'new password' };
  assert.deepEqual(validateRecoveryPassword(values), {});
  assert.ok(validateRecoveryPassword({ ...values, password: 'short' }).password);
  assert.ok(validateRecoveryPassword({ ...values, password: '        ', confirmation: '        ' }).password);
  assert.ok(validateRecoveryPassword({ ...values, confirmation: '' }).confirmation);
  assert.ok(validateRecoveryPassword({ ...values, confirmation: 'new password ' }).confirmation);
  assert.deepEqual(validateRecoveryPassword({ ...values, password: ' new password ', confirmation: ' new password ' }), {});
});
