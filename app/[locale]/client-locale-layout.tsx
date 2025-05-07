'use client'

import { NextIntlClientProvider } from 'next-intl'

type Messages = Record<string, Record<string, string>>

type Props = {
  locale: string
  messages: Messages
  children: React.ReactNode
}

export default function ClientLocaleLayout({ children, locale, messages }: Props) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
} 