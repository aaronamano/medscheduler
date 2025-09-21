"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Upload, Activity, Calendar, Clock, Pill, Download, X } from "lucide-react"
import { MedicationGrid } from "@/components/medication-grid"

export interface Medication {
  _id: string
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

interface ApiMedication {
  _id: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: {
    startDate: string;
    endDate: string;
  };
  notes: string;
  imageUrl: string;
  timesTaken?: number;
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
  const [medicationNames, setMedicationNames] = useState<string[]>([])
  const [isOtherSelected, setIsOtherSelected] = useState(false)
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [image, setImage] = useState<string | undefined>("")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [firstName, setFirstName] = useState("")
  const router = useRouter()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setImage(event.target?.result as string)
      }
      reader.readAsDataURL(e.target.files[0])
    }
  }

  useEffect(() => {
    setIsClient(true)

    const fetchInitialData = async () => {
      const token = localStorage.getItem("token")
      if (token) {
        setIsLoggedIn(true)
        try {
          const response = await fetch("/api/auth/user", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          if (response.ok) {
            const data = await response.json()
            if (data.firstName) {
              setFirstName(data.firstName)
            }
            if (data.chart) {
              const mappedMedications = data.chart.map((med: ApiMedication) => ({
                _id: med._id,
                name: med.medication,
                dosage: med.dosage,
                frequency: med.frequency,
                startDate: new Date(med.duration.startDate).toISOString().split("T")[0],
                endDate: new Date(med.duration.endDate).toISOString().split("T")[0],
                notes: med.notes,
                image: med.imageUrl,
                timesTaken: med.timesTaken || 0, // Default to 0 if not present
                totalDoses: getFrequencyDoses(
                  med.frequency,
                  new Date(med.duration.startDate).toISOString().split("T")[0],
                  new Date(med.duration.endDate).toISOString().split("T")[0]
                ),
              }))
              setMedications(mappedMedications)
            }
          } else {
            console.error("Failed to fetch user data")
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
        }
      }
    }

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

    fetchInitialData()
    fetchMedicationNames()
  }, [])

  const addMedication = async () => {
    if (newMedication.name && newMedication.frequency && startDate && endDate) {
      const medicationData = {
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

      try {
        const token = localStorage.getItem("token")
        const response = await fetch("/api/medicines", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(medicationData),
        })

        if (response.ok) {
          const newMedFromDb = await response.json();
          const newMed = {
            _id: newMedFromDb._id,
            name: newMedFromDb.medication,
            dosage: newMedFromDb.dosage,
            frequency: newMedFromDb.frequency,
            startDate: new Date(newMedFromDb.duration.startDate).toISOString().split("T")[0],
            endDate: new Date(newMedFromDb.duration.endDate).toISOString().split("T")[0],
            notes: newMedFromDb.notes,
            image: newMedFromDb.imageUrl,
            timesTaken: 0,
            totalDoses: getFrequencyDoses(
              newMedFromDb.frequency,
              new Date(newMedFromDb.duration.startDate).toISOString().split("T")[0],
              new Date(newMedFromDb.duration.endDate).toISOString().split("T")[0]
            ),
          };
          setMedications([...medications, newMed]);
          setNewMedication({ name: "", notes: "", frequency: "", dosage: "" });
          setStartDate("");
          setEndDate("");
          setImage("");
        } else {
          console.error("Failed to add medication");
        }
      } catch (error) {
        console.error("Error adding medication:", error)
      }
    }
  }

  const deleteMedication = async (id: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/medicines?id=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setMedications(medications.filter((med) => med._id !== id))
      } else {
        console.error("Failed to delete medication")
      }
    } catch (error) {
      console.error("Error deleting medication:", error)
    }
  }

  const handleEditClick = (medication: Medication) => {
    setEditingMedication(medication);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingMedication(null);
    setIsEditModalOpen(false);
  };

  const handleSaveEdit = async () => {
    if (!editingMedication) return;

    try {
        const token = localStorage.getItem("token");
        const response = await fetch('/api/medicines', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(editingMedication),
        });

        if (response.ok) {
            setMedications(medications.map(med => med._id === editingMedication._id ? editingMedication : med));
            handleCloseModal();
        } else {
            console.error('Failed to save medication');
        }
    } catch (error) {
        console.error('Error saving medication:', error);
    }
  };

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
    if (totalExpected === 0) return 0
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

  const handleLogout = () => {
    localStorage.removeItem("token")
    setIsLoggedIn(false)
    setFirstName("")
    router.push("/")
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
            {isLoggedIn ? (
              <>
                <span className="text-foreground">Welcome, {firstName}</span>
                <Button onClick={handleLogout} variant="outline">
                  Logout
                </Button>
              </>
            ) : (
              <Button asChild variant="outline">
                <Link href="/login">Login</Link>
              </Button>
            )}
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
              <CardTitle className="text-sm font-medium">Today&apos;s Doses</CardTitle>
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
                      setIsOtherSelected(true)
                      setNewMedication({ ...newMedication, name: "" })
                    } else {
                      setIsOtherSelected(false)
                      setNewMedication({ ...newMedication, name: value })
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
                    <Image src={image} alt="Medication Image" className="h-full w-full object-cover rounded-lg" layout="fill" />
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
        <MedicationGrid medications={medications} onDelete={deleteMedication} onExportPDF={exportToPDF} onEdit={handleEditClick} />

        {/* Edit Medication Modal */}
        {isEditModalOpen && editingMedication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl relative">
            <Button onClick={handleCloseModal} variant="ghost" size="icon" className="absolute top-4 right-4 z-10">
                <X className="h-4 w-4" />
              </Button>
              <CardHeader>
                <CardTitle>Edit Medication</CardTitle>
                <CardDescription>Update the details for your medication</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Medication Name</Label>
                    <Input
                      id="edit-name"
                      value={editingMedication.name}
                      onChange={(e) => setEditingMedication({ ...editingMedication, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-dosage">Dosage</Label>
                    <Input
                      id="edit-dosage"
                      value={editingMedication.dosage}
                      onChange={(e) => setEditingMedication({ ...editingMedication, dosage: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-frequency">Frequency</Label>
                    <Select
                      value={editingMedication.frequency}
                      onValueChange={(value) => setEditingMedication({ ...editingMedication, frequency: value })}
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
                    <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground">Image editing not supported yet</p>
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-start-date">Start Date</Label>
                    <Input
                      id="edit-start-date"
                      type="date"
                      value={editingMedication.startDate}
                      onChange={(e) => setEditingMedication({ ...editingMedication, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-end-date">End Date</Label>
                    <Input
                      id="edit-end-date"
                      type="date"
                      value={editingMedication.endDate}
                      onChange={(e) => setEditingMedication({ ...editingMedication, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea
                    id="edit-notes"
                    value={editingMedication.notes}
                    onChange={(e) => setEditingMedication({ ...editingMedication, notes: e.target.value })}
                    className="min-h-[80px]"
                  />
                </div>
                <div className="flex gap-4">
                  <Button onClick={handleSaveEdit} className="w-full">Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}