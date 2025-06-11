import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';
import { dropTask, enqueueTask, keepLatestTask } from 'ember-concurrency';
import FileSaver from 'file-saver';
import { htmlSafe } from '@ember/template';
import removeFileNameExtension from 'frontend-openproceshuis/utils/file-extension-remover';
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
  @tracked latestDiagram = undefined;
  @tracked latestDiagramIsLoading = true;
  @tracked latestDiagramHasErrored = false;
  @service store;
  @service toaster;
  @service plausible;

  latestDiagramAsBpmn = undefined;
  latestDiagramAsSvg = undefined;

  constructor() {
    super(...arguments);
    this.fetchLatestDiagram.perform();
  }

  get process() {
    return this.args.process;
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
    this.fetchLatestDiagramById.perform(uploadedFileId);
  }

  @keepLatestTask
  *fetchLatestDiagram() {
    this.latestDiagramIsLoading = true;
    this.latestDiagramHasErrored = false;

    const query = {
      reload: true,
      page: {
        number: 0,
        size: 1,
      },
      'filter[processes][id]': this.process.id,
      'filter[:or:][extension]': ['bpmn', 'vsdx'],
      sort: '-created',
    };

    let diagrams;
    try {
      diagrams = yield this.store.query('file', query);
    } catch {
      this.latestDiagramHasErrored = true;
    }
    if (diagrams?.length) this.latestDiagram = diagrams[0];
    else this.latestDiagramHasErrored = true;

    this.latestDiagramIsLoading = false;
  }

  @keepLatestTask
  *fetchLatestDiagramById(fileId) {
    this.latestDiagramIsLoading = true;
    this.latestDiagramHasErrored = false;

    try {
      this.latestDiagram = yield this.store.findRecord('file', fileId, {
        reload: true,
      });
    } catch {
      this.latestDiagramHasErrored = true;
    }

    this.latestDiagramIsLoading = false;
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
    } catch {
      let message = 'Bestand kon niet worden opgehaald';

      if (this.latestDiagram.isVisioFile && targetExtension === 'bpmn') {
        const mailto =
          'mailto:loketlokaalbestuur@vlaanderen.be' +
          `?subject=${encodeURIComponent(
            'Visio kan niet downloaden als BPMN',
          )}` +
          `?body=${encodeURIComponent(`\n\n${window.location.href}\n`)}`;
        const linkHtml = `<a href="${mailto}">Stuur ons een mailtje</a>`;
        message = htmlSafe(
          `Dit visio-bestand kan niet worden gedownload als BPMN. ${linkHtml} met het proces waarover het gaat en een korte beschrijving van wat niet lukt. Dan kunnen we nagaan wat fout gaat en Open Proces Huis verder verbeteren.`,
        );
      }

      this.toaster.error(message, 'Fout');
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
