'use client'

import './globals.css'
import { Toaster } from 'sonner'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <title>GARITA.APP - Sistema de Control de Acceso | SISDEL</title>
        <meta name="description" content="Sistema premium de gestión de acceso para condominios y residenciales" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="font-sans">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: '12px',
              padding: '16px',
              fontSize: '14px',
            },
          }}
        />
      </body>
    </html>
  )
}
