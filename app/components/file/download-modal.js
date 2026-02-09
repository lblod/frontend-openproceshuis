import Component from '@glimmer/component';

import { service } from '@ember/service';
import FileSaver from 'file-saver';

import NavigatedViewer from 'bpmn-js/lib/NavigatedViewer';

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
        download: async () => {
          const blob = await this.createBlobForVisioFile(this.args.fileModel);
          await this.downloadFileBlob(blob);
        },
        buttonSkin: 'primary',
      },
      {
        label: 'BPMN',
        extensionLabel: '.bpmn',
        canDownload: this.args.fileModel?.isBpmnFile,
        download: async () => {
          const blob = await this.createBlobForBpmnFile(this.args.fileModel);
          await this.downloadFileBlob(blob);
        },
        buttonSkin: 'primary',
      },
      {
        label: 'Afbeelding',
        extensionLabel: '.png',
        canDownload: true,
        download: async () => {
          const blob = await this.createBlobForPngFile(this.args.fileModel);
          await this.downloadFileBlob(blob);
        },
        buttonSkin: 'secondary',
      },
      {
        label: 'Vectorafbeelding',
        extensionLabel: '.svg',
        canDownload: true,
        download: async () => {
          const blob = await this.createBlobForSvgFile(this.args.fileModel);
          await this.downloadFileBlob(blob);
        },
        buttonSkin: 'secondary',
      },
      {
        label: 'PDF',
        extensionLabel: '.pdf',
        canDownload: true,
        download: async () => {
          const blob = await this.createBlobForPdfFile(this.args.fileModel);
          await this.downloadFileBlob(blob);
        },
        buttonSkin: 'secondary',
      },
    ];
  }

  async downloadFileBlob(blob) {
    const file = this.args.fileModel;
    try {
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

  async createBlobForPngFile(fileModel) {
    const svg = await this.fileToSvg(fileModel);
    return await convertSvgToPng(svg);
  }

  async createBlobForSvgFile(fileModel) {
    const svg = await this.fileToSvg(fileModel);

    return Promise.resolve(
      new Blob([svg], {
        type: 'image/svg+xml;charset=utf-8',
      }),
    );
  }
  async createBlobForPdfFile(fileModel) {
    const svg = await this.fileToSvg(fileModel);
    return await convertSvgToPdf(svg);
  }

  async fileToSvg(fileModel) {
    const url = generateFileDownloadUrl(fileModel.id);
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const xml = await resp.text();

    // NOTE - this is a hack so we have the svg in the correct size
    const bpmnContainer =
      document.getElementsByClassName('bpmn-container')?.[0];
    const viewer = new NavigatedViewer({
      container: bpmnContainer,
    });
    await viewer.importXML(xml);
    const { svg } = await viewer.saveSVG();
    viewer?.destroy();

    return svg;
  }
}
