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
import { FileText, Search, Filter, Calendar, Wrench } from "lucide-react"

// Mock data for service history
const mockServiceHistory = [
  {
    id: "1",
    vehicleId: "1",
    vehicle: "Honda Accord (2020)",
    serviceType: "Oil Change",
    date: "2023-10-15",
    mileage: 25000,
    description: "Full synthetic oil change with filter replacement",
    cost: 89.99,
    technician: "John Smith",
  },
  {
    id: "2",
    vehicleId: "1",
    vehicle: "Honda Accord (2020)",
    serviceType: "Tire Rotation",
    date: "2023-07-22",
    mileage: 22000,
    description: "Rotated all four tires and checked pressure",
    cost: 49.99,
    technician: "Mike Johnson",
  },
  {
    id: "3",
    vehicleId: "1",
    vehicle: "Honda Accord (2020)",
    serviceType: "Brake Inspection",
    date: "2023-04-10",
    mileage: 18000,
    description: "Inspected brake pads, rotors, and brake fluid",
    cost: 39.99,
    technician: "John Smith",
  },
  {
    id: "4",
    vehicleId: "2",
    vehicle: "Toyota Camry (2019)",
    serviceType: "Oil Change",
    date: "2023-11-05",
    mileage: 32000,
    description: "Conventional oil change with filter replacement",
    cost: 69.99,
    technician: "Sarah Williams",
  },
  {
    id: "5",
    vehicleId: "2",
    vehicle: "Toyota Camry (2019)",
    serviceType: "Air Filter Replacement",
    date: "2023-08-15",
    mileage: 28000,
    description: "Replaced engine and cabin air filters",
    cost: 59.99,
    technician: "Mike Johnson",
  },
]

// Mock data for vehicles (for the dropdown)
const mockVehicles = [
  { id: "all", name: "All Vehicles" },
  { id: "1", name: "Honda Accord (2020)" },
  { id: "2", name: "Toyota Camry (2019)" },
]

export default function ServiceHistoryPage() {
  const [selectedVehicle, setSelectedVehicle] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedService, setSelectedService] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Filter service history based on selected vehicle and search query
  const filteredHistory = mockServiceHistory.filter(
    (service) =>
      (selectedVehicle === "all" || service.vehicleId === selectedVehicle) &&
      (service.serviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const handleServiceClick = (service: any) => {
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
              {mockVehicles.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.name}
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
                    {filteredHistory.length > 0 ? (
                      filteredHistory.map((service) => (
                        <TableRow key={service.id}>
                          <TableCell>{service.date}</TableCell>
                          <TableCell>{service.vehicle}</TableCell>
                          <TableCell>{service.serviceType}</TableCell>
                          <TableCell>{service.mileage.toLocaleString()} km</TableCell>
                          <TableCell>${service.cost.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleServiceClick(service)}>
                              <FileText className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No service history found.
                        </TableCell>
                      </TableRow>
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
                <div className="relative border-l border-muted pl-6 ml-6">
                  {filteredHistory.length > 0 ? (
                    filteredHistory.map((service, index) => (
                      <div key={service.id} className="mb-10 relative">
                        <div className="absolute w-4 h-4 bg-primary rounded-full -left-[30px] top-1 border-4 border-background"></div>
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{service.date}</span>
                          </div>
                          <h3 className="text-lg font-semibold">{service.serviceType}</h3>
                          <p className="text-sm">
                            {service.vehicle} • {service.mileage.toLocaleString()} km
                          </p>
                          <p className="text-sm text-muted-foreground">{service.description}</p>
                          <div className="flex justify-between items-center">
                            <span className="font-medium">${service.cost.toFixed(2)}</span>
                            <Button variant="outline" size="sm" onClick={() => handleServiceClick(service)}>
                              <FileText className="h-4 w-4 mr-2" />
                              Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-10 text-center text-muted-foreground">No service history found.</div>
                  )}
                </div>
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
                    <p className="font-medium">{selectedService.vehicle}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p className="font-medium">{selectedService.date}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Mileage</p>
                    <p className="font-medium">{selectedService.mileage.toLocaleString()} km</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Cost</p>
                    <p className="font-medium">${selectedService.cost.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Technician</p>
                    <p className="font-medium">{selectedService.technician}</p>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Description</p>
                  <p className="text-sm mt-1">{selectedService.description}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ClientLayout>
  )
}

