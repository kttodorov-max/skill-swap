import '../app.js'
import { initNavbar } from '../components/navbar.js'
import { register } from '../../services/authService.js'
import { redirectIfAuthenticated } from '../utils/guards.js'
import { showAlert, clearAlert, setButtonLoading } from '../utils/dom.js'
import { validateUsername, validateEmail, validatePassword } from '../utils/validation.js'
import { getErrorMessage } from '../utils/errors.js'

await initNavbar('register')

if (await redirectIfAuthenticated()) {
  // redirect handled
} else {
  const form = document.getElementById('register-form')
  const alertBox = document.getElementById('form-alert')
  const submitBtn = document.getElementById('register-btn')

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    clearAlert(alertBox)

    const username = form.username.value.trim()
    const email = form.email.value.trim()
    const password = form.password.value

    const usernameError = validateUsername(username)
    const emailError = validateEmail(email)
    const passwordError = validatePassword(password)

    form.username.classList.toggle('is-invalid', !!usernameError)
    form.email.classList.toggle('is-invalid', !!emailError)
    form.password.classList.toggle('is-invalid', !!passwordError)

    const firstError = usernameError || emailError || passwordError
    if (firstError) {
      showAlert(alertBox, firstError, 'warning')
      return
    }

    setButtonLoading(submitBtn, true, 'Регистрация...')

    try {
      const data = await register({ email, password, username })

      if (data.session) {
        window.location.href = 'index.html'
        return
      }

      showAlert(
        alertBox,
        data.user
          ? 'Регистрацията е успешна! Проверете имейла си за потвърждение или влезте.'
          : 'Регистрацията е успешна! Можете да влезете.',
        'success'
      )
      form.reset()
    } catch (error) {
      showAlert(alertBox, getErrorMessage(error), 'danger')
    } finally {
      setButtonLoading(submitBtn, false)
    }
  })
}
