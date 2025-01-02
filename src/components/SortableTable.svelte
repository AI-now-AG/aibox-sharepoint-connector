<script lang="ts">
  export let colCssClasses: string[] = [];
  export let colIds: string[] = [];
  export let colNames: string[] = [];
  export let datas: any[] = [];

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
      return datas;
    }

    datas = datas.sort((a: any, b: any) => {
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
    {#each colCssClasses as cssClasses, colIndex}
      <col class={cssClasses ?? ""} />
    {/each}
  </colgroup>
  <thead>
    <tr class="bg-base-300 rounded-lg">
      {#each colNames as colName, colIndex}
        <th
          class={"py-3 px-4 text-left font-normal text-xs" +
            getFirstLastColCssClass(colIndex, colCssClasses.length)}
          on:click={() => sort(colIds[colIndex] ?? "")}
        >
          {colName}
          <span class="ml-2">
            {colIds[colIndex]
              ? sortColumn === colIds[colIndex]
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
    <!-- {#each datas as item}
      <tr class="h-16 bg-base-100 hover:bg-base-300 text-sm rounded-lg">
        <slot {item}></slot>
      </tr>
    {/each} -->
  </tbody>
</table>
