"use client"

import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useServices, useVehicles, useCustomers } from "@/lib/api/hooks"
import { format, addDays, subDays } from "date-fns"
import type { Vehicle, Customer } from "@/lib/mongodb/models"
import { Users, Car, Wrench, Euro } from "lucide-react"
import { RevenueChart } from "@/components/admin/dashboard/revenue-chart"
import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AdminDashboard() {
  const [sortBy, setSortBy] = useState("date")
  const { data: servicesData } = useServices()
  const { data: vehiclesData } = useVehicles()
  const { data: customersData } = useCustomers()

  // Calculate statistics
  const stats = {
    totalCustomers: customersData?.customers.length || 0,
    newCustomers: customersData?.customers.filter(c => 
      new Date(c.createdAt) > subDays(new Date(), 30)
    ).length || 0,
    totalVehicles: vehiclesData?.vehicles.length || 0,
    newVehicles: vehiclesData?.vehicles.filter(v => 
      new Date(v.createdAt) > subDays(new Date(), 30)
    ).length || 0,
    totalServices: servicesData?.services.length || 0,
    monthlyServices: servicesData?.services.filter(s => 
      new Date(s.serviceDate) > subDays(new Date(), 30)
    ).length || 0,
    monthlyRevenue: servicesData?.services
      .filter(s => new Date(s.serviceDate) > subDays(new Date(), 30))
      .reduce((sum, s) => sum + (s.cost || 0), 0) || 0
  }

  // Create lookup maps for vehicles and customers
  const vehicles = vehiclesData?.vehicles.reduce((acc, vehicle) => {
    acc[vehicle.id] = vehicle
    return acc
  }, {} as { [key: string]: Vehicle }) || {}

  const customers = customersData?.customers.reduce((acc, customer) => {
    acc[customer.id] = customer
    return acc
  }, {} as { [key: string]: Customer }) || {}

  // Calculate service stats
  const serviceStats = servicesData?.services.reduce((acc, service) => {
    const type = service.serviceType
    if (!acc[type]) {
      acc[type] = { count: 0, serviceType: type }
    }
    acc[type].count++
    return acc
  }, {} as { [key: string]: { count: number; serviceType: string } }) || {}

  const serviceStatsArray = Object.values(serviceStats)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(stat => ({
      ...stat,
      percentage: Math.round((stat.count / (servicesData?.services?.length || 1)) * 100)
    }))

  // Calculate revenue data for the chart
  const revenueData = Array.from({ length: 12 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const month = date.toLocaleString('default', { month: 'short' })
    const revenue = servicesData?.services
      .filter(s => {
        const serviceDate = new Date(s.serviceDate)
        return serviceDate.getMonth() === date.getMonth() && serviceDate.getFullYear() === date.getFullYear()
      })
      .reduce((sum, s) => sum + (s.cost || 0), 0) || 0
    return { month, revenue }
  }).reverse()

  const services = servicesData?.services || []
  const today = new Date()
  const thirtyDaysAgo = subDays(today, 30)
  const thirtyDaysFromNow = addDays(today, 30)

  // Filter recent services (last 30 days)
  const recentServices = services
    .filter(service => {
      const serviceDate = new Date(service.serviceDate)
      return serviceDate >= thirtyDaysAgo && serviceDate <= today
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime()
        case "type":
          return a.serviceType.localeCompare(b.serviceType)
        case "cost":
          return (b.cost || 0) - (a.cost || 0)
        default:
          return 0
      }
    })

  // Filter upcoming services (next 30 days)
  const upcomingServices = services
    .filter(service => {
      const serviceDate = new Date(service.serviceDate)
      return serviceDate > today && serviceDate <= thirtyDaysFromNow
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(a.serviceDate).getTime() - new Date(b.serviceDate).getTime()
        case "type":
          return a.serviceType.localeCompare(b.serviceType)
        case "cost":
          return (b.cost || 0) - (a.cost || 0)
        default:
          return 0
      }
    })

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Kontrolna Tabla</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ukupno Klijenata</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.newCustomers} novih ovog meseca
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ukupno Vozila</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVehicles}</div>
              <p className="text-xs text-muted-foreground">
                {stats.newVehicles} novih ovog meseca
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Servisi Ovog Meseca</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.monthlyServices}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prihod Ovog Meseca</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.monthlyRevenue.toLocaleString()} €</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mt-6">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Pregled Prihoda</CardTitle>
              <CardDescription>Prihod po mesecima</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <RevenueChart data={revenueData} />
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Nedavni Servisi</CardTitle>
              <CardDescription>Poslednjih 5 izvršenih servisa</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentServices.map((service) => {
                  const vehicle = vehicles[service.vehicleId]
                  return (
                    <div key={service.id} className="flex items-center">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{service.serviceType}</p>
                        <p className="text-sm text-muted-foreground">
                          {vehicle ? `${vehicle.make} ${vehicle.model}` : "Unknown Vehicle"}
                        </p>
                      </div>
                      <div className="ml-auto font-medium">{service.cost.toLocaleString()} €</div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mt-6">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Predstojeći Servisi</CardTitle>
              <CardDescription>Servisi koji su zakazani za sledećih 7 dana</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Klijent</TableHead>
                    <TableHead>Vozilo</TableHead>
                    <TableHead>Tip Servisa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingServices.map((service) => {
                    const vehicle = vehicles[service.vehicleId]
                    const customer = vehicle ? customers[vehicle.customerId] : null
                    return (
                      <TableRow key={service.id}>
                        <TableCell>{format(new Date(service.serviceDate), "dd.MM.yyyy")}</TableCell>
                        <TableCell>{customer?.name || "Unknown Customer"}</TableCell>
                        <TableCell>
                          {vehicle ? `${vehicle.make} ${vehicle.model}` : "Unknown Vehicle"}
                        </TableCell>
                        <TableCell>{service.serviceType}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Najčešći Servisi</CardTitle>
              <CardDescription>Top 5 servisa po učestalosti</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {serviceStatsArray.map((stat, index) => (
                  <div key={index} className="flex items-center">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{stat.serviceType}</p>
                      <p className="text-sm text-muted-foreground">{stat.percentage}%</p>
                    </div>
                    <div className="ml-auto font-medium">{stat.count} puta</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}

