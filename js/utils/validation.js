export function validateUsername(username) {
  if (!username || username.trim().length < 3) {
    return 'Username must be at least 3 characters.'
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return 'Only letters, numbers, and underscore (_) are allowed.'
  }
  return null
}

export function validateEmail(email) {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Enter a valid email address.'
  }
  return null
}

export function validatePassword(password) {
  if (!password || password.length < 6) {
    return 'Password must be at least 6 characters.'
  }
  return null
}

export function validateSkillTitle(title) {
  if (!title || title.trim().length < 2) {
    return 'Title must be at least 2 characters.'
  }
  return null
}
