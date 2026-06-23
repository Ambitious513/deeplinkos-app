import { NextResponse } from "next/server";
import { z } from "zod";

import { fetchLinkPreview } from "@/lib/link-preview";

const previewSchema = z.object({
  url: z.string().trim().min(3),
});

export async function POST(request: Request) {
  const parsed = previewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Provide a URL to preview." }, { status: 400 });
  }

  try {
    const preview = await fetchLinkPreview(parsed.data.url);
    return NextResponse.json({ preview });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to preview link." },
      { status: 400 },
    );
  }
}
