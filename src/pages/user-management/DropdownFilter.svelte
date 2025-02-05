<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { svgIcons } from "$assets/icons";
  import { useTranslations } from "$i18n/utils";
  import { UserRole } from "$enums/Users";

  const dispatch = createEventDispatcher();
  const t = useTranslations();

  let showFilter = $state(false);
  let numberOfFilters = $state(0);

  interface Props {
    rolesParams?: any[];
    statusesParams?: any;
  }

  let { rolesParams = $bindable([]), statusesParams = $bindable({}) }: Props =
    $props();

  // roles
  let isUserChecked: boolean = $state(false);
  let isAdminChecked: boolean = $state(false);

  // statuses
  let isVerifiedChecked: boolean = $state(false);
  let isUnVerifiedChecked: boolean = $state(false);
  let isBlockedChecked: boolean = $state(false);

  $effect(() => {
    if (isUserChecked) {
      rolesParams.push(UserRole.User);
    } else {
      rolesParams = rolesParams.filter((_role) => {
        return _role != UserRole.User;
      });
    }
  });

  $effect(() => {
    if (isAdminChecked) {
      rolesParams.push(UserRole.SuperAdmin);
      rolesParams.push(UserRole.Admin);
    } else {
      rolesParams = rolesParams.filter((_role) => {
        return _role != UserRole.Admin && _role != UserRole.SuperAdmin;
      });
    }
  });

  $effect(() => {
    if (isVerifiedChecked) {
      statusesParams = {
        ...statusesParams,
        isVerified: isVerifiedChecked,
      };
    } else {
      delete statusesParams.isVerified;
    }
  });

  $effect(() => {
    if (isUnVerifiedChecked) {
      statusesParams = {
        ...statusesParams,
        isUnVerified: isUnVerifiedChecked,
      };
    } else {
      delete statusesParams.isUnVerified;
    }
  });

  $effect(() => {
    if (isBlockedChecked) {
      statusesParams = {
        ...statusesParams,
        isBlocked: isBlockedChecked,
      };
    } else {
      delete statusesParams.isBlocked;
    }
  });

  function handleClickFilter() {
    if (showFilter) {
      showFilter = false;
      dispatch("filter");
    } else {
      showFilter = true;
    }
  }

  function calculateNumberOfFitler() {
    numberOfFilters = 0;
    const a: any = {};
    for (let i = 0; i < rolesParams.length; i++) {
      const role = rolesParams[i];
      if (!a[role]) {
        if (role == UserRole.SuperAdmin) {
          continue;
        }
        numberOfFilters += 1;
        a[role] = true;
      }
    }
    if (statusesParams.isBlocked) {
      numberOfFilters += 1;
    }
    if (statusesParams.isVerified) {
      numberOfFilters += 1;
    }
    if (statusesParams.isUnVerified) {
      numberOfFilters += 1;
    }
  }

  $effect(() => {
    if (
      isUserChecked ||
      isAdminChecked ||
      isVerifiedChecked ||
      isUnVerifiedChecked ||
      isBlockedChecked
    ) {
      calculateNumberOfFitler();
    } else {
      numberOfFilters = 0;
    }
  });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="mt-3">
  <div
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
  </div>

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
            dispatch("filter");
          }}
        >
          {@html svgIcons.filter}</button
        >
      </div>

      <div class="w-full h-[1px] bg-slate-200 mt-2 mb-2"></div>

      <div class="w-full text-sm">
        <div class="w-full text-left">{t("user.role")}</div>
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <label
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
        </label>

        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <label
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
        </label>
      </div>

      <div class="w-full mt-4">
        <div class="w-full text-left">{t("user.status")}</div>
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <label
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
        </label>

        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <label
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
        </label>

        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <label
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
        </label>
      </div>
    </div>
  {/if}
</div>
