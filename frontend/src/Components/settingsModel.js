const text = value => typeof value === 'string' ? value.trim() : '';
export const settingsRole = (search, state, profile) => {
  const requested = new URLSearchParams(search).get('as');
  if (requested !== null) return ['client', 'traveler'].includes(requested) ? requested : '';
  if (['client', 'traveler'].includes(state?.role)) return state.role;
  return ['client', 'traveler'].includes(profile?.role) ? profile.role : '';
};
export const profileFromResponse = (response, userId, expected = {}) => {
  const user = response?.data?.user;
  if (response?.success !== true || !userId || user?._id !== userId
    || Object.entries(expected).some(([field, value]) => user[field] !== value)) throw new Error('Profile update was not confirmed.');
  return {
    _id: user._id, name: text(user.name), email: text(user.email), phone_number: text(user.phone_number),
    avatar: text(user.avatar), isVerified: typeof user.isVerified === 'boolean' ? user.isVerified : undefined,
  };
};
export const profileForm = profile => ({ name: text(profile?.name), phone_number: text(profile?.phone_number) });
export const profileChanges = (form, profile) => {
  const previous = profileForm(profile), changes = {};
  for (const field of ['name', 'phone_number']) if (text(form[field]) !== previous[field]) changes[field] = text(form[field]);
  return changes;
};
export const validateProfile = (form, profile) => {
  const errors = {}, name = text(form.name), phone = text(form.phone_number);
  if (!name) errors.name = 'Enter your full name.';
  else if (name.length > 100) errors.name = 'Keep your name to 100 characters or fewer.';
  if (!phone && text(profile?.phone_number)) errors.phone_number = 'Enter a replacement number. Removing a saved number isn’t available yet.';
  else if (phone && phone !== text(profile?.phone_number) && (!/^\+?[\d\s().-]+$/.test(phone) || !/^\d{7,15}$/.test(phone.replace(/\D/g, '')))) errors.phone_number = 'Enter a phone number with 7–15 digits, including a country code if needed.';
  return errors;
};
export const profilePayload = (form, profile) => {
  if (Object.keys(validateProfile(form, profile)).length) throw new Error('Check your profile details.');
  return profileChanges(form, profile);
};
export const profileError = error => {
  const data = error?.response?.data;
  const message = typeof data?.data === 'string' ? data.data : data?.data?.message || data?.message;
  return typeof message === 'string' && error?.response?.status >= 400 && error.response.status < 500
    ? message : 'We couldn’t confirm your changes were saved. Your edits are still here. Please try again.';
};
