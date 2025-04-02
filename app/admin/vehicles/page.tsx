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
import { Plus, Search, MoreHorizontal, Edit, Trash, Wrench, AlertCircle, ArrowLeft, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/firebase/auth-hooks"
import { vehiclesApi } from "@/lib/api/api-client"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"
import { useVehicles, useCustomer } from "@/lib/api/hooks"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import Link from 'next/link'

export default function VehiclesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const auth = useAuth()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const customerId = searchParams.get("customerId") || undefined
  const queryClient = useQueryClient()

  // Fetch data using React Query
  const { data: vehiclesData, isLoading: isLoadingVehicles } = useVehicles(undefined, customerId)
  const { data: customerData } = useCustomer(customerId || "")

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => vehiclesApi.deleteVehicle({ firebaseUser: auth.firebaseUser }, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] })
      toast({
        title: "Success",
        description: "Vehicle deleted successfully",
      })
    },
    onError: (error) => {
      console.error("Error deleting vehicle:", error)
      toast({
        title: "Error",
        description: "Failed to delete vehicle. Please try again.",
        variant: "destructive",
      })
    },
  })

  const vehicles = vehiclesData?.vehicles || []
  const customer = customerData?.customer

  const filteredVehicles = vehicles.filter(
    (vehicle) =>
      vehicle.vin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.make?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.model?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDeleteVehicle = async (id: string) => {
    if (!auth.firebaseUser) return
    deleteMutation.mutate(id)
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

  function renderVehiclesList() {
    if (isLoadingVehicles) {
      return (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )
    }

    return (
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
                          disabled={deleteMutation.isPending}
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
    )
  }

  return (
    <AdminLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {customer && (
              <Button variant="ghost" size="icon" asChild>
                <Link href="/admin/customers/" className="text-blue-600 hover:text-blue-800">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
            )}
            <h1 className="text-3xl font-bold tracking-tight">
              {customer ? `${customer.name}'s Vehicles` : "Vehicles"}
            </h1>
          </div>
          <Button asChild>
            <Link href="/admin/vehicles/add/" className="bg-primary text-white px-4 py-2 rounded-md">
              <Plus className="mr-2 h-4 w-4" />
              Add Vehicle
            </Link>
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

        {renderVehiclesList()}
      </div>
    </AdminLayout>
  )
}

