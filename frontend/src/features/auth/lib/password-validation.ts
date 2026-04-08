export function validateEmailAddress(email: string) {
  if (!email.trim()) {
    return "Email is required.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Enter a valid email address.";
  }

  return undefined;
}

export function validateStrongPassword(password: string) {
  if (!password) {
    return "Password is required.";
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return "Password must include uppercase, lowercase, and a number.";
  }

  return undefined;
}
