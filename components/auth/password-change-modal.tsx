import { useState } from "react"
import { updatePassword } from "firebase/auth"
import { auth } from "@/lib/firebase/firebase-config"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

interface PasswordChangeModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PasswordChangeModal({ isOpen, onClose }: PasswordChangeModalProps) {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Lozinke se ne poklapaju",
        description: "Molimo vas da se pobrinite da se lozinke poklapaju.",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "Lozinka je prekratka",
        description: "Lozinka mora imati najmanje 6 karaktera.",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      const user = auth.currentUser
      if (!user) {
        throw new Error("No user logged in")
      }

      await updatePassword(user, newPassword)
      
      // Clear the temporary password flag
      const response = await fetch("/api/auth/clear-temporary-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${await user.getIdToken()}`
        }
      })
      
      if (!response.ok) {
        throw new Error("Failed to clear temporary password flag")
      }
      
      toast({
        title: "Lozinka je promenjena",
        description: "Lozinka je uspešno promenjena.",
      })
      
      onClose()
    } catch (error) {
      console.error("Error updating password:", error)
      toast({
        title: "Greška",
        description: "Greška prilikom promene lozinke. Pokušajte ponovno.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Promena lozinke</DialogTitle>
          <DialogDescription>
            Molimo vas da postavite novu lozinku za svoj nalog. Iz bezbednosnih razloga, trebalo bi da promenite svoju privremenu lozinku.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Input
                id="new-password"
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Ažuriranje..." : "Ažuriraj lozinku"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 