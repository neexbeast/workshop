"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { ServiceForm } from "@/components/admin/services/service-form"
import { servicesApi } from "@/lib/api/api-client"
import { useAuth } from "@/lib/firebase/auth-hooks"
import { Loader2 } from "lucide-react"
import { useParams } from "next/navigation"
import type { Service } from "@/lib/mongodb/models"

export default function EditServicePage() {
  const [service, setService] = useState<Service | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const auth = useAuth()
  const params = useParams()

  useEffect(() => {
    const fetchService = async () => {
      if (!auth.user) return

      try {
        const response = await servicesApi.getService({ firebaseUser: auth.firebaseUser }, params.id as string)
        setService(response.service)
      } catch (error) {
        console.error("Error fetching service:", error)
        setError(error instanceof Error ? error.message : "Failed to fetch service")
      } finally {
        setIsLoading(false)
      }
    }

    fetchService()
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

  if (!service) {
    return (
      <AdminLayout>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight mb-6">Service Not Found</h1>
          <p>The requested service could not be found.</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Edit Service</h1>
        <ServiceForm service={service} isEdit={true} />
      </div>
    </AdminLayout>
  )
} 