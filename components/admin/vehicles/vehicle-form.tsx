"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/firebase/auth-hooks"
import { vehiclesApi } from "@/lib/api/api-client"
import { customersApi } from "@/lib/api/api-client"
import { decodeVIN, validateVIN } from "@/lib/vin/vin-decoder"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Customer } from "@/lib/mongodb/models"

interface VehicleFormProps {
  vehicle?: {
    id: string
    vin: string
    make: string
    model: string
    year: number
    color?: string
    licensePlate?: string
    customerId: string
    mileage: number
  }
  customerId?: string
  onSuccess?: () => void
  isEdit?: boolean
}

export function VehicleForm({ vehicle, customerId, onSuccess, isEdit = false }: VehicleFormProps) {
  const [formData, setFormData] = useState({
    vin: vehicle?.vin || "",
    make: vehicle?.make || "",
    model: vehicle?.model || "",
    year: vehicle?.year || new Date().getFullYear(),
    color: vehicle?.color || "",
    licensePlate: vehicle?.licensePlate || "",
    customerId: vehicle?.customerId || customerId || "",
    mileage: vehicle?.mileage || 0,
  })
  const [error, setError] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLookingUpVIN, setIsLookingUpVIN] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false)
  const auth = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchCustomers = async () => {
      if (!auth.user) return

      setIsLoadingCustomers(true)
      try {
        const response = await customersApi.getCustomers({ firebaseUser: auth.firebaseUser })
        setCustomers(response.customers || [])
      } catch (err) {
        console.error("Error fetching customers:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch customers")
      } finally {
        setIsLoadingCustomers(false)
      }
    }

    fetchCustomers()
  }, [auth.user, auth.firebaseUser])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: Number.parseInt(value) || 0 }))
  }

  const handleVINLookup = async () => {
    if (!validateVIN(formData.vin)) {
      setError("Invalid VIN format. Please check and try again.")
      return
    }

    setIsLookingUpVIN(true)
    setError("")

    try {
      const result = await decodeVIN(formData.vin)
      if (result.success) {
        setFormData((prev) => ({
          ...prev,
          make: result.data.make || prev.make,
          model: result.data.model || prev.model,
          year: result.data.year || prev.year,
        }))
        toast({
          title: "VIN Lookup Successful",
          description: "Vehicle information has been populated from the VIN.",
        })
      } else {
        setError(result.error || "Failed to decode VIN. Please enter details manually.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred. Please try again.")
      console.error(err)
    } finally {
      setIsLookingUpVIN(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      if (isEdit && vehicle) {
        await vehiclesApi.updateVehicle({ firebaseUser: auth.firebaseUser }, vehicle.id, formData)
        toast({
          title: "Vehicle updated",
          description: "Vehicle information has been updated successfully.",
        })
      } else {
        await vehiclesApi.createVehicle({ firebaseUser: auth.firebaseUser }, formData)
        toast({
          title: "Vehicle added",
          description: "New vehicle has been added successfully.",
        })
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/admin/vehicles")
        router.refresh()
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
        <CardTitle>{isEdit ? "Edit Vehicle" : "Add New Vehicle"}</CardTitle>
        <CardDescription>
          {isEdit
            ? "Update vehicle information in your database."
            : "Enter vehicle details to add it to your database."}
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
            <Label htmlFor="vin">VIN (Vehicle Identification Number)</Label>
            <div className="flex space-x-2">
              <Input
                id="vin"
                name="vin"
                value={formData.vin}
                onChange={handleChange}
                required
                disabled={isEdit} // VIN cannot be changed in edit mode
                className="flex-1"
              />
              {!isEdit && (
                <Button type="button" onClick={handleVINLookup} disabled={isLookingUpVIN || !formData.vin}>
                  {isLookingUpVIN ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Lookup
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="make">Make</Label>
              <Input id="make" name="make" value={formData.make} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input id="model" name="model" value={formData.model} onChange={handleChange} required />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                name="year"
                type="number"
                value={formData.year}
                onChange={handleNumberChange}
                required
                min={1900}
                max={new Date().getFullYear() + 1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input id="color" name="color" value={formData.color} onChange={handleChange} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="licensePlate">License Plate</Label>
              <Input id="licensePlate" name="licensePlate" value={formData.licensePlate} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mileage">Current Mileage (km)</Label>
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
            <Label htmlFor="customerId">Owner</Label>
            <Select
              value={formData.customerId}
              onValueChange={(value) => handleSelectChange("customerId", value)}
              disabled={isLoadingCustomers || !!customerId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a customer" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingCustomers ? (
                  <div className="flex items-center justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading customers...
                  </div>
                ) : (
                  customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} ({customer.email})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
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
              "Update Vehicle"
            ) : (
              "Add Vehicle"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

