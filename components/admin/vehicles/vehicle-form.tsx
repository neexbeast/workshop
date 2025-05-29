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
import { useQueryClient } from "@tanstack/react-query"
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
    year: vehicle?.year || "",
    color: vehicle?.color || "",
    licensePlate: vehicle?.licensePlate || "",
    customerId: vehicle?.customerId || customerId || "",
    mileage: vehicle?.mileage || "",
  })
  const [error, setError] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLookingUpVIN, setIsLookingUpVIN] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false)
  const auth = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  useEffect(() => {
    const fetchCustomers = async () => {
      if (!auth.user) return

      setIsLoadingCustomers(true)
      try {
        const response = await customersApi.getCustomers({ firebaseUser: auth.firebaseUser })
        setCustomers(response.customers || [])
      } catch (err) {
        console.error("Error fetching customers:", err)
        setError(err instanceof Error ? err.message : "Neuspešno učitavanje kupaca")
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
    setFormData((prev) => ({ ...prev, [name]: value === "" ? "" : Number(value) }))
  }

  const handleVINLookup = async () => {
    if (!validateVIN(formData.vin)) {
      setError("Neispravni VIN format. Molimo proverite i pokušajte ponovo.")
      return
    }

    setIsLookingUpVIN(true)
    setError("")

    try {
      const result = await decodeVIN(formData.vin)
      if (result.success && result.data) {
        setFormData((prev) => ({
          ...prev,
          make: result.data?.make || prev.make,
          model: result.data?.model || prev.model,
          year: result.data?.year || prev.year,
        }))
        toast({
          title: "VIN pretraga uspešna",
          description: "Informacije o vozilu su popunjene na osnovu VIN-a.",
        })
      } else {
        setError(result.error || "Neuspešno dekodiranje VIN-a. Molimo unesite podatke ručno.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Došlo je do greške. Molimo pokušajte ponovo.")
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
      // Convert string values to numbers for year and mileage
      const submitData = {
        ...formData,
        year: formData.year === "" ? new Date().getFullYear() : Number(formData.year),
        mileage: formData.mileage === "" ? 0 : Number(formData.mileage),
      }

      if (isEdit && vehicle) {
        await vehiclesApi.updateVehicle({ firebaseUser: auth.firebaseUser }, vehicle.id, submitData)
        toast({
          title: "Vozilo ažurirano",
          description: "Informacije o vozilu su uspešno ažurirane.",
        })
      } else {
        await vehiclesApi.createVehicle({ firebaseUser: auth.firebaseUser }, submitData)
        toast({
          title: "Vozilo dodato",
          description: "Novo vozilo je uspešno dodato.",
        })
      }

      // Invalidate the vehicles query cache
      queryClient.invalidateQueries({ queryKey: ["vehicles"] })

      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/admin/vehicles")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Došlo je do greške. Molimo pokušajte ponovo.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Izmeni Vozilo" : "Dodaj Novo Vozilo"}</CardTitle>
        <CardDescription>
          {isEdit
            ? "Ažurirajte informacije o vozilu u vašoj bazi podataka."
            : "Unesite podatke o vozilu da ga dodate u vašu bazu podataka."}
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
            <Label htmlFor="vin">VIN (Identifikacioni broj vozila)</Label>
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
                      Pretraži
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="make">Marka</Label>
              <Input id="make" name="make" value={formData.make} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input id="model" name="model" value={formData.model} onChange={handleChange} required />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Godina</Label>
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
              <Label htmlFor="color">Boja</Label>
              <Input id="color" name="color" value={formData.color} onChange={handleChange} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="licensePlate">Registarske tablice</Label>
              <Input id="licensePlate" name="licensePlate" value={formData.licensePlate} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mileage">Trenutna kilometraža (km)</Label>
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
            <Label htmlFor="customerId">Vlasnik</Label>
            <Select
              value={formData.customerId}
              onValueChange={(value) => handleSelectChange("customerId", value)}
              disabled={isLoadingCustomers || !!customerId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Izaberite kupca" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingCustomers ? (
                  <div className="flex items-center justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Učitavanje kupaca...
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
            Otkaži
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEdit ? "Ažuriranje..." : "Dodavanje..."}
              </>
            ) : isEdit ? (
              "Ažuriraj Vozilo"
            ) : (
              "Dodaj Vozilo"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

