import type { PdfViewerProps } from './PdfViewer';

// Browsers render PDFs natively; react-native-webview has no web implementation.
export function PdfViewer({ url, backgroundColor, onLoaded }: PdfViewerProps) {
  return (
    <iframe
      src={url}
      title="Lesson slides"
      onLoad={() => onLoaded(0)}
      style={{ flex: 1, width: '100%', height: '100%', border: 0, backgroundColor }}
    />
  );
}
