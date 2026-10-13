import { useMemo } from 'react';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

export interface PdfViewerProps {
  url: string;
  backgroundColor: string;
  onLoaded: (pageCount: number) => void;
  onError: () => void;
}

const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174';

// Android WebView can't display PDFs natively, so pages are rendered to canvases with pdf.js
// on both platforms for consistent behavior. Pinch-zoom is handled by the WebView viewport.
function buildHtml(url: string, backgroundColor: string) {
  return `<!doctype html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=4, user-scalable=yes">
<style>
  html, body { margin: 0; background: ${backgroundColor}; }
  #pages { display: flex; flex-direction: column; gap: 12px; padding: 12px; }
  .page { position: relative; width: 100%; border-radius: 6px; overflow: hidden; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.18); }
  .page canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
</style>
<script src="${PDFJS}/pdf.min.js"></script>
</head><body><div id="pages"></div>
<script>
(async function () {
  var post = function (m) { window.ReactNativeWebView.postMessage(JSON.stringify(m)); };
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '${PDFJS}/pdf.worker.min.js';
    var pdf = await pdfjsLib.getDocument({ url: ${JSON.stringify(url)} }).promise;
    var base = (await pdf.getPage(1)).getViewport({ scale: 1 });
    var container = document.getElementById('pages');
    var targetWidth = Math.min(window.innerWidth * Math.min(window.devicePixelRatio || 1, 3) * 1.5, 2000);
    var tasks = {};

    // Only pages near the viewport hold a bitmap; far-away pages are released to bound memory
    function render(slot, n) {
      if (tasks[n]) return;
      var canvas = slot.firstChild;
      tasks[n] = pdf.getPage(n).then(function (page) {
        if (!tasks[n]) return;
        var viewport = page.getViewport({ scale: targetWidth / page.getViewport({ scale: 1 }).width });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        var task = page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport });
        tasks[n] = task;
        return task.promise;
      }).catch(function () {});
    }
    function release(slot, n) {
      var task = tasks[n];
      if (!task) return;
      var canvas = slot.firstChild;
      if (task.cancel) task.cancel();
      tasks[n] = null;
      canvas.width = 0;
      canvas.height = 0;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var n = Number(e.target.dataset.page);
        if (e.isIntersecting) render(e.target, n); else release(e.target, n);
      });
    }, { rootMargin: '150% 0px' });

    for (var n = 1; n <= pdf.numPages; n++) {
      // Fixed-ratio slot keeps layout stable whether or not its canvas holds a bitmap
      var slot = document.createElement('div');
      slot.className = 'page';
      slot.style.aspectRatio = base.width + ' / ' + base.height;
      slot.dataset.page = String(n);
      slot.setAttribute('role', 'img');
      slot.setAttribute('aria-label', 'Slide ' + n + ' of ' + pdf.numPages);
      var canvas = document.createElement('canvas');
      canvas.width = 0; // default 300x150 bitmap is wasted until the page renders
      canvas.height = 0;
      slot.appendChild(canvas);
      container.appendChild(slot);
      observer.observe(slot);
    }
    post({ type: 'loaded', pages: pdf.numPages });
  } catch (e) {
    post({ type: 'error' });
  }
})();
</script></body></html>`;
}

export function PdfViewer({ url, backgroundColor, onLoaded, onError }: PdfViewerProps) {
  const html = useMemo(() => buildHtml(url, backgroundColor), [url, backgroundColor]);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data) as { type: string; pages?: number };
      if (msg.type === 'loaded') onLoaded(msg.pages ?? 0);
      else if (msg.type === 'error') onError();
    } catch {
      onError();
    }
  };

  return (
    <WebView
      source={{ html }}
      originWhitelist={['*']}
      onMessage={handleMessage}
      onError={onError}
      style={{ flex: 1, backgroundColor }}
      accessibilityLabel="Lesson slides"
    />
  );
}
