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
    const file = this.args.fileModel;

    try {
      const blob = await createBlobCb(file);
      if (!blob) throw Error;

      const fileName = `${removeFileNameExtension(
        file.name,
        file.extension,
      )}.${file.extension}`;

      FileSaver.saveAs(blob, fileName);
      this.toaster.success('Bestand werd succesvol gedownload', null, {
        timeOut: 2500,
      });
      this.args.onDownloadSuccesful?.();
    } catch (error) {
      console.error(error);
      let errorMessage = getMessageForErrorCode(
        'oph.downloadLatestDiagramFailed',
      );
      if (file.isVisioFile && file.extension === 'bpmn') {
        errorMessage = getMessageForErrorCode(
          'oph.visioLatestDiagramDownloadFailed',
        );
      }
      this.toaster.error(errorMessage, 'Fout');
      return;
    }
    // TODO - track the download
  }

  async createBlobForVisioFile(fileModel) {
    const url = generateFileDownloadUrl(fileModel.id);
    const response = await fetch(url);
    if (!response.ok) throw Error(response.status);
    return await response.blob();
  }

  async createBlobForBpmnFile(fileModel) {
    const url = generateFileDownloadUrl(fileModel.id);
    const response = await fetch(url);
    if (!response.ok) throw Error(response.status);
    const octetStreamBlob = await response.blob();
    return Promise.resolve(
      new Blob([octetStreamBlob], {
        type: 'application/xml;charset=utf-8',
      }),
    );
  }

  async createBlobForPngFile() {
    // TODO - get the svg of the file
    return await convertSvgToPng(this.latestDiagramAsSvg);
  }

  async createBlobForSvgFile() {
    // TODO - get the svg of the file
    return Promise.resolve(
      new Blob([this.latestDiagramAsSvg], {
        type: 'image/svg+xml;charset=utf-8',
      }),
    );
  }
  async createBlobForPdfFile() {
    // TODO - get the svg of the file
    return await convertSvgToPdf(this.latestDiagramAsSvg);
  }
}
