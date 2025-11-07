<script lang="ts">
  let selected: "up" | "down" | null = $state(null);

  function toggle(type: "up" | "down") {
    selected = selected === type ? null : type;
  }
</script>

<div class="flex items-center space-x-2 mt-[-10px]">
  <!-- Thumb Up -->
  <button
    onclick={() => toggle("up")}
    class="rounded-full transition-colors duration-200
           hover:bg-white/10 focus:outline-none
           {selected === 'up' ? 'text-green-400' : 'text-gray-400'}"
    aria-label="Thumb up"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="w-6 h-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M14 9V5a2 2 0 0 0-2-2l-3 9v9h8.72a2 2 0 0 0 1.94-1.52l1.38-6A2 2 0 0 0 18.1 11H14zM7 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h3v12z"
      />
    </svg>
  </button>

  <!-- Thumb Down -->
  <button
    onclick={() => toggle("down")}
    class="rounded-full transition-colors duration-200
           hover:bg-white/10 focus:outline-none
           {selected === 'down' ? 'text-red-400' : 'text-gray-400'}"
    aria-label="Thumb down"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="w-6 h-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M10 15v4a2 2 0 0 0 2 2l3-9V3H6.28a2 2 0 0 0-1.94 1.52l-1.38 6A2 2 0 0 0 5.9 13H10zM17 2h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3V2z"
      />
    </svg>
  </button>
</div>
