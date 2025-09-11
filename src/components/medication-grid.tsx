"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, ImageIcon, Download, Edit, Plus } from "lucide-react"
import type { Medication } from "@/app/page"

interface MedicationGridProps {
  medications: Medication[]
  onDelete: (id: string) => void
  onExportPDF: () => void
}

export function MedicationGrid({ medications, onDelete, onExportPDF }: MedicationGridProps) {
  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case "Daily":
        return "bg-blue-500 text-white"
      case "Twice Daily":
        return "bg-green-500 text-white"
      case "Three Times Daily":
        return "bg-orange-500 text-white"
      case "Weekly":
        return "bg-purple-500 text-white"
      case "As Needed":
        return "bg-gray-500 text-white"
      default:
        return "bg-muted"
    }
  }

  const getAdherenceColor = (taken: number, total: number) => {
    const rate = (taken / total) * 100
    if (rate >= 90) return "bg-green-500"
    if (rate >= 70) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Medication Grid</CardTitle>
            <CardDescription>Interactive grid view of your medications</CardDescription>
          </div>
          <Button onClick={onExportPDF} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {medications.map((medication) => (
            <Card key={medication.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Image Section */}
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                      {medication.image ? (
                        <img
                          src={medication.image || "/placeholder.svg"}
                          alt={medication.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Medication Name */}
                  <div className="text-center">
                    <h3 className="font-semibold text-lg text-foreground">{medication.name}</h3>
                    <Badge variant="outline" className="mt-1">
                      {medication.dosage}
                    </Badge>
                  </div>

                  {/* Frequency */}
                  <div className="flex justify-center">
                    <Badge className={getFrequencyColor(medication.frequency)}>{medication.frequency}</Badge>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="text-muted-foreground">
                        {medication.timesTaken}/{medication.totalDoses}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getAdherenceColor(medication.timesTaken, medication.totalDoses)}`}
                        style={{ width: `${Math.min((medication.timesTaken / medication.totalDoses) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="text-center text-sm font-medium">
                      {Math.round((medication.timesTaken / medication.totalDoses) * 100)}% Complete
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Notes:</p>
                    <p className="text-sm text-foreground bg-muted/50 p-2 rounded text-pretty min-h-[60px]">
                      {medication.notes || "No additional notes"}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(medication.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add New Medication Card */}
          <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-4 h-full flex items-center justify-center">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Add new medication</p>
                <p className="text-xs text-muted-foreground">Use the form above</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {medications.length === 0 && (
          <div className="text-center py-12">
            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No medications added yet</h3>
            <p className="text-muted-foreground">Add your first medication using the form above.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
