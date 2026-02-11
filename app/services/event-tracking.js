import Service, { service } from '@ember/service';

import { task } from 'ember-concurrency';

export default class EventTrackingService extends Service {
  @service plausible;
  @service store;

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
