import './globals.css'

export const metadata = {
  title: 'Smart Campus Emergency',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-100 text-gray-900 min-h-screen">
        <header className="bg-red-700 text-white p-4 shadow-md">
          <h1 className="text-xl font-bold">Smart Campus Security Console</h1>
        </header>
        <main className="p-8 max-w-4xl mx-auto">
          {children}
        </main>
      </body>
    </html>
  )
}
