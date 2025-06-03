"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/firebase/auth-hooks"
import { servicesApi } from "@/lib/api/api-client"
import { vehiclesApi } from "@/lib/api/api-client"
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
import type { Service, Vehicle } from "@/lib/mongodb/models"
import { useQueryClient } from "@tanstack/react-query"

// Service types for dropdown
const serviceTypes = [
  "Zamena Ulja",
  "Rotacija Guma",
  "Zamena Kočnica",
  "Zamena Vazdušnog Filtera",
  "Provera Akumulatora",
  "Servis Menjača",
  "Zamena Antifriza",
  "Zamena Svecica",
  "Zamena Remena",
  "Opšta Provera",
]

interface ServiceFormProps {
  service?: Service
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
    reminderDate: undefined as Date | undefined,
    reminderType: "time" as "time" | "mileage" | "both" | "none",
    mileageThreshold: 5000,
    setReminder: false,
  })
  const [error, setError] = useState("")
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const auth = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  useEffect(() => {
    const fetchVehicles = async () => {
      if (!auth.user) return

      setIsLoadingVehicles(true)
      try {
        const response = await vehiclesApi.getVehicles({ firebaseUser: auth.firebaseUser })
        setVehicles(response.vehicles || [])

        // If we have a vehicleId, find and set the selected vehicle
        if (vehicleId || service?.vehicleId) {
          const id = vehicleId || service?.vehicleId
          const vehicle = response.vehicles.find((v) => v.id === id)
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
        setError(err instanceof Error ? err.message : "Failed to fetch vehicles")
      } finally {
        setIsLoadingVehicles(false)
      }
    }

    fetchVehicles()
  }, [auth.user, auth.firebaseUser, vehicleId, service?.vehicleId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear validation error for this field
    setValidationErrors((prev) => ({ ...prev, [name]: false }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear validation error for this field
    setValidationErrors((prev) => ({ ...prev, [name]: false }))

    // If vehicle is changed, update the mileage
    if (name === "vehicleId") {
      const vehicle = vehicles.find((v) => v.id === value)
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
    // Clear validation error for this field
    setValidationErrors((prev) => ({ ...prev, [name]: false }))
  }

  const handleDateChange = (date: Date | undefined, field: string) => {
    if (date) {
      setFormData((prev) => ({ ...prev, [field]: date }))
      // Clear validation error for this field
      setValidationErrors((prev) => ({ ...prev, [field]: false }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    // Validate required fields
    const errors: Record<string, boolean> = {}
    if (!formData.vehicleId) errors.vehicleId = true
    if (!formData.serviceType) errors.serviceType = true
    if (!formData.description) errors.description = true
    if (!formData.cost || formData.cost <= 0) errors.cost = true
    
    setValidationErrors(errors)
    
    // If there are validation errors, don't submit
    if (Object.keys(errors).length > 0) {
      return
    }
    
    setIsLoading(true)

    try {
      // Prepare the service data
      const serviceData = {
        vehicleId: formData.vehicleId,
        serviceType: formData.serviceType,
        serviceDate: formData.serviceDate,
        mileage: formData.mileage,
        description: formData.description,
        parts: formData.parts ? formData.parts.split(",").map((part) => part.trim()) : [],
        cost: formData.cost,
        technicianId: auth.firebaseUser?.uid || "",
      }

      if (isEdit && service) {
        await servicesApi.updateService({ firebaseUser: auth.firebaseUser }, service.id, serviceData)
        toast({
          title: "Servis je uspešno ažuriran",
          description: "Servis je uspešno ažuriran.",
        })
      } else {
        await servicesApi.createService({ firebaseUser: auth.firebaseUser }, serviceData)
        
        // If reminder is set, create a reminder
        if (formData.setReminder && formData.reminderDate) {
          // TODO: Create reminder using the reminder API
          // This will be implemented when the reminder API is available
        }
        
        toast({
          title: "Servis je uspešno dodat",
          description: "Novi servis je uspešno dodat.",
        })
      }

      // Invalidate both services and vehicles query cache
      queryClient.invalidateQueries({ queryKey: ["services"] })
      queryClient.invalidateQueries({ queryKey: ["vehicles"] })

      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/admin/services")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred. Please try again.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Izmeni Servis" : "Dodaj Novi Servis"}</CardTitle>
        <CardDescription>
          {isEdit
            ? "Ažurirajte informacije o servisu u vašoj bazi podataka."
            : "Unesite detalje servisa da biste ga dodali u vašu bazu podataka."}
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
            <Label htmlFor="vehicleId">Vozilo</Label>
            <Select
              value={formData.vehicleId}
              onValueChange={(value) => handleSelectChange("vehicleId", value)}
              disabled={isLoadingVehicles || !!vehicleId}
            >
              <SelectTrigger className={validationErrors.vehicleId ? "border-red-500" : ""}>
                <SelectValue placeholder="Izaberite vozilo" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingVehicles ? (
                  <div className="flex items-center justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Učitavanje vozila...
                  </div>
                ) : (
                  vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.make} {vehicle.model} ({vehicle.year}) - {vehicle.vin}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {validationErrors.vehicleId && (
              <p className="text-sm text-red-500">Izaberite vozilo</p>
            )}
            {selectedVehicle && (
              <p className="text-sm text-muted-foreground mt-1">
                Trenutna kilometraža: {selectedVehicle.mileage.toLocaleString()} km
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="serviceType">Tip Servisa</Label>
            <Select value={formData.serviceType} onValueChange={(value) => handleSelectChange("serviceType", value)}>
              <SelectTrigger className={validationErrors.serviceType ? "border-red-500" : ""}>
                <SelectValue placeholder="Izaberite tip servisa" />
              </SelectTrigger>
              <SelectContent>
                {serviceTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {validationErrors.serviceType && (
              <p className="text-sm text-red-500">Izaberite tip servisa</p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serviceDate">Datum Servisa</Label>
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
                    {formData.serviceDate ? format(formData.serviceDate, "PPP") : <span>Izaberite datum</span>}
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
              <Label htmlFor="mileage">Kilometraža pri Servisu (km)</Label>
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
            <Label htmlFor="description">Opis Servisa</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={3}
              className={validationErrors.description ? "border-red-500" : ""}
            />
            {validationErrors.description && (
              <p className="text-sm text-red-500">Unesite opis servisa</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="parts">Korišćeni Delovi (odvojeni zarezom)</Label>
            <Input
              id="parts"
              name="parts"
              value={formData.parts}
              onChange={handleChange}
              placeholder="npr. Filter ulja, Vazdušni filter, Kočne pločice"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cost">Cena Servisa (KM)</Label>
            <Input
              id="cost"
              name="cost"
              type="number"
              step="0.01"
              value={formData.cost}
              onChange={handleNumberChange}
              required
              min={0}
              className={validationErrors.cost ? "border-red-500" : ""}
            />
            {validationErrors.cost && (
              <p className="text-sm text-red-500">Unesite validnu cenu servisa</p>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="reminder"
                checked={formData.reminderType !== "none"}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    reminderType: checked ? "time" : "none",
                  })
                }
              />
              <Label htmlFor="reminder">Postavite podsetnik za sledeći servis</Label>
            </div>
            {formData.reminderType !== "none" && (
              <div className="pl-6 space-y-4">
                <div className="space-y-2">
                  <Label>Tip Podsetnika</Label>
                  <Select
                    value={formData.reminderType}
                    onValueChange={(value) => handleSelectChange("reminderType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Izaberite tip podsetnika" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="time">Na osnovu vremena</SelectItem>
                      <SelectItem value="mileage">Na osnovu kilometraže</SelectItem>
                      <SelectItem value="both">Oba</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(formData.reminderType === "time" || formData.reminderType === "both") && (
                  <div className="space-y-2">
                    <Label htmlFor="reminderDate">Datum Podsetnika</Label>
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
                          {formData.reminderDate ? format(formData.reminderDate, "PPP") : <span>Izaberite datum</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.reminderDate}
                          onSelect={(date) => handleDateChange(date, "reminderDate")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                {(formData.reminderType === "mileage" || formData.reminderType === "both") && (
                  <div className="space-y-2">
                    <Label htmlFor="mileageThreshold">Prag Kilometraže (km)</Label>
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
                      Podsetnik će biti poslat kada vozilo dostigne{" "}
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
            Otkaži
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEdit ? "Ažuriranje..." : "Dodavanje..."}
              </>
            ) : isEdit ? (
              "Ažuriraj Servis"
            ) : (
              "Dodaj Servis"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

