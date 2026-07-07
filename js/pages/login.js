import '../app.js'
import { initNavbar } from '../components/navbar.js'
import { login } from '../../services/authService.js'
import { redirectIfAuthenticated } from '../utils/guards.js'
import { showAlert, clearAlert, setButtonLoading } from '../utils/dom.js'
import { validateEmail, validatePassword } from '../utils/validation.js'
import { getErrorMessage } from '../utils/errors.js'

await initNavbar('login')

if (await redirectIfAuthenticated()) {
  // redirect handled
} else {
  const form = document.getElementById('login-form')
  const alertBox = document.getElementById('form-alert')
  const submitBtn = document.getElementById('login-btn')
  const params = new URLSearchParams(window.location.search)
  const redirectTo = params.get('redirect') || 'index.html'

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    clearAlert(alertBox)

    const email = form.email.value.trim()
    const password = form.password.value

    form.email.classList.toggle('is-invalid', !!validateEmail(email))
    form.password.classList.toggle('is-invalid', !!validatePassword(password))

    if (validateEmail(email) || validatePassword(password)) {
      showAlert(alertBox, 'Моля, поправете грешките във формата.', 'warning')
      return
    }

    setButtonLoading(submitBtn, true, 'Влизане...')

    try {
      await login({ email, password })
      window.location.href = redirectTo
    } catch (error) {
      showAlert(alertBox, getErrorMessage(error), 'danger')
    } finally {
      setButtonLoading(submitBtn, false)
    }
  })
}
