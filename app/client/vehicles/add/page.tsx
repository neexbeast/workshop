"use client"

import { ClientLayout } from "@/components/client/client-layout"
import { VehicleForm } from "@/components/client/vehicles/vehicle-form"

export default function AddVehiclePage() {
  return (
    <ClientLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Add New Vehicle</h1>
        <VehicleForm />
      </div>
    </ClientLayout>
  )
} 