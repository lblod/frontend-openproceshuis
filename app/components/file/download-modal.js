import Component from '@glimmer/component';

import { service } from '@ember/service';
import FileSaver from 'file-saver';
import removeFileNameExtension from 'frontend-openproceshuis/utils/file-extension-remover';
import { getMessageForErrorCode } from 'frontend-openproceshuis/utils/error-messages';
import {
  convertSvgToPdf,
  convertSvgToPng,
} from 'frontend-openproceshuis/utils/svg-convertors';
import generateFileDownloadUrl from 'frontend-openproceshuis/utils/file-download-url';
export default class FileDownloadModal extends Component {
  @service toaster;

  get downloadOptions() {
    return [
      {
        label: 'Visio',
        extensionLabel: '.vsdx',
        canDownload: this.args.fileModel?.isVisioFile,
        download: async () =>
          await this.downloadFile(this.createBlobForVisioFile),
        buttonSkin: 'primary',
      },
      {
        label: 'BPMN',
        extensionLabel: '.bpmn',
        canDownload: this.args.fileModel?.isBpmnFile,
        download: async () =>
          await this.downloadFile(this.createBlobForBpmnFile),
        buttonSkin: 'primary',
      },
      {
        label: 'Afbeelding',
        extensionLabel: '.png',
        canDownload: this.canDownloadAsSvg,
        download: async () =>
          await this.downloadFile(this.createBlobForPngFile),
        buttonSkin: 'secondary',
      },
      {
        label: 'Vectorafbeelding',
        extensionLabel: '.svg',
        canDownload: this.canDownloadAsSvg,
        download: async () =>
          await this.downloadFile(this.createBlobForSvgFile),
        buttonSkin: 'secondary',
      },
      {
        label: 'PDF',
        extensionLabel: '.pdf',
        canDownload: true,
        download: async () =>
          await this.downloadFile(this.createBlobForPdfFile),
        buttonSkin: 'secondary',
      },
    ];
  }

  get canDownloadAsSvg() {
    // TODO - transform to svg
    return true;
  }

  async downloadFile(createBlobCb) {
    try {
      const blob = await createBlobCb();
      if (!blob) throw Error;

      const fileName = `${removeFileNameExtension(
        this.args.file.name,
        this.args.file.extension,
      )}.${this.args.file.extension}`;

      FileSaver.saveAs(blob, fileName);
    } catch (error) {
      console.error(error);
      let errorMessage = getMessageForErrorCode(
        'oph.downloadLatestDiagramFailed',
      );
      if (this.args.file.isVisioFile && this.args.file.extension === 'bpmn') {
        errorMessage = getMessageForErrorCode(
          'oph.visioLatestDiagramDownloadFailed',
        );
      }
      this.toaster.error(errorMessage, 'Fout');
      return;
    }

    this.args.trackDownloadFileEvent(
      this.args.file.id,
      this.args.file.name,
      'bpmn',
      this.args.file.extension,
    );
  }

  async createBlobForVisioFile() {
    const url = generateFileDownloadUrl(this.args.file.id);
    const response = await fetch(url);
    if (!response.ok) throw Error(response.status);
    return await response.blob();
  }

  async createBlobForBpmnFile() {
    return Promise.resolve(
      new Blob([this.latestDiagramAsBpmn], {
        type: 'application/xml;charset=utf-8',
      }),
    );
  }

  async createBlobForPngFile() {
    return await convertSvgToPng(this.latestDiagramAsSvg);
  }

  async createBlobForSvgFile() {
    // TODO - get elements for creating sv
    return Promise.resolve(
      new Blob([this.latestDiagramAsSvg], {
        type: 'image/svg+xml;charset=utf-8',
      }),
    );
  }
  async createBlobForPdfFile() {
    return await convertSvgToPdf(this.latestDiagramAsSvg);
  }

  onDownloadSuccess() {
    this.toaster.success('Bestand werd succesvol gedownload', null, {
      timeOut: 2500,
    });
    this.args.onDownloadSuccesful?.();
  }
}
