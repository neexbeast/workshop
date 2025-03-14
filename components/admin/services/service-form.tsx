"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/firebase/auth-hooks"
import { servicesApi, vehiclesApi } from "@/lib/api/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// Service types for dropdown
const serviceTypes = [
  "Oil Change",
  "Tire Rotation",
  "Brake Replacement",
  "Air Filter Replacement",
  "Battery Check",
  "Transmission Service",
  "Coolant Flush",
  "Spark Plug Replacement",
  "Timing Belt Replacement",
  "General Inspection",
]

interface ServiceFormProps {
  service?: {
    id: string
    vehicleId: string
    serviceType: string
    serviceDate: Date
    mileage: number
    description: string
    parts?: string[]
    cost: number
  }
  vehicleId?: string
  onSuccess?: () => void
  isEdit?: boolean
}

export function ServiceForm({ service, vehicleId, onSuccess, isEdit = false }: ServiceFormProps) {
  const [formData, setFormData] = useState({
    vehicleId: service?.vehicleId || vehicleId || "",
    serviceType: service?.serviceType || "",
    serviceDate: service?.serviceDate ? new Date(service.serviceDate) : new Date(),
    mileage: service?.mileage || 0,
    description: service?.description || "",
    parts: service?.parts?.join(", ") || "",
    cost: service?.cost || 0,
    reminderDate: null as Date | null,
    reminderType: "time",
    mileageThreshold: 5000,
    setReminder: false,
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [vehicles, setVehicles] = useState<any[]>([])
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null)
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchVehicles = async () => {
      if (!user) return

      setIsLoadingVehicles(true)
      try {
        const response = await vehiclesApi.getVehicles(user)
        setVehicles(response.vehicles || [])

        // If we have a vehicleId, find and set the selected vehicle
        if (vehicleId || service?.vehicleId) {
          const id = vehicleId || service?.vehicleId
          const vehicle = response.vehicles.find((v: any) => v._id === id)
          if (vehicle) {
            setSelectedVehicle(vehicle)
            setFormData((prev) => ({
              ...prev,
              mileage: vehicle.mileage || prev.mileage,
            }))
          }
        }
      } catch (err) {
        console.error("Error fetching vehicles:", err)
      } finally {
        setIsLoadingVehicles(false)
      }
    }

    fetchVehicles()
  }, [user, vehicleId, service?.vehicleId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))

    // If vehicle is changed, update the mileage
    if (name === "vehicleId") {
      const vehicle = vehicles.find((v) => v._id === value)
      if (vehicle) {
        setSelectedVehicle(vehicle)
        setFormData((prev) => ({
          ...prev,
          mileage: vehicle.mileage || prev.mileage,
        }))
      }
    }
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: Number.parseFloat(value) || 0 }))
  }

  const handleDateChange = (date: Date | undefined, field: string) => {
    if (date) {
      setFormData((prev) => ({ ...prev, [field]: date }))
    }
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, setReminder: checked }))

    // If reminder is checked, set a default reminder date (6 months from service date)
    if (checked && !formData.reminderDate) {
      const reminderDate = new Date(formData.serviceDate)
      reminderDate.setMonth(reminderDate.getMonth() + 6)
      setFormData((prev) => ({ ...prev, reminderDate }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Prepare the service data
      const serviceData = {
        vehicleId: formData.vehicleId,
        serviceType: formData.serviceType,
        serviceDate: formData.serviceDate.toISOString(),
        mileage: formData.mileage,
        description: formData.description,
        parts: formData.parts ? formData.parts.split(",").map((part) => part.trim()) : [],
        cost: formData.cost,
      }

      // Add reminder data if reminder is set
      if (formData.setReminder) {
        Object.assign(serviceData, {
          reminderDate: formData.reminderDate?.toISOString(),
          reminderType: formData.reminderType,
          mileageThreshold: formData.mileageThreshold,
        })
      }

      if (isEdit && service) {
        await servicesApi.updateService(user, service.id, serviceData)
        toast({
          title: "Service updated",
          description: "Service record has been updated successfully.",
        })
      } else {
        await servicesApi.createService(user, serviceData)
        toast({
          title: "Service added",
          description: "New service record has been added successfully.",
        })
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/admin/services")
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Edit Service Record" : "Add New Service Record"}</CardTitle>
        <CardDescription>
          {isEdit
            ? "Update service information in your database."
            : "Enter service details to add it to your database."}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="vehicleId">Vehicle</Label>
            <Select
              value={formData.vehicleId}
              onValueChange={(value) => handleSelectChange("vehicleId", value)}
              disabled={isLoadingVehicles || !!vehicleId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a vehicle" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingVehicles ? (
                  <div className="flex items-center justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading vehicles...
                  </div>
                ) : (
                  vehicles.map((vehicle) => (
                    <SelectItem key={vehicle._id} value={vehicle._id}>
                      {vehicle.make} {vehicle.model} ({vehicle.year}) - {vehicle.vin}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedVehicle && (
              <p className="text-sm text-muted-foreground mt-1">
                Current mileage: {selectedVehicle.mileage.toLocaleString()} km
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="serviceType">Service Type</Label>
            <Select value={formData.serviceType} onValueChange={(value) => handleSelectChange("serviceType", value)}>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serviceDate">Service Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.serviceDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.serviceDate ? format(formData.serviceDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.serviceDate}
                    onSelect={(date) => handleDateChange(date, "serviceDate")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mileage">Mileage at Service (km)</Label>
              <Input
                id="mileage"
                name="mileage"
                type="number"
                value={formData.mileage}
                onChange={handleNumberChange}
                required
                min={0}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Service Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parts">Parts Used (comma separated)</Label>
            <Input
              id="parts"
              name="parts"
              value={formData.parts}
              onChange={handleChange}
              placeholder="e.g. Oil filter, Air filter, Brake pads"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cost">Service Cost ($)</Label>
            <Input
              id="cost"
              name="cost"
              type="number"
              step="0.01"
              value={formData.cost}
              onChange={handleNumberChange}
              required
              min={0}
            />
          </div>
          <div className="space-y-4 border rounded-md p-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="setReminder" checked={formData.setReminder} onCheckedChange={handleCheckboxChange} />
              <Label htmlFor="setReminder">Set service reminder</Label>
            </div>

            {formData.setReminder && (
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="reminderType">Reminder Type</Label>
                  <Select
                    value={formData.reminderType}
                    onValueChange={(value) => handleSelectChange("reminderType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select reminder type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="time">Time-based</SelectItem>
                      <SelectItem value="mileage">Mileage-based</SelectItem>
                      <SelectItem value="both">Both time and mileage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(formData.reminderType === "time" || formData.reminderType === "both") && (
                  <div className="space-y-2">
                    <Label htmlFor="reminderDate">Reminder Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.reminderDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.reminderDate ? format(formData.reminderDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.reminderDate || undefined}
                          onSelect={(date) => handleDateChange(date, "reminderDate")}
                          initialFocus
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                {(formData.reminderType === "mileage" || formData.reminderType === "both") && (
                  <div className="space-y-2">
                    <Label htmlFor="mileageThreshold">Mileage Threshold (km)</Label>
                    <Input
                      id="mileageThreshold"
                      name="mileageThreshold"
                      type="number"
                      value={formData.mileageThreshold}
                      onChange={handleNumberChange}
                      required={formData.reminderType === "mileage" || formData.reminderType === "both"}
                      min={0}
                    />
                    <p className="text-sm text-muted-foreground">
                      Reminder will be sent when vehicle reaches{" "}
                      {(formData.mileage + formData.mileageThreshold).toLocaleString()} km
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEdit ? "Updating..." : "Adding..."}
              </>
            ) : isEdit ? (
              "Update Service"
            ) : (
              "Add Service"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

