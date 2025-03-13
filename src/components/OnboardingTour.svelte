<script lang="ts">
  import { onMount } from "svelte";
  import { actions } from "astro:actions";
  import { driver } from "driver.js";
  import "driver.js/dist/driver.css";

  import { useTranslations } from "$i18n/utils";
  import { TourType } from "$enums/Users";
  import { isOnboarding, setOnboarding } from "$stores";

  const t = useTranslations();

  interface Props {
    user: any;
  }
  let { user } = $props() as Props;

  let _popover: HTMLElement | null = null;

  async function markAsOnboarded() {
    await actions.user.deactiveTour({
      _id: user.id,
      type: TourType.Onboarding,
    });
  }

  async function checkOnboarding() {
    const { logins_count = 0, tours } = user || {};
    if (logins_count <= 1) {
      if (tours) {
        for (let i = 0; i < tours.length; i++) {
          const tour = tours[i];
          if (tour.type === TourType.Onboarding && tour.active) {
            return true;
          }
        }
      } else {
        return true;
      }
    }
    return false;
  }

  onMount(async () => {
    const shouldOnboarding = await checkOnboarding();
    if (shouldOnboarding) {
      setOnboarding(true);
      const driverObj = driver({
        popoverClass: "driverjs-theme",
        overlayClickBehavior: "nextStep",
        showButtons: ["next", "previous"],
        prevBtnText: t("onboarding.skip"),
        nextBtnText: t("onboarding.next"),
        doneBtnText: t("onboarding.done"),
        onPrevClick: () => {
          driverObj.destroy();
        },
        onDestroyed: () => {
          markAsOnboarded();
          setOnboarding(false);
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
          if (state?.activeStep?.element == "#onboardingId0") {
            (
              document.getElementsByClassName(
                "driver-popover-navigation-btns",
              )[0] as HTMLElement
            ).style.justifyContent = "center";

            const titleElement = document.getElementById(
              "driver-popover-title",
            );
            if (titleElement) {
              titleElement.style.textAlign = "center";
            }

            const descriptionElement = document.getElementById(
              "driver-popover-description",
            );
            if (descriptionElement) {
              descriptionElement.style.textAlign = "center";
            }
          }
        },
        onHighlighted: (_e, _step) => {
          if (
            _step.element == "#onboardingId1" ||
            _step.element == "#onboardingId3"
          ) {
            const computedStyle = _popover
              ? getComputedStyle(_popover)
              : { inset: "0 0 0 0" };
            const _inset = computedStyle.inset.replaceAll("px", "");
            const _insetValues = _inset.split(" ") ?? [0, 0, 0, 0];
            const top = _insetValues[0] ?? 0;
            const right = _insetValues[1] ?? 0;
            if (_popover) {
              _popover.style.inset = `${top}px ${Number(right) - 18}px auto auto`;
            }
          }
        },
      });
      driverObj.drive();
    }
  });
</script>

<style>
  :global(.driver-popover.driverjs-theme .driver-popover-description ul) {
    list-style-type: disc;
  }

  :global(.driver-popover.driverjs-theme .driver-popover-description ul li) {
    margin-left: 2vw;
  }
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
