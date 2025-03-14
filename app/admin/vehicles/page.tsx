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
import { Plus, Search, MoreHorizontal, Edit, Trash, Wrench, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

// Mock data for vehicles
const mockVehicles = [
  {
    id: "1",
    vin: "1HGCM82633A123456",
    make: "Honda",
    model: "Accord",
    year: 2020,
    owner: "John Doe",
    lastService: "2023-10-15",
    mileage: 25000,
  },
  {
    id: "2",
    vin: "5YJSA1E47MF123456",
    make: "Tesla",
    model: "Model S",
    year: 2021,
    owner: "Jane Smith",
    lastService: "2023-11-20",
    mileage: 15000,
  },
  {
    id: "3",
    vin: "WBAJB0C51BC123456",
    make: "BMW",
    model: "X5",
    year: 2019,
    owner: "Bob Johnson",
    lastService: "2023-09-05",
    mileage: 35000,
  },
  {
    id: "4",
    vin: "1G1JC5SH4D4123456",
    make: "Chevrolet",
    model: "Cruze",
    year: 2018,
    owner: "Alice Brown",
    lastService: "2023-08-12",
    mileage: 45000,
  },
  {
    id: "5",
    vin: "JN1AZ0CP8BT123456",
    make: "Nissan",
    model: "Leaf",
    year: 2022,
    owner: "Charlie Davis",
    lastService: "2023-12-01",
    mileage: 8000,
  },
]

// Mock data for customers (for the dropdown)
const mockCustomers = [
  { id: "1", name: "John Doe" },
  { id: "2", name: "Jane Smith" },
  { id: "3", name: "Bob Johnson" },
  { id: "4", name: "Alice Brown" },
  { id: "5", name: "Charlie Davis" },
]

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState(mockVehicles)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newVehicle, setNewVehicle] = useState({
    vin: "",
    make: "",
    model: "",
    year: new Date().getFullYear(),
    owner: "",
    mileage: 0,
  })

  const filteredVehicles = vehicles.filter(
    (vehicle) =>
      vehicle.vin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.owner.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleAddVehicle = () => {
    const id = (vehicles.length + 1).toString()
    const lastService = new Date().toISOString().split("T")[0]
    setVehicles([...vehicles, { ...newVehicle, id, lastService }])
    setNewVehicle({
      vin: "",
      make: "",
      model: "",
      year: new Date().getFullYear(),
      owner: "",
      mileage: 0,
    })
    setIsAddDialogOpen(false)
  }

  const handleDeleteVehicle = (id: string) => {
    setVehicles(vehicles.filter((vehicle) => vehicle.id !== id))
  }

  // Function to determine if a vehicle needs service soon (for demo purposes)
  const needsServiceSoon = (lastService: string, mileage: number) => {
    const lastServiceDate = new Date(lastService)
    const currentDate = new Date()
    const monthsSinceLastService =
      (currentDate.getFullYear() - lastServiceDate.getFullYear()) * 12 +
      (currentDate.getMonth() - lastServiceDate.getMonth())

    return monthsSinceLastService > 5 || mileage > 30000
  }

  return (
    <AdminLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Vehicles</h1>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Vehicle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Vehicle</DialogTitle>
                <DialogDescription>Enter the vehicle details below to add it to your database.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="vin" className="text-right">
                    VIN
                  </Label>
                  <Input
                    id="vin"
                    value={newVehicle.vin}
                    onChange={(e) => setNewVehicle({ ...newVehicle, vin: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="make" className="text-right">
                    Make
                  </Label>
                  <Input
                    id="make"
                    value={newVehicle.make}
                    onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="model" className="text-right">
                    Model
                  </Label>
                  <Input
                    id="model"
                    value={newVehicle.model}
                    onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="year" className="text-right">
                    Year
                  </Label>
                  <Input
                    id="year"
                    type="number"
                    value={newVehicle.year}
                    onChange={(e) => setNewVehicle({ ...newVehicle, year: Number.parseInt(e.target.value) })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="owner" className="text-right">
                    Owner
                  </Label>
                  <Select
                    value={newVehicle.owner}
                    onValueChange={(value) => setNewVehicle({ ...newVehicle, owner: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select an owner" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockCustomers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.name}>
                          {customer.name}
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
                    value={newVehicle.mileage}
                    onChange={(e) => setNewVehicle({ ...newVehicle, mileage: Number.parseInt(e.target.value) })}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddVehicle}>Add Vehicle</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>VIN</TableHead>
                <TableHead>Make/Model</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Last Service</TableHead>
                <TableHead>Mileage</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVehicles.length > 0 ? (
                filteredVehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="font-medium">{vehicle.vin}</TableCell>
                    <TableCell>
                      {vehicle.make} {vehicle.model}
                    </TableCell>
                    <TableCell>{vehicle.year}</TableCell>
                    <TableCell>{vehicle.owner}</TableCell>
                    <TableCell>
                      {vehicle.lastService}
                      {needsServiceSoon(vehicle.lastService, vehicle.mileage) && (
                        <Badge
                          variant="outline"
                          className="ml-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                        >
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Service Due
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{vehicle.mileage.toLocaleString()} km</TableCell>
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
                            <Wrench className="mr-2 h-4 w-4" />
                            Add Service
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteVehicle(vehicle.id)}
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
                  <TableCell colSpan={7} className="h-24 text-center">
                    No vehicles found.
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

