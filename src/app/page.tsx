"use client"

import { useState, useEffect } from "react"
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
  startDate: string
  endDate: string
}

export default function MedicationDashboard() {
  const [isClient, setIsClient] = useState(false)
  const [medications, setMedications] = useState<Medication[]>([])

  const [newMedication, setNewMedication] = useState({
    name: "",
    notes: "",
    frequency: "",
    dosage: "",
  })
  const [medicationNames, setMedicationNames] = useState<string[]>([]);
  const [isOtherSelected, setIsOtherSelected] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [image, setImage] = useState<string | undefined>("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };
  

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    const fetchMedicationNames = async () => {
      try {
        const response = await fetch("/api/medicines");
        if (response.ok) {
          const data = await response.json();
          setMedicationNames([...data, "Other"]);
        } else {
          console.error("Failed to fetch medication names");
        }
      } catch (error) {
        console.error("Error fetching medication names:", error);
      }
    };

    fetchMedicationNames();
  }, []);

  const addMedication = () => {
    if (newMedication.name && newMedication.frequency && startDate && endDate) {
      const medication: Medication = {
        id: Date.now().toString(),
        name: newMedication.name,
        notes: newMedication.notes,
        frequency: newMedication.frequency,
        dosage: newMedication.dosage,
        timesTaken: 0,
        totalDoses: getFrequencyDoses(newMedication.frequency, startDate, endDate),
        startDate,
        endDate,
        image,
      }
      setMedications([...medications, medication])
      setNewMedication({ name: "", notes: "", frequency: "", dosage: "" });
      setStartDate("");
      setEndDate("");
      setImage("");
    }
  }

  const deleteMedication = (id: string) => {
    setMedications(medications.filter((med) => med.id !== id))
  }

  const getFrequencyDoses = (frequency: string, start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    switch (frequency) {
      case "Daily":
        return diffDays
      case "Twice Daily":
        return diffDays * 2
      case "Three Times Daily":
        return diffDays * 3
      case "Weekly":
        return Math.ceil(diffDays / 7)
      case "As Needed":
        return diffDays // Or some other logic for "As Needed"
      default:
        return diffDays
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

  if (!isClient) {
    return null
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
                <Select
                  value={newMedication.name}
                  onValueChange={(value) => {
                    if (value === "Other") {
                      setIsOtherSelected(true);
                      setNewMedication({ ...newMedication, name: "" });
                    } else {
                      setIsOtherSelected(false);
                      setNewMedication({ ...newMedication, name: value });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select medication" />
                  </SelectTrigger>
                  <SelectContent>
                    {medicationNames.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isOtherSelected && (
                  <Input
                    id="other-name"
                    placeholder="Enter medication name"
                    value={newMedication.name}
                    onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })}
                    className="mt-2"
                  />
                )}
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
                <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors relative">
                  <Input
                    id="image-upload"
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleImageChange}
                  />
                  {image ? (
                    <img src={image} alt="Medication Image" className="h-full w-full object-cover rounded-lg" />
                  ) : (
                    <div className="text-center">
                      <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
                      <p className="mt-1 text-xs text-muted-foreground">Upload image</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
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
