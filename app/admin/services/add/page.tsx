"use client"

import { AdminLayout } from "@/components/admin/admin-layout"
import { ServiceForm } from "@/components/admin/services/service-form"
import { useSearchParams } from "next/navigation"

export default function AddServicePage() {
  const searchParams = useSearchParams()
  const vehicleId = searchParams.get("vehicleId") || undefined

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Add New Service</h1>
        <ServiceForm vehicleId={vehicleId} />
      </div>
    </AdminLayout>
  )
}

