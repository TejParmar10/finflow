// Server-side only — uses pdf-parse which requires Node.js fs
export async function extractHdfcPdfText(buffer: Buffer): Promise<string> {
  // Dynamic import to avoid bundling on client
  const pdfParse = (await import('pdf-parse')).default
  const data = await pdfParse(buffer)
  return data.text
}
