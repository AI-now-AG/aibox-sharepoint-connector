<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { warmupBackend } from '$api/warmup-api';

  let visibilityHandler: (() => void) | null = null;

  onMount(() => {
    // Only warmup when page is visible (user is actively present)
    if (document.visibilityState === 'visible') {
      // Small delay to let initial render complete
      setTimeout(() => {
        warmupBackend();
      }, 500);
    } else {
      // Wait for user to return to the tab
      visibilityHandler = () => {
        if (document.visibilityState === 'visible') {
          warmupBackend();
          // Remove listener after first warmup
          document.removeEventListener('visibilitychange', visibilityHandler!);
          visibilityHandler = null;
        }
      };
      document.addEventListener('visibilitychange', visibilityHandler);
    }
  });

  onDestroy(() => {
    if (visibilityHandler) {
      document.removeEventListener('visibilitychange', visibilityHandler);
    }
  });
</script>

<!-- No visible UI - this is a side-effect component -->
