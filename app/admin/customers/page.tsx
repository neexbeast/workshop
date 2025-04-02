"use client"

import { useState, useEffect } from "react"
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
import { Plus, Search, MoreHorizontal, Edit, Trash, Car } from "lucide-react"
import { useAuth } from "@/lib/firebase/auth-hooks"
import { customersApi } from "@/lib/api/api-client"
import { useToast } from "@/hooks/use-toast"
import type { Customer } from "@/lib/mongodb/models"

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const auth = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    const fetchCustomers = async () => {
      if (!auth.user) return

      setIsLoading(true)
      try {
        const response = await customersApi.getCustomers({ firebaseUser: auth.firebaseUser })
        setCustomers(response.customers || [])
      } catch (error) {
        console.error("Error fetching customers:", error)
        setError(error instanceof Error ? error.message : "Failed to fetch customers")
      } finally {
        setIsLoading(false)
      }
    }

    fetchCustomers()
  }, [auth.user, auth.firebaseUser])

  const filteredCustomers = customers.filter(
    (customer) =>
      (customer.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (customer.email?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (customer.phone?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  )

  const handleDeleteCustomer = async (id: string) => {
    if (!auth.user) return
    
    try {
      await customersApi.deleteCustomer({ firebaseUser: auth.firebaseUser }, id)
      setCustomers(customers.filter((customer) => customer.id !== id))
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

        {error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : isLoading ? (
          <div className="text-center">Loading customers...</div>
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
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No customers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
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
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
} 