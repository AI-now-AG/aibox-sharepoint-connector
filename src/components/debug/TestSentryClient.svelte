<script lang="ts">
  import { captureException } from "$utils/sentry";

  type Result = { ok: boolean; message: string; ts: string } | null;

  let result: Result = null;
  let loading = false;

  function testCaptureException() {
    loading = true;
    result = null;
    try {
      captureException(
        new Error("Test captureException() from Svelte client component"),
        { source: "test-sentry.astro", timestamp: new Date().toISOString() },
      );
      result = {
        ok: true,
        message: "captureException() called — check Network tab for a POST to sentry.io",
        ts: new Date().toISOString(),
      };
    } catch (e) {
      result = {
        ok: false,
        message: `captureException() threw: ${e}`,
        ts: new Date().toISOString(),
      };
    } finally {
      loading = false;
    }
  }

  function testThrowError() {
    throw new Error("Unhandled throw — Sentry should auto-capture this");
  }
</script>

<div style="display:flex; flex-direction:column; gap:1rem; max-width:600px;">
  <div style="background:#1e293b; padding:1rem; border-radius:8px; font-size:0.85rem; color:#94a3b8;">
    Open <strong>DevTools → Network</strong> and filter by <code>sentry.io</code> or <code>ingest</code>
    before clicking the buttons.
  </div>

  <button onclick={testCaptureException} disabled={loading} style="
    padding: 0.75rem 1.5rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
    font-family: monospace;
  ">
    {loading ? "Sending…" : "captureException() — non-throwing"}
  </button>

  <button onclick={testThrowError} style="
    padding: 0.75rem 1.5rem;
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
    font-family: monospace;
  ">
    throw new Error() — auto-capture
  </button>

  {#if result}
    <div style="
      padding: 1rem;
      border-radius: 6px;
      background: {result.ok ? '#14532d' : '#7f1d1d'};
      color: {result.ok ? '#86efac' : '#fca5a5'};
      font-size: 0.85rem;
    ">
      <strong>{result.ok ? "✅" : "❌"} {result.message}</strong><br/>
      <span style="opacity:0.7">{result.ts}</span>
    </div>
  {/if}
</div>
