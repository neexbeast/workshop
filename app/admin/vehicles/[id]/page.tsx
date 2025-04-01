"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { VehicleForm } from "@/components/admin/vehicles/vehicle-form"
import { vehiclesApi } from "@/lib/api/api-client"
import { useAuth } from "@/lib/firebase/auth-hooks"
import { Loader2 } from "lucide-react"
import { useParams } from "next/navigation"
import type { Vehicle } from "@/lib/mongodb/models"

export default function EditVehiclePage() {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const auth = useAuth()
  const params = useParams()

  useEffect(() => {
    const fetchVehicle = async () => {
      if (!auth.user) return

      try {
        const response = await vehiclesApi.getVehicle({ firebaseUser: auth.firebaseUser }, params.id as string)
        setVehicle(response.vehicle)
      } catch (error) {
        console.error("Error fetching vehicle:", error)
        setError(error instanceof Error ? error.message : "Failed to fetch vehicle")
      } finally {
        setIsLoading(false)
      }
    }

    fetchVehicle()
  }, [auth.user, auth.firebaseUser, params.id])

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight mb-6">Error</h1>
          <p className="text-red-500">{error}</p>
        </div>
      </AdminLayout>
    )
  }

  if (!vehicle) {
    return (
      <AdminLayout>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight mb-6">Vehicle Not Found</h1>
          <p>The requested vehicle could not be found.</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Edit Vehicle</h1>
        <VehicleForm vehicle={vehicle} isEdit={true} />
      </div>
    </AdminLayout>
  )
} 