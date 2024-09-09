<script>
  import { onMount } from "svelte";

  let theme = "light";
  export let message;
  export let title;

  const setTheme = (newTheme) => {
    theme = newTheme;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  };

  onMount(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      theme = savedTheme;
      document.documentElement.setAttribute("data-theme", theme);
    }
  });
</script>

<li>
  <a on:click={() => setTheme(message)}>
    {title}
  </a>
</li>
