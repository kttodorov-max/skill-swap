import '../app.js'
import { initNavbar } from '../components/navbar.js'
import { login } from '../../services/authService.js'
import { getSafeRedirectUrl, redirectIfAuthenticated } from '../utils/guards.js'
import { showAlert, clearAlert, setButtonLoading } from '../utils/dom.js'
import { validateEmail, validatePassword } from '../utils/validation.js'
import { getErrorMessage } from '../utils/errors.js'

const params = new URLSearchParams(window.location.search)
const redirectTo = getSafeRedirectUrl(params.get('redirect'))

if (await redirectIfAuthenticated(redirectTo)) {
  // redirect handled
} else {
  await initNavbar('login')

  const form = document.getElementById('login-form')
  const alertBox = document.getElementById('form-alert')
  const submitBtn = document.getElementById('login-btn')

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    clearAlert(alertBox)

    const email = form.email.value.trim()
    const password = form.password.value

    form.email.classList.toggle('is-invalid', !!validateEmail(email))
    form.password.classList.toggle('is-invalid', !!validatePassword(password))

    if (validateEmail(email) || validatePassword(password)) {
      showAlert(alertBox, 'Please fix the errors in the form.', 'warning')
      return
    }

    setButtonLoading(submitBtn, true, 'Signing in...')

    try {
      await login({ email, password })
      window.location.replace(redirectTo)
    } catch (error) {
      showAlert(alertBox, getErrorMessage(error), 'danger')
    } finally {
      setButtonLoading(submitBtn, false)
    }
  })
}
