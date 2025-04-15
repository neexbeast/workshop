"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/firebase/auth-provider"
import { PasswordChangeModal } from "./password-change-modal"

export function PasswordChangeWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  useEffect(() => {
    // Show modal if user needs to change password
    if (user?.needsPasswordChange) {
      setShowPasswordModal(true)
    }
  }, [user?.needsPasswordChange])

  return (
    <>
      {children}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </>
  )
} 