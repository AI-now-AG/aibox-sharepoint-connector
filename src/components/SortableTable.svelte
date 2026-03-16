<script lang="ts" module>
  export interface ColumnData {
    key?: string;
    name?: string;
    class?: string;
  }
</script>

<script lang="ts">
  import { svgIcons } from "$assets/icons";

  interface Props {
    columnData?: ColumnData[];
    rowData?: any[];
    children?: import("svelte").Snippet;
  }

  let { columnData = [], rowData = $bindable([]), children }: Props = $props();

  let sortColumn = $state("");
  let sortDirection = $state("asc");

  function sort(col: string) {
    if (sortColumn === col) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortColumn = col;
      sortDirection = "asc";
    }
    if (!col) {
      return rowData;
    }

    rowData = [...rowData]?.sort((a: any, b: any) => {
      const aValue = a[col] ?? "";
      const bValue = b[col] ?? "";

      if (sortDirection === "asc") {
        if (typeof aValue === "string" && typeof bValue === "string") {
          return aValue.localeCompare(bValue);
        }
        return aValue > bValue ? 1 : -1;
      } else {
        if (typeof aValue === "string" && typeof bValue === "string") {
          return bValue.localeCompare(aValue);
        }
        return aValue < bValue ? 1 : -1;
      }
    });
  }

  function getFirstLastColCssClass(colIndex: number, numberOfColumn: number) {
    if (colIndex == 0) {
      return " rounded-l-lg";
    }
    if (colIndex == numberOfColumn - 1) {
      return " rounded-r-lg";
    }
    return "";
  }
</script>

<div class="overflow-x-auto relative">
  <table
    class="table table-fixed border-separate border-spacing-x-0 border-spacing-y-3 min-w-full relative"
    style="font-family:Inter;"
  >
    <colgroup>
      {#each columnData as data}
        <col class={data.class ?? "w-auto min-w-[150]"} />
      {/each}
    </colgroup>
    <thead>
      <tr class="bg-base-300 rounded-lg">
        {#each columnData as data, colIndex}
          <th
            class={"py-3 px-4 text-left font-normal text-xs" +
              getFirstLastColCssClass(colIndex, columnData.length)}
            onclick={() => sort(data.key ?? "")}
          >
            <span class="inline-flex justify-center items-center">
              {data.name}
              <span class="ml-1">
                {@html data.key
                  ? sortColumn === data.key
                    ? sortDirection === "asc"
                      ? svgIcons.arrowUp
                      : svgIcons.arrowDown
                    : svgIcons.arrowUpDown
                  : ""}
              </span>
            </span>
          </th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {@render children?.()}
    </tbody>
  </table>
</div>
