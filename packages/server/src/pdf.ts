export function buildPdfPlaceholder(_reportId: string): Uint8Array {
  const ascii = `%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n`;
  return new TextEncoder().encode(ascii);
}
