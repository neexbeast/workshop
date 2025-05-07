'use client';

import { NextIntlClientProvider } from 'next-intl';
import { ReactNode } from 'react';

interface Messages {
  [key: string]: {
    [key: string]: string;
  };
}

interface ProvidersProps {
  children: ReactNode;
  locale: string;
  messages: Messages;
}

export default function Providers({ children, locale, messages }: ProvidersProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
} 