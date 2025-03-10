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
      showButtons: ["next", "previous"],
      nextBtnText: "Next →",
      prevBtnText: "Skip",
      onPrevClick: () => {
        driverObj.destroy();
      },
      steps: [
        {
          element: "#onboardingId0",
          popover: {
            title: "Welcome to aibox",
            description:
              "We want to help you get the best experience out of your trial of aibox. <br/><br/> Let’s go on a tour.",
            popoverClass: "driverjs-theme",
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
        if (state.activeStep.element == "#onboardingId0") {
          const disabledPreButton = document.getElementsByClassName(
            "driver-popover-prev-btn driver-popover-btn-disabled",
          )[0];
          disabledPreButton.style.visibility = "hidden";
        }
      },
      onHighlighted: (_e, _step) => {
        if (
          _step.element == "#onboardingId1" ||
          _step.element == "#onboardingId3"
        ) {
          const computedStyle = getComputedStyle(_popover) ?? "0 0 0 0";
          const _inset = computedStyle.inset.replaceAll("px", "");
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

<style>
  /* :global(.driver-popover.driverjs-theme) {
    background-color: #fde047;
    color: #000;
  } */

  :global(.driver-popover.driverjs-theme .driver-popover-title) {
    color: #491eff;
    margin-bottom: 2vh;
  }

  :global(.driver-popover.driverjs-theme .driver-popover-description) {
    margin-bottom: 2vh;
  }

  :global(.driver-popover.driverjs-theme .driver-popover-navigation-btns) {
    justify-content: space-between;
  }

  :global(.driver-popover.driverjs-theme button) {
    border-radius: 8px;
    padding: 16px;
    padding-top: 6px;
    padding-bottom: 6px;
    border: none;
    font-weight: 700;
  }

  /* :global(.driver-popover.driverjs-theme button:hover) {
  } */

  :global(.driver-popover.driverjs-theme .driver-popover-next-btn) {
    background-color: #4338ca;
    color: white;
    text-shadow: none;
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
