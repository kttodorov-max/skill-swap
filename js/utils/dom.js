export function showAlert(container, message, type = 'danger') {
  if (!container) return

  container.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `
}

export function clearAlert(container) {
  if (container) container.innerHTML = ''
}

export function setButtonLoading(button, isLoading, loadingText = 'Зареждане...') {
  if (!button) return

  if (isLoading) {
    button.dataset.originalText = button.innerHTML
    button.disabled = true
    button.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>${loadingText}`
    return
  }

  button.disabled = false
  button.innerHTML = button.dataset.originalText || button.innerHTML
}
