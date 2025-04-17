<script>
  let { title, price } = $props();
</script>

<div class="card bg-[#E6F0FA] shadow-lg rounded-lg p-6 text-gray-600">
  <label
    class="label cursor-pointer flex items-center justify-between"
    for="audio-option"
  >
    <div>
      <h3 class="text-lg font-semibold">{title}</h3>
    </div>
    <div class="flex items-center">
      <p class="text-gray-600 mr-3">{price}</p>
    </div>
  </label>
</div>
