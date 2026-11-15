import type { Metadata } from "next";
import { WhitelistManager } from "@/components/admin/whitelist-manager";

export const metadata: Metadata = { title: "ניהול מורשים" };

export default function AdminWhitelistPage() {
  return <WhitelistManager />;
}
