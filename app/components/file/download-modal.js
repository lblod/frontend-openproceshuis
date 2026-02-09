import Component from '@glimmer/component';

import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import FileSaver from 'file-saver';

import NavigatedViewer from 'bpmn-js/lib/NavigatedViewer';

import removeFileNameExtension from 'frontend-openproceshuis/utils/file-extension-remover';
import { getMessageForErrorCode } from 'frontend-openproceshuis/utils/error-messages';
import {
  convertSvgToPdf,
  convertSvgToPng,
} from 'frontend-openproceshuis/utils/svg-convertors';
import generateFileDownloadUrl, {
  generateVisioConversionUrl,
} from 'frontend-openproceshuis/utils/file-download-url';

export default class FileDownloadModal extends Component {
  @service toaster;

  @tracked isDownloading = false;

  get downloadOptions() {
    return [
      {
        label: 'Visio',
        extensionLabel: '.vsdx',
        canDownload: this.args.fileModel?.isVisioFile,
        download: async () => {
          // eslint-disable-next-line ember/no-side-effects
          this.isDownloading = true;
          const blob = await this.createBlobForVisioFile(this.args.fileModel);
          await this.downloadFileBlob(blob, 'vsdx');
        },
        buttonSkin: 'primary',
      },
      {
        label: 'BPMN',
        extensionLabel: '.bpmn',
        canDownload:
          this.args.fileModel?.isBpmnFile || this.args.fileModel?.isVisioFile,
        download: async () => {
          // eslint-disable-next-line ember/no-side-effects
          this.isDownloading = true;
          let conversionDownloadUrl = null;
          if (this.args.fileModel?.isVisioFile) {
            conversionDownloadUrl = generateVisioConversionUrl(
              this.args.fileModel.id,
              'bpmn',
            );
          }
          const blob = await this.createBlobForBpmnFile(this.args.fileModel, {
            downloadUrl: conversionDownloadUrl,
          });
          await this.downloadFileBlob(blob, 'bpmn');
        },
        buttonSkin: this.args.fileModel?.isBpmnFile ? 'primary' : 'secondary',
      },
      {
        label: 'Afbeelding',
        extensionLabel: '.png',
        canDownload: true,
        download: async () => {
          // eslint-disable-next-line ember/no-side-effects
          this.isDownloading = true;
          const blob = await this.createBlobForPngFile(this.args.fileModel);
          await this.downloadFileBlob(blob, 'png');
        },
        buttonSkin: 'secondary',
      },
      {
        label: 'Vectorafbeelding',
        extensionLabel: '.svg',
        canDownload: true,
        download: async () => {
          // eslint-disable-next-line ember/no-side-effects
          this.isDownloading = true;
          const blob = await this.createBlobForSvgFile(this.args.fileModel);
          await this.downloadFileBlob(blob, 'svg');
        },
        buttonSkin: 'secondary',
      },
      {
        label: 'PDF',
        extensionLabel: '.pdf',
        canDownload: true,
        download: async () => {
          // eslint-disable-next-line ember/no-side-effects
          this.isDownloading = true;
          let blob = null;
          if (this.args.fileModel.isVisioFile) {
            const url = generateVisioConversionUrl(
              this.args.fileModel.id,
              'pdf',
            );
            const response = await fetch(url);
            if (!response.ok) throw Error(response.status);
            blob = await response.blob();
          } else {
            blob = await this.createBlobForPdfFile(this.args.fileModel);
          }
          await this.downloadFileBlob(blob, 'pdf');
        },
        buttonSkin: 'secondary',
      },
    ];
  }

  async downloadFileBlob(blob, targetExtension) {
    const file = this.args.fileModel;
    try {
      if (!blob) throw Error;

      const fileName = `${removeFileNameExtension(
        file.name,
        file.extension,
      )}.${targetExtension ?? file.extension}`;

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
    } finally {
      this.isDownloading = false;
    }
    // TODO - track the download
  }

  async createBlobForVisioFile(fileModel) {
    try {
      const url = generateFileDownloadUrl(fileModel.id);
      const response = await fetch(url);
      if (!response.ok) throw Error(response.status);
      return await response.blob();
    } catch (error) {
      this.toaster.error('Fout tijdens het converteren voor visio', 'Fout');
      this.isDownloading = false;
    }
  }

  async createBlobForBpmnFile(fileModel, { downloadUrl }) {
    const url = downloadUrl ?? generateFileDownloadUrl(fileModel.id);
    try {
      const response = await fetch(url);
      if (!response.ok) throw Error(response.status);
      const octetStreamBlob = await response.blob();
      return Promise.resolve(
        new Blob([octetStreamBlob], {
          type: 'application/xml;charset=utf-8',
        }),
      );
    } catch (error) {
      this.toaster.error(
        'Fout tijdens het converteren van het bestand',
        'Fout',
      );
      this.isDownloading = false;
    }
  }
  async createBlobForPngFile(fileModel) {
    try {
      const svg = await this.fileToSvg(fileModel);
      return await convertSvgToPng(svg);
    } catch (error) {
      console.error(error);
      this.toaster.error('Fout tijdens het converteren voor PNG', 'Fout');
      this.isDownloading = false;
    }
  }

  async createBlobForSvgFile(fileModel) {
    try {
      const svg = await this.fileToSvg(fileModel);

      return Promise.resolve(
        new Blob([svg], {
          type: 'image/svg+xml;charset=utf-8',
        }),
      );
    } catch (error) {
      console.error(error);
      this.toaster.error('Fout tijdens het converteren voor SVG', 'Fout');
      this.isDownloading = false;
    }
  }

  async createBlobForPdfFile(fileModel) {
    try {
      const svg = await this.fileToSvg(fileModel);
      return await convertSvgToPdf(svg);
    } catch (error) {
      console.error(error);
      this.toaster.error('Fout tijdens het converteren voor PDF', 'Fout');
      this.isDownloading = false;
    }
  }

  async fileToSvg(fileModel) {
    try {
      const url = generateFileDownloadUrl(fileModel.id);
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const xml = await resp.text();

      // NOTE - this is a hack so we have the svg in a size
      const bpmnContainer = document.getElementsByClassName('diagrams')?.[0];
      const viewer = new NavigatedViewer({
        container: bpmnContainer,
      });
      await viewer.importXML(xml);
      const { svg } = await viewer.saveSVG();
      viewer?.destroy();

      return svg;
    } catch (error) {
      console.error(error);
      this.toaster.error('Fout tijdens het converteren voor SVG', 'Fout');
      this.isDownloading = false;
    }
  }
}
