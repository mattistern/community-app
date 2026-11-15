import type { Metadata } from "next";
import { IssuesManager } from "@/components/admin/issues-manager";

export const metadata: Metadata = { title: "ניהול פניות" };

export default function AdminIssuesPage() {
  return <IssuesManager />;
}
