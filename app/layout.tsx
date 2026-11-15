import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
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
      <body className="min-h-full">{children}</body>
    </html>
  );
}
