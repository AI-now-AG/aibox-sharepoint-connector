import { getTranscriptionConfig } from './transcription/transcription-api';

const WARMUP_SESSION_KEY = 'aibox_backend_warmup_done';
const WARMUP_TIMEOUT_MS = 30000; // 30 seconds timeout

/**
 * Check if user is actively present on the page
 */
function isUserActive(): boolean {
  // Don't warmup if page is hidden (background tab)
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
    return false;
  }
  return true;
}

/**
 * Warmup the backend server by making a lightweight request.
 * This helps avoid cold start delays on Azure Container Apps.
 *
 * Guards:
 * - Only fires once per browser session (sessionStorage)
 * - Only fires when user is actively on the page (visibility API)
 */
export async function warmupBackend(): Promise<void> {
  // Only warmup when user is actively present
  if (!isUserActive()) {
    console.log('[Warmup] Skipped - user not active on page');
    return;
  }

  // Check if already warmed up in this session
  if (sessionStorage.getItem(WARMUP_SESSION_KEY)) {
    return;
  }

  // Mark as attempted immediately to prevent duplicate calls
  sessionStorage.setItem(WARMUP_SESSION_KEY, Date.now().toString());

  try {
    const config = await getTranscriptionConfig();

    // Fire and forget - use AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), WARMUP_TIMEOUT_MS);

    await fetch(config.apiUrl, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log('[Warmup] Backend server warmed up successfully');
  } catch (error) {
    // Silently ignore errors - this is a best-effort warmup
    console.log('[Warmup] Backend warmup attempt completed (may have timed out)');
  }
}
