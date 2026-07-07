const ERROR_MESSAGES = {
  'Invalid login credentials': 'Грешна имейл или парола.',
  'User already registered': 'Потребител с този имейл вече съществува.',
  'Email not confirmed': 'Моля, потвърдете имейла си преди вход.',
}

export function getErrorMessage(error, fallback = 'Възникна грешка. Опитайте отново.') {
  if (!error) return fallback
  return ERROR_MESSAGES[error.message] || error.message || fallback
}
