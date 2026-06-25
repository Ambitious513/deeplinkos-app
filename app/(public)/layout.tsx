import type { ReactNode } from "react";
import { PublicAuthShell } from "@/components/auth/public-auth-shell";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <PublicAuthShell>{children}</PublicAuthShell>;
}
