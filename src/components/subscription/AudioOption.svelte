<script>
  let { title, price, checked = false, on = {} } = $props();
  let { change } = on;
</script>

<div class="card bg-[#E6F0FA] shadow-lg rounded-lg p-6">
  <label class="label cursor-pointer flex items-center justify-between">
    <div>
      <h3 class="text-lg font-semibold">{title}</h3>
    </div>
    <div class="flex items-center">
      <p class="text-gray-600 mr-3">{price}</p>
      <input
        type="radio"
        name="audio-option"
        class="radio radio-primary"
        {checked}
        onchange={change}
      />
    </div>
  </label>
</div>
