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
    ],
    apple: [
      {
        url: "/icons/icon.svg",
        type: "image/svg+xml",
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