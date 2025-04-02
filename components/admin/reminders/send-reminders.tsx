"use client"

import { useState } from "react"
import { useAuth } from "@/lib/firebase/auth-hooks"
import { remindersApi } from "@/lib/api/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Mail, AlertTriangle, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ApiError {
  message: string;
}

export function SendReminders() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    count?: number
  } | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  const handleSendReminders = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await remindersApi.sendReminders(user)

      setResult({
        success: true,
        message: response.message,
        count: response.count,
      })

      toast({
        title: "Reminders sent",
        description: `Successfully sent ${response.count} service reminders.`,
      })
    } catch (err) {
      const error = err as ApiError
      setResult({
        success: false,
        message: error.message || "Failed to send reminders. Please try again.",
      })

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send service reminders.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Service Reminders</CardTitle>
        <CardDescription>Send email reminders to customers for upcoming services that are due.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This will send email notifications to all customers who have service reminders due today. Reminders are
          automatically marked as sent after successful delivery.
        </p>

        {result && (
          <Alert variant={result.success ? "default" : "destructive"} className="mb-4">
            {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>
              {result.message}
              {result.success && result.count === 0 && (
                <p className="mt-2">There are no reminders due for sending at this time.</p>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleSendReminders} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending Reminders...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Send Reminders
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

