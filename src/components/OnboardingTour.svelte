<script>
  import { onMount } from "svelte";
  import introJs from "intro.js";
  import "intro.js/introjs.css";

  onMount(() => {
    introJs()
      .setOptions({
        steps: [
          {
            intro: "We want to help you get the best experience out of your trial of aibox.\n\n Let’s go on a tour.",
          },
          {
            element: "#onboardingId1",
            intro:
              "Let AI help you with your processes. We already provided some examples for you.\n\nIn the paid version, you can define the structure and the use cases yourself, add knowledge bases and invite your team!",
            position: "right",
          },
          {
            element: "#onboardingId2",
            intro: "You don’t need to provide all the information you need.",
            position: "left",
          },
          { 
            element: "#onboardingId3",
            intro: "Setup your profile",
            position: "right",
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
