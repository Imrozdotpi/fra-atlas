"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react"
import { useState, useEffect } from "react"

interface Notice {
  id: string
  title: string
  date: string
  isNew?: boolean
}

interface NoticeBoardProps {
  className?: string
}

export default function NoticeBoard({ className = "" }: NoticeBoardProps) {
  const notices: Notice[] = [
    {
      id: "1",
      title: "Last date for FRA Claim registration: 10 September 2025",
      date: "2025-08-15",
      isNew: true,
    },
    {
      id: "2",
      title: "New FRA guidelines issued – August 2025",
      date: "2025-08-01",
      isNew: true,
    },
    {
      id: "3",
      title: "Officer training session on 15 October 2025",
      date: "2025-07-20",
    },
    {
      id: "4",
      title: "Updated claim verification process effective from September 2025",
      date: "2025-07-10",
    },
    {
      id: "5",
      title: "Digital documentation requirements for new claims",
      date: "2025-06-25",
    },
  ]

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)

  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % notices.length)
    }, 6000)

    return () => clearInterval(interval)
  }, [isPlaying, notices.length])

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + notices.length) % notices.length)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % notices.length)
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader className="pb-3">
        <div className="relative">
          <div
            className="absolute -top-3 -left-3 text-white px-4 py-2 rounded-t-lg font-semibold text-sm"
            style={{ backgroundColor: "#e57c04" }}
          >
            महत्वपूर्ण जानकारी
          </div>
          <div
            className="absolute -top-3 -right-3 text-white px-4 py-2 rounded-t-lg font-semibold text-sm"
            style={{ backgroundColor: "#e57c04" }}
          >
            Important Notices
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="relative">
          <div className="h-64 overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out h-full"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {notices.map((notice, index) => (
                <div key={notice.id} className="w-full flex-shrink-0 p-4 flex flex-col justify-center">
                  <div className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <p className="text-sm text-gray-800 leading-relaxed flex-1 font-medium">{notice.title}</p>
                      {notice.isNew && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full flex-shrink-0">New</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{new Date(notice.date).toLocaleDateString("en-IN")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevious}
              className="h-8 w-8 p-0 bg-transparent"
              aria-label="Previous notice"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={togglePlayPause}
                className="h-8 w-8 p-0 bg-transparent"
                aria-label={isPlaying ? "Pause slideshow" : "Play slideshow"}
              >
                {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              </Button>

              <div className="flex gap-1">
                {notices.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentIndex ? "bg-[#e57c04]" : "bg-gray-300"
                    }`}
                    aria-label={`Go to notice ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={goToNext}
              className="h-8 w-8 p-0 bg-transparent"
              aria-label="Next notice"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
