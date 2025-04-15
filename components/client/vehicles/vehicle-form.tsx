"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/firebase/auth-hooks"
import { vehiclesApi } from "@/lib/api/api-client"
import { decodeVIN, validateVIN } from "@/lib/vin/vin-decoder"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useQueryClient } from "@tanstack/react-query"
import type { Vehicle } from "@/lib/mongodb/models"

interface VehicleFormProps {
  vehicle?: Vehicle
  onSuccess?: () => void
  isEdit?: boolean
}

export function VehicleForm({ vehicle, onSuccess, isEdit = false }: VehicleFormProps) {
  const [formData, setFormData] = useState({
    vin: vehicle?.vin || "",
    make: vehicle?.make || "",
    model: vehicle?.model || "",
    year: vehicle?.year || new Date().getFullYear(),
    color: vehicle?.color || "",
    licensePlate: vehicle?.licensePlate || "",
    mileage: vehicle?.mileage || 0,
    customerId: vehicle?.customerId || "",
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [vinDetails, setVinDetails] = useState<{ make?: string; model?: string; year?: number } | null>(null)
  const auth = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const handleVINChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const vin = e.target.value.toUpperCase()
    setFormData((prev) => ({ ...prev, vin }))

    if (vin.length === 17) {
      if (!validateVIN(vin)) {
        setError("Invalid VIN format")
        return
      }

      try {
        const response = await decodeVIN(vin)
        if (response.success && response.data) {
          setVinDetails({
            make: response.data.make,
            model: response.data.model,
            year: response.data.year,
          })
          setFormData((prev) => ({
            ...prev,
            make: response.data.make || prev.make,
            model: response.data.model || prev.model,
            year: response.data.year || prev.year,
          }))
          setError("")
        } else {
          throw new Error(response.error || "Failed to decode VIN")
        }
      } catch (error) {
        setError("Failed to decode VIN. Please enter vehicle details manually.")
        console.error(error)
      }
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

      // Invalidate the vehicles query cache
      queryClient.invalidateQueries({ queryKey: ["vehicles"] })

      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/client/vehicles")
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred. Please try again.")
      console.error(error)
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
            ? "Update your vehicle information"
            : "Enter your vehicle details below. You can use the VIN to automatically fill in some information."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="vin">Vehicle Identification Number (VIN)</Label>
            <div className="relative">
              <Input
                id="vin"
                value={formData.vin}
                onChange={handleVINChange}
                maxLength={17}
                placeholder="Enter 17-digit VIN"
                disabled={isLoading}
              />
              {formData.vin.length > 0 && (
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              )}
            </div>
            {vinDetails && (
              <p className="text-sm text-muted-foreground">
                Detected: {vinDetails.make} {vinDetails.model} ({vinDetails.year})
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="make">Make</Label>
              <Input
                id="make"
                value={formData.make}
                onChange={(e) => setFormData((prev) => ({ ...prev, make: e.target.value }))}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData((prev) => ({ ...prev, model: e.target.value }))}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData((prev) => ({ ...prev, year: parseInt(e.target.value) }))}
                required
                min={1900}
                max={new Date().getFullYear() + 1}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="licensePlate">License Plate</Label>
              <Input
                id="licensePlate"
                value={formData.licensePlate}
                onChange={(e) => setFormData((prev) => ({ ...prev, licensePlate: e.target.value }))}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mileage">Current Mileage</Label>
              <Input
                id="mileage"
                type="number"
                value={formData.mileage}
                onChange={(e) => setFormData((prev) => ({ ...prev, mileage: parseInt(e.target.value) }))}
                required
                min={0}
                disabled={isLoading}
              />
            </div>
          </div>

          <CardFooter className="flex justify-end space-x-2 px-0">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? "Updating..." : "Adding..."}
                </>
              ) : (
                isEdit ? "Update Vehicle" : "Add Vehicle"
              )}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  )
} 