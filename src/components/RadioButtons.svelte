<script lang="ts">
  interface RadioOption {
    value: string;
    label: string;
  }
  interface Props {
    options?: RadioOption[];
    value?: string;
  }

  let { value = "medium", options = [] }: Props = $props();
</script>

<div class="w-full">
  <div class="mb-2 text-base-content font-medium text-sm">Reasoning Effort</div>
  <div class="flex flex-row space-x-4">
    <div class="form-control">
      <label class="label cursor-pointer">
        <input
          type="radio"
          name="priority"
          class="radio"
          value="low"
          bind:group={value}
        />
        <span class="label-text">low</span>
      </label>
    </div>

    <div class="form-control">
      <label class="label cursor-pointer">
        <input
          type="radio"
          name="priority"
          class="radio"
          value="medium"
          bind:group={value}
        />
        <span class="label-text">medium</span>
      </label>
    </div>

    <div class="form-control">
      <label class="label cursor-pointer">
        <input
          type="radio"
          name="priority"
          class="radio"
          value="high"
          bind:group={value}
        />
        <span class="label-text">high</span>
      </label>
    </div>
  </div>
</div>
