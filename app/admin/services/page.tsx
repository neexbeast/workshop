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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Search, MoreHorizontal, Edit, Trash, FileText, Bell } from "lucide-react"
import { Badge } from "@/components/ui/badge"

// Mock data for services
const mockServices = [
  {
    id: "1",
    vehicleId: "1",
    vehicle: "Honda Accord (2020)",
    vin: "1HGCM82633A123456",
    owner: "John Doe",
    serviceType: "Oil Change",
    date: "2023-10-15",
    mileage: 25000,
    description: "Full synthetic oil change with filter replacement",
    cost: 89.99,
    reminderSet: true,
    reminderDate: "2024-04-15",
  },
  {
    id: "2",
    vehicleId: "2",
    vehicle: "Tesla Model S (2021)",
    vin: "5YJSA1E47MF123456",
    owner: "Jane Smith",
    serviceType: "Tire Rotation",
    date: "2023-11-20",
    mileage: 15000,
    description: "Rotated all four tires and checked pressure",
    cost: 49.99,
    reminderSet: false,
    reminderDate: null,
  },
  {
    id: "3",
    vehicleId: "3",
    vehicle: "BMW X5 (2019)",
    vin: "WBAJB0C51BC123456",
    owner: "Bob Johnson",
    serviceType: "Brake Replacement",
    date: "2023-09-05",
    mileage: 35000,
    description: "Replaced front brake pads and rotors",
    cost: 349.99,
    reminderSet: true,
    reminderDate: "2024-09-05",
  },
  {
    id: "4",
    vehicleId: "4",
    vehicle: "Chevrolet Cruze (2018)",
    vin: "1G1JC5SH4D4123456",
    owner: "Alice Brown",
    serviceType: "Air Filter Replacement",
    date: "2023-08-12",
    mileage: 45000,
    description: "Replaced cabin and engine air filters",
    cost: 59.99,
    reminderSet: false,
    reminderDate: null,
  },
  {
    id: "5",
    vehicleId: "5",
    vehicle: "Nissan Leaf (2022)",
    vin: "JN1AZ0CP8BT123456",
    owner: "Charlie Davis",
    serviceType: "Battery Check",
    date: "2023-12-01",
    mileage: 8000,
    description: "Performed diagnostic check on EV battery system",
    cost: 79.99,
    reminderSet: true,
    reminderDate: "2024-06-01",
  },
]

// Mock data for vehicles (for the dropdown)
const mockVehicles = [
  { id: "1", name: "Honda Accord (2020)", vin: "1HGCM82633A123456", owner: "John Doe" },
  { id: "2", name: "Tesla Model S (2021)", vin: "5YJSA1E47MF123456", owner: "Jane Smith" },
  { id: "3", name: "BMW X5 (2019)", vin: "WBAJB0C51BC123456", owner: "Bob Johnson" },
  { id: "4", name: "Chevrolet Cruze (2018)", vin: "1G1JC5SH4D4123456", owner: "Alice Brown" },
  { id: "5", name: "Nissan Leaf (2022)", vin: "JN1AZ0CP8BT123456", owner: "Charlie Davis" },
]

// Service types for dropdown
const serviceTypes = [
  "Oil Change",
  "Tire Rotation",
  "Brake Replacement",
  "Air Filter Replacement",
  "Battery Check",
  "Transmission Service",
  "Coolant Flush",
  "Spark Plug Replacement",
  "Timing Belt Replacement",
  "General Inspection",
]

export default function ServicesPage() {
  const [services, setServices] = useState(mockServices)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newService, setNewService] = useState({
    vehicleId: "",
    serviceType: "",
    mileage: 0,
    description: "",
    cost: 0,
    reminderSet: false,
    reminderMonths: 6,
  })

  const filteredServices = services.filter(
    (service) =>
      service.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.serviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.vin.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleAddService = () => {
    const id = (services.length + 1).toString()
    const date = new Date().toISOString().split("T")[0]

    // Calculate reminder date if reminder is set
    let reminderDate = null
    if (newService.reminderSet) {
      const reminder = new Date()
      reminder.setMonth(reminder.getMonth() + newService.reminderMonths)
      reminderDate = reminder.toISOString().split("T")[0]
    }

    // Find the selected vehicle details
    const selectedVehicle = mockVehicles.find((v) => v.id === newService.vehicleId)

    if (selectedVehicle) {
      setServices([
        ...services,
        {
          ...newService,
          id,
          date,
          reminderDate,
          vehicle: selectedVehicle.name,
          vin: selectedVehicle.vin,
          owner: selectedVehicle.owner,
        },
      ])
    }

    // Reset form
    setNewService({
      vehicleId: "",
      serviceType: "",
      mileage: 0,
      description: "",
      cost: 0,
      reminderSet: false,
      reminderMonths: 6,
    })

    setIsAddDialogOpen(false)
  }

  const handleDeleteService = (id: string) => {
    setServices(services.filter((service) => service.id !== id))
  }

  return (
    <AdminLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Services</h1>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Service
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Add New Service</DialogTitle>
                <DialogDescription>Record a new service for a vehicle in your database.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="vehicle" className="text-right">
                    Vehicle
                  </Label>
                  <Select
                    value={newService.vehicleId}
                    onValueChange={(value) => setNewService({ ...newService, vehicleId: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockVehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.name} - {vehicle.owner}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="serviceType" className="text-right">
                    Service Type
                  </Label>
                  <Select
                    value={newService.serviceType}
                    onValueChange={(value) => setNewService({ ...newService, serviceType: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select service type" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="mileage" className="text-right">
                    Mileage
                  </Label>
                  <Input
                    id="mileage"
                    type="number"
                    value={newService.mileage}
                    onChange={(e) => setNewService({ ...newService, mileage: Number.parseInt(e.target.value) })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cost" className="text-right">
                    Cost
                  </Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    value={newService.cost}
                    onChange={(e) => setNewService({ ...newService, cost: Number.parseFloat(e.target.value) })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="description" className="text-right pt-2">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={newService.description}
                    onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                    className="col-span-3"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <div className="text-right">
                    <Label>Reminder</Label>
                  </div>
                  <div className="col-span-3 flex items-center space-x-2">
                    <Checkbox
                      id="reminderSet"
                      checked={newService.reminderSet}
                      onCheckedChange={(checked) => setNewService({ ...newService, reminderSet: checked as boolean })}
                    />
                    <Label htmlFor="reminderSet">Set service reminder</Label>
                  </div>
                </div>
                {newService.reminderSet && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="reminderMonths" className="text-right">
                      Remind in
                    </Label>
                    <Select
                      value={newService.reminderMonths.toString()}
                      onValueChange={(value) =>
                        setNewService({ ...newService, reminderMonths: Number.parseInt(value) })
                      }
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select months" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 months</SelectItem>
                        <SelectItem value="6">6 months</SelectItem>
                        <SelectItem value="9">9 months</SelectItem>
                        <SelectItem value="12">12 months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddService}>Add Service</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Service Type</TableHead>
                <TableHead>Mileage</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Reminder</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServices.length > 0 ? (
                filteredServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>{service.date}</TableCell>
                    <TableCell className="font-medium">{service.vehicle}</TableCell>
                    <TableCell>{service.owner}</TableCell>
                    <TableCell>{service.serviceType}</TableCell>
                    <TableCell>{service.mileage.toLocaleString()} km</TableCell>
                    <TableCell>${service.cost.toFixed(2)}</TableCell>
                    <TableCell>
                      {service.reminderSet ? (
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                          <Bell className="h-3 w-3 mr-1" />
                          {service.reminderDate}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteService(service.id)}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No services found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  )
}

