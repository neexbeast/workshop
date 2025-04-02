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
import { Plus, Search, MoreHorizontal, Edit, Trash, ArrowLeft, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/firebase/auth-hooks"
import { servicesApi, vehiclesApi, customersApi } from "@/lib/api/api-client"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import type { Service, Vehicle, Customer } from "@/lib/mongodb/models"
import { format } from "date-fns"

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [vehicles, setVehicles] = useState<{ [key: string]: Vehicle }>({})
  const [customers, setCustomers] = useState<{ [key: string]: Customer }>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const auth = useAuth()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const vehicleId = searchParams.get("vehicleId") || undefined

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.user) return

      setIsLoading(true)
      try {
        // Fetch services, filtered by vehicleId if provided
        const servicesResponse = await servicesApi.getServices({ firebaseUser: auth.firebaseUser }, undefined, vehicleId)
        setServices(servicesResponse.services || [])

        // Fetch all vehicles and customers to display their details
        const vehiclesResponse = await vehiclesApi.getVehicles({ firebaseUser: auth.firebaseUser })
        const vehiclesMap = vehiclesResponse.vehicles.reduce((acc, vehicle) => {
          acc[vehicle.id] = vehicle
          return acc
        }, {} as { [key: string]: Vehicle })
        setVehicles(vehiclesMap)

        const customersResponse = await customersApi.getCustomers({ firebaseUser: auth.firebaseUser })
        const customersMap = customersResponse.customers.reduce((acc, customer) => {
          acc[customer.id] = customer
          return acc
        }, {} as { [key: string]: Customer })
        setCustomers(customersMap)
      } catch (error) {
        console.error("Error fetching data:", error)
        setError(error instanceof Error ? error.message : "Failed to fetch data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [auth.user, auth.firebaseUser, vehicleId])

  const filteredServices = services.filter(
    (service) =>
      service.serviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicles[service.vehicleId]?.vin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicles[service.vehicleId]?.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicles[service.vehicleId]?.model.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDeleteService = async (id: string) => {
    if (!auth.user) return
    
    try {
      await servicesApi.deleteService({ firebaseUser: auth.firebaseUser }, id)
      setServices(services.filter((service) => service.id !== id))
      toast({
        title: "Success",
        description: "Service deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting service:", error)
      toast({
        title: "Error",
        description: "Failed to delete service. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <AdminLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Services</h1>
            {vehicleId && vehicles[vehicleId] && (
              <div className="flex items-center space-x-2 text-muted-foreground">
                <ArrowLeft className="h-4 w-4" />
                <Link href="/admin/vehicles" className="hover:text-foreground">
                  Back to Vehicles
                </Link>
              </div>
            )}
          </div>
          <Link href={vehicleId ? `/admin/services/add?vehicleId=${vehicleId}` : "/admin/services/add"}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Service
            </Button>
          </Link>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search services..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : isLoading ? (
          <div className="flex justify-center py-8">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading services...</span>
            </div>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No services found.</div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service Type</TableHead>
                  <TableHead>Mileage</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((service) => {
                  const vehicle = vehicles[service.vehicleId]
                  const customer = vehicle ? customers[vehicle.customerId] : null

                  return (
                    <TableRow key={service.id}>
                      <TableCell>{format(new Date(service.serviceDate), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        {vehicle ? (
                          <div>
                            <div>
                              {vehicle.make} {vehicle.model} ({vehicle.year})
                            </div>
                            <div className="text-sm text-muted-foreground">{vehicle.vin}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Vehicle not found</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {customer ? (
                          <div>
                            <div>{customer.name}</div>
                            <div className="text-sm text-muted-foreground">{customer.email}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Customer not found</span>
                        )}
                      </TableCell>
                      <TableCell>{service.serviceType}</TableCell>
                      <TableCell>{service.mileage?.toLocaleString()} km</TableCell>
                      <TableCell>${service.cost?.toFixed(2)}</TableCell>
                      <TableCell>
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
                              <Link href={`/admin/services/${service.id}`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteService(service.id)}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
} 