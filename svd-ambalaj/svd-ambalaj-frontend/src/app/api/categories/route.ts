import { NextResponse } from "next/server";
import { resolveServerApiBase } from "@/lib/server-api";

export const revalidate = 300; // Cache for 5 minutes

export async function GET() {
  try {
    const apiBase = resolveServerApiBase();
    const response = await fetch(`${apiBase}/categories`, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return NextResponse.json({ categories: [] }, { status: 200 });
    }

    const data = await response.json();
    return NextResponse.json({ categories: data.categories || [] });
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json({ categories: [] }, { status: 200 });
  }
}
