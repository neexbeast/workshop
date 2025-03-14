"use client"

import { ClientLayout } from "@/components/client/client-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Car, Wrench, AlertCircle } from "lucide-react"
import Link from "next/link"

// Mock data for client vehicles
const mockVehicles = [
  {
    id: "1",
    vin: "1HGCM82633A123456",
    make: "Honda",
    model: "Accord",
    year: 2020,
    lastService: "2023-10-15",
    mileage: 25000,
    servicesDue: ["Oil Change"],
  },
  {
    id: "2",
    vin: "4T1BF1FK5CU123456",
    make: "Toyota",
    model: "Camry",
    year: 2019,
    lastService: "2023-11-05",
    mileage: 32000,
    servicesDue: ["Brake Inspection", "Tire Rotation"],
  },
]

export default function ClientVehiclesPage() {
  return (
    <ClientLayout>
      <div className="flex flex-col space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">My Vehicles</h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mockVehicles.map((vehicle) => (
            <Card key={vehicle.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle>
                  {vehicle.make} {vehicle.model}
                </CardTitle>
                <CardDescription>
                  {vehicle.year} • VIN: {vehicle.vin}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Last Service</p>
                      <p className="font-medium">{vehicle.lastService}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Current Mileage</p>
                      <p className="font-medium">{vehicle.mileage.toLocaleString()} km</p>
                    </div>
                  </div>

                  {vehicle.servicesDue.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Services Due</p>
                      <div className="flex flex-wrap gap-2">
                        {vehicle.servicesDue.map((service, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                          >
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={`/client/vehicles/${vehicle.id}`}>
                        <Car className="h-4 w-4 mr-2" />
                        Details
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={`/client/service-history?vehicle=${vehicle.id}`}>
                        <Wrench className="h-4 w-4 mr-2" />
                        Service History
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Vehicle Service Summary</CardTitle>
            <CardDescription>Overview of all your vehicles and their service status</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>VIN</TableHead>
                  <TableHead>Last Service</TableHead>
                  <TableHead>Mileage</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockVehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="font-medium">
                      {vehicle.make} {vehicle.model} ({vehicle.year})
                    </TableCell>
                    <TableCell>{vehicle.vin}</TableCell>
                    <TableCell>{vehicle.lastService}</TableCell>
                    <TableCell>{vehicle.mileage.toLocaleString()} km</TableCell>
                    <TableCell>
                      {vehicle.servicesDue.length > 0 ? (
                        <Badge
                          variant="outline"
                          className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                        >
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Service Due
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                        >
                          Up to Date
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </ClientLayout>
  )
}

