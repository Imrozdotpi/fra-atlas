"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, CheckCircle, XCircle, Clock, Calendar, MapPin, Download, AlertCircle, User } from "lucide-react"
import { formatDate, formatCoordinates, getStatusBadgeClass } from "@/lib/utils"

interface ClaimDocument {
  id: string
  name: string
  url: string
  size?: number
  uploadDate?: string
}

interface ClaimHistoryEntry {
  date: string
  action: string
  officer: string
  comment?: string
}

interface ClaimDetail {
  id: string
  village_id: string
  claimant: string
  status: "Pending" | "Verified" | "Rejected"
  date: string
  lat: number
  lon: number
  short_note: string
  documents: ClaimDocument[]
  history: ClaimHistoryEntry[]
  area?: number
  claimType?: string
  contactNumber?: string
  address?: string
}

interface ClaimModalProps {
  claim: ClaimDetail | null
  isOpen: boolean
  onClose: () => void
  onVerify: (claimId: string, comment?: string) => Promise<void>
  onReject: (claimId: string, reason: string) => Promise<void>
}

export default function ClaimModal({ claim, isOpen, onClose, onVerify, onReject }: ClaimModalProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [isProcessing, setIsProcessing] = useState(false)
  const [verifyComment, setVerifyComment] = useState("")
  const [rejectReason, setRejectReason] = useState("")
  const [showVerifyForm, setShowVerifyForm] = useState(false)
  const [showRejectForm, setShowRejectForm] = useState(false)

  if (!claim) return null

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Verified":
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case "Rejected":
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />
    }
  }

  const handleVerify = async () => {
    if (!claim) return

    setIsProcessing(true)
    try {
      await onVerify(claim.id, verifyComment || undefined)
      setShowVerifyForm(false)
      setVerifyComment("")
      onClose()
    } catch (error) {
      console.error("Failed to verify claim:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!claim || !rejectReason.trim()) return

    setIsProcessing(true)
    try {
      await onReject(claim.id, rejectReason)
      setShowRejectForm(false)
      setRejectReason("")
      onClose()
    } catch (error) {
      console.error("Failed to reject claim:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadDocument = (doc: ClaimDocument) => {
    window.open(doc.url, "_blank")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-gov-blue">Claim Details - {claim.claimant}</DialogTitle>
            <div className="flex items-center gap-2">
              {getStatusIcon(claim.status)}
              <Badge className={getStatusBadgeClass(claim.status)}>{claim.status}</Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4 flex-shrink-0">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="documents">Documents ({claim.documents.length})</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="overview" className="h-full overflow-y-auto mt-4">
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Claimant Name</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-900">{claim.claimant}</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Claim Date</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-900">{formatDate(claim.date)}</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Location Coordinates</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-900 font-mono text-sm">
                            {formatCoordinates(claim.lat, claim.lon, 6)}
                          </span>
                        </div>
                      </div>

                      {claim.area && (
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Claim Area</Label>
                          <p className="text-gray-900 mt-1">{claim.area} hectares</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      {claim.claimType && (
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Claim Type</Label>
                          <p className="text-gray-900 mt-1">{claim.claimType}</p>
                        </div>
                      )}

                      {claim.contactNumber && (
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Contact Number</Label>
                          <p className="text-gray-900 mt-1">{claim.contactNumber}</p>
                        </div>
                      )}

                      {claim.address && (
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Address</Label>
                          <p className="text-gray-900 mt-1">{claim.address}</p>
                        </div>
                      )}

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Claim ID</Label>
                        <p className="text-gray-900 mt-1 font-mono text-sm">{claim.id}</p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Claim Description</Label>
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-900 leading-relaxed">{claim.short_note}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="documents" className="h-full overflow-y-auto mt-4">
                <div className="space-y-4">
                  {claim.documents.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No documents uploaded</p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {claim.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-gray-500" />
                            <div>
                              <p className="font-medium text-gray-900">{doc.name}</p>
                              {doc.uploadDate && (
                                <p className="text-sm text-gray-500">Uploaded: {formatDate(doc.uploadDate)}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => downloadDocument(doc)}>
                              <Download className="w-4 h-4 mr-2" />
                              View
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="timeline" className="h-full overflow-y-auto mt-4">
                <div className="space-y-4">
                  {claim.history.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No timeline entries</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {claim.history.map((entry, index) => (
                        <div key={index} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 bg-gov-blue rounded-full"></div>
                            {index < claim.history.length - 1 && <div className="w-0.5 h-16 bg-gray-200 mt-2"></div>}
                          </div>
                          <div className="flex-1 pb-8">
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-gray-900">{entry.action}</h4>
                                <span className="text-sm text-gray-500">{formatDate(entry.date)}</span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">by {entry.officer}</p>
                              {entry.comment && (
                                <div className="mt-3 p-3 bg-gray-50 rounded border-l-4 border-gov-blue">
                                  <p className="text-sm text-gray-700">{entry.comment}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="actions" className="h-full overflow-y-auto mt-4">
                <div className="space-y-6">
                  {claim.status === "Pending" ? (
                    <>
                      {/* Verify Section */}
                      <div className="border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <h3 className="font-medium text-green-800">Verify Claim</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          Approve this claim if all documents are valid and requirements are met.
                        </p>

                        {!showVerifyForm ? (
                          <Button onClick={() => setShowVerifyForm(true)} className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Verify Claim
                          </Button>
                        ) : (
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="verify-comment">Additional Comments (Optional)</Label>
                              <Textarea
                                id="verify-comment"
                                placeholder="Add any comments about the verification..."
                                value={verifyComment}
                                onChange={(e) => setVerifyComment(e.target.value)}
                                className="mt-1"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={handleVerify}
                                disabled={isProcessing}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {isProcessing ? "Processing..." : "Confirm Verification"}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => setShowVerifyForm(false)}
                                disabled={isProcessing}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      <Separator />

                      {/* Reject Section */}
                      <div className="border border-red-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <XCircle className="w-5 h-5 text-red-600" />
                          <h3 className="font-medium text-red-800">Reject Claim</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          Reject this claim if documents are insufficient or requirements are not met.
                        </p>

                        {!showRejectForm ? (
                          <Button onClick={() => setShowRejectForm(true)} variant="destructive">
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject Claim
                          </Button>
                        ) : (
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="reject-reason">Reason for Rejection *</Label>
                              <Textarea
                                id="reject-reason"
                                placeholder="Please provide a detailed reason for rejection..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="mt-1"
                                required
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={handleReject}
                                disabled={isProcessing || !rejectReason.trim()}
                                variant="destructive"
                              >
                                {isProcessing ? "Processing..." : "Confirm Rejection"}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => setShowRejectForm(false)}
                                disabled={isProcessing}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        This claim has already been {claim.status.toLowerCase()}. No further actions are available.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
