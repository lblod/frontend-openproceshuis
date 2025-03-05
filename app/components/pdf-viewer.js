import Component from '@glimmer/component';
import { action } from '@ember/object';
import pdfjsLib from 'pdfjs-dist/build/pdf';
import { generateVisioConversionUrl } from 'frontend-openproceshuis/utils/file-download-url';

export default class PdfViewerComponent extends Component {
  isPanning = false;
  startX = 0;
  startY = 0;
  lastX = 0;
  lastY = 0;
  canvas = null;

  constructor() {
    super(...arguments);
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      '//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  @action
  async setupViewer(container) {
    container.tabIndex = 0; // Make container focusable

    container.style.position = 'relative';
    container.style.overflow = 'hidden'; // Prevents scrolling outside
    container.style.userSelect = 'none';

    // Create canvas dynamically
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.left = '0px'; // Ensures top-left alignment
    this.canvas.style.top = '0px';
    container.appendChild(this.canvas);

    const visioFileId = this.args.diagram?.isVisioFile
      ? this.args.diagram.id
      : undefined;
    if (!visioFileId) return;

    const url = generateVisioConversionUrl(visioFileId);
    const pdf = await pdfjsLib.getDocument(url).promise;
    const page = await pdf.getPage(1);

    // Get original page dimensions
    const originalViewport = page.getViewport({ scale: 1 });

    // Calculate the best scale to fit the container
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const scaleX = containerWidth / originalViewport.width;
    const scaleY = containerHeight / originalViewport.height;
    const scale = Math.min(scaleX, scaleY); // Maintain aspect ratio

    const viewport = page.getViewport({ scale });

    this.canvas.width = viewport.width;
    this.canvas.height = viewport.height;
    const context = this.canvas.getContext('2d');

    const renderContext = { canvasContext: context, viewport };
    await page.render(renderContext).promise;

    // **Align canvas top-left and ensure no offset**
    this.lastX = 0;
    this.lastY = 0;
    this.canvas.style.transform = `translate(${this.lastX}px, ${this.lastY}px)`;

    this.setupPanEvents(container);
  }

  @action
  setupPanEvents(container) {
    let startX, startY;

    const onMouseDown = (event) => {
      this.isPanning = true;
      startX = event.clientX - this.lastX;
      startY = event.clientY - this.lastY;
    };

    const onMouseMove = (event) => {
      if (!this.isPanning) return;

      // Calculate new position
      this.lastX = event.clientX - startX;
      this.lastY = event.clientY - startY;

      this.canvas.style.transform = `translate(${this.lastX}px, ${this.lastY}px)`;
    };

    const onMouseUp = () => {
      this.isPanning = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseup', onMouseUp);
    container.addEventListener('mouseleave', onMouseUp);
  }
}
