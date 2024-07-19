<script>
  export let placeholder;
  export let promptText;
</script>

<div class="flex space-y-2">
  <textarea
    class="w-full min-h-64 p-2 textarea textarea-ghost textarea-lg"
    {placeholder}
    bind:value={promptText}
  ></textarea>
</div>
