<script>
  import { svgIcons } from "$assets/icons";

  let tenants = [
      { displayName: 'Somedia', name: 'Some', dateAdded: '17.02.2024', status: 'active' },
      { displayName: 'AI now', name: 'ai-now', dateAdded: '29.09.2024', status: 'active' },
      { displayName: 'Demo', name: 'demo', dateAdded: '01.05.2024', status: 'active' },
      { displayName: 'TwelveCapital', name: 'twelve-cap', dateAdded: '09.12.2023', status: 'active' },
      { displayName: 'Südkurier Zeitung', name: 'suedkurier', dateAdded: '17.02.2024', status: 'active' },
      { displayName: 'Company xyz', name: 'company-x', dateAdded: '02.08.2024', status: 'active' },
  ];

  let showArchived = false;

  const gotoDetail = (tenant) => {
    alert(JSON.stringify(tenant))
  }

  const copyName = (name) => {
    alert(name)
  }

  
  const archiveTenant = (tenant) => {
    alert(JSON.stringify(tenant))
  }
</script>

<style>
  .relative-dropdown {
      position: relative;
  }

  .dropdown-content {
      display: none;
      z-index: 1000;
      position: absolute;
      right: 10px;
      top: 40px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 1rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }

  .relative-dropdown:hover .dropdown-content {
    display: block;
  }

</style>

<div class="container max-w-5xl mx-auto p-6" style="font-family: Inter;">
  <div class="items-center mb-10">
      <div class="relative w-full">
        <label class="input input-bordered flex items-center gap-2">
          {@html svgIcons.search}
          <input type="text" class="grow text-sm" placeholder="Type here" />
        </label>
      </div>
      <div class="mt-4">
        <label class="flex items-center space-x-2">
          <input type="checkbox" class="checkbox border-gray-300 rounded focus:ring-indigo-500 w-5 h-5" bind:checked={showArchived} />
          <span class="label-text">show archived</span>
        </label>
      </div>
      
  </div>

  <div>
      <h2 class="text-lg font-normal mb-4">All tenants ({tenants.length})</h2>

          <table class="min-w-full relative" style="font-family:Inter;">
          
              <thead>
                <tr class="bg-gray-200 rounded">
                    <th class="py-3 px-4 text-left font-normal text-xs">Display name</th>
                    <th class="py-3 px-4 text-left font-normal text-xs">name</th>
                    <th class="py-3 px-4 text-left font-normal text-xs">date added</th>
                    <th class="py-3 px-4 text-left font-normal text-xs">status</th>
                    <th class="py-3 px-4"></th>
                </tr>
                <tr class="header-spacing"></tr>
            </thead>
              <tbody style="margin-top: 20px;">
                  {#each tenants as tenant}
                      <tr class="bg-white hover:bg-gray-200 text-sm">
                          <td class="py-3 px-4 text-sm font-medium">
                            <button class="underline underline-offset-2" on:click={()=>gotoDetail(tenant)}>{tenant.displayName}</button>
                          </td>
                          <td class="py-3 px-4 text-gray-600 flex items-center text-xs font-normal">
                              {tenant.name}
                              <button class="mx-1" on:click={()=>copyName(tenant.name)}>{@html svgIcons.copy}</button>
                          </td>
                          <td class="py-3 px-4 text-sm font-medium">{tenant.dateAdded}</td>
                          <td class="py-3 px-4">
                              <span class="text-emerald-600 text-sm font-medium">{tenant.status}</span>
                          </td>
                          <td class="py-3 px-4 text-right relative-dropdown">
                              <button class="focus:outline-none">
                                  {@html svgIcons["three-dot"]}
                              </button>
                              <div class="dropdown-content py-2">
                                  <button class="flex block w-full text-left px-4 py-1 text-sm hover:underline">
                                    {@html svgIcons.archive} 
                                    <span class="ml-1">archive</span>
                                  </button>
                                  <button class="flex block w-full text-left px-4 py-1 text-sm hover:underline">
                                    {@html svgIcons.edit}
                                    <span class="ml-1">edit</span>
                                  </button>
                              </div>
                          </td>
                      </tr>
                  {/each}
              </tbody>
          </table>
     
  </div>

  <div class="flex justify-center join mt-6">
    <button class="join-item btn btn-sm">1</button>
    <button class="join-item btn btn-sm btn-active">2</button>
    <button class="join-item btn btn-sm">3</button>
    <button class="join-item btn btn-sm">4</button>
  </div>

</div>