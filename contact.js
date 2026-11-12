const copyButton = document.querySelector('[data-copy-email]')
const status = document.querySelector('#copy-status')
let hideTimer
copyButton?.addEventListener('click', async () => {
  const email = copyButton.dataset.copyEmail
  if (!email || !status) return
  copyButton.disabled = true
  clearTimeout(hideTimer)
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
    await navigator.clipboard.writeText(email)
    status.textContent = 'ელფოსტის მისამართი დაკოპირებულია.'
  } catch {
    status.textContent = 'კოპირება ვერ მოხერხდა. მონიშნე და დააკოპირე მისამართი ხელით.'
  } finally {
    copyButton.disabled = false
    status.classList.add('is-visible')
    hideTimer = setTimeout(() => status.classList.remove('is-visible'), 4500)
  }
})
