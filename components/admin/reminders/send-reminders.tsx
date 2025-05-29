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
        <CardTitle>Pošalji Podsetnike za Servis</CardTitle>
        <CardDescription>Pošaljite email podsetnike klijentima za predstojeće servise koji su na redu.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Ovo će poslati email obaveštenja svim klijentima koji imaju podsetnike za servis koji su danas na redu. Podsetnici se
          automatski označavaju kao poslati nakon uspešnog slanja.
        </p>

        {result && (
          <Alert variant={result.success ? "default" : "destructive"} className="mb-4">
            {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            <AlertTitle>{result.success ? "Uspeh" : "Greška"}</AlertTitle>
            <AlertDescription>
              {result.message}
              {result.success && result.count === 0 && (
                <p className="mt-2">Trenutno nema podsetnika za slanje.</p>
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
              Slanje Podsetnika...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Pošalji Podsetnike
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

