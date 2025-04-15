"use client"

import { useState } from "react"
import { ClientLayout } from "@/components/client/client-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Search, Filter, Calendar, Wrench, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/firebase/auth-hooks"
import { useClientServices, useClientVehicles } from "@/lib/api/hooks"
import { format } from "date-fns"
import type { Service, Vehicle } from "@/lib/mongodb/models"

export default function ServiceHistoryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedVehicle, setSelectedVehicle] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const { firebaseUser } = useAuth()
  const customerId = firebaseUser?.uid

  // Fetch data using React Query
  const { data: servicesData, isLoading: isLoadingServices } = useClientServices(customerId)
  const { data: vehiclesData, isLoading: isLoadingVehicles } = useClientVehicles(customerId)

  const services = servicesData?.services || []
  const vehicles = vehiclesData?.vehicles || []

  const isLoading = isLoadingServices || isLoadingVehicles

  // Create a lookup map for vehicles
  const vehicleMap = vehicles.reduce((acc, vehicle) => {
    acc[vehicle.id] = vehicle
    return acc
  }, {} as { [key: string]: Vehicle })

  // Filter services based on search query and selected vehicle
  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.serviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicleMap[service.vehicleId]?.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicleMap[service.vehicleId]?.model.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesVehicle = selectedVehicle === "all" || service.vehicleId === selectedVehicle

    return matchesSearch && matchesVehicle
  })

  const handleServiceClick = (service: Service) => {
    setSelectedService(service)
    setIsDialogOpen(true)
  }

  return (
    <ClientLayout>
      <div className="flex flex-col space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Service History</h1>

        <div className="flex flex-col md:flex-row gap-4">
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
          <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
            <SelectTrigger className="w-full md:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by vehicle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vehicles</SelectItem>
              {vehicles.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.make} {vehicle.model} ({vehicle.year})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>
          <TabsContent value="list">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Mileage</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead className="text-right">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          <div className="flex justify-center items-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredServices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                          No services found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredServices.map((service) => {
                        const vehicle = vehicleMap[service.vehicleId]
                        return (
                          <TableRow key={service.id}>
                            <TableCell>{format(new Date(service.serviceDate), "PPP")}</TableCell>
                            <TableCell>
                              {vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.year})` : "Unknown Vehicle"}
                            </TableCell>
                            <TableCell>{service.serviceType}</TableCell>
                            <TableCell>{service.mileage.toLocaleString()} km</TableCell>
                            <TableCell>${(service.cost ?? 0).toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => handleServiceClick(service)}>
                                <FileText className="h-4 w-4 mr-2" />
                                Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle>Service Timeline</CardTitle>
                <CardDescription>Chronological view of all services performed</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : filteredServices.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground">No service history found.</div>
                ) : (
                  <div className="relative border-l border-muted pl-6 ml-6">
                    {filteredServices.map((service) => {
                      const vehicle = vehicleMap[service.vehicleId]
                      return (
                        <div key={service.id} className="mb-10 relative">
                          <div className="absolute w-4 h-4 bg-primary rounded-full -left-[30px] top-1 border-4 border-background"></div>
                          <div className="flex flex-col space-y-2">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(service.serviceDate), "PPP")}
                              </span>
                            </div>
                            <h3 className="text-lg font-semibold">{service.serviceType}</h3>
                            <p className="text-sm">
                              {vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.year})` : "Unknown Vehicle"} •{" "}
                              {service.mileage.toLocaleString()} km
                            </p>
                            <p className="text-sm text-muted-foreground">{service.description}</p>
                            <div className="flex justify-between items-center">
                              <span className="font-medium">${(service.cost ?? 0).toFixed(2)}</span>
                              <Button variant="outline" size="sm" onClick={() => handleServiceClick(service)}>
                                <FileText className="h-4 w-4 mr-2" />
                                Details
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Service Details</DialogTitle>
              <DialogDescription>Complete information about the service performed</DialogDescription>
            </DialogHeader>
            {selectedService && (
              <div className="space-y-4 py-4">
                <div className="flex items-center space-x-2">
                  <Wrench className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">{selectedService.serviceType}</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Vehicle</p>
                    <p className="font-medium">
                      {vehicleMap[selectedService.vehicleId]
                        ? `${vehicleMap[selectedService.vehicleId].make} ${vehicleMap[selectedService.vehicleId].model} (${vehicleMap[selectedService.vehicleId].year})`
                        : "Unknown Vehicle"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p className="font-medium">{format(new Date(selectedService.serviceDate), "PPP")}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Mileage</p>
                    <p className="font-medium">{selectedService.mileage.toLocaleString()} km</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Cost</p>
                    <p className="font-medium">${(selectedService.cost ?? 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Technician</p>
                    <p className="font-medium">{selectedService.technicianId || "Not specified"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Description</p>
                  <p className="text-sm mt-1">{selectedService.description || "No description provided"}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ClientLayout>
  )
}

