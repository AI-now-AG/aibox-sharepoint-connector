<script>
  import { onMount } from "svelte";

  const themes = [
    {
      name: "Light",
      theme: "light",
    },
    {
      name: "Dark",
      theme: "dark",
    },
    {
      name: "Somedia",
      theme: "somedia",
    },
    {
      name: "Weihnachtsmann",
      theme: "weihnachtsmann",
    },
    {
      name: "Luxury",
      theme: "luxury",
    },
    {
      name: "Lemonade",
      theme: "lemonade",
    },
  ];

  let theme = "light";

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

<ul class="dropdown-content menu bg-base-100 rounded-box z-30 w-52 p-2 shadow">
  {#each themes as theme}
    <li>
      <a
        href="#{theme.theme}"
        on:click|preventDefault={() => setTheme(theme.theme)}
      >
        {theme.name}
      </a>
    </li>
  {/each}
</ul>
