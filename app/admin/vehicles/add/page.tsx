"use client"

import { AdminLayout } from "@/components/admin/admin-layout"
import { VehicleForm } from "@/components/admin/vehicles/vehicle-form"
import { useSearchParams } from "next/navigation"

export default function AddVehiclePage() {
  const searchParams = useSearchParams()
  const customerId = searchParams.get("customerId") || undefined

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Dodaj Novo Vozilo</h1>
        <VehicleForm customerId={customerId} />
      </div>
    </AdminLayout>
  )
}

