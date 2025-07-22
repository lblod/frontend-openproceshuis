import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';
import { dropTask, enqueueTask } from 'ember-concurrency';
import FileSaver from 'file-saver';
import removeFileNameExtension from 'frontend-openproceshuis/utils/file-extension-remover';
import { getMessageForErrorCode } from 'frontend-openproceshuis/utils/error-messages';

import {
  convertSvgToPdf,
  convertSvgToPng,
} from 'frontend-openproceshuis/utils/svg-convertors';
import generateFileDownloadUrl, {
  generateVisioConversionUrl,
} from 'frontend-openproceshuis/utils/file-download-url';
export default class ProcessDiagramVisual extends Component {
  @tracked downloadModalOpened = false;
  @tracked replaceModalOpened = false;
  @tracked piiResults = [];
  @tracked piiToAnonymize = [];
  @tracked fileHasPii = false;
  @service store;
  @service toaster;
  @service plausible;
  @service diagram;
  @service api;

  latestDiagramAsBpmn = undefined;
  latestDiagramAsSvg = undefined;

  constructor() {
    super(...arguments);
    this.diagram.fetchLatest.perform(this.process.id);
  }

  get process() {
    return this.args.process;
  }

  get latestDiagram() {
    return this.diagram.latestDiagram;
  }

  get latestDiagramIsLoading() {
    return this.diagram.latestDiagramIsLoading;
  }

  get latestDiagramHasErrored() {
    return this.diagram.latestDiagramHasErrored;
  }

  @action
  setPiiState(piiData) {
    this.piiResults = piiData;
    this.fileHasPii = piiData.length > 0;
    this.piiToAnonymize = [...piiData];
  }

  @action
  handlePiiSelection(result, isChecked) {
    if (isChecked) {
      // Add the item to the list to be anonymized
      this.piiToAnonymize = [...this.piiToAnonymize, result];
    } else {
      // Remove the item from the list
      this.piiToAnonymize = this.piiToAnonymize.filter(
        (item) => item !== result,
      );
    }
  }

  @action
  handleAnonymization() {
    console.log('Anonymization triggered for:', this.piiToAnonymize);
  }

  @action
  setLatestDiagramAsBpmn(value) {
    this.latestDiagramAsBpmn = value;
  }

  @action
  setLatestDiagramAsSvg(value) {
    this.latestDiagramAsSvg = value;
  }

  @action
  openDownloadModal() {
    this.downloadModalOpened = true;
  }

  @action
  closeDownloadModal() {
    this.downloadModalOpened = false;
  }

  @action
  openReplaceModal() {
    this.replaceModalOpened = true;
  }

  @action
  closeReplaceModal() {
    this.replaceModalOpened = false;
  }

  @enqueueTask
  *addFileToProcess(newFileId) {
    const newFile = yield this.store.findRecord('file', newFileId);
    this.process.files.push(newFile);
    this.process.modified = newFile.created;

    yield this.process.save();
  }

  @dropTask
  *extractBpmnElements(bpmnFileId) {
    yield fetch(`/bpmn?id=${bpmnFileId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
    });
  }

  @action
  diagramUploaded(uploadedFileId) {
    this.replaceModalOpened = false;
    this.diagram.fetchLatestById.perform(uploadedFileId);
    this.diagram.refreshVersions(this.process.id);
  }

  @dropTask
  *downloadLatestDiagram(targetExtension) {
    try {
      if (!this.latestDiagram) throw Error;

      let blob = undefined;
      if (targetExtension === 'vsdx' && this.latestDiagram.isVisioFile) {
        const url = generateFileDownloadUrl(this.latestDiagram.id);
        const response = yield fetch(url);
        if (!response.ok) throw Error(response.status);
        blob = yield response.blob();
      } else if (targetExtension === 'bpmn') {
        if (this.latestDiagramAsBpmn) {
          blob = new Blob([this.latestDiagramAsBpmn], {
            type: 'application/xml;charset=utf-8',
          });
        } else if (this.latestDiagram.isVisioFile) {
          const url = generateVisioConversionUrl(
            this.latestDiagram.id,
            targetExtension,
          );
          const response = yield fetch(url);
          if (!response.ok) throw Error(response.status);
          blob = yield response.blob();
        }
      } else if (targetExtension === 'svg' && this.latestDiagramAsSvg) {
        blob = new Blob([this.latestDiagramAsSvg], {
          type: 'image/svg+xml;charset=utf-8',
        });
      } else if (targetExtension === 'pdf') {
        if (this.latestDiagramAsSvg) {
          blob = yield convertSvgToPdf(this.latestDiagramAsSvg);
        } else if (this.latestDiagram.isVisioFile) {
          const url = generateVisioConversionUrl(
            this.latestDiagram.id,
            targetExtension,
          );
          const response = yield fetch(url);
          if (!response.ok) throw Error(response.status);
          blob = yield response.blob();
        }
      } else if (targetExtension === 'png' && this.latestDiagramAsSvg) {
        blob = yield convertSvgToPng(this.latestDiagramAsSvg);
      }
      if (!blob) throw Error;

      const fileName = `${removeFileNameExtension(
        this.latestDiagram.name,
        this.latestDiagram.extension,
      )}.${targetExtension}`;

      FileSaver.saveAs(blob, fileName);
    } catch (error) {
      console.error(error);
      let errorMessage = getMessageForErrorCode(
        'oph.downloadLatestDiagramFailed',
      );
      if (this.latestDiagram.isVisioFile && targetExtension === 'bpmn') {
        errorMessage = getMessageForErrorCode(
          'oph.visioLatestDiagramDownloadFailed',
        );
      }
      this.toaster.error(errorMessage, 'Fout');
      return;
    }

    this.args.trackDownloadFileEvent(
      this.latestDiagram.id,
      this.latestDiagram.name,
      'bpmn',
      targetExtension,
    );
  }
}
