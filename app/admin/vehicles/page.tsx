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
import { Plus, Search, MoreHorizontal, Edit, Trash, Wrench, AlertCircle, ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/firebase/auth-hooks"
import { vehiclesApi, customersApi } from "@/lib/api/api-client"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"
import type { Vehicle, Customer } from "@/lib/mongodb/models"

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const auth = useAuth()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const customerId = searchParams.get("customerId") || undefined

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.user) return

      setIsLoading(true)
      try {
        // If customerId is provided, fetch customer details
        if (customerId) {
          const customerResponse = await customersApi.getCustomer({ firebaseUser: auth.firebaseUser }, customerId)
          setCustomer(customerResponse.customer)
        }

        // Fetch vehicles, filtered by customerId if provided
        const response = await vehiclesApi.getVehicles({ firebaseUser: auth.firebaseUser }, undefined, customerId)
        setVehicles(response.vehicles || [])
      } catch (error) {
        console.error("Error fetching data:", error)
        setError(error instanceof Error ? error.message : "Failed to fetch data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [auth.user, auth.firebaseUser, customerId])

  const filteredVehicles = vehicles.filter(
    (vehicle) =>
      vehicle.vin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.make?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.model?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDeleteVehicle = async (id: string) => {
    if (!auth.user) return
    
    try {
      await vehiclesApi.deleteVehicle({ firebaseUser: auth.firebaseUser }, id)
      setVehicles(vehicles.filter((vehicle) => vehicle.id !== id))
      toast({
        title: "Success",
        description: "Vehicle deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting vehicle:", error)
      toast({
        title: "Error",
        description: "Failed to delete vehicle. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Function to determine if a vehicle needs service soon
  const needsServiceSoon = (lastService: string | undefined, mileage: number) => {
    if (!lastService) return false
    const lastServiceDate = new Date(lastService)
    const currentDate = new Date()
    const monthsSinceLastService =
      (currentDate.getFullYear() - lastServiceDate.getFullYear()) * 12 +
      (currentDate.getMonth() - lastServiceDate.getMonth())

    return monthsSinceLastService > 5 || mileage > 30000
  }

  return (
    <AdminLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            {customer ? (
              <>
                <div className="flex items-center space-x-4">
                  <Button variant="ghost" size="sm" className="pl-0" asChild>
                    <a href="/admin/customers">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Customers
                    </a>
                  </Button>
                </div>
                <h1 className="text-3xl font-bold tracking-tight">Vehicles for {customer.name}</h1>
                <p className="text-muted-foreground">
                  {customer.email} • {customer.phone}
                </p>
              </>
            ) : (
              <h1 className="text-3xl font-bold tracking-tight">Vehicles</h1>
            )}
          </div>
          <Button asChild>
            <a href={`/admin/vehicles/add${customerId ? `?customerId=${customerId}` : ''}`}>
              <Plus className="mr-2 h-4 w-4" />
              Add Vehicle
            </a>
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search vehicles..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : isLoading ? (
          <div className="text-center">Loading vehicles...</div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>VIN</TableHead>
                  <TableHead>Make & Model</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>License Plate</TableHead>
                  <TableHead>Mileage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No vehicles found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell>{vehicle.vin}</TableCell>
                      <TableCell>
                        {vehicle.make} {vehicle.model}
                      </TableCell>
                      <TableCell>{vehicle.year}</TableCell>
                      <TableCell>{vehicle.licensePlate || "N/A"}</TableCell>
                      <TableCell>{vehicle.mileage.toLocaleString()} km</TableCell>
                      <TableCell>
                        {needsServiceSoon(vehicle.lastService, vehicle.mileage) && (
                          <Badge variant="destructive">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Service Due
                          </Badge>
                        )}
                      </TableCell>
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
                              <a href={`/admin/vehicles/${vehicle.id}`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a href={`/admin/services/add?vehicleId=${vehicle.id}`}>
                                <Wrench className="h-4 w-4 mr-2" />
                                Add Service
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteVehicle(vehicle.id)}
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

