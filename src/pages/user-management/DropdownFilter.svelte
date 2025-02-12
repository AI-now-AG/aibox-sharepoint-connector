<script lang="ts">
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  import { UserRole } from "$enums/Users";

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

  function handleClickFilter() {
    if (showFilter) {
      showFilter = false;
      onfilter();
    } else {
      showFilter = true;
    }
  }

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
  <button
    class="btn btn-sm btn-active font-normal bg-base-200"
    onclick={(e) => {
      e.stopPropagation();
      handleClickFilter();
    }}
  >
    {@html svgIcons.filter}
    {t("common.filter")}
    {#if numberOfFilters > 0}
      <div class="badge badge-primary badge-md">{numberOfFilters}</div>
    {/if}
    {@html svgIcons.arrowDownFill}
  </button>

  {#if showFilter}
    <div
      class="menu bg-base-100 rounded-xl z-[1] p-3 shadow w-52 mt-1 absolute"
    >
      <div class="flex justify-center items-center">
        <span class="flex-1 text-left text-sm font-bold"
          >{t("common.filter")}</span
        >
        <button
          class="btn btn-default btn-sm"
          onclick={(e) => {
            e.stopPropagation();
            showFilter = false;
            onfilter();
          }}
        >
          {@html svgIcons.filter}</button
        >
      </div>

      <div class="w-full h-[1px] bg-slate-200 mt-2 mb-2"></div>

      <div class="w-full text-sm">
        <div class="w-full text-left">{t("user.role")}</div>
        <button
          onclick={(e) => {
            e.stopPropagation();
            null;
          }}
          class="flex items-center ml-4 p-2 rounded-lg hover:bg-gray-200"
        >
          <input
            type="checkbox"
            class="checkbox checkbox-sm checkbox-neutral mr-2"
            bind:checked={isUserChecked}
          />
          <span class="font-normal">{t("user.user")}</span>
        </button>
        <button
          onclick={(e) => {
            e.stopPropagation();
            null;
          }}
          class="flex items-center ml-4 p-2 rounded-lg hover:bg-gray-200"
        >
          <input
            type="checkbox"
            class="checkbox checkbox-sm checkbox-neutral mr-2"
            bind:checked={isAdminChecked}
          />
          <span class="font-normal">{t("user.admin")}</span>
        </button>
      </div>

      <div class="w-full mt-4">
        <div class="w-full text-left">{t("user.status")}</div>
        <button
          onclick={(e) => {
            e.stopPropagation();
            null;
          }}
          class="flex items-center ml-4 p-2 rounded-lg hover:bg-gray-200"
        >
          <input
            type="checkbox"
            class="checkbox checkbox-sm checkbox-neutral mr-2"
            bind:checked={isBlockedChecked}
          />
          <span class="font-normal">{t("common.block")}</span>
        </button>
        <button
          onclick={(e) => {
            e.stopPropagation();
            null;
          }}
          class="flex items-center ml-4 p-2 rounded-lg hover:bg-gray-200"
        >
          <input
            type="checkbox"
            class="checkbox checkbox-sm checkbox-neutral mr-2"
            bind:checked={isUnVerifiedChecked}
          />
          <span class="font-normal">{t("user.un-veriried")}</span>
        </button>
        <button
          onclick={(e) => {
            e.stopPropagation();
            null;
          }}
          class="flex items-center ml-4 p-2 rounded-lg hover:bg-gray-200"
        >
          <input
            type="checkbox"
            class="checkbox checkbox-sm checkbox-neutral mr-2"
            bind:checked={isVerifiedChecked}
          />
          <span class="font-normal">{t("user.veriried")}</span>
        </button>
      </div>
    </div>
  {/if}
</div>
