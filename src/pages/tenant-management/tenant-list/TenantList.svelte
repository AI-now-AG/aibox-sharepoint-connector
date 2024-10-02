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
      border-radius: 0.375rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }

  .dropdown-content.show {
      display: block;
  }

  .relative-dropdown:hover .dropdown-content {
    display: block;
  }
</style>

<div class="container max-w-5xl mx-auto p-6 space-y-4">
  <div class="flex items-center mb-6 space-x-4">
      <div class="relative w-full">
          <input type="text" placeholder="Type here" class="p-3 pl-10 border rounded w-full bg-white" />
          <svg class="absolute left-3 top-3 text-gray-500 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a4 4 0 10-8 0 4 4 0 008 0zM21 21l-6-6"></path>
          </svg>
      </div>
      <label class="flex items-center space-x-2">
          <input type="checkbox" class="border-gray-300 rounded focus:ring-indigo-500" bind:checked={showArchived} />
          <span class="text-gray-600">show archived</span>
      </label>
  </div>

  <div>
      <h2 class="text-lg font-medium mb-4 text-gray-600">All tenants ({tenants.length})</h2>
      <div class="bg-white shadow rounded-md overflow-visible">
          <table class="min-w-full relative">
              <thead>
                  <tr class="bg-gray-50 border-b">
                      <th class="py-3 px-4 text-left font-medium text-gray-600">Display name</th>
                      <th class="py-3 px-4 text-left font-medium text-gray-600">name</th>
                      <th class="py-3 px-4 text-left font-medium text-gray-600">date added</th>
                      <th class="py-3 px-4 text-left font-medium text-gray-600">status</th>
                      <th class="py-3 px-4"></th>
                  </tr>
              </thead>
              <tbody>
                  {#each tenants as tenant, index}
                      <tr class="border-b hover:bg-gray-50">
                          <td class="py-3 px-4">{tenant.displayName}</td>
                          <td class="py-3 px-4 text-gray-600 flex items-center">
                              {tenant.name}
                              <svg class="ml-2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                              </svg>
                          </td>
                          <td class="py-3 px-4 text-gray-600">{tenant.dateAdded}</td>
                          <td class="py-3 px-4">
                              <span class="text-green-600">{tenant.status}</span>
                          </td>
                          <td class="py-3 px-4 text-right relative-dropdown">
                              <button class="text-gray-500 hover:text-gray-700 focus:outline-none">
                                  {@html svgIcons["three-dot"]}
                              </button>
                              <div class="dropdown-content ">
                                  <button class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">archive</button>
                                  <button class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">edit</button>
                              </div>
                          </td>
                      </tr>
                  {/each}
              </tbody>
          </table>
      </div>
  </div>

  <div class="flex justify-center mt-6 space-x-2">
      <button class="px-3 py-1 border rounded">1</button>
      <button class="px-3 py-1 border rounded">2</button>
      <button class="px-3 py-1 border rounded">3</button>
      <button class="px-3 py-1 border rounded">4</button>
  </div>
</div>