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
import { Plus, Search, MoreHorizontal, Edit, Trash, Wrench, AlertCircle, ArrowLeft, Loader2, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/firebase/auth-hooks"
import { vehiclesApi } from "@/lib/api/api-client"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"
import { useVehicles, useCustomer, useCustomers } from "@/lib/api/hooks"
import { useMutation, useQueryClient } from "@tanstack/react-query"
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

export default function VehiclesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null)
  const [dropdownOpenId, setDropdownOpenId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState("make")
  const auth = useAuth()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const customerId = searchParams.get("customerId") || undefined
  const queryClient = useQueryClient()

  // Fetch data using React Query
  const { data: vehiclesData, isLoading: isLoadingVehicles } = useVehicles(undefined, customerId)
  const { data: customerData } = useCustomer(customerId || "")
  const { data: customersData } = useCustomers()

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
  const customersMap = customersData?.customers?.reduce((acc, customer) => {
    acc[customer.id] = customer
    return acc
  }, {} as { [key: string]: { name: string } }) || {}

  const filteredVehicles = vehicles.filter(
    (vehicle) =>
      vehicle.vin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.make?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.model?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDeleteVehicle = async (id: string) => {
    if (!auth.firebaseUser) return
    setVehicleToDelete(id)
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
              <TableHead>Marka</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Godina</TableHead>
              <TableHead>VIN</TableHead>
              <TableHead>Tablice</TableHead>
              <TableHead>Kilometraža</TableHead>
              <TableHead>Vlasnik</TableHead>
              <TableHead className="text-right">Akcije</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Nema pronađenih vozila
                </TableCell>
              </TableRow>
            ) : (
              filteredVehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell>{vehicle.make}</TableCell>
                  <TableCell>{vehicle.model}</TableCell>
                  <TableCell>{vehicle.year}</TableCell>
                  <TableCell>{vehicle.vin}</TableCell>
                  <TableCell>{vehicle.licensePlate}</TableCell>
                  <TableCell>{vehicle.mileage.toLocaleString()} km</TableCell>
                  <TableCell>{customersMap[vehicle.customerId]?.name || "-"}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu open={dropdownOpenId === vehicle.id} onOpenChange={(open) => setDropdownOpenId(open ? vehicle.id : null)}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Otvori meni</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Akcije</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/vehicles/${vehicle.id}`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Izmeni
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/services/add?vehicleId=${vehicle.id}`}>
                            <Wrench className="h-4 w-4 mr-2" />
                            Dodaj Servis
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={(e) => {
                            e.preventDefault();
                            setDropdownOpenId(null);
                            setTimeout(() => handleDeleteVehicle(vehicle.id), 0);
                          }}
                          disabled={deleteMutation.isPending}
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
      </div>
    )
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Vozila</h1>
          <Button asChild>
            <Link href="/admin/vehicles/add">
              <Plus className="mr-2 h-4 w-4" />
              Dodaj Vozilo
            </Link>
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Pretraži vozila..."
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
                  <TableHead>Marka</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Godina</TableHead>
                  <TableHead>VIN</TableHead>
                  <TableHead>Tablice</TableHead>
                  <TableHead>Kilometraža</TableHead>
                  <TableHead>Vlasnik</TableHead>
                  <TableHead className="text-right">Akcije</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingVehicles ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      <div className="flex justify-center items-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredVehicles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                      Nema pronađenih vozila
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell>{vehicle.make}</TableCell>
                      <TableCell>{vehicle.model}</TableCell>
                      <TableCell>{vehicle.year}</TableCell>
                      <TableCell>{vehicle.vin}</TableCell>
                      <TableCell>{vehicle.licensePlate}</TableCell>
                      <TableCell>{vehicle.mileage.toLocaleString()} km</TableCell>
                      <TableCell>{customersMap[vehicle.customerId]?.name || "-"}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu open={dropdownOpenId === vehicle.id} onOpenChange={(open) => setDropdownOpenId(open ? vehicle.id : null)}>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Otvori meni</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Akcije</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/vehicles/${vehicle.id}`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Izmeni
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/services/add?vehicleId=${vehicle.id}`}>
                                <Wrench className="h-4 w-4 mr-2" />
                                Dodaj Servis
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={(e) => {
                                e.preventDefault();
                                setDropdownOpenId(null);
                                setTimeout(() => handleDeleteVehicle(vehicle.id), 0);
                              }}
                              disabled={deleteMutation.isPending}
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
        open={!!vehicleToDelete}
        onClose={() => setVehicleToDelete(null)}
        title="Are you sure?"
        description="This action cannot be undone. This will permanently delete the vehicle and all associated service records."
      >
        <button
          style={{ background: "red", color: "white", marginRight: 8, padding: "8px 16px", borderRadius: 4, border: "none" }}
          onClick={() => {
            setVehicleToDelete(null);
            if (vehicleToDelete && auth.firebaseUser) {
              deleteMutation.mutate(vehicleToDelete);
            }
          }}
        >
          Delete
        </button>
      </CustomDialog>
    </AdminLayout>
  )
}

