import type { Metadata } from "next";
import { ExportPanel } from "@/components/admin/export-panel";

export const metadata: Metadata = { title: "ייצוא נתונים" };

export default function AdminExportPage() {
  return <ExportPanel />;
}
