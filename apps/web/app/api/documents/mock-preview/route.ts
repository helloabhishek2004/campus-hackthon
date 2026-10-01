import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("ref") || "CAMPUS-DOC";
  const docName = ref.split("/").pop() || "CampusDocument.pdf";

  // Generate a minimal valid PDF format buffer
  const content = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 214 >>
stream
BT
/F1 20 Tf
50 720 Td
(Smart Campus - Certified Institutional Document) Tj
0 -30 Td
/F1 12 Tf
(Document Reference: ${ref}) Tj
0 -20 Td
(Verification Status: Authenticated by Registrar) Tj
0 -20 Td
(Security Level: Institutional Signature Intact) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000229 00000 n 
0000000494 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
562
%%EOF`;

  const pdfBuffer = Buffer.from(content, "utf-8");

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${docName}"`,
      "Content-Length": pdfBuffer.length.toString(),
    },
  });
}
