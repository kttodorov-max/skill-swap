export function validateUsername(username) {
  if (!username || username.trim().length < 3) {
    return 'Потребителското име трябва да е поне 3 символа.'
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return 'Позволени са само букви, цифри и долна черта (_).'
  }
  return null
}

export function validateEmail(email) {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Въведете валиден имейл адрес.'
  }
  return null
}

export function validatePassword(password) {
  if (!password || password.length < 6) {
    return 'Паролата трябва да е поне 6 символа.'
  }
  return null
}

export function validateSkillTitle(title) {
  if (!title || title.trim().length < 2) {
    return 'Заглавието трябва да е поне 2 символа.'
  }
  return null
}
