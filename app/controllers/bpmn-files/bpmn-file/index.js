import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { task, dropTask } from 'ember-concurrency';
import { inject as service } from '@ember/service';

export default class BpmnUploadsBpmnFileIndexController extends Controller {
  queryParams = ['page', 'size', 'sort'];

  @service store;
  @service router;
  @service currentSession;
  @service toaster;

  @tracked page = 0;
  size = 20;
  @tracked sort = 'name';
  @tracked replaceModalOpened = false;
  @tracked edit = false;
  @tracked newFileId = undefined;
  @tracked formIsValid = false;

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

  get bpmnElements() {
    return this.model.loadBpmnElementsTaskInstance.isFinished
      ? this.model.loadBpmnElementsTaskInstance.value
      : this.model.loadedBpmnElements;
  }

  get bpmnElementsBatchIsLoading() {
    return this.model.loadBpmnElementsTaskInstance.isRunning;
  }

  get bpmnElementsBatchHasNoResults() {
    return (
      this.model.loadBpmnElementsTaskInstance.isFinished &&
      this.bpmnElements.length === 0
    );
  }

  get bpmnElementsBatchHasErrored() {
    return this.model.loadBpmnElementsTaskInstance.isError;
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
  openReplaceModal() {
    this.newFileId = undefined;
    this.replaceModalOpened = true;
  }

  @action
  closeReplaceModal() {
    this.replaceModalOpened = false;
  }

  @task({ enqueue: true, maxConcurrency: 3 })
  *extractBpmn(newFileId) {
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
      include: 'publisher',
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

    let url = this.router.urlFor('bpmn-files.bpmn-file', newFileId);
    window.location.replace(url);
  }

  @action
  toggleEdit() {
    this.edit = !this.edit;
    this.validateForm();
  }

  @action
  cancelEdit() {
    this.resetModel();
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
