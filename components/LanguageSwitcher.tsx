'use client';

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Languages } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useTranslations } from 'next-intl'

export default function LanguageSwitcher() {
  const t = useTranslations('navigation')
  const router = useRouter()
  const pathname = usePathname()

  const switchLanguage = (locale: string) => {
    const newPath = pathname.replace(/^\/(en|sr)/, `/${locale}`)
    router.push(newPath)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">{t('language')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => switchLanguage('en')}>
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => switchLanguage('sr')}>
          Српски
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 