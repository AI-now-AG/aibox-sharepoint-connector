<script>
  import { onMount } from "svelte";
  import { driver } from "driver.js";
  import "driver.js/dist/driver.css";

  import { useTranslations } from "$i18n/utils";
  const t = useTranslations();

  let _popover;

  function markAsOnboarded() {
    // TODO: Se onboarding to false
  }

  function isOnboarding() {
    // TODO: Check onboarding
    return false;
  }

  onMount(() => {
    if (isOnboarding()) {
      const driverObj = driver({
        popoverClass: "driverjs-theme",
        overlayClickBehavior: "nextStep",
        showButtons: ["next", "previous"],
        prevBtnText: t("onboarding.skip"),
        nextBtnText: t("onboarding.next"),
        onPrevClick: () => {
          driverObj.destroy();
          markAsOnboarded();
        },
        steps: [
          {
            element: "#onboardingId0",
            popover: {
              showButtons: ["next"],
              popoverClass: "driverjs-theme",
              title: t("onboarding.step-0.title"),
              description: t("onboarding.step-0.description"),
              nextBtnText: t("onboarding.step-0.next-btn-text"),
            },
          },
          {
            element: "#onboardingId1",
            popover: {
              popoverClass: "driverjs-theme",
              title: t("onboarding.step-1.title"),
              description: t("onboarding.step-1.description"),
            },
          },
          {
            element: "#onboardingId2",
            popover: {
              popoverClass: "driverjs-theme",
              title: t("onboarding.step-2.title"),
              description: t("onboarding.step-2.description"),
            },
          },
          {
            element: "#onboardingId3",
            popover: {
              popoverClass: "driverjs-theme",
              title: t("onboarding.step-3.title"),
              description: t("onboarding.step-3.description"),
            },
          },
        ],
        onPopoverRender: (popover, { config, state }) => {
          _popover = document.getElementById("driver-popover-content");
          _popover.style.animation = "animate-fade-in .3s";
          if (state.activeStep.element == "#onboardingId0") {
            document.getElementsByClassName(
              "driver-popover-navigation-btns",
            )[0].style.justifyContent = "center";
            document.getElementById("driver-popover-title").style.textAlign =
              "center";
            document.getElementById(
              "driver-popover-description",
            ).style.textAlign = "center";
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
    }
  });
</script>

<style>
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
</style>
