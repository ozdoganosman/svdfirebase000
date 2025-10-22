import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api-tfi7rlxtca-uc.a.run.app";

export async function GET() {
  try {
    const response = await fetch(`${API_URL}/exchange-rate`, {
      // Revalidate every 60 seconds
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch from backend");
    }

    const data = await response.json();
    
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("[API Route] Exchange rate fetch failed:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch exchange rate" },
      { status: 500 }
    );
  }
}
