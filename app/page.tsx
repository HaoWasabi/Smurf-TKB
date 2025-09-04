"use client"

import React, { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Types for schedule data
interface ScheduleItem {
  ten: string
  mhp: string
  nhom: string
  thu: number
  so_tiet: number
  tiet: number
  giang_vien: string
  phong: string
  so_tc?: number // số tín chỉ, không bắt buộc
}

interface ScheduleData {
  name: string
  created: string
  data: ScheduleItem[]
}

interface GroupedScheduleItem {
  ten: string
  mhp: string
  nhom: string
  so_tc?: number // số tín chỉ, không bắt buộc
  lich: {
    thu: number
    tiet: number
    so_tiet: number
    giang_vien: string
    phong: string
  }[]
}

interface GroupedScheduleData {
  name: string
  created: string
  data: GroupedScheduleItem[]
}

export default function SchedulePage() {
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null)

  // Khôi phục dữ liệu từ localStorage khi trang tải lại
  useEffect(() => {
    try {
      const saved = localStorage.getItem("smurf-tkb-data")
      if (saved) {
        const json = JSON.parse(saved)
        if (validateScheduleData(json)) {
          setScheduleData(json)
        }
      }
    } catch {}
  }, [])

  // Lưu dữ liệu vào localStorage mỗi khi scheduleData thay đổi
  useEffect(() => {
    if (scheduleData) {
      localStorage.setItem("smurf-tkb-data", JSON.stringify(scheduleData))
    } else {
      localStorage.removeItem("smurf-tkb-data")
    }
  }, [scheduleData])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false)
  const [newSubject, setNewSubject] = useState<{
    ten: string
    mhp: string
    nhom: string
    thu: number
    tiet: number
    so_tiet: number
    giang_vien: string
    phong: string
    so_tc?: number
  }>({
    ten: "",
    mhp: "",
    nhom: "",
    thu: 2,
    tiet: 1,
    so_tiet: 1,
    giang_vien: "",
    phong: "",
    so_tc: undefined,
  })
  const [editingSubject, setEditingSubject] = useState<ScheduleItem | null>(null)
  const [isEditSubjectOpen, setIsEditSubjectOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false)
  const [subjectToDelete, setSubjectToDelete] = useState<ScheduleItem | null>(null)
  const [showJsonPreview, setShowJsonPreview] = useState(false)
  const [showImagePreview, setShowImagePreview] = useState(false)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<any>(null)
  const [exportType, setExportType] = useState<"grouped" | "flat" | "csv">("grouped")

  // Days of the week in Vietnamese
  const dayLabels = ["THỨ 2", "THỨ 3", "THỨ 4", "THỨ 5", "THỨ 6", "THỨ 7", "CN"]
  const days = [2, 3, 4, 5, 6, 7, 0]
  const periods = Array.from({ length: 10 }, (_, i) => i + 1)

  const courseColors = [
    { bg: "#dbeafe", text: "#1e40af", border: "#93c5fd" }, // blue
    { bg: "#dcfce7", text: "#166534", border: "#86efac" }, // green
    { bg: "#f3e8ff", text: "#7c3aed", border: "#c4b5fd" }, // purple
    { bg: "#fed7aa", text: "#ea580c", border: "#fdba74" }, // orange
    { bg: "#fce7f3", text: "#be185d", border: "#f9a8d4" }, // pink
    { bg: "#e0e7ff", text: "#4338ca", border: "#a5b4fc" }, // indigo
    { bg: "#ccfbf1", text: "#0f766e", border: "#5eead4" }, // teal
    { bg: "#fee2e2", text: "#dc2626", border: "#fca5a5" }, // red
  ]

  const getCourseColor = (courseCode: string) => {
    const hash = courseCode.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return courseColors[hash % courseColors.length]
  }

  const validateScheduleData = (data: any): data is ScheduleData => {
    if (!data || typeof data !== "object") return false
    if (!data.name || !data.created || !Array.isArray(data.data)) return false

    return data.data.every(
      (item: any) =>
        typeof item.ten === "string" &&
        typeof item.mhp === "string" &&
        typeof item.nhom === "string" &&
        typeof item.thu === "number" &&
        typeof item.so_tiet === "number" &&
        typeof item.tiet === "number" &&
        typeof item.giang_vien === "string" &&
        typeof item.phong === "string" &&
        (item.so_tc === undefined || typeof item.so_tc === "number") &&
        item.thu >= 0 &&
        item.thu <= 7 &&
        item.tiet >= 1 &&
        item.tiet <= 10 &&
        item.so_tiet >= 1 &&
        item.so_tiet <= 5,
    )
  }

  const transformToGroupedFormat = (data: ScheduleData): GroupedScheduleData => {
    const groupedMap = new Map<string, GroupedScheduleItem>()

    // Sort data by course code and group for consistent processing
    const sortedData = [...data.data].sort((a, b) => {
      if (a.mhp !== b.mhp) return a.mhp.localeCompare(b.mhp)
      return a.nhom.localeCompare(b.nhom)
    })

    sortedData.forEach((item) => {
      const key = `${item.mhp}-${item.nhom}`

      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          ten: item.ten,
          mhp: item.mhp,
          nhom: item.nhom,
          so_tc: item.so_tc,
          lich: [],
        })
      }

      // Check for duplicate schedule entries
      const existingSchedule = groupedMap
        .get(key)!
        .lich.find((schedule) => schedule.thu === item.thu && schedule.tiet === item.tiet)

      if (!existingSchedule) {
        groupedMap.get(key)!.lich.push({
          thu: item.thu,
          tiet: item.tiet,
          so_tiet: item.so_tiet,
          giang_vien: item.giang_vien,
          phong: item.phong,
        })
      }
    })

    // Sort schedule entries within each course
    groupedMap.forEach((course) => {
      course.lich.sort((a, b) => {
        if (a.thu !== b.thu) return a.thu - b.thu
        return a.tiet - b.tiet
      })
    })

    return {
      name: data.name,
      created: data.created,
      data: Array.from(groupedMap.values()),
    }
  }

  const transformFromGroupedFormat = (groupedData: GroupedScheduleData): ScheduleData => {
    const flatData: ScheduleItem[] = []

    groupedData.data.forEach((course) => {
      course.lich.forEach((schedule) => {
        flatData.push({
          ten: course.ten,
          mhp: course.mhp,
          nhom: course.nhom,
          thu: schedule.thu,
          so_tiet: schedule.so_tiet,
          tiet: schedule.tiet,
          giang_vien: schedule.giang_vien,
          phong: schedule.phong,
          // Nếu course.so_tc không tồn tại thì bỏ qua trường này
          ...(course.so_tc !== undefined ? { so_tc: course.so_tc } : {}),
        })
      })
    })

    return {
      name: groupedData.name,
      created: groupedData.created,
      data: flatData,
    }
  }

  const validateFile = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ["application/json", "text/json"]

    if (file.size > maxSize) {
      return "File quá lớn. Kích thước tối đa là 10MB."
    }

    if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith(".json")) {
      return "Chỉ chấp nhận file JSON (.json)"
    }

    return null
  }

  const processFile = async (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      throw new Error(validationError)
    }

    setSelectedFile(file)
    setError(null)
    setIsProcessing(true)
    setUploadProgress(0)

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 100)

      const text = await file.text()
      setUploadProgress(95)

      const jsonData = JSON.parse(text)
      setUploadProgress(100)

      clearInterval(progressInterval)

      // Detect if it's grouped format and convert to flat format
      if (jsonData.data && jsonData.data.length > 0 && jsonData.data[0].lich) {
        // It's grouped format, convert to flat
        const flatData = transformFromGroupedFormat(jsonData as GroupedScheduleData)
        if (validateScheduleData(flatData)) {
          setScheduleData(flatData)
          setError(null)
        } else {
          throw new Error("Dữ liệu không hợp lệ sau khi chuyển đổi")
        }
      } else {
        // It's flat format, validate directly
        if (validateScheduleData(jsonData)) {
          setScheduleData(jsonData)
          setError(null)
        } else {
          throw new Error("Định dạng dữ liệu không hợp lệ")
        }
      }
    } catch (error) {
      setError(`Lỗi đọc file: ${error instanceof Error ? error.message : "Lỗi không xác định"}`)
      setScheduleData(null)
    } finally {
      setIsProcessing(false)
      setUploadProgress(0)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    await processFile(file)
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    const jsonFile = files.find((file) => file.type === "application/json" || file.name.toLowerCase().endsWith(".json"))

    if (jsonFile) {
      await processFile(jsonFile)
    } else {
      setError("Vui lòng thả file JSON hợp lệ")
    }
  }, [])

  const handleClearData = () => {
    setSelectedFile(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleClickUpload = () => {
    fileInputRef.current?.click()
  }

  const handleDeleteSubject = (subjectToDelete: ScheduleItem) => {
    setSubjectToDelete(subjectToDelete)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteSubject = () => {
    if (!scheduleData || !subjectToDelete) return

    const updatedData = scheduleData.data.filter((item) => item !== subjectToDelete)
    setScheduleData({
      ...scheduleData,
      data: updatedData,
    })
    setShowDeleteConfirm(false)
    setSubjectToDelete(null)
  }

  const handleClearAll = () => {
    setShowClearAllConfirm(true)
  }

  const confirmClearAll = () => {
    setScheduleData(null)
    setShowClearAllConfirm(false)
  }

  const handleExportGrouped = () => {
    if (!scheduleData) {
      setError("Chưa có dữ liệu để xuất")
      return
    }

    try {
      const groupedData = transformToGroupedFormat(scheduleData)
      setPreviewData(groupedData)
      setExportType("grouped")
      setShowJsonPreview(true)
      setError(null)
    } catch (error) {
      setError(`Lỗi tạo preview: ${error instanceof Error ? error.message : "Lỗi không xác định"}`)
    }
  }

  const confirmExportJson = () => {
    if (!previewData) return

    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-")
      let blob: Blob
      let filename: string

      if (exportType === "csv") {
        blob = new Blob(["\uFEFF" + previewData], { type: "text/csv;charset=utf-8;" })
        filename = `tkb-${timestamp}.csv`
      } else {
        blob = new Blob([JSON.stringify(previewData, null, 2)], {
          type: "application/json",
        })
        filename = `tkb-${exportType}-${timestamp}.json`
      }

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      setShowJsonPreview(false)
      setError(null)
    } catch (error) {
      setError(`Lỗi xuất file: ${error instanceof Error ? error.message : "Lỗi không xác định"}`)
    }
  }

  const handleExportImage = async () => {
    if (!scheduleData) {
      setError("Chưa có dữ liệu để xuất")
      return
    }

    // Tạo ảnh PNG và hiển thị xem trước
    try {
      const scheduleTable = document.querySelector("table") as HTMLElement
      if (!scheduleTable) {
        throw new Error("Không tìm thấy bảng thời khóa biểu")
      }

      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")!
      const cellWidth = 160
      const cellHeight = 60
      const totalCols = 8 // 1 cột tiết + 7 cột ngày
      canvas.width = 9 * cellWidth // tăng thêm để có khoảng trống hai bên
      // Tăng chiều cao để chứa thông báo trùng tiết
      let baseHeight = 800
      const conflicted = getConflictedSubjects()
      // Tính số dòng thực tế cần cho thông báo trùng tiết (word wrap)
      let conflictLines = 0
      const maxLineWidth = canvas.width - 2 * ((canvas.width - totalCols * cellWidth) / 2) - 40 // padding
      ctx.font = "14px Arial"
      if (conflicted.length > 0) {
        conflicted.forEach(conf => {
          let thuText = conf.thu === 0 ? "Chủ nhật" : `Thứ ${conf.thu}`
          let monText = conf.items.map(item => `${item.ten} (${item.mhp} - ${item.nhom})`).join(", ")
          let fullText = `${thuText}, Tiết ${conf.tiet}: ${monText}`
          // Chia dòng theo từ, không vượt quá maxLineWidth
          let words = fullText.split(" ")
          let line = ""
          words.forEach((word, idx) => {
            let testLine = line.length > 0 ? line + " " + word : word
            let metrics = ctx.measureText(testLine)
            if (metrics.width > maxLineWidth) {
              conflictLines++
              line = word
            } else {
              line = testLine
            }
            // Nếu là từ cuối cùng thì cũng tính là một dòng
            if (idx === words.length - 1) conflictLines++
          })
        })
      }
  // Tăng chiều cao canvas nhiều hơn để đảm bảo không bị cắt
  let conflictHeight = conflicted.length > 0 ? 80 + conflictLines * 36 : 0
  canvas.height = baseHeight + conflictHeight
      const startX = (canvas.width - totalCols * cellWidth) / 2 // căn giữa bảng
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = "#1e40af"
      ctx.font = "bold 24px Arial"
      ctx.textAlign = "center"
      ctx.fillText((scheduleData?.name ?? "Thời Khóa Biểu"), canvas.width / 2, 40)
      const days = ["THỨ 2", "THỨ 3", "THỨ 4", "THỨ 5", "THỨ 6", "THỨ 7", "CN"]
      const startY = 80
      ctx.font = "bold 14px Arial"
      ctx.fillStyle = "#374151"
      ctx.strokeStyle = "#d1d5db"
      ctx.lineWidth = 1
      // Vẽ cột đầu tiên tiêu đề 'TIẾT'
      ctx.strokeRect(startX, startY, cellWidth, cellHeight)
      ctx.fillStyle = "#f3f4f6"
      ctx.fillRect(startX + 1, startY + 1, cellWidth - 2, cellHeight - 2)
      ctx.fillStyle = "#374151"
      ctx.textAlign = "center"
      ctx.fillText("TIẾT", startX + cellWidth / 2, startY + cellHeight / 2 + 5)

      // Vẽ các tiêu đề ngày
      days.forEach((day, index) => {
        const x = startX + (index + 1) * cellWidth
        const y = startY
        ctx.strokeRect(x, y, cellWidth, cellHeight)
        ctx.fillStyle = "#f3f4f6"
        ctx.fillRect(x + 1, y + 1, cellWidth - 2, cellHeight - 2)
        ctx.fillStyle = "#374151"
        ctx.textAlign = "center"
        ctx.fillText(day, x + cellWidth / 2, y + cellHeight / 2 + 5)
      })
      for (let period = 1; period <= 10; period++) {
        const y = startY + period * cellHeight
        // Vẽ cột đầu tiên số tiết
        ctx.strokeRect(startX, y, cellWidth, cellHeight)
        ctx.fillStyle = "#f9fafb"
        ctx.fillRect(startX + 1, y + 1, cellWidth - 2, cellHeight - 2)
        ctx.fillStyle = "#374151"
        ctx.textAlign = "center"
        ctx.fillText(`TIẾT ${period}`, startX + cellWidth / 2, y + cellHeight / 2 + 5)

        // Vẽ các cột ngày
        for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
          const x = startX + (dayIndex + 1) * cellWidth
          ctx.strokeRect(x, y, cellWidth, cellHeight)
          // dayIndex 0-5: thứ 2-7, dayIndex 6: CN
          const thuValue = dayIndex < 6 ? dayIndex + 2 : 0;
          const subject =
            scheduleData &&
            scheduleData.data.find(
              (s) => s.thu === thuValue && s.tiet <= period && s.tiet + s.so_tiet - 1 >= period,
            )
          if (subject) {
            const colors = ["#dbeafe", "#dcfce7", "#fef3c7", "#fce7f3", "#e0e7ff", "#f0fdf4"]
            const colorIndex = scheduleData.data.indexOf(subject) % colors.length
            ctx.fillStyle = colors[colorIndex]
            ctx.fillRect(x + 1, y + 1, cellWidth - 2, cellHeight - 2)
            ctx.fillStyle = "#374151"
            ctx.font = "12px Arial"
            ctx.textAlign = "center"
            const lines = [
              subject.ten.substring(0, 15) + (subject.ten.length > 15 ? "..." : ""),
              `${subject.giang_vien || ""}`,
              `${subject.phong || ""}`,
            ]
            lines.forEach((line, lineIndex) => {
              if (line.trim()) {
                ctx.fillText(line, x + cellWidth / 2, y + 20 + lineIndex * 15)
              }
            })
          }
        }
      }
      // Vẽ thông báo các môn bị trùng tiết bên dưới bảng
      if (conflicted.length > 0) {
        ctx.font = "bold 18px Arial"
        ctx.fillStyle = "#dc2626"
        ctx.textAlign = "left"
        ctx.fillText("Các môn bị trùng tiết:", startX, baseHeight + 40)
        ctx.font = "14px Arial"
        ctx.fillStyle = "#b91c1c"
        let y = baseHeight + 70
        conflicted.forEach((conf) => {
          let thuText = conf.thu === 0 ? "Chủ nhật" : `Thứ ${conf.thu}`
          let monText = conf.items.map(item => `${item.ten} (${item.mhp} - ${item.nhom})`).join(", ")
          let fullText = `${thuText}, Tiết ${conf.tiet}: ${monText}`
          // Chia dòng theo từ, không vượt quá maxLineWidth
          let words = fullText.split(" ")
          let line = ""
          words.forEach((word, idx) => {
            let testLine = line.length > 0 ? line + " " + word : word
            let metrics = ctx.measureText(testLine)
            if (metrics.width > maxLineWidth) {
              ctx.fillText(line, startX + 20, y)
              y += 24
              line = word
            } else {
              line = testLine
            }
            if (idx === words.length - 1 && line.length > 0) {
              ctx.fillText(line, startX + 20, y)
              y += 24
            }
          })
        })
      }
      const url = canvas.toDataURL("image/png", 0.95)
      setImagePreviewUrl(url)
      setShowImagePreview(true)
    } catch (error) {
      setError(`Lỗi tạo ảnh: ${error instanceof Error ? error.message : "Lỗi không xác định"}`)
    }
  }

  const confirmExportImage = async () => {
    setIsExporting(true)
    setShowImagePreview(false)

    try {
      const scheduleTable = document.querySelector("table") as HTMLElement
      if (!scheduleTable) {
        throw new Error("Không tìm thấy bảng thời khóa biểu")
      }

      // Create canvas
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")!

      // Set canvas size
      canvas.width = 1200
      canvas.height = 800

      // Fill white background
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw title
      ctx.fillStyle = "#1e40af"
      ctx.font = "bold 24px Arial"
      ctx.textAlign = "center"
      ctx.fillText((scheduleData?.name ?? "Thời Khóa Biểu"), canvas.width / 2, 40)

      // Draw table headers
      const days = ["", "THỨ 2", "THỨ 3", "THỨ 4", "THỨ 5", "THỨ 6", "THỨ 7"]
      const cellWidth = 160
      const cellHeight = 60
      const startX = 40
      const startY = 80

      ctx.font = "bold 14px Arial"
      ctx.fillStyle = "#374151"
      ctx.strokeStyle = "#d1d5db"
      ctx.lineWidth = 1

      // Draw header row
      days.forEach((day, index) => {
        const x = startX + index * cellWidth
        const y = startY

        // Draw cell border
        ctx.strokeRect(x, y, cellWidth, cellHeight)

        // Fill header background
        ctx.fillStyle = "#f3f4f6"
        ctx.fillRect(x + 1, y + 1, cellWidth - 2, cellHeight - 2)

        // Draw text
        ctx.fillStyle = "#374151"
        ctx.textAlign = "center"
        ctx.fillText(day, x + cellWidth / 2, y + cellHeight / 2 + 5)
      })

      // Draw period rows
      for (let period = 1; period <= 10; period++) {
        const y = startY + period * cellHeight

        // Draw period number
        ctx.strokeRect(startX, y, cellWidth, cellHeight)
        ctx.fillStyle = "#f9fafb"
        ctx.fillRect(startX + 1, y + 1, cellWidth - 2, cellHeight - 2)
        ctx.fillStyle = "#374151"
        ctx.textAlign = "center"
        ctx.fillText(`TIẾT ${period}`, startX + cellWidth / 2, y + cellHeight / 2 + 5)

        // Draw day cells
        for (let dayIndex = 1; dayIndex < 7; dayIndex++) {
          const x = startX + dayIndex * cellWidth
          ctx.strokeRect(x, y, cellWidth, cellHeight)

          // Find subject for this slot
          const subject =
            scheduleData &&
            scheduleData.data.find(
              (s) => s.thu === dayIndex + 1 && s.tiet <= period && s.tiet + s.so_tiet - 1 >= period,
            )

          if (subject) {
            // Fill with color
            const colors = ["#dbeafe", "#dcfce7", "#fef3c7", "#fce7f3", "#e0e7ff", "#f0fdf4"]
            const colorIndex = scheduleData.data.indexOf(subject) % colors.length
            ctx.fillStyle = colors[colorIndex]
            ctx.fillRect(x + 1, y + 1, cellWidth - 2, cellHeight - 2)

            // Draw subject info
            ctx.fillStyle = "#374151"
            ctx.font = "12px Arial"
            ctx.textAlign = "center"
            const lines = [
              subject.ten.substring(0, 15) + (subject.ten.length > 15 ? "..." : ""),
              `${subject.giang_vien || ""}`,
              `${subject.phong || ""}`,
            ]

            lines.forEach((line, lineIndex) => {
              if (line.trim()) {
                ctx.fillText(line, x + cellWidth / 2, y + 20 + lineIndex * 15)
              }
            })
          }
        }
      }

      // Convert to blob and download
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-")
            const link = document.createElement("a")
            link.download = `tkb-${timestamp}.png`
            link.href = URL.createObjectURL(blob)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(link.href)
          }
        },
        "image/png",
        0.95,
      )

      setError(null)
    } catch (error) {
      console.error("Export error:", error)
      setError(`Lỗi xuất ảnh: ${error instanceof Error ? error.message : "Lỗi không xác định"}`)
    } finally {
      setIsExporting(false)
    }
  }

  const handlePrint = () => {
    if (!scheduleData) {
      setError("Chưa có dữ liệu để in")
      return
    }

    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      setError("Không thể mở cửa sổ in. Vui lòng kiểm tra popup blocker.")
      return
    }

    const scheduleTable = document.querySelector("table")?.outerHTML || ""
    const legendCard = document.querySelector("[data-legend]")?.outerHTML || ""

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Thời khóa biểu - ${scheduleData.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; color: #1e40af; margin-bottom: 20px; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: center; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .course-info { font-size: 12px; }
            .legend { margin-top: 20px; }
            .legend h3 { margin-bottom: 10px; }
            .legend-item { display: inline-block; margin: 5px 10px 5px 0; }
            .legend-color { width: 16px; height: 16px; display: inline-block; margin-right: 5px; border: 1px solid #ccc; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>${scheduleData.name}</h1>
          <p style="text-align: center; margin-bottom: 20px;">
            Tạo lúc: ${new Date(scheduleData.created).toLocaleString("vi-VN")}
          </p>
          ${scheduleTable}
          <div class="legend">
            ${legendCard}
          </div>
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()

    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
  }

  const handleAddSubject = () => {

    if (!newSubject.ten || !newSubject.mhp) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc: Tên môn học, Mã học phần")
      return
    }
    // Cho phép đăng ký môn bị trùng tiết, không kiểm tra xung đột nữa

    const newScheduleItem: ScheduleItem = {
      ten: newSubject.ten,
      mhp: newSubject.mhp,
      nhom: newSubject.nhom,
      thu: newSubject.thu || 0,
      tiet: newSubject.tiet || 0,
      so_tiet: newSubject.so_tiet || 0,
      giang_vien: newSubject.giang_vien || "",
      phong: newSubject.phong || "",
      so_tc: newSubject.so_tc,
    }

    if (scheduleData) {
      setScheduleData({
        ...scheduleData,
        data: [...scheduleData.data, newScheduleItem],
      })
    } else {
      setScheduleData({
        name: "Thời khóa biểu mới",
        created: new Date().toISOString(),
        data: [newScheduleItem],
      })
    }

    setNewSubject({
      ten: "",
      mhp: "",
      nhom: "",
      thu: 2,
      tiet: 1,
      so_tiet: 1,
      giang_vien: "",
      phong: "",
      so_tc: undefined,
    })
    setIsAddSubjectOpen(false)
    setError(null)
  }

  const handleEditSubject = (subject: ScheduleItem) => {
    setEditingSubject(subject)
    setNewSubject({
      ten: subject.ten,
      mhp: subject.mhp,
      nhom: subject.nhom,
      thu: subject.thu,
      tiet: subject.tiet,
      so_tiet: subject.so_tiet,
      giang_vien: subject.giang_vien,
      phong: subject.phong,
      so_tc: subject.so_tc ?? undefined,
    })
    setIsEditSubjectOpen(true)
  }

  const handleSaveEditedSubject = () => {
    if (!newSubject.ten || !newSubject.mhp) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc: Tên môn học, Mã học phần")
      return
    }

    if (!scheduleData || !editingSubject) return

    // Cho phép sửa lịch môn sang tiết trùng với môn khác, không kiểm tra xung đột nữa
    const updatedData = scheduleData.data.map((item) =>
      item === editingSubject
        ? {
            ten: newSubject.ten,
            mhp: newSubject.mhp,
            nhom: newSubject.nhom,
            thu: newSubject.thu || 0,
            tiet: newSubject.tiet || 0,
            so_tiet: newSubject.so_tiet || 0,
            giang_vien: newSubject.giang_vien || "",
            phong: newSubject.phong || "",
            so_tc: newSubject.so_tc,
          }
        : item,
    )

    setScheduleData({
      ...scheduleData,
      data: updatedData,
    })

    setEditingSubject(null)
    setIsEditSubjectOpen(false)
    setNewSubject({
      ten: "",
      mhp: "",
      nhom: "",
      thu: 2,
      tiet: 1,
      so_tiet: 1,
      giang_vien: "",
      phong: "",
      so_tc: undefined,
    })
    setError(null)
  }
  // Hàm lấy danh sách các môn không bị trùng tiết
  const getNonConflictedSubjects = () => {
    if (!scheduleData) return []
    const subjects = scheduleData.data
    const result: ScheduleItem[] = []
    subjects.forEach((item, idx) => {
      // Kiểm tra xem có môn nào trước đó bị trùng với môn này không
      const isConflictWithPrevious = result.some((prev) => {
        return (
          prev.thu === item.thu &&
          ((prev.tiet <= item.tiet && prev.tiet + prev.so_tiet > item.tiet) ||
            (item.tiet <= prev.tiet && item.tiet + item.so_tiet > prev.tiet))
        )
      })
      if (!isConflictWithPrevious) {
        result.push(item)
      }
      // Nếu bị trùng với môn trước đó thì không push vào result
    })
    return result
  }

  // Hàm lấy danh sách các môn bị trùng tiết
  const getConflictedSubjects = () => {
    if (!scheduleData) return []
    const subjects = scheduleData.data
    const conflicts: { items: ScheduleItem[]; thu: number; tiet: number }[] = []
    // Duyệt từng tiết, từng ngày
    for (let thu = 0; thu <= 7; thu++) {
      for (let tiet = 1; tiet <= 10; tiet++) {
        // Tìm các môn học chiếm tiết này
        const overlapped = subjects.filter(
          (item) =>
            item.thu === thu &&
            item.tiet <= tiet &&
            item.tiet + item.so_tiet - 1 >= tiet
        )
        if (overlapped.length > 1) {
          // Nếu có nhiều hơn 1 môn chiếm tiết này thì bị trùng
          // Kiểm tra đã thêm chưa (tránh lặp lại)
          const alreadyAdded = conflicts.some(
            (c) => c.thu === thu && c.tiet === tiet
          )
          if (!alreadyAdded) {
            conflicts.push({ items: overlapped, thu, tiet })
          }
        }
      }
    }
    return conflicts
  }

  const getScheduleItem = (day: number, period: number) => {
    if (!scheduleData) return null
    return scheduleData.data.find((item) => item.thu === day && item.tiet === period)
  }

  const getScheduleItems = (day: number, period: number) => {
    if (!scheduleData) return []
    // Chỉ lấy các môn không bị trùng tiết
    const nonConflicted = getNonConflictedSubjects()
    return nonConflicted.filter((item) => {
      return item.thu === day && item.tiet <= period && item.tiet + item.so_tiet - 1 >= period
    })
  }

  const shouldRenderCell = (day: number, period: number) => {
    const items = getScheduleItems(day, period)
    if (items.length === 0) return { render: true, item: null }

    const item = items[0]
    return {
      render: item.tiet === period,
      item: item,
      rowSpan: item.so_tiet,
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold text-blue-600">Quản lý TKB</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-start justify-between">
              <div className="flex flex-col gap-4 min-w-80">
                <div
                  className={`
                    border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
                    ${
                      isDragOver
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                    }
                    ${isProcessing ? "pointer-events-none opacity-50" : ""}
                  `}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={handleClickUpload}
                >
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium text-blue-600">Nhấp để chọn file</span> hoặc kéo thả file JSON vào
                      đây
                    </div>
                    <div className="text-xs text-gray-500">Hỗ trợ file JSON (tối đa 10MB)</div>
                  </div>
                </div>

                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isProcessing}
                />

                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Đang xử lý...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {selectedFile && !isProcessing && (
                  <div className="text-sm text-gray-600 bg-gray-100 p-3 rounded">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{selectedFile.name}</div>
                        <div className="text-xs">{(selectedFile.size / 1024).toFixed(1)} KB</div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearData}
                        className="text-red-600 hover:text-red-700 bg-transparent"
                      >
                        Xóa
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Dialog open={isAddSubjectOpen} onOpenChange={setIsAddSubjectOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="bg-green-500 text-white hover:bg-green-600"
                      style={{ width: "80px" }}
                    >
                      Thêm môn
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Thêm môn học mới</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="ten">Tên môn học *</Label>
                        <Input
                          id="ten"
                          value={newSubject.ten}
                          onChange={(e) => setNewSubject({ ...newSubject, ten: e.target.value })}
                          placeholder="Ví dụ: Lập trình Web"
                        />
                      </div>
                      <div>
                        <Label htmlFor="mhp">Mã học phần *</Label>
                        <Input
                          id="mhp"
                          value={newSubject.mhp}
                          onChange={(e) => setNewSubject({ ...newSubject, mhp: e.target.value })}
                          placeholder="Ví dụ: IT4409"
                        />
                      </div>
                      <div>
                        <Label htmlFor="nhom">Nhóm</Label>
                        <Input
                          id="nhom"
                          value={newSubject.nhom}
                          onChange={(e) => setNewSubject({ ...newSubject, nhom: e.target.value })}
                          placeholder="Ví dụ: 01"
                        />
                      </div>
                      <div className="text-sm text-gray-600 mb-2">Thông tin thời gian (tùy chọn):</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="thu">Thứ</Label>
                          <Select
                            value={newSubject.thu.toString()}
                            onValueChange={(value) => setNewSubject({ ...newSubject, thu: Number.parseInt(value) })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">Chủ nhật</SelectItem>
                              <SelectItem value="2">Thứ 2</SelectItem>
                              <SelectItem value="3">Thứ 3</SelectItem>
                              <SelectItem value="4">Thứ 4</SelectItem>
                              <SelectItem value="5">Thứ 5</SelectItem>
                              <SelectItem value="6">Thứ 6</SelectItem>
                              <SelectItem value="7">Thứ 7</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="tiet">Tiết bắt đầu</Label>
                          <Select
                            value={newSubject.tiet.toString()}
                            onValueChange={(value) => setNewSubject({ ...newSubject, tiet: Number.parseInt(value) })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {periods.map((period) => (
                                <SelectItem key={period} value={period.toString()}>
                                  Tiết {period}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="so_tiet">Số tiết</Label>
                        <Select
                          value={newSubject.so_tiet.toString()}
                          onValueChange={(value) => setNewSubject({ ...newSubject, so_tiet: Number.parseInt(value) })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 tiết</SelectItem>
                            <SelectItem value="2">2 tiết</SelectItem>
                            <SelectItem value="3">3 tiết</SelectItem>
                            <SelectItem value="4">4 tiết</SelectItem>
                            <SelectItem value="5">5 tiết</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="giang_vien">Giảng viên</Label>
                        <Input
                          id="giang_vien"
                          value={newSubject.giang_vien}
                          onChange={(e) => setNewSubject({ ...newSubject, giang_vien: e.target.value })}
                          placeholder="Ví dụ: TS. Nguyễn Văn A"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phong">Phòng học</Label>
                        <Input
                          id="phong"
                          value={newSubject.phong}
                          onChange={(e) => setNewSubject({ ...newSubject, phong: e.target.value })}
                          placeholder="Ví dụ: TC-201"
                        />
                      </div>
                      <div>
                        <Label htmlFor="so_tc">Số tín chỉ</Label>
                        <Input
                          id="so_tc"
                          type="number"
                          min={0}
                          value={newSubject.so_tc === undefined ? "" : newSubject.so_tc}
                          onChange={(e) => setNewSubject({ ...newSubject, so_tc: e.target.value === "" ? undefined : Number(e.target.value) })}
                          placeholder="Ví dụ: 3"
                        />
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button onClick={handleAddSubject} className="flex-1">
                          Thêm môn học
                        </Button>
                        <Button variant="outline" onClick={() => setIsAddSubjectOpen(false)}>
                          Hủy
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  onClick={handleClearAll}
                  variant="destructive"
                  className="bg-red-500 text-white hover:bg-red-600"
                  style={{ width: "80px" }}
                >
                  Xóa hết
                </Button>

                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    className="bg-gray-600 text-white hover:bg-gray-700 text-xs px-2"
                    onClick={handleExportGrouped}
                    disabled={!scheduleData}
                    title="Xuất JSON định dạng nhóm"
                    style={{ width: "80px" }}
                  >
                    Tải json
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-blue-500 text-white hover:bg-blue-600 text-xs px-2"
                    onClick={handleExportImage}
                    disabled={!scheduleData || isExporting}
                    title="Xuất ảnh PNG"
                    style={{ width: "80px" }}
                  >
                    {isExporting ? "Đang xuất..." : "Tải ảnh"}
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-purple-500 text-white hover:bg-purple-600 text-xs px-2"
                    onClick={handlePrint}
                    disabled={!scheduleData}
                    title="In thời khóa biểu"
                    style={{ width: "80px" }}
                  >
                    In TKB
                  </Button>
                </div>
              </div>
            </div>

            {error && (
              <Alert className="mt-4 border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            {scheduleData && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="font-medium text-green-800">Dữ liệu đã được tải thành công</span>
                </div>
                <div className="text-sm text-green-700 space-y-1">
                  <p>
                    <strong>Tên:</strong> {scheduleData.name}
                  </p>
                  <p>
                    <strong>Tạo lúc:</strong> {new Date(scheduleData.created).toLocaleString("vi-VN")}
                  </p>
                  <p>
                    <strong>Tổng số buổi học:</strong> {scheduleData.data.length}
                  </p>
                  <p>
                    <strong>Số môn học khác nhau:</strong> {new Set(scheduleData.data.map((item) => item.mhp)).size}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {scheduleData && scheduleData.data.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Danh sách môn học ({scheduleData.data.length} môn)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-2 py-1 text-xs">STT</th>
                      <th className="border border-gray-300 px-2 py-1 text-xs">Tên môn học</th>
                      <th className="border border-gray-300 px-2 py-1 text-xs">Mã HP</th>
                      <th className="border border-gray-300 px-2 py-1 text-xs">Nhóm</th>
                      <th className="border border-gray-300 px-2 py-1 text-xs">Thứ</th>
                      <th className="border border-gray-300 px-2 py-1 text-xs">Tiết</th>
                      <th className="border border-gray-300 px-2 py-1 text-xs">Số tiết</th>
                      <th className="border border-gray-300 px-2 py-1 text-xs">Giảng viên</th>
                      <th className="border border-gray-300 px-2 py-1 text-xs">Phòng</th>
                      <th className="border border-gray-300 px-2 py-1 text-xs">Số tín chỉ</th>
                      <th className="border border-gray-300 px-2 py-1 text-xs">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheduleData.data.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-2 py-1 text-xs text-center">{index + 1}</td>
                        <td className="border border-gray-300 px-2 py-1 text-xs">{item.ten}</td>
                        <td className="border border-gray-300 px-2 py-1 text-xs text-center">{item.mhp}</td>
                        <td className="border border-gray-300 px-2 py-1 text-xs text-center">{item.nhom}</td>
                        <td className="border border-gray-300 px-2 py-1 text-xs text-center">
                          {item.thu === 0 ? "CN" : item.thu ? `Thứ ${item.thu}` : "-"}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-xs text-center">{item.tiet || "-"}</td>
                        <td className="border border-gray-300 px-2 py-1 text-xs text-center">{item.so_tiet || "-"}</td>
                        <td className="border border-gray-300 px-2 py-1 text-xs">{item.giang_vien || "-"}</td>
                        <td className="border border-gray-300 px-2 py-1 text-xs text-center">{item.phong || "-"}</td>
                        <td className="border border-gray-300 px-2 py-1 text-xs text-center">{item.so_tc ?? "-"}</td>
                        <td className="border border-gray-300 px-2 py-1 text-xs">
                          <div className="flex gap-1">
                            <Button
                              size="default"
                              variant="outline"
                              className="h-10 px-4 text-base bg-transparent"
                              style={{ width: "80px", fontSize: "12px" }}
                              onClick={() => handleEditSubject(item)}
                            >
                              Sửa
                            </Button>
                            <Button
                              size="default"
                              variant="outline"
                              className="h-10 px-4 text-base bg-red-500 text-white hover:bg-red-600"
                              style={{ width: "80px", fontSize: "12px" }}
                              onClick={() => handleDeleteSubject(item)}
                            >
                              Xóa
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-100 to-gray-200">
                    <th className="border border-gray-400 p-3 font-bold text-gray-700 sticky left-0 bg-gray-100 z-10">
                      TIẾT
                    </th>
                    {dayLabels.map((label, idx) => (
                      <th key={label} className="border border-gray-400 p-3 font-bold text-gray-700 min-w-40">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {periods.map((period) => (
                    <tr key={period} className="hover:bg-gray-50 transition-colors">
                      <td className="border border-gray-400 p-3 text-center font-semibold bg-gray-50 sticky left-0 z-10">
                        {period}
                      </td>
                      {days.map((day) => {
                        const cellInfo = shouldRenderCell(day, period)

                        if (!cellInfo.render) {
                          return null
                        }

                        return (
                          <td
                            key={`${period}-${day}`}
                            className="border border-gray-400 p-1 relative"
                            style={{
                              height: cellInfo.item ? `${cellInfo.rowSpan * 4}rem` : "4rem",
                              minHeight: "4rem",
                            }}
                            rowSpan={cellInfo.item ? cellInfo.rowSpan : 1}
                          >
                            {cellInfo.item && (
                              <div
                                className="text-xs p-2 rounded-md h-full flex flex-col justify-center border-2 shadow-sm hover:shadow-md transition-shadow"
                                style={{
                                  backgroundColor: getCourseColor(cellInfo.item.mhp).bg,
                                  color: getCourseColor(cellInfo.item.mhp).text,
                                  borderColor: getCourseColor(cellInfo.item.mhp).border,
                                }}
                              >
                                <div className="font-bold text-center mb-1 leading-tight">{cellInfo.item.ten}</div>
                                <div className="text-center opacity-90 text-xs">
                                  {cellInfo.item.mhp} - {cellInfo.item.nhom}
                                </div>
                                <div className="text-center mt-1 font-medium">{cellInfo.item.giang_vien}</div>
                                <div className="text-center font-medium">{cellInfo.item.phong}</div>
                                {cellInfo.item.so_tiet > 1 && (
                                  <div className="text-center text-xs opacity-75 mt-1">
                                    ({cellInfo.item.so_tiet} tiết)
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Hiển thị thông tin môn trùng tiết */}
            {scheduleData && getConflictedSubjects().length > 0 && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="font-bold text-red-700 mb-2">Các môn bị trùng tiết:</div>
                <ul className="list-disc pl-6 space-y-2">
                  {getConflictedSubjects().map((conf, idx) => (
                    <li key={idx} className="text-sm text-red-700">
                      <span>
                        <strong>
                          {conf.thu === 0 ? "Chủ nhật" : `Thứ ${conf.thu}`}, Tiết {conf.tiet}:
                        </strong>
                      </span>
                      <span className="ml-2">
                        {conf.items.map((item, i) => (
                          <span key={i}>
                            {item.ten} ({item.mhp} - {item.nhom})
                            {i < conf.items.length - 1 ? ", " : ""}
                          </span>
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>


        <Dialog open={isEditSubjectOpen} onOpenChange={setIsEditSubjectOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa môn học</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-ten">Tên môn học *</Label>
                <Input
                  id="edit-ten"
                  value={newSubject.ten}
                  onChange={(e) => setNewSubject({ ...newSubject, ten: e.target.value })}
                  placeholder="Ví dụ: Lập trình Web"
                />
              </div>
              <div>
                <Label htmlFor="edit-mhp">Mã học phần *</Label>
                <Input
                  id="edit-mhp"
                  value={newSubject.mhp}
                  onChange={(e) => setNewSubject({ ...newSubject, mhp: e.target.value })}
                  placeholder="Ví dụ: IT4409"
                />
              </div>
              <div>
                <Label htmlFor="edit-nhom">Nhóm</Label>
                <Input
                  id="edit-nhom"
                  value={newSubject.nhom}
                  onChange={(e) => setNewSubject({ ...newSubject, nhom: e.target.value })}
                  placeholder="Ví dụ: 01"
                />
              </div>
              <div className="text-sm text-gray-600 mb-2">Thông tin thời gian (tùy chọn):</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="edit-thu">Thứ</Label>
                  <Select
                    value={newSubject.thu.toString()}
                    onValueChange={(value) => setNewSubject({ ...newSubject, thu: Number.parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Chủ nhật</SelectItem>
                      <SelectItem value="2">Thứ 2</SelectItem>
                      <SelectItem value="3">Thứ 3</SelectItem>
                      <SelectItem value="4">Thứ 4</SelectItem>
                      <SelectItem value="5">Thứ 5</SelectItem>
                      <SelectItem value="6">Thứ 6</SelectItem>
                      <SelectItem value="7">Thứ 7</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-tiet">Tiết bắt đầu</Label>
                  <Select
                    value={newSubject.tiet.toString()}
                    onValueChange={(value) => setNewSubject({ ...newSubject, tiet: Number.parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {periods.map((period) => (
                        <SelectItem key={period} value={period.toString()}>
                          Tiết {period}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-so_tiet">Số tiết</Label>
                <Select
                  value={newSubject.so_tiet.toString()}
                  onValueChange={(value) => setNewSubject({ ...newSubject, so_tiet: Number.parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 tiết</SelectItem>
                    <SelectItem value="2">2 tiết</SelectItem>
                    <SelectItem value="3">3 tiết</SelectItem>
                    <SelectItem value="4">4 tiết</SelectItem>
                    <SelectItem value="5">5 tiết</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-giang_vien">Giảng viên</Label>
                <Input
                  id="edit-giang_vien"
                  value={newSubject.giang_vien}
                  onChange={(e) => setNewSubject({ ...newSubject, giang_vien: e.target.value })}
                  placeholder="Ví dụ: TS. Nguyễn Văn A"
                />
              </div>
              <div>
                <Label htmlFor="edit-phong">Phòng học</Label>
                <Input
                  id="edit-phong"
                  value={newSubject.phong}
                  onChange={(e) => setNewSubject({ ...newSubject, phong: e.target.value })}
                  placeholder="Ví dụ: TC-201"
                />
              </div>
              <div>
                <Label htmlFor="edit-so_tc">Số tín chỉ</Label>
                <Input
                  id="edit-so_tc"
                  type="number"
                  min={0}
                  value={newSubject.so_tc === undefined ? "" : newSubject.so_tc}
                  onChange={(e) => setNewSubject({ ...newSubject, so_tc: e.target.value === "" ? undefined : Number(e.target.value) })}
                  placeholder="Ví dụ: 3"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveEditedSubject} className="flex-1">
                  Lưu thay đổi
                </Button>
                <Button variant="outline" onClick={() => setIsEditSubjectOpen(false)}>
                  Hủy
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Xác nhận xóa môn học</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>Bạn có chắc chắn muốn xóa môn học này không?</p>
              {subjectToDelete && (
                <div className="bg-gray-100 p-3 rounded">
                  <p>
                    <strong>Tên:</strong> {subjectToDelete.ten}
                  </p>
                  <p>
                    <strong>Mã HP:</strong> {subjectToDelete.mhp}
                  </p>
                  <p>
                    <strong>Nhóm:</strong> {subjectToDelete.nhom}
                  </p>
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <Button onClick={confirmDeleteSubject} variant="destructive" className="flex-1">
                  Xóa
                </Button>
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                  Hủy
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showClearAllConfirm} onOpenChange={setShowClearAllConfirm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Xác nhận xóa tất cả</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>Bạn có chắc chắn muốn xóa toàn bộ thời khóa biểu không?</p>
              <p className="text-red-600 text-sm">Hành động này không thể hoàn tác!</p>
              <div className="flex gap-2 pt-4">
                <Button onClick={confirmClearAll} variant="destructive" className="flex-1">
                  Xóa tất cả
                </Button>
                <Button variant="outline" onClick={() => setShowClearAllConfirm(false)}>
                  Hủy
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showJsonPreview} onOpenChange={setShowJsonPreview}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>
                Xem trước dữ liệu xuất -{" "}
                {exportType === "grouped" ? "JSON Nhóm" : exportType === "flat" ? "JSON Phẳng" : "CSV"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-gray-100 p-4 rounded max-h-96 overflow-auto">
                <pre className="text-sm whitespace-pre-wrap">
                  {exportType === "csv" ? previewData : JSON.stringify(previewData, null, 2)}
                </pre>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={confirmExportJson} className="flex-1">
                  Tải xuống
                </Button>
                <Button variant="outline" onClick={() => setShowJsonPreview(false)}>
                  Hủy
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showImagePreview} onOpenChange={setShowImagePreview}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Xem trước ảnh thời khóa biểu</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {imagePreviewUrl && (
                <div className="flex justify-center">
                  <img src={imagePreviewUrl} alt="Preview TKB" className="rounded shadow max-w-full max-h-[500px]" />
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => {
                    if (imagePreviewUrl) {
                      const a = document.createElement("a")
                      a.href = imagePreviewUrl
                      a.download = `tkb-preview-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.png`
                      a.click()
                    }
                  }}
                  className="flex-1"
                  disabled={!imagePreviewUrl}
                >
                  Tải ảnh
                </Button>
                <Button variant="outline" onClick={() => setShowImagePreview(false)}>
                  Đóng
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {scheduleData && (
          <Card className="mt-4" data-legend>
            <CardHeader>
              <CardTitle className="text-lg">Chú thích môn học</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {Array.from(new Set(scheduleData.data.map((item) => item.mhp))).map((courseCode) => {
                  const courseItem = scheduleData.data.find((item) => item.mhp === courseCode)!
                  const colors = getCourseColor(courseCode)
                  return (
                    <div key={courseCode} className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded border-2"
                        style={{
                          backgroundColor: colors.bg,
                          borderColor: colors.border,
                        }}
                      ></div>
                      <span className="text-sm font-medium">{courseItem.ten}</span>
                      <span className="text-xs text-gray-500">({courseCode})</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-2 text-center">
        <div className="mt-6 text-center text-sm text-gray-500">Smurf-TKB-v1.0.0</div>
          <a
            href="https://forms.gle/qcJUaibM26YB4ig4A"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
          >
            Gửi góp ý hoặc phản hồi cho Smurf-TKB
          </a>
        </div>
      </div>
    </div>
  )
}
