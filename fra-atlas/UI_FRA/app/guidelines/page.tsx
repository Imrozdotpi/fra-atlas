"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  BookOpen,
  Users,
  FileText,
  CheckCircle,
  XCircle,
  Phone,
  MapPin,
  Clock,
  Shield,
  TreePine,
  Home,
} from "lucide-react"
import { useLanguage } from "@/components/LanguageProvider"

export default function GuidelinesPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Optional Back to Home shortcut (header already has HOME) */}
      <div className="container mx-auto px-4 py-6">
        <div className="text-left">
          <Link href="/" className="text-gov-blue hover:underline text-sm font-medium">
            ← {t("home")}
          </Link>
        </div>
      </div>

      <main className="container mx-auto px-4 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center gap-4">
              <BookOpen className="w-8 h-8 text-[#2c6e49]" />
              <div>
                <h1 className="text-3xl font-bold text-[#0f2a44]">{t("guidelines_title")}</h1>
                <p className="text-gray-600">{t("guidelines_subtitle")}</p>
              </div>
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-220px)] rounded-lg border">
            <div className="space-y-8 p-4">
              {/* Introduction */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#2c6e49]">
                    <TreePine className="w-5 h-5" />
                    1. {t("guidelines_intro_title")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">{t("guidelines_intro_text")}</p>
                  <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                    <h4 className="font-semibold text-green-800 mb-2">{t("guidelines_eligible_beneficiaries")}</h4>
                    <ul className="text-green-700 space-y-1">
                      <li>• {t("guidelines_eligible_st")}</li>
                      <li>• {t("guidelines_eligible_otfd")}</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Types of Rights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#2c6e49]">
                    <Shield className="w-5 h-5" />
                    2. {t("guidelines_types_title")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2">{t("guidelines_type_ifr")}</h4>
                      <p className="text-blue-700 text-sm">{t("guidelines_type_ifr_desc")}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-purple-800 mb-2">{t("guidelines_type_cfr")}</h4>
                      <p className="text-purple-700 text-sm">{t("guidelines_type_cfr_desc")}</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-orange-800 mb-2">{t("guidelines_type_other")}</h4>
                      <p className="text-orange-700 text-sm">{t("guidelines_type_other_desc")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Eligibility Criteria */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#2c6e49]">
                    <Users className="w-5 h-5" />
                    3. {t("guidelines_eligibility_title")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-[#2c6e49] mt-1" />
                      <div>
                        <h4 className="font-semibold text-gray-800">{t("guidelines_eligibility_residence")}</h4>
                        <p className="text-gray-600">{t("guidelines_eligibility_residence_desc")}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Users className="w-5 h-5 text-[#2c6e49] mt-1" />
                      <div>
                        <h4 className="font-semibold text-gray-800">{t("guidelines_eligibility_community")}</h4>
                        <p className="text-gray-600">{t("guidelines_eligibility_community_desc")}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Documents Required */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#2c6e49]">
                    <FileText className="w-5 h-5" />
                    4. {t("guidelines_documents_title")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-gray-700">{t("guidelines_doc_residence")}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-gray-700">{t("guidelines_doc_landuse")}</span>
                      </li>
                    </ul>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-gray-700">{t("guidelines_doc_resolution")}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-gray-700">{t("guidelines_doc_verification")}</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Application Process */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#2c6e49]">
                    <MapPin className="w-5 h-5" />
                    5. {t("guidelines_process_title")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-[#2c6e49] text-white rounded-full flex items-center justify-center mx-auto mb-2">
                        1
                      </div>
                      <p className="text-sm font-medium">{t("guidelines_process_step1")}</p>
                    </div>
                    <div className="hidden md:block text-gray-400">→</div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-[#2c6e49] text-white rounded-full flex items-center justify-center mx-auto mb-2">
                        2
                      </div>
                      <p className="text-sm font-medium">{t("guidelines_process_step2")}</p>
                    </div>
                    <div className="hidden md:block text-gray-400">→</div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-[#2c6e49] text-white rounded-full flex items-center justify-center mx-auto mb-2">
                        3
                      </div>
                      <p className="text-sm font-medium">{t("guidelines_process_step3")}</p>
                    </div>
                    <div className="hidden md:block text-gray-400">→</div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-[#2c6e49] text-white rounded-full flex items-center justify-center mx-auto mb-2">
                        4
                      </div>
                      <p className="text-sm font-medium">{t("guidelines_process_step4")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* How FRA Atlas Helps */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#2c6e49]">
                    <Home className="w-5 h-5" />
                    6. {t("guidelines_help_title")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                        <div>
                          <h4 className="font-medium text-gray-800">{t("guidelines_help_upload")}</h4>
                          <p className="text-sm text-gray-600">{t("guidelines_help_upload_desc")}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                        <div>
                          <h4 className="font-medium text-gray-800">{t("guidelines_help_map")}</h4>
                          <p className="text-sm text-gray-600">{t("guidelines_help_map_desc")}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                        <div>
                          <h4 className="font-medium text-gray-800">{t("guidelines_help_transparency")}</h4>
                          <p className="text-sm text-gray-600">{t("guidelines_help_transparency_desc")}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                        <div>
                          <h4 className="font-medium text-gray-800">{t("guidelines_help_faster")}</h4>
                          <p className="text-sm text-gray-600">{t("guidelines_help_faster_desc")}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Do's and Don'ts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#2c6e49]">
                    <Shield className="w-5 h-5" />
                    7. {t("guidelines_dos_title")} & {t("guidelines_dont_title")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        {t("guidelines_dos_title")}
                      </h4>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                          <span className="text-gray-700">{t("guidelines_dos_1")}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                          <span className="text-gray-700">{t("guidelines_dos_2")}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                          <span className="text-gray-700">{t("guidelines_dos_3")}</span>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                        <XCircle className="w-5 h-5" />
                        {t("guidelines_dont_title")}
                      </h4>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-red-500 mt-1" />
                          <span className="text-gray-700">{t("guidelines_donts_1")}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-red-500 mt-1" />
                          <span className="text-gray-700">{t("guidelines_donts_2")}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-red-500 mt-1" />
                          <span className="text-gray-700">{t("guidelines_donts_3")}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Support & Contact */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#2c6e49]">
                    <Phone className="w-5 h-5" />
                    8. {t("guidelines_contact_title")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-[#2c6e49]" />
                        <div>
                          <h4 className="font-semibold text-gray-800">{t("guidelines_contact_helpline")}</h4>
                          <p className="text-lg font-bold text-[#2c6e49]">1800 180 2117</p>
                          <p className="text-sm text-gray-600">{t("guidelines_contact_hours")}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-[#2c6e49]" />
                        <div>
                          <h4 className="font-semibold text-gray-800">{t("guidelines_contact_local")}</h4>
                          <p className="text-gray-700">{t("guidelines_contact_office")}</p>
                          <p className="text-sm text-gray-600">{t("guidelines_contact_district")}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">{t("guidelines_contact_faq")}</h4>
                    <p className="text-blue-700 text-sm">{t("guidelines_contact_faq_note")}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </div>
      </main>
    </div>
  )
}
