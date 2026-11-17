import { GOOGLE_SHEETS_READONLY_SCOPE } from '../../domain/constants'

let scriptPromise

export function loadGoogleIdentity() {
  if (window.google?.accounts?.oauth2) return Promise.resolve(window.google)
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-google-identity]')
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google), { once: true })
      existing.addEventListener('error', () => reject(new Error('Unable to load Google Identity Services.')), { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.dataset.googleIdentity = 'true'
    script.onload = () => resolve(window.google)
    script.onerror = () => reject(new Error('Unable to load Google Identity Services.'))
    document.head.appendChild(script)
  })
  return scriptPromise
}

export async function requestGoogleAccessToken(clientId) {
  if (!clientId) throw new Error('VITE_GOOGLE_CLIENT_ID is not configured.')
  const google = await loadGoogleIdentity()
  return new Promise((resolve, reject) => {
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: GOOGLE_SHEETS_READONLY_SCOPE,
      callback: (response) => {
        if (response?.error) reject(new Error(response.error_description || response.error))
        else if (response?.access_token) resolve(response.access_token)
        else reject(new Error('Google did not return an access token.'))
      },
      error_callback: (error) => reject(new Error(error?.message || error?.type || 'Google authorization was cancelled.')),
    })
    tokenClient.requestAccessToken({ prompt: '' })
  })
}
