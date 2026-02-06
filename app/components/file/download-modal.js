import Component from '@glimmer/component';

import { service } from '@ember/service';

export default class FileDownloadModal extends Component {
  @service toaster;

  get downloadOptions() {
    return [
      {
        label: 'Visio',
        extensionLabel: '.vsdx',
        canDownload: this.args.fileModel?.isVisioFile,
        download: async () => {
          this.onDownloadSuccess();
        },
        buttonSkin: 'primary',
      },
      {
        label: 'BPMN',
        extensionLabel: '.bpmn',
        canDownload: this.args.fileModel?.isBpmnFile,
        download: async () => {
          this.onDownloadSuccess();
        },
        buttonSkin: 'primary',
      },
      {
        label: 'Afbeelding',
        extensionLabel: '.png',
        canDownload: this.fileAsSVG,
        download: async () => {
          this.onDownloadSuccess();
        },
        buttonSkin: 'secondary',
      },
      {
        label: 'Vectorafbeelding',
        extensionLabel: '.svg',
        canDownload: this.fileAsSVG,
        download: async () => {
          this.onDownloadSuccess();
        },
        buttonSkin: 'secondary',
      },
      {
        label: 'PDF',
        extensionLabel: '.pdf',
        canDownload: true,
        download: async () => {
          this.onDownloadSuccess();
        },
        buttonSkin: 'secondary',
      },
    ];
  }

  get fileAsSVG() {
    // TODO - transform to svg
    return true;
  }

  onDownloadSuccess() {
    this.toaster.success('Bestand werd succesvol gedownload', null, {
      timeOut: 2500,
    });
    this.args.onDownloadSuccesful?.();
  }
}
