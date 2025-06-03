<script lang="ts">
  import { onMount } from "svelte";
  import { svgIcons } from "$assets/icons";

  let isButtonVisible = $state(false);

  onMount(() => {
    const handleScroll = () => {
      const { scrollHeight, scrollTop, clientHeight } =
        document.documentElement;

      if (Math.abs(scrollHeight - clientHeight - scrollTop) > 100) {
        if (!isButtonVisible) isButtonVisible = true;
      } else {
        if (isButtonVisible) isButtonVisible = false;
      }
    };
    window.addEventListener("scroll", handleScroll);
  });

  const scrollToBottom = async () => {
    window.scroll({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  };
</script>

{#if isButtonVisible}
  <div class="relative w-full flex justify-center">
    <button
      class="absolute shadow-lg hover:shadow-2xl self-center bottom-2 btn btn-sm btn-circle"
      onclick={() => {
        scrollToBottom();
      }}
    >
      {@html svgIcons.downIcon}
    </button>
  </div>
{/if}
