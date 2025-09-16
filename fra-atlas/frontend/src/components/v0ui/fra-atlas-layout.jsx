"use client"
import { MapPin, Upload, Database, Search, Filter, Plus, LogOut } from "lucide-react"

// Placeholder components - replace with your actual components
const MapComponent = () => (
  <div className="w-full h-full bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
    <div className="text-center space-y-2">
      <MapPin size={32} className="mx-auto text-gray-400" />
      <p className="text-gray-500 text-sm">Your Leaflet Map Component Goes Here</p>
    </div>
  </div>
)

const ToolbarControls = () => (
  <div className="flex flex-wrap items-center gap-4 text-sm">
    {/* Map layer toggles */}
    <div className="flex items-center gap-4">
      <label className="flex items-center gap-2">
        <input type="checkbox" defaultChecked className="rounded" />
        <span>Show States</span>
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" defaultChecked className="rounded" />
        <span>Show Districts</span>
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" defaultChecked className="rounded" />
        <span>Show Villages</span>
      </label>
    </div>

    {/* Status filters */}
    <div className="flex items-center gap-2">
      <button className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Granted</button>
      <button className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">Pending</button>
    </div>

    {/* Level selector */}
    <div className="flex items-center gap-2 text-gray-600">
      <span>Level: state → Orissa</span>
    </div>

    {/* Action buttons */}
    <div className="flex items-center gap-2 ml-auto">
      <button className="px-3 py-1 text-gray-600 hover:text-gray-800">Back to States</button>
      <button className="px-3 py-1 text-gray-600 hover:text-gray-800">Reset View</button>
    </div>
  </div>
)

const UploadForm = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-4">
      <input
        type="file"
        className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-gray-100 file:text-gray-700"
        placeholder="Choose File"
      />
      <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Upload & Create Claim</button>
    </div>
  </div>
)

const ClaimsTable = () => (
  <div className="space-y-4">
    {/* Table controls */}
    <div className="flex items-center gap-4">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search village / holder / district"
          className="pl-10 pr-4 py-2 border border-gray-300 rounded w-64"
        />
      </div>
      <select className="px-3 py-2 border border-gray-300 rounded">
        <option>All</option>
        <option>Granted</option>
        <option>Pending</option>
      </select>
      <select className="px-3 py-2 border border-gray-300 rounded">
        <option>Newest</option>
        <option>Oldest</option>
      </select>
    </div>

    {/* Table actions */}
    <div className="flex items-center gap-4 text-sm text-gray-600">
      <span>Showing 15 of 15</span>
      <div className="flex items-center gap-2 ml-auto">
        <button className="hover:text-gray-800">Zoom to selected</button>
        <button className="hover:text-gray-800">Select visible</button>
        <button className="hover:text-gray-800">Clear selection</button>
        <button className="hover:text-gray-800">Delete selected (0)</button>
      </div>
    </div>

    {/* Sample table data */}
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-3 text-sm font-medium">
              <input type="checkbox" className="rounded" />
            </th>
            <th className="text-left p-3 text-sm font-medium">ID</th>
            <th className="text-left p-3 text-sm font-medium">Village</th>
            <th className="text-left p-3 text-sm font-medium">Holder</th>
            <th className="text-left p-3 text-sm font-medium">Status</th>
            <th className="text-left p-3 text-sm font-medium">Date</th>
            <th className="text-left p-3 text-sm font-medium">Type</th>
            <th className="text-left p-3 text-sm font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {[
            {
              id: 31,
              village: "Sirpur",
              district: "Adilabad",
              holder: "Meena Bai",
              status: "Granted",
              date: "2025-08-22",
              type: "manual",
            },
            {
              id: 27,
              village: "Daringbadi",
              district: "Kandhamal",
              holder: "Sunil Pradhan",
              status: "Granted",
              date: "2025-08-20",
              type: "manual",
            },
            {
              id: 33,
              village: "Sadar Bazar",
              district: "West",
              holder: "Lila Roy",
              status: "Granted",
              date: "2025-08-18",
              type: "manual",
            },
            {
              id: 29,
              village: "Narsampet",
              district: "Warangal",
              holder: "Geeta Devi",
              status: "Granted",
              date: "2025-08-15",
              type: "manual",
            },
          ].map((claim) => (
            <tr key={claim.id} className="border-t border-gray-200 hover:bg-gray-50">
              <td className="p-3">
                <input type="checkbox" className="rounded" />
              </td>
              <td className="p-3 text-sm">{claim.id}</td>
              <td className="p-3">
                <div className="text-sm font-medium">{claim.village}</div>
                <div className="text-xs text-gray-500">{claim.district}</div>
              </td>
              <td className="p-3 text-sm">{claim.holder}</td>
              <td className="p-3">
                <div className="space-y-1">
                  <span className="inline-block px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                    {claim.status}
                  </span>
                  <span className="inline-block px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                    Has coords
                  </span>
                </div>
              </td>
              <td className="p-3 text-sm">{claim.date}</td>
              <td className="p-3 text-sm text-gray-500">{claim.type}</td>
              <td className="p-3">
                <div className="flex gap-1">
                  <button className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200">
                    Edit
                  </button>
                  <button className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200">
                    Copy coords
                  </button>
                  <button className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200">Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

const FRAAtlasLayout = () => {
  // const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <MapPin size={24} className="text-gray-700" />
              <h1 className="text-xl font-semibold text-gray-900">FRA Atlas</h1>
            </div>

            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2">
                <Plus size={16} />
                New FRA Claim
              </button>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
                Reset View
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700" title="Sign Out">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Main content */}
        <main className="flex-1">
          <div className="p-6 space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <ToolbarControls />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Map section */}
              <div className="xl:col-span-2">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin size={18} />
                    Interactive Map
                  </h2>
                  <div className="h-96 lg:h-[500px]">
                    <MapComponent />
                  </div>
                </div>
              </div>

              {/* Right sidebar */}
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Upload size={18} />
                    Upload FRA Document
                  </h3>
                  <UploadForm />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Database size={18} />
                  Claims Database
                </h2>
                <button className="px-3 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 flex items-center gap-2">
                  <Filter size={14} />
                  Filters
                </button>
              </div>
              <ClaimsTable />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default FRAAtlasLayout

/*
Usage Instructions:

1. Replace the placeholder components with your actual components:
   - MapComponent: Your Leaflet map component
   - ToolbarControls: Your existing map controls (Show States, Districts, etc.)
   - UploadForm: Your file upload form
   - ClaimsTable: Your existing claims data table

2. Example integration:
   
   import YourMapComponent from './your-map-component'
   import YourToolbarControls from './your-toolbar-controls'
   import YourUploadForm from './your-upload-form'
   import YourClaimsTable from './your-claims-table'

   // Then replace the placeholder components:
   const MapComponent = YourMapComponent
   const ToolbarControls = YourToolbarControls
   const UploadForm = YourUploadForm
   const ClaimsTable = YourClaimsTable

3. The layout is fully responsive and uses semantic design tokens from globals.css
4. All existing functionality should work unchanged - this is just a visual wrapper
*/
