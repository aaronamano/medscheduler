"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Upload, Activity, Calendar, Clock, Pill, Download } from "lucide-react"
import { MedicationGrid } from "@/components/medication-grid"

export interface Medication {
  id: string
  name: string
  image?: string
  notes: string
  frequency: string
  dosage: string
  timesTaken: number
  totalDoses: number
}

export default function MedicationDashboard() {
  const [medications, setMedications] = useState<Medication[]>([
    {
      id: "1",
      name: "Aspirin",
      notes: "Take with food to avoid stomach upset",
      frequency: "Daily",
      dosage: "81mg",
      timesTaken: 28,
      totalDoses: 30,
    },
    {
      id: "2",
      name: "Vitamin D3",
      notes: "Best absorbed with fatty meal",
      frequency: "Daily",
      dosage: "1000 IU",
      timesTaken: 25,
      totalDoses: 30,
    },
  ])

  const [newMedication, setNewMedication] = useState({
    name: "",
    notes: "",
    frequency: "",
    dosage: "",
  })

  const addMedication = () => {
    if (newMedication.name && newMedication.frequency) {
      const medication: Medication = {
        id: Date.now().toString(),
        name: newMedication.name,
        notes: newMedication.notes,
        frequency: newMedication.frequency,
        dosage: newMedication.dosage,
        timesTaken: 0,
        totalDoses: getFrequencyDoses(newMedication.frequency),
      }
      setMedications([...medications, medication])
      setNewMedication({ name: "", notes: "", frequency: "", dosage: "" })
    }
  }

  const deleteMedication = (id: string) => {
    setMedications(medications.filter((med) => med.id !== id))
  }

  const getFrequencyDoses = (frequency: string) => {
    switch (frequency) {
      case "Daily":
        return 30
      case "Twice Daily":
        return 60
      case "Three Times Daily":
        return 90
      case "Weekly":
        return 4
      case "As Needed":
        return 10
      default:
        return 30
    }
  }

  const getAdherenceRate = () => {
    if (medications.length === 0) return 0
    const totalTaken = medications.reduce((sum, med) => sum + med.timesTaken, 0)
    const totalExpected = medications.reduce((sum, med) => sum + med.totalDoses, 0)
    return Math.round((totalTaken / totalExpected) * 100)
  }

  const exportToPDF = async () => {
    const { jsPDF } = await import("jspdf")
    const doc = new jsPDF()

    // Add title
    doc.setFontSize(20)
    doc.text("Medication Dashboard", 20, 20)

    // Add date
    doc.setFontSize(12)
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35)

    // Add medications table
    let yPosition = 50
    doc.setFontSize(14)
    doc.text("Medications:", 20, yPosition)
    yPosition += 10

    medications.forEach((med, index) => {
      doc.setFontSize(10)
      doc.text(`${index + 1}. ${med.name}`, 20, yPosition)
      doc.text(`Dosage: ${med.dosage}`, 80, yPosition)
      doc.text(`Frequency: ${med.frequency}`, 130, yPosition)
      yPosition += 5
      if (med.notes) {
        doc.text(`Notes: ${med.notes.substring(0, 50)}${med.notes.length > 50 ? "..." : ""}`, 25, yPosition)
        yPosition += 5
      }
      yPosition += 5
    })

    doc.save("medication-dashboard.pdf")
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Medication Dashboard</h1>
            <p className="text-muted-foreground">Track your medications and monitor adherence</p>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild variant="outline">
              <Link href="/login">Login</Link>
            </Button>
            <Button onClick={exportToPDF} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Activity className="mr-2 h-4 w-4" />
              {getAdherenceRate()}% Adherence
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Medications</CardTitle>
              <Pill className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{medications.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Doses</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {medications.filter((med) => med.frequency.includes("Daily")).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Adherence Rate</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getAdherenceRate()}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Dose</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2:00 PM</div>
            </CardContent>
          </Card>
        </div>

        {/* Add Medication Form */}
        <Card>
          <CardHeader>
            <CardTitle>Add New Medication</CardTitle>
            <CardDescription>Enter details for a new medication</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Medication Name</Label>
                <Input
                  id="name"
                  placeholder="Enter medication name"
                  value={newMedication.name}
                  onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dosage">Dosage</Label>
                <Input
                  id="dosage"
                  placeholder="e.g., 10mg, 1 tablet"
                  value={newMedication.dosage}
                  onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={newMedication.frequency}
                  onValueChange={(value) => setNewMedication({ ...newMedication, frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Twice Daily">Twice Daily</SelectItem>
                    <SelectItem value="Three Times Daily">Three Times Daily</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="As Needed">As Needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Medication Image</Label>
                <div className="flex items-center justify-center w-full h-20 border-2 border-dashed border-border rounded-lg bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors">
                  <div className="text-center">
                    <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
                    <p className="mt-1 text-xs text-muted-foreground">Upload image</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes or instructions"
                value={newMedication.notes}
                onChange={(e) => setNewMedication({ ...newMedication, notes: e.target.value })}
                className="min-h-[80px]"
              />
            </div>
            <Button onClick={addMedication} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Medication
            </Button>
          </CardContent>
        </Card>

        {/* Medication Grid */}
        <MedicationGrid medications={medications} onDelete={deleteMedication} onExportPDF={exportToPDF} />
      </div>
    </div>
  )
}
