import type { Metadata } from "next";
import { Overview } from "@/components/admin/overview";

export const metadata: Metadata = { title: "סקירה כללית" };

export default function AdminOverviewPage() {
  return <Overview />;
}
