import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'FeedStudio · Catálogos para TikTok', description: 'Transforme ofertas e criativos em um catálogo RSS.' };
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) { return <html lang="pt-BR"><body>{children}</body></html>; }
