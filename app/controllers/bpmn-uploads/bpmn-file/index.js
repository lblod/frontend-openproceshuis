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

  // FIXME: should be shielded by backend instead of frontend
  get wasPublishedByCurrentOrganization() {
    return (
      this.model.metadata.publisher &&
      this.currentSession.group &&
      this.model.metadata.publisher.id === this.currentSession.group.id
    );
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

  get isLoading() {
    return this.model.loadBpmnElementsTaskInstance.isRunning;
  }

  get hasPreviousData() {
    return (
      this.model.loadedBpmnElements && this.model.loadedBpmnElements.length > 0
    );
  }

  get hasNoResults() {
    return (
      this.model.loadBpmnElementsTaskInstance.isFinished &&
      this.bpmnElements.length === 0
    );
  }

  get hasErrored() {
    return this.model.loadBpmnElementsTaskInstance.isError;
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
    const oldFile = this.model.metadata;
    const newFile = yield this.store.findRecord('file', this.newFileId, {
      include: 'publisher',
    });

    newFile.name = oldFile.name;
    newFile.description = oldFile.description;
    newFile.created = oldFile.created;
    yield newFile.save();

    yield oldFile.destroyRecord();
  }

  @action
  async fileUploaded(newFileId) {
    this.newFileId = newFileId;
    await this.replaceFile.perform();

    let url = this.router.urlFor('bpmn-uploads.bpmn-file', newFileId);
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
    this.toggleEdit();
  }

  @dropTask
  *updateModel(event) {
    event.preventDefault();

    const file = this.model.metadata;
    if (file.validate() && file.hasDirtyAttributes) {
      file.modified = new Date();

      try {
        yield file.save();
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

    this.toggleEdit();
  }

  resetModel() {
    this.model.metadata.rollbackAttributes();
  }

  @action
  setFileName(event) {
    this.model.metadata.name = event.target.value;
    this.validateForm();
  }

  @action
  setFileDescription(event) {
    this.model.metadata.description = event.target.value;
    this.validateForm();
  }

  validateForm() {
    this.formIsValid =
      this.model.metadata.validate() && this.model.metadata.hasDirtyAttributes;
  }
}
