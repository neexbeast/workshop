"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { SendReminders } from "@/components/admin/reminders/send-reminders"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/firebase/auth-hooks"
import { remindersApi } from "@/lib/api/api-client"
import { Search, Calendar, Car, User } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function RemindersPage() {
  const { user } = useAuth()
  const [reminders, setReminders] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReminders = async () => {
      if (!user) return

      setLoading(true)
      try {
        const response = await remindersApi.getReminders(user)
        setReminders(response.reminders || [])
      } catch (error) {
        console.error("Error fetching reminders:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchReminders()
  }, [user])

  // Filter reminders based on search query
  const filteredReminders = reminders.filter(
    (reminder) =>
      reminder.vehicle?.make?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reminder.vehicle?.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reminder.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reminder.service?.serviceType?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <AdminLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Service Reminders</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search reminders..."
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
                    <TableHead>Due Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array(5)
                      .fill(0)
                      .map((_, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Skeleton className="h-5 w-24" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-32" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-40" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-28" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-20" />
                          </TableCell>
                        </TableRow>
                      ))
                  ) : filteredReminders.length > 0 ? (
                    filteredReminders.map((reminder) => (
                      <TableRow key={reminder._id}>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                            {new Date(reminder.reminderDate).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-muted-foreground" />
                            {reminder.customer?.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Car className="h-4 w-4 mr-2 text-muted-foreground" />
                            {reminder.vehicle?.make} {reminder.vehicle?.model}
                          </div>
                        </TableCell>
                        <TableCell>{reminder.service?.serviceType}</TableCell>
                        <TableCell>
                          {reminder.sent ? (
                            <Badge
                              variant="outline"
                              className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            >
                              Sent
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                            >
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No reminders found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div>
            <SendReminders />
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

