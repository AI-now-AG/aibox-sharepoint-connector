<script>
    let tenants = [
      { displayName: 'Somedia', name: 'Some', dateAdded: '17.02.2024', status: 'active' },
      { displayName: 'AI now', name: 'ai-now', dateAdded: '29.09.2024', status: 'active' },
      { displayName: 'Demo', name: 'demo', dateAdded: '01.05.2024', status: 'active' },
      { displayName: 'TwelveCapital', name: 'twelve-cap', dateAdded: '09.12.2023', status: 'active' },
      { displayName: 'Südkurier Zeitung', name: 'suedkurier', dateAdded: '17.02.2024', status: 'active' },
      { displayName: 'Company xyz', name: 'company-x', dateAdded: '02.08.2024', status: 'active' },
    ];
  </script>
  
  <div class="container max-w-5xl mx-auto p-6 space-y-4">
   
    <div class="flex items-center mb-6">
      <div class="relative w-full">
        <input type="text" placeholder="Type here" class="p-3 pl-10 border rounded w-full bg-white" />
        <svg class="absolute left-3 top-3 text-gray-500 w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.9 14.32a8 8 0 111.414-1.414l4.708 4.708a1 1 0 01-1.414 1.414l-4.708-4.708zM14 8a6 6 0 11-12 0 6 6 0 0112 0z" clip-rule="evenodd"></path></svg>
      </div>
      <label class="ml-4 flex items-center">
        <input type="checkbox" class="mr-2" /> show archived
      </label>
    </div>

    <div>
      <h2 class="text-lg font-medium mb-3">All tenants (45)</h2>
      <div class="bg-white shadow rounded-md overflow-hidden">
        <table class="min-w-full">
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
            {#each tenants as tenant}
              <tr class="border-b hover:bg-gray-50">
                <td class="py-3 px-4">{tenant.displayName}</td>
                <td class="py-3 px-4 text-gray-600 flex items-center">
                  {tenant.name}
                  <!-- Add any icons you need here -->
                </td>
                <td class="py-3 px-4 text-gray-600">{tenant.dateAdded}</td>
                <td class="py-3 px-4">
                  <span class="text-green-600">{tenant.status}</span>
                </td>
                <td class="py-3 px-4 text-right relative">
                  <button class="text-gray-500 hover:text-gray-700 focus:outline-none">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M6 10a2 2 0 114 0 2 2 0 01-4 0zM10 4a2 2 0 100-4 2 2 0 000 4zm0 12a2 2 0 100-4 2 2 0 000 4z"></path></svg>
                  </button>
                  <div class="absolute right-0 mt-2 w-24 bg-white border rounded shadow-lg py-1 hidden group-hover:block">
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
    
    <div class="flex justify-center mt-6">
      <button class="px-3 py-1 mx-1 border rounded">1</button>
      <button class="px-3 py-1 mx-1 border rounded">2</button>
      <button class="px-3 py-1 mx-1 border rounded">3</button>
      <button class="px-3 py-1 mx-1 border rounded">4</button>
    </div>
  </div>