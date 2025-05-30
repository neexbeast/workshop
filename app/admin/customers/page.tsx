"use client"

import { useState } from "react"
import Link from "next/link"
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
import { Plus, Search, MoreHorizontal, Edit, Trash, Car, Loader2, FileText } from "lucide-react"
import { useAuth } from "@/lib/firebase/auth-hooks"
import { useToast } from "@/hooks/use-toast"
import { useCustomers, useDeleteCustomer, useVehicles } from "@/lib/api/hooks"
import { CustomDialog } from "@/components/ui/CustomDialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Filter } from "lucide-react"

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null)
  const { firebaseUser } = useAuth()
  const { toast } = useToast()

  const { data: customersData, isLoading } = useCustomers(searchQuery)
  const { data: vehiclesData } = useVehicles()
  const deleteCustomer = useDeleteCustomer()

  const customers = customersData?.customers ?? []
  const vehicles = vehiclesData?.vehicles || []

  const filteredCustomers = customers.filter(
    (customer) =>
      (customer.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (customer.email?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (customer.phone?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  )

  const handleDeleteCustomer = async (id: string) => {
    if (!firebaseUser) return
    setCustomerToDelete(id)
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Klijenti</h1>
          <Button asChild>
            <Link href="/admin/customers/add">
              <Plus className="mr-2 h-4 w-4" />
              Dodaj Klijenta
            </Link>
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Pretraži klijente..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ime</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Broj Vozila</TableHead>
                  <TableHead className="text-right">Akcije</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      <div className="flex justify-center items-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      Nema pronađenih klijenata
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                      <TableCell>{customer.name}</TableCell>
                      <TableCell>{customer.email || "-"}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                      <TableCell>{vehicles.filter(v => v.customerId === customer.id).length}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Otvori meni</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Akcije</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/vehicles?customerId=${customer.id}`}>
                                <Car className="h-4 w-4 mr-2" />
                                Prikaži Vozila
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/customers/${customer.id}`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Izmeni
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={(e) => {
                                e.preventDefault();
                                setTimeout(() => handleDeleteCustomer(customer.id), 0);
                              }}
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              Obriši
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <CustomDialog
        open={!!customerToDelete}
        onClose={() => setCustomerToDelete(null)}
        title="Are you sure?"
        description="This action cannot be undone. This will permanently delete the customer and all associated vehicles and service records."
      >
        <button
          style={{ background: "red", color: "white", marginRight: 8, padding: "8px 16px", borderRadius: 4, border: "none" }}
          onClick={async () => {
            setCustomerToDelete(null);
            if (customerToDelete && firebaseUser) {
              try {
                await deleteCustomer.mutateAsync(customerToDelete);
                toast({
                  title: "Customer deleted",
                  description: "The customer has been deleted successfully.",
                });
              } catch (error) {
                console.error("Error deleting customer:", error);
                toast({
                  title: "Error",
                  description: "Failed to delete customer. Please try again.",
                  variant: "destructive",
                });
              }
            }
          }}
        >
          Delete
        </button>
      </CustomDialog>
    </AdminLayout>
  )
} 