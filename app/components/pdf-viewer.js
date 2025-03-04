import Component from '@glimmer/component';
import { action } from '@ember/object';
import pdfjsLib from 'pdfjs-dist/build/pdf';
import { generateVisioConversionUrl } from 'frontend-openproceshuis/utils/file-download-url';

export default class PdfViewerComponent extends Component {
  constructor() {
    super(...arguments);
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      '//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  @action
  async setupViewer(element) {
    element.tabIndex = 0; // Make element focusable

    const visioFileId = this.args.diagram?.isVisioFile
      ? this.args.diagram.id
      : undefined;
    if (!visioFileId) return;

    const url = generateVisioConversionUrl(visioFileId);

    const loadingTask = pdfjsLib.getDocument(url);
    const pdf = await loadingTask.promise;

    const page = await pdf.getPage(1);

    const scale = 1.5;
    const viewport = page.getViewport({ scale });

    element.width = viewport.width;
    element.height = viewport.height;
    const context = element.getContext('2d');

    const renderContext = { canvasContext: context, viewport };
    await page.render(renderContext).promise;
  }
}
