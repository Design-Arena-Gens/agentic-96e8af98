import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Book Q&A Agent - किताब सवाल-जवाब एजेंट',
  description: 'Upload your book and ask questions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="hi">
      <body>{children}</body>
    </html>
  )
}
