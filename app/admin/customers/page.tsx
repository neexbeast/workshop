"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, Search, MoreHorizontal, Edit, Trash, Car, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/firebase/auth-hooks"
import { useToast } from "@/hooks/use-toast"
import type { Customer } from "@/lib/mongodb/models"
import { useCustomers, useDeleteCustomer } from "@/lib/api/hooks"

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const { firebaseUser } = useAuth()
  const { toast } = useToast()

  const { data: customersData, isLoading } = useCustomers(searchQuery)
  const deleteCustomer = useDeleteCustomer()

  const customers = customersData?.customers ?? []

  const filteredCustomers = customers.filter(
    (customer) =>
      (customer.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (customer.email?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (customer.phone?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  )

  const handleDeleteCustomer = async (id: string) => {
    if (!firebaseUser) return
    
    try {
      await deleteCustomer.mutateAsync(id)
      toast({
        title: "Customer deleted",
        description: "The customer has been deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting customer:", error)
      toast({
        title: "Error",
        description: "Failed to delete customer. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <AdminLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <Button asChild>
            <a href="/admin/customers/add">
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </a>
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search customers..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No customers found
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>{customer.address || "N/A"}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <a href={`/admin/customers/${customer.id}`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <a href={`/admin/vehicles?customerId=${customer.id}`}>
                              <Car className="h-4 w-4 mr-2" />
                              View Vehicles
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteCustomer(customer.id)}
                            disabled={deleteCustomer.isPending}
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            {deleteCustomer.isPending ? "Deleting..." : "Delete"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
} 