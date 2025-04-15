"use client"

import { useState } from "react"
import Link from "next/link"
import { ClientLayout } from "@/components/client/client-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Edit, Wrench, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/firebase/auth-hooks"
import { useClientVehicles } from "@/lib/api/hooks"

export default function ClientVehiclesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const { firebaseUser } = useAuth()
  const customerId = firebaseUser?.uid

  // Fetch vehicles using React Query
  const { data: vehiclesData, isLoading: isLoadingVehicles } = useClientVehicles(customerId)

  const vehicles = vehiclesData?.vehicles || []

  const filteredVehicles = vehicles.filter(
    (vehicle) =>
      vehicle.vin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.make?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.model?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const renderVehiclesList = () => {
    if (isLoadingVehicles) {
      return (
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )
    }

    if (vehicles.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No vehicles found. Add your first vehicle to get started.</p>
          <Button asChild className="mt-4">
            <Link href="/client/vehicles/add">
              <Plus className="mr-2 h-4 w-4" />
              Add Vehicle
            </Link>
          </Button>
        </div>
      )
    }

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Make & Model</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>License Plate</TableHead>
              <TableHead>Mileage</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVehicles.map((vehicle) => (
              <TableRow key={vehicle.id}>
                <TableCell>
                  <div className="font-medium">{vehicle.make} {vehicle.model}</div>
                  <div className="text-sm text-muted-foreground">VIN: {vehicle.vin}</div>
                </TableCell>
                <TableCell>{vehicle.year}</TableCell>
                <TableCell>{vehicle.color || "-"}</TableCell>
                <TableCell>{vehicle.licensePlate || "-"}</TableCell>
                <TableCell>{vehicle.mileage.toLocaleString()} km</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/client/vehicles/${vehicle.id}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/schedule?vehicleId=${vehicle.id}`}>
                        <Wrench className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <ClientLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">My Vehicles</h1>
          <Button asChild>
            <Link href="/client/vehicles/add">
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
    </ClientLayout>
  )
}

