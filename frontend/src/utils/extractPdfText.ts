function normalizeExtractedText(text: string) {
  return text
    .replace(/\u0000/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export async function extractPdfText(file: File) {
  const [{ GlobalWorkerOptions, getDocument }, pdfWorkerModule] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ])

  GlobalWorkerOptions.workerSrc = pdfWorkerModule.default
  const data = await file.arrayBuffer()
  const document = await getDocument({ data }).promise
  const pages: string[] = []

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')

    pages.push(pageText)
  }

  const normalizedText = normalizeExtractedText(pages.join('\n\n'))

  if (normalizedText.length < 80) {
    throw new Error('当前PDF中未提取到足够文本，可能是扫描件或图片型简历')
  }

  return normalizedText
}
