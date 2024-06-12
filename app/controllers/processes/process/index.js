import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { task, dropTask } from 'ember-concurrency';
import { inject as service } from '@ember/service';
import generateBpmnDownloadUrl from 'frontend-openproceshuis/utils/bpmn-download-url';
import downloadFileByUrl from 'frontend-openproceshuis/utils/file-downloader';

export default class ProcessesProcessIndexController extends Controller {
  queryParams = ['page', 'size', 'sort'];

  @service store;
  @service router;
  @service currentSession;
  @service toaster;

  @tracked page = 0;
  size = 20;
  @tracked sort = 'name';
  @tracked downloadModalOpened = false;
  @tracked replaceModalOpened = false;
  @tracked edit = false;
  @tracked newFileId = undefined;
  @tracked formIsValid = false;

  downloadTypes = [
    {
      extension: 'bpmn',
      mime: 'text/xml',
      label: 'origineel',
    },
    {
      extension: 'png',
      mime: 'image/png',
      label: 'afbeelding',
    },
    {
      extension: 'svg',
      mime: 'image/svg+xml',
      label: 'vectorafbeelding',
    },
    {
      extension: 'pdf',
      mime: 'application/pdf',
      label: 'PDF',
    },
  ];

  get metadata() {
    return this.model.loadMetadataTaskInstance.isFinished
      ? this.model.loadMetadataTaskInstance.value
      : this.model.loadedMetadata;
  }

  get metadataIsLoading() {
    return this.model.loadMetadataTaskInstance.isRunning;
  }

  get metadataHasErrored() {
    return this.model.loadMetadataTaskInstance.isError;
  }

  get diagram() {
    return this.model.loadDiagramTaskInstance.isFinished
      ? this.model.loadDiagramTaskInstance.value
      : this.model.loadedDiagram;
  }

  get diagramIsLoading() {
    return this.model.loadDiagramTaskInstance.isRunning;
  }

  get diagramHasErrored() {
    return this.model.loadDiagramTaskInstance.isError;
  }

  get processSteps() {
    return this.model.loadProcessStepsTaskInstance.isFinished
      ? this.model.loadProcessStepsTaskInstance.value
      : this.model.loadedProcessSteps;
  }

  get processStepsBatchIsLoading() {
    return this.model.loadProcessStepsTaskInstance.isRunning;
  }

  get processStepsBatchHasNoResults() {
    return (
      this.model.loadProcessStepsTaskInstance.isFinished &&
      this.processSteps.length === 0
    );
  }

  get processStepsBatchHasErrored() {
    return this.model.loadProcessStepsTaskInstance.isError;
  }

  get canEdit() {
    return (
      this.currentSession.canEdit &&
      this.currentSession.group &&
      this.metadata?.publisher &&
      this.metadata.publisher.id === this.currentSession.group.id
    );
  }

  @action
  resetFilters() {
    this.page = 0;
    this.sort = 'name';

    // Triggers a refresh of the model
    this.page = null;
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
  async downloadFile(downloadType) {
    const url = generateBpmnDownloadUrl(this.metadata.id);
    const headers = {
      Accept: downloadType.mime,
    };
    const fileName = `${this.metadata.name}.${downloadType.extension}`;
    await downloadFileByUrl(url, headers, fileName);
  }

  @action
  openReplaceModal() {
    this.newFileId = undefined;
    this.replaceModalOpened = true;
  }

  @action
  closeReplaceModal() {
    this.replaceModalOpened = false;
  }

  @task({ enqueue: true, maxConcurrency: 3 })
  *extractBpmnElements(newFileId) {
    yield fetch(`/bpmn?id=${newFileId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.api+json',
      },
    });
  }

  @dropTask
  *replaceFile() {
    if (!this.metadata) return;

    const newFile = yield this.store.findRecord('file', this.newFileId, {
      include:
        'publisher,publisher.primary-site,publisher.primary-site.contacts',
    });

    newFile.name = this.metadata.name;
    newFile.description = this.metadata.description;
    newFile.created = this.metadata.created;
    yield newFile.save();

    yield this.metadata.destroyRecord();
  }

  @action
  async fileUploaded(newFileId) {
    this.newFileId = newFileId;
    await this.replaceFile.perform();

    let url = this.router.urlFor('processes.process', newFileId);
    window.location.replace(url);
  }

  @action
  toggleEdit() {
    this.edit = !this.edit;
    this.validateForm();
  }

  @dropTask
  *updateModel(event) {
    event.preventDefault();

    if (!this.metadata) return;

    if (this.metadata.validate() && this.metadata.hasDirtyAttributes) {
      this.metadata.modified = new Date();

      try {
        yield this.metadata.save();
        this.edit = false;
        this.toaster.success(
          'Metadata van BPMN-bestand succesvol bijgewerkt',
          'Gelukt!',
          {
            timeOut: 5000,
          }
        );
      } catch (error) {
        console.error(error);
        this.toaster.error(
          'Metadata van BPMN-bestand kon niet worden bijgewerkt',
          'Fout'
        );
        this.resetModel();
      }
    } else {
      this.resetModel();
    }
  }

  @action
  resetModel() {
    this.metadata?.rollbackAttributes();
    this.replaceModalOpened = false;
    this.edit = false;
    this.newFileId = undefined;
  }

  @action
  setFileName(event) {
    if (!this.metadata) return;
    this.metadata.name = event.target.value;
    this.validateForm();
  }

  @action
  setFileDescription(event) {
    if (!this.metadata) return;
    this.metadata.description = event.target.value;
    this.validateForm();
  }

  validateForm() {
    this.formIsValid =
      this.metadata?.validate() && this.metadata?.hasDirtyAttributes;
  }
}
