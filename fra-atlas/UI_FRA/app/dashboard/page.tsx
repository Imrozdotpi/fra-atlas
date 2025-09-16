"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Download,
  Users,
  MapPin,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  PieChart,
} from "lucide-react"
import { clearToken } from "@/lib/api"

// <-- language hook
import { useLanguage } from "@/components/LanguageProvider"

// Mock data as specified
const areaData = {
  total_villages: 14,
  cumulative_area: 18560,
  area_registered: 12640,
  farmers_registered: 389,
  today_registered_area: 240,
  mismatch_area: 2,
  verified_mismatch_area: 1,
  pending_mismatch_area: 1,
  special_verification_area: 580,
  special_verification_verified_area: 210,
  special_verification_pending_area: 370,
}

const grievanceData = {
  total_grievances: 72,
  solved_grievances: 58,
  pending_grievances: 10,
  pending_grievances_sdm: 4,
}

const panchayatData = [
  { district: "Shivpuri", total_villages: 52, claims_submitted: 180, claims_verified: 120, claims_pending: 60 },
  { district: "Chhindwara", total_villages: 47, claims_submitted: 210, claims_verified: 150, claims_pending: 60 },
  { district: "Koraput", total_villages: 39, claims_submitted: 165, claims_verified: 110, claims_pending: 55 },
  { district: "Kandhamal", total_villages: 41, claims_submitted: 140, claims_verified: 95, claims_pending: 45 },
  { district: "Warangal", total_villages: 44, claims_submitted: 175, claims_verified: 130, claims_pending: 45 },
  { district: "Adilabad", total_villages: 38, claims_submitted: 160, claims_verified: 115, claims_pending: 45 },
  { district: "West Tripura", total_villages: 29, claims_submitted: 95, claims_verified: 70, claims_pending: 25 },
  { district: "TOTAL", total_villages: 290, claims_submitted: 1125, claims_verified: 790, claims_pending: 335 },
]

// Mock grievance table data
const mockGrievances = [
  {
    id: "GRV001",
    raisedBy: "राम कुमार",
    type: "Land Dispute",
    status: "Solved",
    officer: "Officer A",
    date: "2024-01-15",
    priority: "High",
  },
  {
    id: "GRV002",
    raisedBy: "सीता देवी",
    type: "Documentation",
    status: "Pending",
    officer: "Officer B",
    date: "2024-01-20",
    priority: "Medium",
  },
  {
    id: "GRV003",
    raisedBy: "मोहन लाल",
    type: "Survey Issue",
    status: "Pending with SDM",
    officer: "SDM Office",
    date: "2024-01-25",
    priority: "High",
  },
  {
    id: "GRV004",
    raisedBy: "गीता शर्मा",
    type: "Verification",
    status: "Solved",
    officer: "Officer C",
    date: "2024-02-01",
    priority: "Low",
  },
  {
    id: "GRV005",
    raisedBy: "अजय सिंह",
    type: "Land Rights",
    status: "Pending",
    officer: "Officer A",
    date: "2024-02-05",
    priority: "Medium",
  },
]

export default function DashboardPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("area-details")
  const [selectedGrievance, setSelectedGrievance] = useState<any>(null)
  const [selectedDistrict, setSelectedDistrict] = useState<any>(null)
  const [showNotifications, setShowNotifications] = useState(false)

  // language
  const { t,lang } = useLanguage()

  const handleExport = (type: string) => {
    // Mock export functionality
    console.log(`Exporting ${type} data...`)
  }

  return (
    // ProtectedRoute removed — returning dashboard directly
    <div
      className="min-h-screen"
      style={{
        background: `
          linear-gradient(135deg, rgba(44, 110, 73, 0.05) 0%, rgba(15, 42, 68, 0.05) 100%),
          url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23e5e7eb' fillOpacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")         
        `,
      }}
    >
      {/* Main Content: add id so HeaderClient's "SKIP TO MAIN CONTENT" works */}
      <div id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* adjusted TabsList to center the three tabs and give consistent spacing */}
          <TabsList className="flex justify-center items-center space-x-4 bg-white rounded-lg shadow-sm p-2">
            <TabsTrigger
              value="area-details"
              className="data-[state=active]:bg-[#2c6e49] data-[state=active]:text-white font-medium py-3 px-6 rounded-md"
            >
              {t("tab_area")}
            </TabsTrigger>
            <TabsTrigger
              value="grievance-details"
              className="data-[state=active]:bg-[#2c6e49] data-[state=active]:text-white font-medium py-3 px-6 rounded-md"
            >
              {t("tab_grievance")}
            </TabsTrigger>
            <TabsTrigger
              value="panchayat-details"
              className="data-[state=active]:bg-[#2c6e49] data-[state=active]:text-white font-medium py-3 px-6 rounded-md"
            >
              {t("tab_panchayat")}
            </TabsTrigger>
          </TabsList>

          {/* Tab contents unchanged (still using t(...) per your request) */}
          {/* Tab 1: Area-wise Land Details */}
          <TabsContent value="area-details" className="space-y-6">
            {/* Summary Cards Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-[#2c6e49]" />
                    {t("total_villages")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#0f2a44]">{areaData.total_villages}</div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <BarChart3 className="w-4 h-4 mr-2 text-[#2c6e49]" />
                    {t("cumulative_area")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#0f2a44]">{areaData.cumulative_area.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                    {t("area_registered")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{areaData.area_registered.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <Users className="w-4 h-4 mr-2 text-[#2c6e49]" />
                    {t("farmers_registered")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#0f2a44]">{areaData.farmers_registered}</div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2 text-blue-600" />
                    {t("today_registered")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{areaData.today_registered_area}</div>
                </CardContent>
              </Card>
            </div>

            {/* (The rest of the dashboard remains exactly the same as in the translated version) */}
            {/* Mismatch & Verification Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className="bg-white shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">{t("mismatch_area")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-red-600">{areaData.mismatch_area}</div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">{t("verified_mismatch")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-green-600">{areaData.verified_mismatch_area}</div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">{t("pending_mismatch")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-yellow-600">{areaData.pending_mismatch_area}</div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">{t("special_verification")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-[#0f2a44]">{areaData.special_verification_area}</div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">{t("special_verified")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-green-600">
                    {areaData.special_verification_verified_area}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 3 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-[#0f2a44]">
                    <PieChart className="w-5 h-5 mr-2" />
                    {t("registration_progress")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#2c6e49]">68%</div>
                      <div className="text-sm text-gray-600">{t("registered_vs_remaining")}</div>
                      <div className="text-xs text-gray-500 mt-2">
                        {areaData.area_registered.toLocaleString()} / {areaData.cumulative_area.toLocaleString()} ha
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-[#0f2a44]">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    {t("mismatch_analysis")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center space-y-2">
                      <div className="flex justify-between items-center w-32">
                        <span className="text-sm">{t("total")}</span>
                        <span className="font-bold">{areaData.mismatch_area}</span>
                      </div>
                      <div className="flex justify-between items-center w-32">
                        <span className="text-sm">{t("verified")}</span>
                        <span className="font-bold text-green-600">{areaData.verified_mismatch_area}</span>
                      </div>
                      <div className="flex justify-between items-center w-32">
                        <span className="text-sm">{t("pending")}</span>
                        <span className="font-bold text-yellow-600">{areaData.pending_mismatch_area}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-[#0f2a44]">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    {t("todays_progress")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{areaData.today_registered_area}</div>
                      <div className="text-sm text-gray-600">{t("hectares_registered_today")}</div>
                      <div className="text-xs text-gray-500 mt-2">
                        {((areaData.today_registered_area / areaData.cumulative_area) * 100).toFixed(2)}% {t("of_total_area")}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => handleExport("area")} className="bg-[#2c6e49] hover:bg-[#1e4d35]">
                <Download className="w-4 h-4 mr-2" />
                {t("export_area")}
              </Button>
            </div>
          </TabsContent>

          {/* Tab 2: Grievance Details */}
          <TabsContent value="grievance-details" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-white shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-[#2c6e49]" />
                    {t("total_grievances")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#0f2a44]">{grievanceData.total_grievances}</div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                    {t("solved")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{grievanceData.solved_grievances}</div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-yellow-600" />
                    {t("pending")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{grievanceData.pending_grievances}</div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2 text-red-600" />
                    {t("pending_with_sdm")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{grievanceData.pending_grievances_sdm}</div>
                </CardContent>
              </Card>
            </div>

            {/* Grievances Table */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-[#0f2a44]">{t("grievances_list")}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("table_id")}</TableHead>
                      <TableHead>{t("table_raised_by")}</TableHead>
                      <TableHead>{t("table_type")}</TableHead>
                      <TableHead>{t("table_status")}</TableHead>
                      <TableHead>{t("table_officer")}</TableHead>
                      <TableHead>{t("table_date")}</TableHead>
                      <TableHead>{t("table_priority")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockGrievances.map((grievance) => (
                      <TableRow
                        key={grievance.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => setSelectedGrievance(grievance)}
                      >
                        <TableCell className="font-medium">{grievance.id}</TableCell>
                        <TableCell>{grievance.raisedBy}</TableCell>
                        <TableCell>{t(grievance.type)}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              grievance.status === "Solved"
                                ? "bg-green-100 text-green-800"
                                : grievance.status === "Pending with SDM"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }
                          >
                            {t(grievance.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>{grievance.officer}</TableCell>
                        <TableCell>{new Date(grievance.date).toLocaleDateString("en-IN")}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              grievance.priority === "High"
                                ? "bg-red-100 text-red-800"
                                : grievance.priority === "Medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }
                          >
                            {t(grievance.priority)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-[#0f2a44]">
                    <PieChart className="w-5 h-5 mr-2" />
                    {t("status_distribution")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center space-y-2">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round((grievanceData.solved_grievances / grievanceData.total_grievances) * 100)}%
                      </div>
                      <div className="text-sm text-gray-600">{t("resolution_rate")}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-[#0f2a44]">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    {t("priority_breakdown")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center space-y-2">
                      <div className="flex justify-between items-center w-32">
                        <span className="text-sm">{t("high")}</span>
                        <span className="font-bold text-red-600">2</span>
                      </div>
                      <div className="flex justify-between items-center w-32">
                        <span className="text-sm">{t("medium")}</span>
                        <span className="font-bold text-yellow-600">2</span>
                      </div>
                      <div className="flex justify-between items-center w-32">
                        <span className="text-sm">{t("low")}</span>
                        <span className="font-bold text-green-600">1</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => handleExport("grievance")} className="bg-[#2c6e49] hover:bg-[#1e4d35]">
                <Download className="w-4 h-4 mr-2" />
                {t("export_grievance")}
              </Button>
            </div>
          </TabsContent>

          {/* Tab 3: Panchayat Land Details */}
          <TabsContent value="panchayat-details" className="space-y-6">
            {/* District Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {panchayatData
                .filter((d) => d.district !== "TOTAL")
                .map((district) => (
                  <Card
                    key={district.district}
                    className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedDistrict(district)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-[#0f2a44]">{t(district.district)}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">{t("villages")}</span>
                        <span className="text-sm font-medium">{district.total_villages}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">{t("submitted")}</span>
                        <span className="text-sm font-medium">{district.claims_submitted}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">{t("verified")}</span>
                        <span className="text-sm font-medium text-green-600">{district.claims_verified}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">{t("pending")}</span>
                        <span className="text-sm font-medium text-yellow-600">{district.claims_pending}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>

            {/* Detailed Table */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-[#0f2a44]">{t("district_summary")}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("table_district")}</TableHead>
                      <TableHead>{t("table_villages")}</TableHead>
                      <TableHead>{t("table_claims_submitted")}</TableHead>
                      <TableHead>{t("table_claims_verified")}</TableHead>
                      <TableHead>{t("table_claims_pending")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {panchayatData.map((district) => (
                      <TableRow
                        key={district.district}
                        className={
                          district.district === "TOTAL" ? "font-bold bg-gray-50" : "cursor-pointer hover:bg-gray-50"
                        }
                        onClick={() => district.district !== "TOTAL" && setSelectedDistrict(district)}
                      >
                        <TableCell className="font-medium">{t(district.district)}</TableCell>
                        <TableCell>{district.total_villages}</TableCell>
                        <TableCell>{district.claims_submitted}</TableCell>
                        <TableCell className="text-green-600">{district.claims_verified}</TableCell>
                        <TableCell className="text-yellow-600">{district.claims_pending}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-[#0f2a44]">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    {t("claims_by_district")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#2c6e49]">1,125</div>
                      <div className="text-sm text-gray-600">{t("total_claims_submitted")}</div>
                      <div className="text-xs text-gray-500 mt-2">{t("across_n_districts", { n: 7 })}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-[#0f2a44]">
                    <PieChart className="w-5 h-5 mr-2" />
                    {t("overall_progress")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center space-y-2">
                      <div className="text-2xl font-bold text-green-600">70%</div>
                      <div className="text-sm text-gray-600">{t("verification_rate")}</div>
                      <div className="text-xs text-gray-500 mt-2">{t("verified_out_of_total", { verified: 790, total: 1125 })}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => handleExport("panchayat")} className="bg-[#2c6e49] hover:bg-[#1e4d35]">
                <Download className="w-4 h-4 mr-2" />
                {t("export_panchayat")}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Grievance Detail Modal */}
      <Dialog open={!!selectedGrievance} onOpenChange={() => setSelectedGrievance(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("grievance_details_title", { id: selectedGrievance?.id })}</DialogTitle>
          </DialogHeader>
          {selectedGrievance && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">{t("raised_by")}</label>
                  <p className="text-sm">{selectedGrievance.raisedBy}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">{t("type")}</label>
                  <p className="text-sm">{t(selectedGrievance.type)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">{t("status")}</label>
                  <Badge
                    className={
                      selectedGrievance.status === "Solved"
                        ? "bg-green-100 text-green-800"
                        : selectedGrievance.status === "Pending with SDM"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }
                  >
                    {t(selectedGrievance.status)}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">{t("assigned_officer")}</label>
                  <p className="text-sm">{selectedGrievance.officer}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">{t("description")}</label>
                <p className="text-sm bg-gray-50 p-3 rounded">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore
                  et dolore magna aliqua.
                </p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setSelectedGrievance(null)}>
                  {t("close")}
                </Button>
                {selectedGrievance.status === "Pending" && (
                  <>
                    <Button className="bg-green-600 hover:bg-green-700">{t("mark_as_solved")}</Button>
                    <Button variant="destructive">{t("escalate_to_sdm")}</Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* District Detail Modal */}
<Dialog open={!!selectedDistrict} onOpenChange={() => setSelectedDistrict(null)}>
  <DialogContent className="max-w-4xl w-full">
    <DialogHeader>
      <DialogTitle>{t("panchayat_details_title", { district: selectedDistrict?.district })}</DialogTitle>
    </DialogHeader>

    {selectedDistrict && (
      <div className="space-y-4 max-h-[70vh] overflow-auto pr-2">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-[#0f2a44]">{selectedDistrict.total_villages}</div>
              <div className="text-sm text-gray-600">{t("total_villages")}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-[#0f2a44]">{selectedDistrict.claims_submitted}</div>
              <div className="text-sm text-gray-600">{t("claims_submitted")}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{selectedDistrict.claims_verified}</div>
              <div className="text-sm text-gray-600">{t("claims_verified")}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{selectedDistrict.claims_pending}</div>
              <div className="text-sm text-gray-600">{t("claims_pending")}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("panchayat_wise_breakdown")}</CardTitle>
          </CardHeader>

          <CardContent>
            {/* Horizontal scroll wrapper so date column is visible */}
            <div className="overflow-x-auto">
              <div className="min-w-[760px]">
                <ScrollArea className="w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("table_panchayat")}</TableHead>
                        <TableHead>{t("table_land_type")}</TableHead>
                        <TableHead>{t("table_area")}</TableHead>
                        <TableHead>{t("table_status")}</TableHead>
                        <TableHead className="whitespace-nowrap">{t("table_last_survey")}</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {(
                        (selectedDistrict as any).panchayats?.length
                          ? (selectedDistrict as any).panchayats
                          : [
                              { name: "Panchayat A", landType: "Forest Land", area: 125.5, status: "verified", lastSurvey: "2024-01-15" },
                              { name: "Panchayat B", landType: "Agricultural", area: 89.2, status: "pending", lastSurvey: "2024-01-20" },
                              { name: "Panchayat C", landType: "Mixed Use", area: 156.8, status: "verified", lastSurvey: "2024-01-25" },
                            ]
                      ).map((p: any, idx: number) => (
                        <TableRow key={p.name ?? idx}>
                          <TableCell>{p.name}</TableCell>
                          {/* If you have translations for land types, ensure keys exist; otherwise show raw */}
                          <TableCell>{t(p.landType) || p.landType}</TableCell>
                          <TableCell>{p.area}</TableCell>
                          <TableCell>
                            {p.status === "verified" ? (
                              <Badge className="bg-green-100 text-green-800">{t("verified")}</Badge>
                            ) : p.status === "pending" ? (
                              <Badge className="bg-yellow-100 text-yellow-800">{t("pending")}</Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-800">{t(p.status)}</Badge>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {p.lastSurvey
                              ? new Date(p.lastSurvey).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN")
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="w-full sm:w-auto">
            <Button type="button" variant="outline" className="w-full sm:w-auto">
              {t("upload_survey_documents")}
            </Button>
          </div>

          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <Button type="button" onClick={() => setSelectedDistrict(null)} variant="outline">
              {t("close")}
            </Button>

            <Button type="button" className="bg-[#2c6e49] hover:bg-[#1e4d35]">
              <Download className="w-4 h-4 mr-2" />
              {t("download_report")}
            </Button>
          </div>
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>



      {/* Notification Panel */}
      {showNotifications && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-[#0f2a44]">{t("notifications")}</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowNotifications(false)}>
                ×
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              {t("notification_bullet_1")} • {t("notification_bullet_2")} • {t("notification_bullet_3")}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
