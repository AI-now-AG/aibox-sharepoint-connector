<script>
  import { onMount } from "svelte";
  import { driver } from "driver.js";
  import "driver.js/dist/driver.css";

  onMount(() => {
    let _popover;
    const driverObj = driver({
      showProgress: false,
      smoothScroll: true,
      popoverClass: "driverjs-theme",
      overlayClickBehavior: "nextStep",
      steps: [
        {
          popover: {
            title: "Welcome to aibox",
            description:
              "We want to help you get the best experience out of your trial of aibox. <br/><br/> Let’s go on a tour.",
            popoverClass: "driverjs-theme",
            disableButtons: ["previous"],
          },
        },
        {
          element: "#onboardingId1",
          popover: {
            title: "Execute your use cases",
            description:
              "Let AI help you with your processes. We already provided some examples for you.<br/><br/>In the paid version, you can define the structure and the use cases yourself, add knowledge bases and invite your team!",
            side: "right",
            popoverClass: "driverjs-theme",
          },
        },
        {
          element: "#onboardingId2",
          popover: {
            title: "Execute your use cases",
            description:
              "You don’t need to provide all the information you need. ",
            popoverClass: "driverjs-theme",
          },
        },
        {
          element: "#onboardingId3",
          popover: {
            title: "Transcribe your audio",
            description: "Transcribe your audio",
            side: "right",
            popoverClass: "driverjs-theme",
          },
        },
      ],
      onPopoverRender: (popover, { config, state }) => {
        _popover = document.getElementById("driver-popover-content");
        _popover.style.animation = "animate-fade-in .3s";
      },
      onHighlighted: (_e, _step) => {
        if (
          _step.element == "#onboardingId1" ||
          _step.element == "#onboardingId3"
        ) {
          const computedStyle = getComputedStyle(_popover) ?? "0 0 0 0";
          const _inset = computedStyle.inset.replaceAll("px", "");
          console.log("INSETS", _inset);
          const _insetValues = _inset.split(" ") ?? [0, 0, 0, 0];
          const top = _insetValues[0] ?? 0;
          const right = _insetValues[1] ?? 0;
          _popover.style.inset = `${top}px ${right - 18}px auto auto`;
        }
      },
    });

    driverObj.drive();
  });
</script>

<div>
  <!-- Your onboarding content which will be highlighted -->
</div>

<style>
  /* Custom styles if needed */
  /* :global(.driver-popover.driverjs-theme) {
    background-color: #fde047;
    color: #000;
  } */

  /* :global(.driver-popover.driverjs-theme .driver-popover-title) {
    font-size: 20px;
  } */

  /* :global(
    .driver-popover.driverjs-theme .driver-popover-title,
    .driver-popover.driverjs-theme .driver-popover-description,
    .driver-popover.driverjs-theme .driver-popover-progress-text
  ) {
    color: #000;
  } */

  /* :global(.driver-popover.driverjs-theme button) {
  } */

  /* :global(.driver-popover.driverjs-theme button:hover) {
  } */

  :global(.driver-popover.driverjs-theme .driver-popover-navigation-btns) {
    justify-content: space-between;
    gap: 3px;
  }

  :global(.driver-popover.driverjs-theme .driver-popover-close-btn) {
    color: #9b9b9b;
  }

  :global(.driver-popover.driverjs-theme .driver-popover-close-btn:hover) {
    color: #000;
  }

  /* :global(
    .driver-popover.driverjs-theme
      .driver-popover-arrow-side-left.driver-popover-arrow
  ) {
    border-left-color: #fde047; 
  } */

  /* :global(
    .driver-popover.driverjs-theme
      .driver-popover-arrow-side-right.driver-popover-arrow
  ) {
    border-right-color: #fde047; 
  } */

  /* :global(
    .driver-popover.driverjs-theme
      .driver-popover-arrow-side-top.driver-popover-arrow
  ) {
    border-top-color: #fde047;
  } */

  /* :global(
    .driver-popover.driverjs-theme
      .driver-popover-arrow-side-bottom.driver-popover-arrow
  ) {
    border-bottom-color: #fde047;
  } */
</style>
