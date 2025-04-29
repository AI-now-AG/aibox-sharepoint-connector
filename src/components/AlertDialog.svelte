<script lang="ts">
  interface Props {
    modal: any;
    message?: string;
    okText?: string;
    okAction?: Function;
  }

  let {
    modal = $bindable(),
    message = $bindable(""),
    okText,
    okAction,
  }: Props = $props();
</script>

<dialog bind:this={modal} class="modal">
  <div class="modal-box">
    <form method="dialog">
      <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        >✕</button
      >
    </form>
    <p id="alert_message" style="color: rgb(159 18 57);">{message}</p>
    {#if okText}
      <div class="flex justify-between gap-4 mt-6">
        <button
          id="yes_button"
          class="btn btn-warning flex-1"
          onclick={() => {
            okAction ? okAction() : modal.close();
          }}>{okText}</button
        >
      </div>
    {/if}
  </div>
</dialog>
