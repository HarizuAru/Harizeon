import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.redirect("https://harizeon.com/.well-known/security.txt", 301);
}
