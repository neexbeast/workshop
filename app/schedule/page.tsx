"use client"

import { useState, useEffect } from "react"
import { ClientLayout } from "@/components/client/client-layout"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/lib/firebase/auth-hooks"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { Loader2, Clock } from "lucide-react"
import { useRouter } from "next/navigation"

interface TimeSlot {
  time: string
  available: boolean
}

interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  vin: string
}

const serviceTypes = [
  "Oil Change",
  "Tire Rotation",
  "Brake Service",
  "Engine Diagnostic",
  "General Maintenance",
  "Air Conditioning",
  "Transmission Service",
  "Battery Service",
  "Wheel Alignment",
  "Exhaust System",
]

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [selectedVehicle, setSelectedVehicle] = useState<string>("")
  const [selectedService, setSelectedService] = useState<string>("")
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  
  const auth = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  // Fetch user's vehicles
  const fetchVehicles = async () => {
    if (!auth.firebaseUser) return

    setIsLoadingVehicles(true)
    try {
      const token = await auth.firebaseUser.getIdToken()
      console.log("Fetching vehicles with token...")
      
      const response = await fetch("/api/vehicles", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error response from vehicles API:", errorData)
        throw new Error(errorData.error || "Failed to fetch vehicles")
      }

      const data = await response.json()
      console.log("Received vehicles data:", data)
      
      if (!data.vehicles) {
        console.error("No vehicles array in response:", data)
        throw new Error("Invalid response format")
      }

      setVehicles(data.vehicles)
    } catch (error) {
      console.error("Error fetching vehicles:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch your vehicles. Please try again.",
        variant: "destructive",
      })
      setVehicles([])
    } finally {
      setIsLoadingVehicles(false)
    }
  }

  // Fetch available time slots
  const fetchTimeSlots = async (date: Date) => {
    if (!auth.firebaseUser) return

    setIsLoadingSlots(true)
    try {
      const token = await auth.firebaseUser.getIdToken()
      const response = await fetch(`/api/availability?date=${format(date, "yyyy-MM-dd")}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch availability")
      }

      const data = await response.json()
      
      // Only show available time slots
      setTimeSlots(data.timeSlots?.filter((slot: TimeSlot) => slot.available) || [])
    } catch (error) {
      console.error("Error fetching time slots:", error)
      toast({
        title: "Error",
        description: "Failed to fetch available time slots",
        variant: "destructive",
      })
      setTimeSlots([])
    } finally {
      setIsLoadingSlots(false)
    }
  }

  // Effect to fetch vehicles when component mounts
  useEffect(() => {
    if (auth.user) {
      fetchVehicles()
    }
  }, [auth.user, fetchVehicles])

  // Effect to fetch time slots when date changes
  useEffect(() => {
    fetchTimeSlots(selectedDate)
  }, [selectedDate, fetchTimeSlots])

  const handleScheduleService = async () => {
    if (!auth.firebaseUser) {
      toast({
        title: "Error",
        description: "You must be logged in to schedule a service",
        variant: "destructive",
      })
      return
    }

    if (!selectedVehicle || !selectedService || !selectedTime) {
      toast({
        title: "Error",
        description: "Please select a vehicle, service type, and time slot",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const token = await auth.firebaseUser.getIdToken()
      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          vehicleId: selectedVehicle,
          serviceType: selectedService,
          scheduledTime: `${format(selectedDate, "yyyy-MM-dd")}T${selectedTime}`,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to schedule service")
      }

      toast({
        title: "Success",
        description: "Your service has been scheduled successfully.",
      })
      
      // Close the confirmation dialog
      setIsConfirmDialogOpen(false)
      
      // Reset form
      setSelectedTime("")
      setSelectedService("")
      
      // Refresh time slots
      fetchTimeSlots(selectedDate)
      
      // Redirect to services page
      router.push("/services")
    } catch (error) {
      console.error("Error scheduling service:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to schedule service",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const selectedVehicleInfo = vehicles.find(v => v.id === selectedVehicle)

  return (
    <ClientLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Schedule Service</h1>
          <p className="text-muted-foreground">Book a service appointment for your vehicle</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Service Details</CardTitle>
              <CardDescription>Select your vehicle and service type</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Vehicle</Label>
                <Select value={selectedVehicle} onValueChange={setSelectedVehicle} disabled={isLoadingVehicles}>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingVehicles ? "Loading vehicles..." : "Select a vehicle"} />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.make} {vehicle.model} ({vehicle.year}) - {vehicle.vin}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Service Type</Label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Select Date & Time</CardTitle>
              <CardDescription>Choose your preferred appointment time</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                disabled={(date) =>
                  date < new Date() || // Can't select past dates
                  date.getDay() === 0 || // Sunday
                  date.getDay() === 6 // Saturday
                }
                className="rounded-md border"
              />

              <div className="space-y-2">
                <Label>Available Time Slots</Label>
                {isLoadingSlots ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : timeSlots.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground">
                    No available time slots for this date.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map((slot) => (
                      <Button
                        key={slot.time}
                        variant={selectedTime === slot.time ? "default" : "outline"}
                        className="w-full"
                        onClick={() => setSelectedTime(slot.time)}
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        {slot.time ? format(new Date(`2000-01-01T${slot.time}`), "h:mm a") : ""}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button
            size="lg"
            onClick={() => setIsConfirmDialogOpen(true)}
            disabled={!selectedVehicle || !selectedService || !selectedTime}
          >
            Schedule Service
          </Button>
        </div>

        <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Service Appointment</DialogTitle>
              <DialogDescription>
                Please review your service appointment details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {selectedVehicleInfo && (
                <div className="space-y-1">
                  <Label>Vehicle</Label>
                  <p className="text-sm">
                    {selectedVehicleInfo.make} {selectedVehicleInfo.model} ({selectedVehicleInfo.year})
                  </p>
                  <p className="text-sm text-muted-foreground">VIN: {selectedVehicleInfo.vin}</p>
                </div>
              )}
              <div className="space-y-1">
                <Label>Service</Label>
                <p className="text-sm">{selectedService}</p>
              </div>
              <div className="space-y-1">
                <Label>Date & Time</Label>
                <p className="text-sm">
                  {format(selectedDate, "MMMM d, yyyy")} at{" "}
                  {selectedTime ? format(new Date(`2000-01-01T${selectedTime}`), "h:mm a") : ""}
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleScheduleService} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  "Confirm Appointment"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ClientLayout>
  )
} 