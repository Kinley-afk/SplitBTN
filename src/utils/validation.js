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