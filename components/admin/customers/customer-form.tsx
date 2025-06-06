"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/firebase/auth-hooks"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import type { Customer } from "@/lib/mongodb/models"
import { useCreateCustomer, useUpdateCustomer } from "@/lib/api/hooks"

interface CustomerFormProps {
  customer?: Customer
  isEdit?: boolean
}

type CustomerFormData = Pick<Customer, "name" | "phone" | "address"> & {
  email?: string;
}

export function CustomerForm({ customer, isEdit }: CustomerFormProps) {
  const router = useRouter()
  const { firebaseUser } = useAuth()
  const { toast } = useToast()
  const [formData, setFormData] = useState<CustomerFormData>({
    name: customer?.name ?? "",
    email: customer?.email ?? "",
    phone: customer?.phone ?? "",
    address: customer?.address ?? "",
  })
  const [error, setError] = useState("")

  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!firebaseUser) {
      throw new Error("You must be logged in to perform this action")
    }

    try {
      if (isEdit && customer) {
        await updateCustomer.mutateAsync({
          id: customer.id,
          data: formData,
        })
        toast({
          title: "Klijent je ažuriran",
          description: "Klijent je uspešno ažuriran."
        })
      } else {
        await createCustomer.mutateAsync(formData)
        toast({
          title: "Klijent je dodat",
          description: "Klijent je uspešno dodat."
        })
      }
      router.push("/admin/customers")
      router.refresh()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred. Please try again."
      setError(errorMessage)
      console.error("Error submitting form:", error)
      toast({
        title: "Greška",
        description: "Greška prilikom sačuvanja klijenta. Pokušajte ponovno.",
        variant: "destructive"
      })
    }
  }

  const isLoading = createCustomer.isPending || updateCustomer.isPending

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Izmeni Klijenta" : "Dodaj Novog Klijenta"}</CardTitle>
        <CardDescription>
          {isEdit
            ? "Ažurirajte informacije o klijentu u vašoj bazi podataka."
            : "Unesite podatke o klijentu da biste ga dodali u vašu bazu podataka."}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Ime</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email (Opciono)</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              pattern={formData.email ? "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$" : undefined}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefon</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Adresa</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
            Otkaži
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEdit ? "Ažuriranje..." : "Dodavanje..."}
              </>
            ) : isEdit ? (
              "Ažuriraj Klijenta"
            ) : (
              "Dodaj Klijenta"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

