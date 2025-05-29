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
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Istorija Servisa</h1>
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Pretraži servise..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
          </div>
        </div>

        <div className="bg-card rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Vozilo</TableHead>
                <TableHead>Tip Servisa</TableHead>
                <TableHead>Kilometraža</TableHead>
                <TableHead>Cena</TableHead>
                <TableHead className="text-right">Akcije</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServices.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>{format(new Date(service.serviceDate), "dd.MM.yyyy")}</TableCell>
                  <TableCell>
                    {vehicles[service.vehicleId]?.make} {vehicles[service.vehicleId]?.model}
                  </TableCell>
                  <TableCell>{service.serviceType}</TableCell>
                  <TableCell>{service.mileage.toLocaleString()} km</TableCell>
                  <TableCell>{service.cost.toLocaleString()} KM</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedService(service)}>
                      Detalji
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Dialog open={!!selectedService} onOpenChange={() => setSelectedService(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalji Servisa</DialogTitle>
            </DialogHeader>
            {selectedService && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground">Datum</p>
                    <p className="font-medium">{format(new Date(selectedService.serviceDate), "dd.MM.yyyy")}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Vozilo</p>
                    <p className="font-medium">
                      {vehicles[selectedService.vehicleId]?.make} {vehicles[selectedService.vehicleId]?.model}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tip Servisa</p>
                    <p className="font-medium">{selectedService.serviceType}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Kilometraža</p>
                    <p className="font-medium">{selectedService.mileage.toLocaleString()} km</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Cena</p>
                    <p className="font-medium">{selectedService.cost.toLocaleString()} KM</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Mehaničar</p>
                    <p className="font-medium">{selectedService.technicianId || "Nije navedeno"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Opis</p>
                  <p className="text-sm mt-1">{selectedService.description || "Nema opisa"}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ClientLayout>
  )
}

