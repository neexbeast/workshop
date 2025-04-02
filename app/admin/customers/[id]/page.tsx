"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { CustomerForm } from "@/components/admin/customers/customer-form"
import { customersApi } from "@/lib/api/api-client"
import { useAuth } from "@/lib/firebase/auth-hooks"
import { Loader2 } from "lucide-react"
import { useParams } from "next/navigation"
import type { Customer } from "@/lib/mongodb/models"

export default function EditCustomerPage() {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const auth = useAuth()
  const params = useParams()

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!auth.user) return

      try {
        const response = await customersApi.getCustomer({ firebaseUser: auth.firebaseUser }, params.id as string)
        setCustomer(response.customer)
      } catch (error) {
        console.error("Error fetching customer:", error)
        setError(error instanceof Error ? error.message : "Failed to fetch customer")
      } finally {
        setIsLoading(false)
      }
    }

    fetchCustomer()
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

  if (!customer) {
    return (
      <AdminLayout>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight mb-6">Customer Not Found</h1>
          <p>The requested customer could not be found.</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Edit Customer</h1>
        <CustomerForm customer={customer} isEdit={true} />
      </div>
    </AdminLayout>
  )
} 