"use client"

import { AdminLayout } from "@/components/admin/admin-layout"
import { CustomerForm } from "@/components/admin/customers/customer-form"

export default function AddCustomerPage() {
  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Add New Customer</h1>
        <CustomerForm />
      </div>
    </AdminLayout>
  )
}

