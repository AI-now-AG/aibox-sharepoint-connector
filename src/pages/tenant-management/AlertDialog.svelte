<script lang="ts">
  export let modal: any;
  export let message: string = "";
</script>

<dialog id="alert_dialog" bind:this={modal} class="modal">
  <div class="modal-box">
    <form method="dialog">
      <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        >✕</button
      >
    </form>
    <p id="alert_message" style="color: rgb(159 18 57);">{message}</p>
  </div>
</dialog>
