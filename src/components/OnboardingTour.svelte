<script>
  import { onMount } from "svelte";
  import introJs from "intro.js";
  import "intro.js/introjs.css";

  onMount(() => {
    introJs()
      .setOptions({
        steps: [
          {
            intro: "Welcome to AIBOX APP! Let's take a tour.",
          },
          {
            element: "#onboardingId1",
            intro: "Select a prompt menu item",
          },
          {
            element: "#onboardingId2",
            intro: "Enter your chat",
          },
          {
            element: "#onboardingId3",
            intro: "Setup your profile",
          },
          {
            intro: "Enjoy using AIBOX.",
          },
        ],
      })
      .start();
  });
</script>

<div>
  <!-- Your onboarding content which will be highlighted -->
</div>

<style>
  /* Custom styles if needed */
</style>
