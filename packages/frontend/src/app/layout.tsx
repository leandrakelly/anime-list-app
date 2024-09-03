import { Nunito } from 'next/font/google'

import { Providers } from './providers'

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-nunito',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={nunito.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
