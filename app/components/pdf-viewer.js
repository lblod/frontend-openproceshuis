import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { restartableTask } from 'ember-concurrency';

export default class PdfViewerComponent extends Component {
  @tracked pdfBlobUrl = null;

  @action
  async setupViewer() {
    const visioFileId = this.args.diagram?.isVisioFile
      ? this.args.diagram.id
      : undefined;
    if (!visioFileId) return;

    const blob = await this.downloadVisioAsPdf.perform(visioFileId);
    if (!blob) return;

    this.pdfBlobUrl = URL.createObjectURL(blob);
  }

  @restartableTask
  *downloadVisioAsPdf(visioFileId) {
    const url = `/visio/convert?id=${visioFileId}&target=pdf`;
    const response = yield fetch(url);
    if (!response.ok) throw Error(response.status);
    return yield response.blob();
  }
}
