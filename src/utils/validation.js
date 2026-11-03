// Pure validation helpers. Each returns an error message, or '' if valid.
export function validateName(name) {
  if (!name.trim()) return 'Please enter your name.';
  if (name.trim().length < 2) return 'Name must be at least 2 characters.';
  return '';
}

export function validateEmail(email) {
  if (!email.trim()) return 'Please enter your email.';
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email.trim())) return 'Enter a valid email address.';
  return '';
}

export function validatePassword(password) {
  if (!password) return 'Please enter your password.';
  if (password.length < 6) return 'Password must be at least 6 characters.';
  return '';
}

export function validateGroupName(name) {
  const trimmed = name.trim();
  if (!trimmed) return 'Please enter a group name.';
  if (trimmed.length < 2) return 'Group name must be at least 2 characters.';
  if (trimmed.length > 40) return 'Group name must be 40 characters or fewer.';
  return '';
}

// Invite codes are 6 characters from A-Z and 2-9 (no 0, O, 1 or I).
export function validateInviteCode(code) {
  const cleaned = code.trim().toUpperCase();
  if (!cleaned) return 'Please enter the invite code.';
  if (!/^[A-HJ-NP-Z2-9]{6}$/.test(cleaned)) return 'Invite codes have 6 letters or numbers.';
  return '';
}