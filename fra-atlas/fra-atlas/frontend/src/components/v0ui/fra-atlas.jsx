"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import {
  MapPin,
  Database,
  Satellite,
  Users,
  FileText,
  Download,
  X,
  ChevronDown,
  ExternalLink,
  Mail,
  Globe,
} from "lucide-react"

interface Metrics {
  villages: string
  claims: string
  assets: string
}

interface Partner {
  name: string
  logoUrl: string
}

interface Theme {
  primary: string
  accent: string
  cta: string
}

interface FormData {
  name: string
  organization: string
  email: string
  message: string
}

interface FRAAtlasProps {
  onRequestDemo?: (formData: FormData) => void
  onOpenDashboard?: () => void
  metrics?: Metrics
  partners?: Partner[]
  theme?: Theme
  useH1?: boolean
}

const FRAAtlas: React.FC<FRAAtlasProps> = ({
  onRequestDemo,
  onOpenDashboard,
  metrics = {
    villages: "1,200+",
    claims: "24,000+",
    assets: "15,000+",
  },
  partners,
  theme = {
    primary: "#0f7b40",
    accent: "#2aa26b",
    cta: "#0f6fff",
  },
  useH1 = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    name: "",
    organization: "",
    email: "",
    message: "",
  })
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [language, setLanguage] = useState("EN")
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false)

  const modalRef = useRef<HTMLDivElement>(null)
  const firstFocusableRef = useRef<HTMLInputElement>(null)
  const mapPreviewRef = useRef<HTMLDivElement>(null)

  // Focus trap for modal
  useEffect(() => {
    if (isModalOpen && firstFocusableRef.current) {
      firstFocusableRef.current.focus()
    }
  }, [isModalOpen])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && isModalOpen) {
      setIsModalOpen(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form submitted:", formData)
    onRequestDemo?.(formData)
    setIsSubmitted(true)
    setTimeout(() => {
      setIsModalOpen(false)
      setIsSubmitted(false)
      setFormData({ name: "", organization: "", email: "", message: "" })
    }, 2000)
  }

  const handleExploreDemo = () => {
    if (onOpenDashboard) {
      onOpenDashboard()
    } else {
      mapPreviewRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }

  const features = [
    {
      title: "Digitize & Verify",
      description: "OCR + NER to standardize legacy FRA documents.",
      icon: FileText,
    },
    {
      title: "Interactive FRA Atlas",
      description: "IFR / CR / CFR layers, village boundaries, patta holders.",
      icon: MapPin,
    },
    {
      title: "AI Asset Mapping",
      description: "water bodies, farms, forest cover from satellite imagery.",
      icon: Satellite,
    },
    {
      title: "Scheme Layering (DSS)",
      description: "recommend PM-KISAN, Jal Jeevan, MGNREGA prioritization.",
      icon: Database,
    },
    {
      title: "Public & Officer Views",
      description: "role-based dashboards for district officers and policy-makers.",
      icon: Users,
    },
    {
      title: "Data Import & Export",
      description: "shapefiles, CSV, and PDF reports.",
      icon: Download,
    },
  ]

  const HeadingTag = useH1 ? "h1" : "h2"

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50" style={{ backgroundColor: "#f7fafc" }}>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background: `linear-gradient(135deg, ${theme.primary}20 0%, ${theme.accent}20 100%)`,
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="flex items-center gap-2 text-sm">
                <button
                  className={`px-2 py-1 rounded ${language === "EN" ? "bg-white shadow-sm" : "text-gray-600"}`}
                  onClick={() => setLanguage("EN")}
                  aria-label="Switch to English"
                >
                  EN
                </button>
                <span className="text-gray-400">|</span>
                <button
                  className={`px-2 py-1 rounded ${language === "HI" ? "bg-white shadow-sm" : "text-gray-600"}`}
                  onClick={() => setLanguage("HI")}
                  aria-label="Switch to Hindi"
                >
                  HI
                </button>
              </div>

              <div className="space-y-6">
                <HeadingTag className="text-4xl lg:text-5xl font-bold leading-tight" style={{ color: "#111827" }}>
                  FRA Atlas — A National WebGIS for Forest Rights
                </HeadingTag>

                <p className="text-xl text-gray-600 leading-relaxed">
                  Digitize, visualize and prioritize FRA claims and pattas — integrated with satellite asset maps and a
                  Decision Support System for targeted schemes.
                </p>

                <div className="flex flex-wrap gap-2">
                  {["Digitization", "WebGIS", "AI Asset Mapping", "DSS"].map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-sm rounded-full bg-white shadow-sm border"
                      style={{ color: theme.primary }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleExploreDemo}
                    className="px-8 py-4 rounded-lg font-semibold text-white transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-200"
                    style={{ backgroundColor: theme.cta }}
                    aria-label="Explore Demo"
                  >
                    Explore Demo
                  </button>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-8 py-4 rounded-lg font-semibold border-2 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-200"
                    style={{
                      borderColor: theme.primary,
                      color: theme.primary,
                    }}
                    aria-label="Request Demo or Trial"
                  >
                    Request Demo / Trial
                  </button>
                </div>
              </div>
            </div>

            {/* Right Map Preview */}
            <div className="lg:pl-8">
              <div
                ref={mapPreviewRef}
                className="relative bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 focus-within:shadow-xl focus-within:-translate-y-1"
                tabIndex={0}
                role="img"
                aria-label="Interactive map preview showing FRA claims and forest areas"
              >
                <div
                  className="w-full h-80 bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center"
                  style={{ minHeight: "320px" }}
                >
                  <div className="text-center space-y-4">
                    <MapPin size={48} style={{ color: theme.primary }} className="mx-auto" />
                    <p className="text-gray-600">Interactive Map Preview</p>
                  </div>
                </div>

                {/* Map Legend */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.accent }}></div>
                    <span>Granted</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span>Pending</span>
                  </div>
                </div>

                {/* Open Atlas Button */}
                <div className="absolute bottom-4 right-4">
                  <button
                    onClick={handleExploreDemo}
                    className="px-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg font-medium transition-all duration-200 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ color: theme.cta }}
                    aria-label="Open Atlas in full view"
                  >
                    Open Atlas <ExternalLink size={16} className="inline ml-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold" style={{ color: theme.primary }}>
                {metrics.villages}
              </div>
              <div className="text-gray-600 mt-2">Villages mapped</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold" style={{ color: theme.primary }}>
                {metrics.claims}
              </div>
              <div className="text-gray-600 mt-2">Claims digitized</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold" style={{ color: theme.primary }}>
                {metrics.assets}
              </div>
              <div className="text-gray-600 mt-2">Assets detected</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16" style={{ backgroundColor: "#f7fafc" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4" style={{ color: "#111827" }}>
              Comprehensive Forest Rights Management
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-start space-x-4">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: `${theme.primary}10` }}>
                    <feature.icon size={24} style={{ color: theme.primary }} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2" style={{ color: "#111827" }}>
                      {feature.title}
                    </h4>
                    <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DSS Highlight */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-8">
            <div className="flex items-start space-x-4">
              <div className="p-3 rounded-lg bg-white shadow-sm">
                <Database size={24} style={{ color: theme.cta }} />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-3" style={{ color: "#111827" }}>
                  Decision Support System in Action
                </h4>
                <p className="text-gray-700 mb-4">
                  "DSS suggests Jal Jeevan Mission prioritization for 342 villages with low water index."
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      backgroundColor: theme.accent,
                      width: "68%",
                    }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">Analysis Progress: 68%</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partners */}
      {partners && partners.length > 0 && (
        <section className="py-12" style={{ backgroundColor: "#f7fafc" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h4 className="text-center text-lg font-medium mb-8 text-gray-600">Trusted Partners</h4>
            <div className="flex justify-center items-center space-x-8 flex-wrap gap-4">
              {partners.slice(0, 5).map((partner, index) => (
                <div key={index} className="w-24 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                  {partner.logoUrl ? (
                    <img
                      src={partner.logoUrl || "/placeholder.svg"}
                      alt={partner.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-gray-500 text-center px-2">{partner.name}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-wrap gap-6">
              <a
                href="#"
                className="text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="Read project brief"
              >
                Read project brief
              </a>
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="Request credentials"
              >
                Request credentials
              </button>
              <a
                href="mailto:team@fra-atlas.gov.in"
                className="text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
                aria-label="Contact project team"
              >
                <Mail size={16} />
                Contact project team
              </a>
            </div>

            <div className="relative">
              <button
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                aria-label="Select language"
                aria-expanded={isLangDropdownOpen}
              >
                <Globe size={16} />
                {language}
                <ChevronDown size={16} />
              </button>

              {isLangDropdownOpen && (
                <div className="absolute right-0 bottom-full mb-2 bg-white border rounded-lg shadow-lg py-1 min-w-[80px]">
                  <button
                    onClick={() => {
                      setLanguage("EN")
                      setIsLangDropdownOpen(false)
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                  >
                    EN
                  </button>
                  <button
                    onClick={() => {
                      setLanguage("HI")
                      setIsLangDropdownOpen(false)
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                  >
                    HI
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </footer>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}
          onKeyDown={handleKeyDown}
        >
          <div
            ref={modalRef}
            className="bg-white rounded-xl max-w-md w-full p-6 space-y-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="flex justify-between items-center">
              <h3 id="modal-title" className="text-xl font-semibold" style={{ color: "#111827" }}>
                Request Demo / Trial
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Name *
                  </label>
                  <input
                    ref={firstFocusableRef}
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="organization" className="block text-sm font-medium mb-2">
                    Organization *
                  </label>
                  <input
                    id="organization"
                    type="text"
                    required
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email *
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={3}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tell us about your requirements..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-lg font-semibold text-white transition-colors hover:opacity-90 focus:outline-none focus:ring-4 focus:ring-blue-200"
                  style={{ backgroundColor: theme.cta }}
                >
                  Submit Request
                </button>
              </form>
            ) : (
              <div className="text-center py-8" role="status" aria-live="polite">
                <div className="text-green-600 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold mb-2">Request Submitted!</h4>
                <p className="text-gray-600">We'll get back to you within 24 hours.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Screen reader announcements */}
      <div aria-live="polite" className="sr-only">
        {isSubmitted && "Demo request submitted successfully"}
      </div>
    </div>
  )
}

export default FRAAtlas

/*
Usage Example:

import FRAAtlas from './components/fra-atlas';

// Basic usage
<FRAAtlas />

// With custom props
<FRAAtlas
  onRequestDemo={(formData) => {
    console.log('Demo requested:', formData);
    // Handle form submission
  }}
  onOpenDashboard={() => {
    console.log('Opening dashboard');
    // Navigate to dashboard
  }}
  metrics={{
    villages: '2,500+',
    claims: '45,000+',
    assets: '28,000+'
  }}
  partners={[
    { name: 'Ministry of Environment', logoUrl: '/logos/moef.png' },
    { name: 'Forest Survey of India', logoUrl: '/logos/fsi.png' }
  ]}
  theme={{
    primary: '#0f7b40',
    accent: '#2aa26b',
    cta: '#0f6fff'
  }}
  useH1={true}
/>
*/
