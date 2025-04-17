<script>
  import AudioOption from "./AudioOption.svelte";

  let selectedOption = $state("AUDIO ON FINETUNE"); // Default selected option

  const options = [
    { title: "AUDODYNAMIC", price: "10 CHF / per month" },
    { title: "AUDIO ON FINETUNE", price: "20 CHF / per month" },
    { title: "AUDIO PREMIUM PACKAGE", price: "50 CHF / per month" },
  ];
</script>

{#each options as option}
  <AudioOption
    title={option.title}
    price={option.price}
    checked={selectedOption === option.title}
    on:change={() => (selectedOption = option.title)}
  />
{/each}
