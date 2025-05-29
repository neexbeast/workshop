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
import type { Vehicle, Customer } from "@/lib/mongodb/models"
import { format } from "date-fns"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useServices, useVehicles, useCustomers } from "@/lib/api/hooks"
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

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null)
  const [serviceDetails, setServiceDetails] = useState<any | null>(null)
  const auth = useAuth()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const vehicleId = searchParams.get("vehicleId") || undefined
  const queryClient = useQueryClient()

  // Fetch data using React Query
  const { data: servicesData, isLoading: isLoadingServices } = useServices(undefined, vehicleId)
  const { data: vehiclesData } = useVehicles()
  const { data: customersData } = useCustomers()

  // Create lookup maps for vehicles and customers
  const vehicles = vehiclesData?.vehicles.reduce((acc, vehicle) => {
    acc[vehicle.id] = vehicle
    return acc
  }, {} as { [key: string]: Vehicle }) || {}

  const customers = customersData?.customers.reduce((acc, customer) => {
    acc[customer.id] = customer
    return acc
  }, {} as { [key: string]: Customer }) || {}

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

  // Filter services based on date
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upcomingServices = filteredServices
    .filter(service => new Date(service.serviceDate) >= today)
    .sort((a, b) => new Date(a.serviceDate).getTime() - new Date(b.serviceDate).getTime())

  const pastServices = filteredServices
    .filter(service => new Date(service.serviceDate) < today)
    .sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime())

  const allServices = filteredServices
    .sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime())

  const displayedServices = {
    all: allServices,
    upcoming: upcomingServices,
    past: pastServices
  }[activeTab] || []

  const handleDeleteService = async (id: string) => {
    if (!auth.firebaseUser) return
    setServiceToDelete(id)
  }

  function renderServicesList() {
    if (isLoadingServices) {
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
            {displayedServices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Nema pronađenih servisa
                </TableCell>
              </TableRow>
            ) : (
              displayedServices.map((service) => {
                const vehicle = vehicles[service.vehicleId]
                const customer = vehicle ? customers[vehicle.customerId] : null

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
                    <TableCell>{service.cost.toLocaleString()} €</TableCell>
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
      </div>
    )
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Servisi</h1>
          <Button asChild>
            <Link href="/admin/services/add">
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
                ) : displayedServices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                      Nema pronađenih servisa
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedServices.map((service) => {
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
                        <TableCell>{service.cost.toLocaleString()} €</TableCell>
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
        title="Are you sure?"
        description="This action cannot be undone. This will permanently delete the service record."
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
          Delete
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
            <p><b>Cena:</b> {serviceDetails.service.cost.toLocaleString()} €</p>
            <p><b>Opis:</b> {serviceDetails.service.description || '-'}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              
            </div>
          </div>
        </CustomDialog>
      )}
    </AdminLayout>
  )
} 