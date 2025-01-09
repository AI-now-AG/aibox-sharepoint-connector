<script lang="ts" context="module">
  export interface ColumnData {
    key?: string;
    name?: string;
    class?: string;
  }
</script>

<script lang="ts">
  import { svgIcons } from "$assets/icons";

  export let columnData: ColumnData[] = [];
  export let rowData: any[] = [];

  let sortColumn = "";
  let sortDirection = "asc";

  function sort(col: string) {
    if (sortColumn === col) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortColumn = col;
      sortDirection = "asc";
    }
    if (col == undefined || col == "") {
      return rowData;
    }

    rowData = rowData?.sort((a: any, b: any) => {
      if (sortDirection === "asc") {
        if (typeof a[col] === "string") {
          return a[col].localeCompare(b[col]);
        }
        return a[col] > b[col] ? 1 : -1;
      } else {
        if (typeof a[col] === "string") {
          return b[col].localeCompare(a[col]);
        }
        return a[col] < b[col] ? 1 : -1;
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

<table
  class="border-separate border-spacing-x-0 border-spacing-y-3 min-w-full relative"
  style="font-family:Inter;"
>
  <colgroup>
    {#each columnData as data}
      <col class={data.class ?? "w-auto"} />
    {/each}
  </colgroup>
  <thead>
    <tr class="bg-base-300 rounded-lg">
      {#each columnData as data, colIndex}
        <th
          class={"py-3 px-4 text-left font-normal text-xs" +
            getFirstLastColCssClass(colIndex, columnData.length)}
          on:click={() => sort(data.key ?? "")}
        >
          <span class="inline-flex justify-center">
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
    <slot></slot>
  </tbody>
</table>
