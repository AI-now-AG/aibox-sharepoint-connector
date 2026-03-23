<script lang="ts">
  import { onMount } from "svelte";
  import { actions } from "astro:actions";
  import { driver, type DriveStep } from "driver.js";
  import "driver.js/dist/driver.css";

  import { useTranslations } from "$i18n/utils";
  import { TourType, UserRole } from "$types/Users";
  import { isOnboarding } from "$stores";

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

  function isSupperUserOrAdmin() {
    const userRoles = user?.roles || [];
    console.log("User roles:", userRoles);
    return [UserRole.SuperUser, UserRole.Admin].some((role) =>
      userRoles.includes(role.toString().trim()),
    );
  }

  async function checkOnboarding() {
    const { logins_count = 0, tours } = user || {};
    if (logins_count <= 1) {
      if (tours) {
        let hasOnboardingTour = false;
        for (let i = 0; i < tours.length; i++) {
          const tour = tours[i];
          if (tour.type === TourType.Onboarding) {
            hasOnboardingTour = true;
            return tour.active;
          }
        }
        if (!hasOnboardingTour) {
          return true;
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
      $isOnboarding = true;

      const _steps: DriveStep[] = [
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
        {
          element: "#onboardingId4",
          popover: {
            popoverClass: "driverjs-theme",
            title: t("onboarding.step-4.title"),
            description: t("onboarding.step-4.description"),
          },
        },
      ];

      if (isSupperUserOrAdmin()) {
        _steps.push({
          element: "#onboardingId5",
          popover: {
            popoverClass: "driverjs-theme",
            title: t("onboarding.step-5.title"),
            description: t("onboarding.step-5.description"),
          },
        });
      }

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
          $isOnboarding = false;
        },
        steps: _steps,
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
            _step.element == "#onboardingId3" ||
            _step.element == "#onboardingId4" ||
            _step.element == "#onboardingId5"
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
    margin-left: 1.25rem;
  }
  :global(.driver-popover.driverjs-theme .driver-popover-title) {
    color: var(--color-primary);
    margin-bottom: 0.75rem;
  }

  :global(.driver-popover.driverjs-theme .driver-popover-description) {
    margin-bottom: 0.75rem;
  }

  :global(.driver-popover.driverjs-theme .driver-popover-navigation-btns) {
    justify-content: space-between;
  }

  :global(.driver-popover.driverjs-theme button) {
    border-radius: 0.5rem;
    padding: 1rem;
    padding-top: 0.375rem;
    padding-bottom: 0.375rem;
    border: none;
    font-weight: 700;
  }

  :global(.driver-popover.driverjs-theme .driver-popover-next-btn) {
    background-color: var(--color-primary);
    color: white;
    text-shadow: none;
  }

  :global(.driver-popover.driverjs-theme .driver-popover-close-btn) {
    color: var(--color-base-content);
    opacity: 0.4;
  }

  :global(.driver-popover.driverjs-theme .driver-popover-close-btn:hover) {
    color: var(--color-base-content);
    opacity: 1;
  }
</style>
