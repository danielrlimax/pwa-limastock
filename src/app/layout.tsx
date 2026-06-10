import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaRegister } from "@/components/pwa/pwa-register";
import { PwaInstallButton } from "@/components/pwa/pwa-install-button";

export const metadata: Metadata = {
  title: {
    default: "LimaStock",
    template: "%s | LimaStock",
  },
  description:
    "Controle de estoque, vendas, scanner de código de barras e gestão SaaS.",
  applicationName: "LimaStock",
  appleWebApp: {
    capable: true,
    title: "LimaStock",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      {
        url: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <PwaRegister />
        {children}
        <PwaInstallButton />
      </body>
    </html>
  );
}