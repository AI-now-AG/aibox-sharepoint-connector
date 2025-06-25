<script lang="ts">
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  import { UserRole } from "$types/Users";

  const t = useTranslations();

  let showFilter = $state(false);
  let numberOfFilters = $state(0);

  export function hideDropdownFilter() {
    showFilter = false;
  }

  interface Props {
    rolesParams?: any[];
    statusesParams?: any;
    onfilter: Function;
  }

  let {
    rolesParams = $bindable([]),
    statusesParams = $bindable({}),
    onfilter,
  }: Props = $props();

  // roles
  let isUserChecked: boolean = $state(false);
  let isAdminChecked: boolean = $state(false);

  // statuses
  let isVerifiedChecked: boolean = $state(false);
  let isUnVerifiedChecked: boolean = $state(false);
  let isBlockedChecked: boolean = $state(false);

  $effect(() => {
    if (isUserChecked) {
      if (!rolesParams.includes(UserRole.User)) {
        rolesParams = [...rolesParams, UserRole.User];
      }
    } else {
      if (rolesParams.includes(UserRole.User)) {
        rolesParams = rolesParams.filter((_role) => _role !== UserRole.User);
      }
    }
  });

  $effect(() => {
    if (isAdminChecked) {
      const newRoles = [UserRole.SuperAdmin, UserRole.Admin].filter(
        (role) => !rolesParams.includes(role),
      );
      if (newRoles.length > 0) {
        rolesParams = [...rolesParams, ...newRoles];
      }
    } else {
      if (
        rolesParams.includes(UserRole.Admin) ||
        rolesParams.includes(UserRole.SuperAdmin)
      ) {
        rolesParams = rolesParams.filter(
          (_role) => _role !== UserRole.Admin && _role !== UserRole.SuperAdmin,
        );
      }
    }
  });

  $effect(() => {
    statusesParams = {
      ...(isVerifiedChecked && { isVerified: true }),
      ...(isUnVerifiedChecked && { isUnVerified: true }),
      ...(isBlockedChecked && { isBlocked: true }),
    };
  });

  function calculateNumberOfFitler() {
    let count = 0;
    const uniqueRoles = new Set();

    for (const role of rolesParams) {
      if (role !== UserRole.SuperAdmin) {
        uniqueRoles.add(role);
      }
    }

    count += uniqueRoles.size;
    if (statusesParams.isBlocked) count++;
    if (statusesParams.isVerified) count++;
    if (statusesParams.isUnVerified) count++;

    return count;
  }

  $effect(() => {
    const prevCount = numberOfFilters;

    const anyChecked =
      isUserChecked ||
      isAdminChecked ||
      isVerifiedChecked ||
      isUnVerifiedChecked ||
      isBlockedChecked;

    if (anyChecked) {
      const newFilterCount = calculateNumberOfFitler();
      if (prevCount !== newFilterCount) {
        numberOfFilters = newFilterCount;
      }
    } else if (prevCount !== 0) {
      numberOfFilters = 0;
    }
  });
</script>

<div class="mt-3">
  <div class="dropdown">
    <div
      tabindex="0"
      role="button"
      class="btn font-normal btn-sm btn-outline m-1"
    >
      {@html svgIcons.filter}
      {t("common.filter")}
      {#if numberOfFilters > 0}
        <div class="badge badge-primary badge-md">{numberOfFilters}</div>
      {/if}
      {@html svgIcons.arrowDownFill}
    </div>
    <div
      tabindex="-1"
      class="dropdown-content card card-sm bg-base-100 z-1 w-64 shadow-md"
    >
      <div class="bg-base-100 rounded-xl z-1 p-3 shadow-sm w-52 mt-1 absolute">
        <div class="flex justify-center items-center">
          <span class="flex-1 text-left text-sm font-bold"
            >{t("common.filter")}</span
          >
          <button
            class="btn btn-outline btn-sm"
            onclick={(e) => {
              const elem = document.activeElement;
              if (elem instanceof HTMLElement) {
                elem.blur();
              }
              e.stopPropagation();
              onfilter();
            }}
          >
            {@html svgIcons.filter}</button
          >
        </div>

        <div class="divider"></div>

        <div class="w-full text-sm">
          <div class="w-full text-left">{t("user.role")}</div>
          <div
            class="flex-1 items-center ml-4 p-2 rounded-lg hover:bg-base-300"
          >
            <label class="fieldset-label">
              <input
                type="checkbox"
                bind:checked={isUserChecked}
                class="checkbox checkbox-sm mr-2"
              />
              <span class="font-normal text-base-content">{t("user.user")}</span
              >
            </label>
          </div>
          <div
            class="flex-1 items-center ml-4 p-2 rounded-lg hover:bg-base-300"
          >
            <label class="fieldset-label">
              <input
                type="checkbox"
                bind:checked={isAdminChecked}
                class="checkbox checkbox-sm mr-2"
              />
              <span class="font-normal text-base-content"
                >{t("user.admin")}</span
              >
            </label>
          </div>
        </div>

        <div class="w-full mt-2 text-sm">
          <div class="w-full text-left">{t("user.status")}</div>
          <div
            class="flex-1 items-center ml-4 p-2 rounded-lg hover:bg-base-300"
          >
            <label class="fieldset-label">
              <input
                type="checkbox"
                bind:checked={isBlockedChecked}
                class="checkbox checkbox-sm mr-2"
              />
              <span class="font-normal text-base-content"
                >{t("common.block")}</span
              >
            </label>
          </div>
          <div
            class="flex-1 items-center ml-4 p-2 rounded-lg hover:bg-base-300"
          >
            <label class="fieldset-label">
              <input
                type="checkbox"
                bind:checked={isUnVerifiedChecked}
                class="checkbox checkbox-sm mr-2"
              />
              <span class="font-normal text-base-content"
                >{t("user.un-veriried")}</span
              >
            </label>
          </div>
          <div class="flex items-center ml-4 p-2 rounded-lg hover:bg-base-300">
            <label class="fieldset-label">
              <input
                type="checkbox"
                bind:checked={isVerifiedChecked}
                class="checkbox checkbox-sm mr-2"
              />
              <span class="font-normal text-base-content"
                >{t("user.veriried")}</span
              >
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
