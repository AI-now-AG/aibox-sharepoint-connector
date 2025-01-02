<script lang="ts" context="module">
  export interface ColumnData {
    colId?: string;
    colName?: string;
    colCssClases?: string;
  }
</script>

<script lang="ts">
  export let colDatas: ColumnData[] = [];
  export let rowDatas: any[] = [];

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
      return rowDatas;
    }

    rowDatas = rowDatas?.sort((a: any, b: any) => {
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
    {#each colDatas as data}
      <col class={data.colCssClases ?? "w-auto"} />
    {/each}
  </colgroup>
  <thead>
    <tr class="bg-base-300 rounded-lg">
      {#each colDatas as data, colIndex}
        <th
          class={"py-3 px-4 text-left font-normal text-xs" +
            getFirstLastColCssClass(colIndex, colDatas.length)}
          on:click={() => sort(data.colId ?? "")}
        >
          {data.colName}
          <span class="ml-2">
            {data.colId
              ? sortColumn === data.colId
                ? sortDirection === "asc"
                  ? "▲"
                  : "▼"
                : "☰"
              : ""}
          </span>
        </th>
      {/each}
    </tr>
  </thead>
  <tbody>
    <slot></slot>
  </tbody>
</table>
