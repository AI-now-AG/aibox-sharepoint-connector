<script>
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();
  let selectedLang = "en";

  function switchLanguage() {
    dispatch("langChange", { lang: selectedLang });
  }
</script>

<div class="form-control">
  <label class="label" for="language-select">
    <span class="label-text">Select Language</span>
  </label>
  <select
    id="language-select"
    bind:value={selectedLang}
    on:change={switchLanguage}
    class="select select-bordered w-full max-w-xs"
  >
    <option value="en">English</option>
    <option value="de">German</option>
  </select>
</div>
