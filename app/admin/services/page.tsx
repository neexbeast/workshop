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
import { Plus, Search, MoreHorizontal, Edit, Trash, ArrowLeft, Loader2, FileText } from "lucide-react"
import { useAuth } from "@/lib/firebase/auth-hooks"
import { servicesApi } from "@/lib/api/api-client"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import type { Vehicle, Service } from "@/lib/mongodb/models"
import { format } from "date-fns"
import { useServices, useVehicles } from "@/lib/api/hooks"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CustomDialog } from "@/components/ui/CustomDialog"
import { Card, CardContent } from "@/components/ui/card"

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null)
  const [serviceDetails, setServiceDetails] = useState<{ service: Service; vehicle: Vehicle | null } | null>(null)
  const auth = useAuth()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const vehicleId = searchParams.get("vehicleId") || undefined
  const queryClient = useQueryClient()

  // Fetch data using React Query
  const { data: servicesData, isLoading: isLoadingServices } = useServices(undefined, vehicleId)
  const { data: vehiclesData } = useVehicles()

  // Create lookup map for vehicles
  const vehicles = vehiclesData?.vehicles.reduce((acc, vehicle) => {
    acc[vehicle.id] = vehicle
    return acc
  }, {} as { [key: string]: Vehicle }) || {}

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => servicesApi.deleteService({ firebaseUser: auth.firebaseUser }, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] })
      toast({
        title: "Success",
        description: "Service deleted successfully",
      })
    },
    onError: (error) => {
      console.error("Error deleting service:", error)
      toast({
        title: "Error",
        description: "Failed to delete service. Please try again.",
        variant: "destructive",
      })
    },
  })

  const services = servicesData?.services || []

  const filteredServices = services.filter(
    (service) =>
      service.serviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicles[service.vehicleId]?.vin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicles[service.vehicleId]?.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicles[service.vehicleId]?.model.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDeleteService = async (id: string) => {
    if (!auth.firebaseUser) return
    setServiceToDelete(id)
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            {vehicleId && (
              <Button variant="ghost" asChild>
                <Link href="/admin/services">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Nazad
                </Link>
              </Button>
            )}
            <div>
              <h1 className="text-3xl font-bold">
                {vehicleId && vehicles[vehicleId] 
                  ? `${vehicles[vehicleId].make} ${vehicles[vehicleId].model} ${vehicles[vehicleId].licensePlate} Servisi`
                  : "Servisi"
                }
              </h1>
              {vehicleId && vehicles[vehicleId] && (
                <p className="text-muted-foreground">
                  Pregled svih servisa za ovo vozilo
                </p>
              )}
            </div>
          </div>
          <Button asChild>
            <Link href={`/admin/services/add${vehicleId ? `?vehicleId=${vehicleId}` : ''}`}>
              <Plus className="mr-2 h-4 w-4" />
              Dodaj Servis
            </Link>
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Pretraži servise..."
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
                  <TableHead>Datum</TableHead>
                  <TableHead>Vozilo</TableHead>
                  <TableHead>Tablice</TableHead>
                  <TableHead>Tip Servisa</TableHead>
                  <TableHead>Kilometraža</TableHead>
                  <TableHead>Cena</TableHead>
                  <TableHead className="text-right">Akcije</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingServices ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      <div className="flex justify-center items-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredServices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                      Nema pronađenih servisa
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredServices.map((service) => {
                    const vehicle = vehicles[service.vehicleId]
                    return (
                      <TableRow key={service.id}>
                        <TableCell>{format(new Date(service.serviceDate), "dd.MM.yyyy")}</TableCell>
                        <TableCell>
                          {vehicle ? (
                            <Link href={`/admin/vehicles/${vehicle.id}`} className="hover:underline">
                              {vehicle.make} {vehicle.model} ({vehicle.year})
                            </Link>
                          ) : (
                            "Unknown Vehicle"
                          )}
                        </TableCell>
                        <TableCell>{vehicle?.licensePlate || "-"}</TableCell>
                        <TableCell>{service.serviceType}</TableCell>
                        <TableCell>{service.mileage.toLocaleString()} km</TableCell>
                        <TableCell>{service.cost.toLocaleString()} KM</TableCell>
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
                              <DropdownMenuItem
                                onClick={() => setServiceDetails({ service, vehicle })}
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                Detalji
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/services/${service.id}`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Izmeni
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.preventDefault();
                                  document.body.click();
                                  setTimeout(() => handleDeleteService(service.id), 0);
                                }}
                                className="text-red-600"
                                disabled={deleteMutation.isPending}
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                Obriši
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <CustomDialog
        open={!!serviceToDelete}
        onClose={() => setServiceToDelete(null)}
        title="Da li ste sigurni?"
        description="Ova akcija se ne može poništiti. Ovo će trajno obrisati servis."
      >
        <button
          style={{ background: "red", color: "white", marginRight: 8, padding: "8px 16px", borderRadius: 4, border: "none" }}
          onClick={() => {
            setServiceToDelete(null);
            if (serviceToDelete && auth.firebaseUser) {
              deleteMutation.mutate(serviceToDelete);
            }
          }}
        >
          Obriši
        </button>
      </CustomDialog>

      {serviceDetails && (
        <CustomDialog
          open={!!serviceDetails}
          onClose={() => setServiceDetails(null)}
          title="Detalji Servisa"
          description="Detaljan prikaz izvršenog servisa."
        >
          <div style={{ minWidth: 300 }}>
            <p><b>Vozilo:</b> {serviceDetails.vehicle ? `${serviceDetails.vehicle.make} ${serviceDetails.vehicle.model} (${serviceDetails.vehicle.year})` : '-'}</p>
            <p><b>Tablice:</b> {serviceDetails.vehicle?.licensePlate || '-'}</p>
            <p><b>Datum:</b> {format(new Date(serviceDetails.service.serviceDate), "dd.MM.yyyy")}</p>
            <p><b>Tip Servisa:</b> {serviceDetails.service.serviceType}</p>
            <p><b>Kilometraža:</b> {serviceDetails.service.mileage.toLocaleString()} km</p>
            <p><b>Cena:</b> {serviceDetails.service.cost.toLocaleString()} KM</p>
            <p><b>Opis:</b> {serviceDetails.service.description || '-'}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <Button variant="outline" onClick={() => setServiceDetails(null)}>
                Zatvori
              </Button>
            </div>
          </div>
        </CustomDialog>
      )}
    </AdminLayout>
  )
} 