import '../app.js'
import { initNavbar } from '../components/navbar.js'
import { register } from '../../services/authService.js'
import { redirectIfAuthenticated } from '../utils/guards.js'
import { showAlert, clearAlert, setButtonLoading } from '../utils/dom.js'
import { validateUsername, validateEmail, validatePassword } from '../utils/validation.js'
import { getErrorMessage } from '../utils/errors.js'

if (await redirectIfAuthenticated('profile.html')) {
  // redirect handled
} else {
  await initNavbar('register')

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

    setButtonLoading(submitBtn, true, 'Registering...')

    try {
      const data = await register({ email, password, username })

      if (data.session) {
        if (data.profile) {
          window.location.replace('profile.html')
          return
        }

        showAlert(
          alertBox,
          'Registration successful, but your profile is still being created. Try signing in shortly.',
          'warning'
        )
        return
      }

      showAlert(
        alertBox,
        data.user
          ? 'Registration successful! Check your email for confirmation, then sign in.'
          : 'Registration successful! You can sign in now.',
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
