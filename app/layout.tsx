import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import { PwaSetup } from "@/components/pwa/pwa-setup";
import "./globals.css";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
});

export const metadata: Metadata = {
  title: {
    default: "קול הקהילה",
    template: "%s | קול הקהילה",
  },
  description:
    "דיווחים על בעיות בקהילה, דירוג דחיפות אנונימי ועדכוני סטטוס שקופים - במקום הרעש של קבוצות הוואטסאפ.",
  applicationName: "קול הקהילה",
  icons: {
    icon: [
      { url: "/pwa/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/pwa/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: { url: "/pwa/apple-touch-icon.png", sizes: "180x180" },
  },
  // iOS home-screen launch: no Safari chrome, with the app's own title.
  appleWebApp: {
    capable: true,
    title: "קול הקהילה",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563EB",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${heebo.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {children}
        <PwaSetup />
      </body>
    </html>
  );
}
