"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Send, Clock, CalendarRange } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/firebase/auth-hooks"
import { remindersApi } from "@/lib/api/api-client"
import { useToast } from "@/hooks/use-toast"
import { useReminders } from "@/lib/api/hooks"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function RemindersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month" | "year">("all")
  const [isSending, setIsSending] = useState(false)
  const auth = useAuth()
  const { toast } = useToast()

  const { data, isLoading, error } = useReminders({
    dateFilter: dateFilter === "all" ? undefined : dateFilter,
  })

  const reminders = data?.reminders || []

  const filteredReminders = reminders.filter(
    (reminder) =>
      (reminder.message?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (reminder.email?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  )

  const handleSendReminder = async (reminderId: string) => {
    if (!auth.firebaseUser) return

    setIsSending(true)
    try {
      await remindersApi.sendReminder({ firebaseUser: auth.firebaseUser }, reminderId)
      toast({
        title: "Success",
        description: "Reminder sent successfully",
      })
    } catch (error) {
      console.error("Error sending reminder:", error)
      toast({
        title: "Error",
        description: "Failed to send reminder",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <AdminLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Podsetnici</h1>
            <p className="text-muted-foreground">Upravljajte podsetnicima za servis</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Pretraži podsetnike..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={dateFilter} onValueChange={(value: "all" | "today" | "week" | "month" | "year") => setDateFilter(value)}>
            <SelectTrigger className="w-full md:w-[200px]">
              <CalendarRange className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtriraj po datumu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Svi Podsetnici</SelectItem>
              <SelectItem value="today">Danas</SelectItem>
              <SelectItem value="week">Ove Nedelje</SelectItem>
              <SelectItem value="month">Ovog Meseca</SelectItem>
              <SelectItem value="year">Ove Godine</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error ? (
          <div className="text-center text-red-500">{error instanceof Error ? error.message : "Neuspešno učitavanje podsetnika"}</div>
        ) : isLoading ? (
          <div className="text-center">Učitavanje podsetnika...</div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Poruka</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Akcije</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReminders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      Nema pronađenih podsetnika
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReminders.map((reminder) => (
                    <TableRow key={reminder._id?.toString()}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {new Date(reminder.reminderDate).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>{reminder.email}</TableCell>
                      <TableCell>{reminder.message}</TableCell>
                      <TableCell>
                        <Badge variant={reminder.sent ? "default" : "secondary"}>
                          {reminder.sent ? "Poslato" : "Na čekanju"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSendReminder(reminder._id?.toString() || "")}
                          disabled={reminder.sent || isSending}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

