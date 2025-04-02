"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/lib/firebase/auth-hooks"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { Loader2, Clock, User, Car } from "lucide-react"
import { useSchedules, useAvailability, useUpdateAvailability } from "@/lib/api/api-client"

// Default working hours
const defaultWorkingHours = {
  start: "09:00",
  end: "17:00",
  interval: 30,
}

interface TimeSlot {
  time: string
  available: boolean
}

interface WorkingHours {
  start: string
  end: string
  interval: number
}

interface Schedule {
  id: string
  time: string
  customerEmail: string
  vehicleInfo: string
  serviceType: string
}

export default function AdminSchedulePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isEditingHours, setIsEditingHours] = useState(false)
  const [editingWorkingHours, setEditingWorkingHours] = useState<WorkingHours>(defaultWorkingHours)
  const { firebaseUser } = useAuth()
  const { toast } = useToast()

  const { data: availabilityData, isLoading: isLoadingAvailability } = useAvailability(selectedDate)
  const { data: schedulesData, isLoading: isLoadingSchedules } = useSchedules(selectedDate)
  const updateAvailability = useUpdateAvailability()

  const isDateBlocked = availabilityData?.isBlocked ?? false
  const workingHours = availabilityData?.workingHours ?? defaultWorkingHours
  const timeSlots = availabilityData?.timeSlots ?? []
  const schedules = schedulesData?.schedules ?? []

  // Generate time slots for the selected date
  const generateTimeSlots = (hours: WorkingHours) => {
    const slots: TimeSlot[] = []
    const [startHour, startMinute] = hours.start.split(":").map(Number)
    const [endHour, endMinute] = hours.end.split(":").map(Number)
    
    let currentTime = new Date(selectedDate)
    currentTime.setHours(startHour, startMinute, 0, 0)
    
    const endTime = new Date(selectedDate)
    endTime.setHours(endHour, endMinute, 0, 0)
    
    while (currentTime < endTime) {
      slots.push({
        time: format(currentTime, "HH:mm"),
        available: true // Default to available for new slots
      })
      currentTime = new Date(currentTime.getTime() + hours.interval * 60000)
    }
    
    return slots
  }

  const handleTimeSlotChange = (checked: boolean, slotTime: string) => {
    const updatedSlots = timeSlots.map((s: TimeSlot) =>
      s.time === slotTime ? { ...s, available: checked } : s
    )
    handleSaveAvailability(isDateBlocked, workingHours, updatedSlots)
  }

  const handleSaveAvailability = async (
    isBlocked: boolean,
    hours: WorkingHours,
    slots: TimeSlot[]
  ) => {
    if (!firebaseUser) {
      toast({
        title: "Error",
        description: "You must be logged in to save availability",
        variant: "destructive",
      })
      return
    }

    try {
      await updateAvailability.mutateAsync({
        date: format(selectedDate, "yyyy-MM-dd"),
        isBlocked,
        workingHours: hours,
        timeSlots: slots,
      })

      toast({
        title: "Success",
        description: "Availability settings have been saved.",
      })
    } catch (error) {
      console.error("Error saving availability:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save availability settings",
        variant: "destructive",
      })
    }
  }

  const handleSaveWorkingHours = () => {
    setIsEditingHours(false)
    const newSlots = generateTimeSlots(editingWorkingHours)
    handleSaveAvailability(isDateBlocked, editingWorkingHours, newSlots)
    toast({
      title: "Success",
      description: "Working hours have been updated.",
    })
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Schedule Management</h1>
          <p className="text-muted-foreground">Manage your shop&apos;s availability and view appointments</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar and Working Hours */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Date</CardTitle>
                <CardDescription>Choose a date to manage availability</CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            {/* Working Hours Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle>Working Hours</CardTitle>
                  <CardDescription>Set your working hours for this date</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingWorkingHours(workingHours)
                    setIsEditingHours(true)
                  }}
                >
                  Edit Hours
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={isDateBlocked}
                    onCheckedChange={(checked) => handleSaveAvailability(checked, workingHours, timeSlots)}
                    disabled={isLoadingAvailability}
                  />
                  <Label>Block entire day</Label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Time</Label>
                    <p className="text-sm">{workingHours.start}</p>
                  </div>
                  <div>
                    <Label>End Time</Label>
                    <p className="text-sm">{workingHours.end}</p>
                  </div>
                </div>

                <div>
                  <Label>Interval (minutes)</Label>
                  <p className="text-sm">{workingHours.interval}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Time Slots and Scheduled Appointments */}
          <div className="space-y-6">
            {/* Scheduled Appointments Card */}
            <Card>
              <CardHeader>
                <CardTitle>Scheduled Appointments</CardTitle>
                <CardDescription>View appointments for {format(selectedDate, "MMMM d, yyyy")}</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSchedules ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : schedules.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground">
                    No appointments scheduled for this date.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {schedules.map((schedule: Schedule) => (
                      <Card key={schedule.id}>
                        <CardContent className="pt-6">
                          <div className="grid gap-2">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{schedule.time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>{schedule.customerEmail}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Car className="h-4 w-4" />
                              <span>{schedule.vehicleInfo}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Service:</span>
                              <span>{schedule.serviceType}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Time Slots Card */}
            <Card>
              <CardHeader>
                <CardTitle>Time Slots</CardTitle>
                <CardDescription>Manage availability for each time slot</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAvailability ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {timeSlots.map((slot: TimeSlot) => (
                      <div key={slot.time} className="flex items-center space-x-2">
                        <Switch
                          checked={slot.available}
                          onCheckedChange={(checked) => handleTimeSlotChange(checked, slot.time)}
                          disabled={isLoadingAvailability}
                        />
                        <Label>{slot.time}</Label>
                      </div>
                    ))}

                    <Button
                      className="w-full"
                      onClick={() => handleSaveAvailability(isDateBlocked, workingHours, timeSlots)}
                      disabled={isLoadingAvailability}
                    >
                      {isLoadingAvailability ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Availability"
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Working Hours Edit Dialog */}
        <Dialog open={isEditingHours} onOpenChange={setIsEditingHours}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Working Hours</DialogTitle>
              <DialogDescription>
                Set the working hours and interval for this date
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={editingWorkingHours.start}
                    onChange={(e) =>
                      setEditingWorkingHours((prev: WorkingHours) => ({ ...prev, start: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={editingWorkingHours.end}
                    onChange={(e) =>
                      setEditingWorkingHours((prev: WorkingHours) => ({ ...prev, end: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="interval">Interval (minutes)</Label>
                <Select
                  value={editingWorkingHours.interval.toString()}
                  onValueChange={(value) =>
                    setEditingWorkingHours((prev: WorkingHours) => ({ ...prev, interval: parseInt(value) }))
                  }
                >
                  <SelectTrigger id="interval">
                    <SelectValue placeholder="Select interval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveWorkingHours}>Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
} 