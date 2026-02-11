import Component from '@glimmer/component';

import { action } from '@ember/object';
import { task } from 'ember-concurrency';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';

import { downloadFileByUrl } from 'frontend-openproceshuis/utils/file-downloader';

export default class DiagramListTable extends Component {
  @service toaster;
  @service store;
  @service plausible;

  @tracked fileToDownload;
  @tracked fileToDelete;
  @tracked canDeleteFile = true;

  get activeDiagrams() {
    const diagrams = this.args.diagramList.diagrams;
    return diagrams
      .filter((diagrams) => !diagrams.diagramFile.isArchived)
      .sort((latest, current) => latest.position - current.position);
  }

  @action
  async downloadFile(file) {
    await downloadFileByUrl(file.id, file.name);
  }

  @action
  onFileDownloadedSuccessful(fileModel, targetExtension) {
    this.fileToDelete = null;
    this.trackDownloadFileEvent(
      fileModel.id,
      fileModel.name,
      fileModel.extension,
      targetExtension,
      this.args.process,
    );
    this.incrementFileDownloads.perform(targetExtension, this.args.process?.id);
  }

  trackDownloadFileEvent(
    fileId,
    fileName,
    fileExtension,
    targetExtension,
    process,
  ) {
    try {
      this.plausible.trackEvent('Download bestand', {
        'Bestand-ID': fileId,
        Bestandsnaam: fileName,
        Bestandstype: fileExtension,
        Downloadtype: targetExtension ?? fileExtension,
        'Proces-ID': process?.id,
        Procesnaam: process?.title,
        'Bestuur-ID': process?.publisher?.id,
        Bestuursnaam: process?.publisher?.name,
      });
    } catch (error) {
      console.error(
        `Something went wrong while trying to fetch the download quantity of ${targetExtension} `,
        error,
      );
    }
  }

  incrementFileDownloads = task(
    { enqueue: true },
    async (targetExtension, processId) => {
      try {
        const process = await this.store.findRecord('process', processId);
        const stats = process.processStatistics;
        switch (targetExtension) {
          case 'bpmn':
            stats.bpmnDownloads += 1;
            break;
          case 'pdf':
            stats.pdfDownloads += 1;
            break;
          case 'png':
            stats.pngDownloads += 1;
            break;
          case 'svg':
            stats.svgDownloads += 1;
            break;
          default:
            console.error('fileExtension', targetExtension, 'not recognized');
            return;
        }
        await stats.save();
      } catch (error) {
        console.error(
          `Something went wrong while loading the file downloads:`,
          error,
        );
      }
    },
  );
}
