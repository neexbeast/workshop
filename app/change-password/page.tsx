"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/firebase/auth-hooks"
import { updatePassword } from "firebase/auth"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export default function ChangePasswordPage() {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // If user doesn't need to change password, redirect to home
  if (user && !user.needsPasswordChange) {
    router.push("/")
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Lozinke se ne poklapaju"
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Lozinka mora imati najmanje 6 karaktera"
      })
      return
    }

    try {
      setLoading(true)
      
      if (!user) {
        throw new Error("No user found")
      }

      await updatePassword(user, newPassword)
      
      toast({
        title: "Lozinka je promenjena",
        description: "Lozinka je uspešno promenjena."
      })
      router.push("/") // Redirect to home page
    } catch (error) {
      console.error("Error changing password:", error)
      toast({
        variant: "destructive",
        title: "Greška",
        description: "Greška prilikom promene lozinke. Pokušajte ponovno."
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-md py-12">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-6">Change Your Password</h1>
        <p className="text-gray-600 mb-6">
          Please set a new password for your account. Your password must be at least 6 characters long.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium mb-1">
              New Password
            </label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
              Confirm Password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Changing Password..." : "Change Password"}
          </Button>
        </form>
      </Card>
    </div>
  )
} 