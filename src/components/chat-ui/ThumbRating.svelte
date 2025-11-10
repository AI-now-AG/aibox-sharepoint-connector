<script lang="ts">
  import { svgIcons } from "$assets/icons";
  import { MessageThumbRating } from "$types/MessageHistory";

  interface Props {
    selected: MessageThumbRating | null | undefined;
    rate: Function;
  }

  let { selected = null, rate = () => null }: Props = $props();

  const toggle = (type: MessageThumbRating) => {
    selected = selected === type ? MessageThumbRating.Cancel : type;
    rate?.(selected);
  };
</script>

<div class="flex items-center space-x-2 mt-[-10px]">
  <button
    onclick={() => toggle(MessageThumbRating.Up)}
    class="hover:bg-gray-100 outline-none border-none p-1 rounded-full
           {selected === 'up' ? 'text-blue-400' : ''}"
    aria-label="Thumb up"
  >
    {@html svgIcons.thumbUp}
  </button>

  <button
    onclick={() => toggle(MessageThumbRating.Down)}
    class="hover:bg-gray-100 outline-none border-none p-1 rounded-full
           {selected === 'down' ? 'text-blue-400' : ''}"
    aria-label="Thumb down"
  >
    {@html svgIcons.thumbDown}
  </button>
</div>
