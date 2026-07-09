const ERROR_MESSAGES = {
  'Invalid login credentials': 'Invalid email or password.',
  'User already registered': 'A user with this email already exists.',
  'Email not confirmed': 'Please confirm your email before signing in.',
}

export function getErrorMessage(error, fallback = 'An error occurred. Please try again.') {
  if (!error) return fallback
  return ERROR_MESSAGES[error.message] || error.message || fallback
}
