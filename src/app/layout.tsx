import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaInstallButton } from "@/components/pwa/pwa-install-button";
import { PwaRegister } from "@/components/pwa/pwa-register";

export const metadata: Metadata = {
  title: {
    default: "LimaStock",
    template: "%s | LimaStock",
  },
  description:
    "Controle de estoque, vendas, scanner de código de barras e gestão SaaS.",
  applicationName: "LimaStock",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "LimaStock",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      {
        url: "/icons/icon.svg",
        type: "image/svg+xml",
      },
      {
        url: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
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