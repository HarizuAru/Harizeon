import { NextResponse } from "next/server";

export async function GET() {
  const content = `# Harizeon Security Contact Information (RFC 9116)
Contact: mailto:security@harizeon.com
Expires: 2027-12-31T23:59:59.000Z
Encryption: https://harizeon.com/security
Preferred-Languages: en, ms
Canonical: https://harizeon.com/.well-known/security.txt
Policy: https://harizeon.com/security
Hiring: https://harizeon.com/careers
`;

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
