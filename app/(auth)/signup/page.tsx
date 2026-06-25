import { redirect } from "next/navigation";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next = "/dashboard" } = await searchParams;
  redirect(`/?auth=signup&next=${encodeURIComponent(next)}`);
}
