import { notFound } from 'next/navigation'
import ClientLocaleLayout from './client-locale-layout'
import { locales, type Locale } from '@/i18n.config'

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'sr' }]
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  // Validate locale
  if (!locales.includes(params.locale as Locale)) {
    notFound()
  }

  const locale = params.locale // Store locale value to avoid multiple accesses

  let messages;
  try {
    messages = (await import(`../../messages/${locale}.json`)).default
  } catch {
    notFound()
  }

  return (
    <ClientLocaleLayout locale={locale} messages={messages}>
      {children}
    </ClientLocaleLayout>
  )
} 