import type { Metadata } from 'next'
import { DM_Mono, Geist } from 'next/font/google'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'
const geistSans = Geist({
    variable: '--font-geist-sans',
    weight: '400',
    subsets: ['latin']
})

const dmMono = DM_Mono({
    subsets: ['latin'],
    variable: '--font-dm-mono',
    weight: '400'
})

export const metadata: Metadata = {
    title: 'Agent UI',
    description:
        'Современный интерфейс чата для ИИ-агентов, созданный на Next.js, Tailwind CSS и TypeScript. Готовый UI для взаимодействия с агентами Agno.'
}

export default function RootLayout({
    children
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="ru">
            <body className={`${geistSans.variable} ${dmMono.variable} antialiased`}>
                <NuqsAdapter>{children}</NuqsAdapter>
                <Toaster />
            </body>
        </html>
    )
}
