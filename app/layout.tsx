import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "FreePickup — Regala y recoge items gratis",
    template: "%s | FreePickup",
  },
  description:
    "Conectamos personas que quieren regalar cosas con fleteros que las llevan a quien las necesita.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
