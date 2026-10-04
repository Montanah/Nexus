import assert from 'node:assert/strict';
import test from 'node:test';
import { profileChanges, profileError, profileForm, profileFromResponse, profilePayload, settingsRole, validateProfile } from '../src/Components/settingsModel.js';
const profile = { _id: 'u1', name: 'Alex Morgan', email: 'alex@example.test', phone_number: '+254 712 345 678', isVerified: true };

test('settings uses a persistent workspace hint and never invents an account role', () => {
  assert.equal(settingsRole('?as=traveler', { role: 'client' }, {}), 'traveler');
  assert.equal(settingsRole('', { role: 'client' }, {}), 'client');
  assert.equal(settingsRole('', null, { role: 'traveler' }), 'traveler');
  assert.equal(settingsRole('', null, { name: 'Alex' }), '');
  assert.equal(settingsRole('?as=invalid', null, { role: 'client' }), '');
});

test('profile responses must acknowledge the same account and every submitted field', () => {
  const response = { success: true, data: { user: profile } };
  assert.deepEqual(profileFromResponse(response, 'u1'), { ...profile, avatar: '' });
  assert.throws(() => profileFromResponse(response, 'u2'));
  assert.throws(() => profileFromResponse({ ...response, success: false }, 'u1'));
  assert.throws(() => profileFromResponse(response, 'u1', { name: 'Changed name' }));
  assert.throws(() => profileFromResponse(null, 'u1'));
  assert.deepEqual(profileFromResponse(response, 'u1', { phone_number: profile.phone_number }), { ...profile, avatar: '' });
});

test('profile updates send changed name and phone only, preserving existing phone formatting', () => {
  assert.deepEqual(profilePayload({ ...profileForm(profile), name: '  Alex Taylor  ', email: 'forged@example.test', isVerified: true, role: 'admin' }, profile), { name: 'Alex Taylor' });
  assert.deepEqual(profilePayload({ name: profile.name, phone_number: '+1 (202) 555-0123' }, profile), { phone_number: '+1 (202) 555-0123' });
  assert.deepEqual(profileChanges({ name: ` ${profile.name} `, phone_number: profile.phone_number }, profile), {});
});

test('required names and invalid phone edits fail before requests are sent', () => {
  assert.equal(Boolean(validateProfile({ ...profileForm(profile), name: '  ' }, profile).name), true);
  assert.equal(Boolean(validateProfile({ ...profileForm(profile), name: 'a'.repeat(101) }, profile).name), true);
  for (const phone of ['123', '1234567890123456', '+254abc12345', '++254712345678']) assert.equal(Boolean(validateProfile({ name: profile.name, phone_number: phone }, profile).phone_number), true);
  assert.deepEqual(validateProfile({ name: 'Zoë O’Neil', phone_number: '0712 345 678' }, profile), {});
});

test('phone removal is blocked because the backend ignores empty replacements', () => {
  assert.equal(Boolean(validateProfile({ name: profile.name, phone_number: '' }, profile).phone_number), true);
  assert.throws(() => profilePayload({ name: profile.name, phone_number: ' ' }, profile));
  const withoutPhone = { ...profile, phone_number: '' };
  assert.deepEqual(profilePayload({ name: 'Alex Taylor', phone_number: '' }, withoutPhone), { name: 'Alex Taylor' });
  // An existing legacy value need not be changed just to save a name.
  assert.deepEqual(profilePayload({ name: 'Alex Taylor', phone_number: 'legacy number' }, { ...profile, phone_number: 'legacy number' }), { name: 'Alex Taylor' });
});

test('missing verification and optional profile details stay unknown instead of fabricated', () => {
  const data = profileFromResponse({ success: true, data: { user: { _id: 'u1' } } }, 'u1');
  assert.deepEqual(profileForm(data), { name: '', phone_number: '' });
  assert.equal(data.email, ''); assert.equal(data.avatar, ''); assert.equal(data.isVerified, undefined);
  assert.equal(profileFromResponse({ success: true, data: { user: { ...profile, isVerified: 'true' } } }, 'u1').isVerified, undefined);
});

test('save failures handle existing API envelopes without exposing server errors', () => {
  assert.equal(profileError({ response: { status: 400, data: { data: 'User not found' } } }), 'User not found');
  assert.equal(profileError({ response: { status: 409, data: { data: { message: 'Phone number already used' } } } }), 'Phone number already used');
  assert.match(profileError({ response: { status: 500, data: { message: 'Database details' } } }), /edits are still here/);
});
