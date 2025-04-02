"use client"

import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { servicesApi } from "@/lib/api/api-client"
import { useAuth } from "@/lib/firebase/auth-hooks"
import { Loader2, TrendingUp, DollarSign, Wrench } from "lucide-react"
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from "date-fns"
import { useQuery } from "@tanstack/react-query"

export default function ReportsPage() {
  const { firebaseUser } = useAuth()

  const { data: servicesData, isLoading, error } = useQuery({
    queryKey: ["services", "reports"],
    queryFn: () => servicesApi.getServices({ firebaseUser }),
    enabled: !!firebaseUser,
  })

  const services = servicesData?.services || []

  const calculateStats = (period: "week" | "month" | "year") => {
    const now = new Date()
    let start: Date
    let end: Date

    switch (period) {
      case "week":
        start = startOfWeek(now, { weekStartsOn: 1 }) // Start from Monday
        end = endOfWeek(now, { weekStartsOn: 1 })
        break
      case "month":
        start = startOfMonth(now)
        end = endOfMonth(now)
        break
      case "year":
        start = startOfYear(now)
        end = endOfYear(now)
        break
    }

    const filteredServices = services.filter(service => 
      isWithinInterval(new Date(service.serviceDate), { start, end })
    )

    const totalEarnings = filteredServices.reduce((sum, service) => sum + (service.cost || 0), 0)
    const totalServices = filteredServices.length
    const averagePerService = totalServices > 0 ? totalEarnings / totalServices : 0

    return {
      totalEarnings,
      totalServices,
      averagePerService,
      servicesByType: filteredServices.reduce((acc, service) => {
        acc[service.serviceType] = (acc[service.serviceType] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight mb-6">Error</h1>
          <p className="text-red-500">{error instanceof Error ? error.message : "Failed to fetch services"}</p>
        </div>
      </AdminLayout>
    )
  }

  const weeklyStats = calculateStats("week")
  const monthlyStats = calculateStats("month")
  const yearlyStats = calculateStats("year")

  const renderStatsCards = (stats: ReturnType<typeof calculateStats>, period: string) => (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">For this {period}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Services Completed</CardTitle>
          <Wrench className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalServices}</div>
          <p className="text-xs text-muted-foreground">For this {period}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average per Service</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${stats.averagePerService.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">For this {period}</p>
        </CardContent>
      </Card>
    </div>
  )

  const renderServiceTypeBreakdown = (stats: ReturnType<typeof calculateStats>) => (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Services by Type</CardTitle>
        <CardDescription>Breakdown of services performed</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {Object.entries(stats.servicesByType).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between">
              <div className="space-x-2">
                <span className="font-medium">{type}</span>
              </div>
              <div className="font-medium">{count}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <AdminLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Service Reports</h1>
            <p className="text-muted-foreground">Overview of your service performance and earnings</p>
          </div>
        </div>

        <Tabs defaultValue="week" className="space-y-4">
          <TabsList>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
            <TabsTrigger value="year">This Year</TabsTrigger>
          </TabsList>

          <TabsContent value="week" className="space-y-4">
            {renderStatsCards(weeklyStats, "week")}
            {renderServiceTypeBreakdown(weeklyStats)}
          </TabsContent>

          <TabsContent value="month" className="space-y-4">
            {renderStatsCards(monthlyStats, "month")}
            {renderServiceTypeBreakdown(monthlyStats)}
          </TabsContent>

          <TabsContent value="year" className="space-y-4">
            {renderStatsCards(yearlyStats, "year")}
            {renderServiceTypeBreakdown(yearlyStats)}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
} 