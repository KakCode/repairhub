import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { geocodeAddress } from "@/lib/geocode";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const address = req.nextUrl.searchParams.get("address");
  if (!address || address.trim().length < 5) {
    return NextResponse.json({ error: "Enter a fuller address" }, { status: 400 });
  }

  const result = await geocodeAddress(address);
  if (!result) {
    // Not found is an expected outcome of a normal search, not a server error.
    return NextResponse.json({ error: "Could not find that address" });
  }

  return NextResponse.json(result);
}
