"use client"

import { ClientLayout } from "@/components/client/client-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Car, Wrench, Bell, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// Mock data for client dashboard
const mockVehicles = [
  { id: "1", make: "Honda", model: "Accord", year: 2020, lastService: "2023-10-15", mileage: 25000 },
  { id: "2", make: "Toyota", model: "Camry", year: 2019, lastService: "2023-11-05", mileage: 32000 },
]

const mockUpcomingServices = [
  {
    id: "1",
    vehicle: "Honda Accord (2020)",
    serviceType: "Oil Change",
    dueDate: "2024-04-15",
    mileageDue: 30000,
  },
  {
    id: "2",
    vehicle: "Toyota Camry (2019)",
    serviceType: "Brake Inspection",
    dueDate: "2024-05-05",
    mileageDue: 35000,
  },
]

const mockRecentServices = [
  {
    id: "1",
    vehicle: "Honda Accord (2020)",
    serviceType: "Oil Change",
    date: "2023-10-15",
    mileage: 25000,
    cost: 89.99,
  },
  {
    id: "2",
    vehicle: "Toyota Camry (2019)",
    serviceType: "Tire Rotation",
    date: "2023-11-05",
    mileage: 32000,
    cost: 49.99,
  },
]

export default function ClientDashboard() {
  return (
    <ClientLayout>
      <div className="flex flex-col space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Vehicles</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockVehicles.length}</div>
              <p className="text-xs text-muted-foreground">Registered vehicles</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Services</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockRecentServices.length}</div>
              <p className="text-xs text-muted-foreground">In the last 30 days</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Reminders</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockUpcomingServices.length}</div>
              <p className="text-xs text-muted-foreground">Due in the next 30 days</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>My Vehicles</CardTitle>
              <CardDescription>Your registered vehicles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockVehicles.map((vehicle) => (
                  <div key={vehicle.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="mr-4 rounded-full p-2 bg-muted">
                        <Car className="h-4 w-4" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {vehicle.make} {vehicle.model} ({vehicle.year})
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Last service: {vehicle.lastService} • {vehicle.mileage.toLocaleString()} km
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/client/vehicles/${vehicle.id}`}>View Details</Link>
                    </Button>
                  </div>
                ))}
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/client/vehicles">View All Vehicles</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Services</CardTitle>
              <CardDescription>Services due in the next 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockUpcomingServices.map((service) => (
                  <div key={service.id} className="flex items-center">
                    <div className="mr-4 rounded-full p-2 bg-muted">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {service.serviceType} for {service.vehicle}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Due: {service.dueDate} or at {service.mileageDue.toLocaleString()} km
                      </p>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/client/reminders">View All Reminders</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Service History</CardTitle>
            <CardDescription>Your recent service activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRecentServices.map((service) => (
                <div key={service.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-4 rounded-full p-2 bg-muted">
                      <Wrench className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {service.serviceType} for {service.vehicle}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Completed: {service.date} • {service.mileage.toLocaleString()} km
                      </p>
                    </div>
                  </div>
                  <div className="text-sm font-medium">${service.cost.toFixed(2)}</div>
                </div>
              ))}
              <Button variant="outline" className="w-full" asChild>
                <Link href="/client/service-history">View Full History</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ClientLayout>
  )
}

