"use client"

import { AdminLayout } from "@/components/admin/admin-layout"
import { CustomerForm } from "@/components/admin/customers/customer-form"
import { Loader2 } from "lucide-react"
import { useParams } from "next/navigation"
import { useCustomer } from "@/lib/api/hooks"

export default function EditCustomerPage() {
  const params = useParams()
  const { data: customerData, isLoading, error } = useCustomer(params.id as string)

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
          <p className="text-red-500">{error instanceof Error ? error.message : "Failed to fetch customer"}</p>
        </div>
      </AdminLayout>
    )
  }

  if (!customerData?.customer) {
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
        <CustomerForm customer={customerData.customer} isEdit={true} />
      </div>
    </AdminLayout>
  )
} 