import { redirect } from "next/navigation";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string; check_email?: string }> }) {
  const { next = "/dashboard" } = await searchParams;
  redirect(`/?auth=login&next=${encodeURIComponent(next)}`);
}
