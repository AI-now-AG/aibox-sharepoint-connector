<script>
  import AudioOption from "./AudioOption.svelte";

  let selectedOption = $state("AUDIO ON FINETUNE"); // Default selected option

  const options = [
    { title: "AUDODYNAMIC", price: "10 CHF / per month" },
    { title: "AUDIO ON FINETUNE", price: "20 CHF / per month" },
    { title: "AUDIO PREMIUM PACKAGE", price: "50 CHF / per month" },
  ];
</script>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
  {#each options as option}
    <div>
      <AudioOption
        title={option.title}
        price={option.price}
        checked={selectedOption === option.title}
        on:change={() => (selectedOption = option.title)}
      />
    </div>
  {/each}
</div>
