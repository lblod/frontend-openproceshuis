import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { dropTask, keepLatestTask } from 'ember-concurrency';
import { inject as service } from '@ember/service';
import ENV from 'frontend-openproceshuis/config/environment';
import { getMessageForErrorCode } from 'frontend-openproceshuis/utils/error-messages';

export default class ProcessInventoryProcessCardPopup extends Component {
  @service store;
  @service toaster;
  @tracked selectedProcessConcept = undefined;
  size = 1000;

  constructor(...args) {
    super(...args);
    this.loadProcessConceptsTask.perform();
  }

  get process() {
    return this.args.process;
  }

  get isEditing() {
    return this.args.isEditing;
  }

  get linkedConcept() {
    return this.process.linkedConcept;
  }

  get processConcepts() {
    return this.loadProcessConceptsTask.lastSuccessful?.value;
  }

  get isLoading() {
    return this.loadProcessConceptsTask.isRunning;
  }

  get loadingMessage() {
    return 'Procesconcepten worden opgehaald ...';
  }

  get saveButtonDisabled() {
    return (
      !this.selectedProcessConcept ||
      this.linkedProcess === this.selectedProcessConcept
    );
  }

  @action
  resetModel() {
    this.process.rollbackAttributes();
    this.selectedProcessConcept = undefined;
    this.args.closeModal();
  }

  @action
  selectProcessConcept(processConcept) {
    this.selectedProcessConcept = processConcept;
    console.log('this.selectedProcessConcept', this.selectedProcessConcept);
  }

  @dropTask
  *updateModel(event) {
    event.preventDefault();
    try {
      this.process.linkedConcept = this.selectedProcessConcept;
      yield this.process.save();
      this.toaster.success('Proces succesvol bijgewerkt', 'Gelukt!', {
        timeOut: 5000,
      });
      this.args.closeModal();
    } catch (error) {
      console.error(error);
      const errorMessage = getMessageForErrorCode('oph.updateModelFailed');
      this.toaster.error(errorMessage, 'Fout', { timeout: 5000 });
      this.resetModel();
    }
  }

  @keepLatestTask()
  *loadProcessConceptsTask() {
    let query = {
      reload: true,
      page: { size: this.size },
      include:
        'process-groups,process-groups.process-domains,process-groups.process-domains.process-categories',
      'filter[:not:status]': ENV.resourceStates.archived,
    };

    return yield this.store.query('conceptual-process', query);
  }

  @action
  mockOnchange() {
    // TODO: Change this when filters are going to be created
    console.log('on change called');
  }

  @action
  resetFilters() {
    // TODO: Change this when filters are going to be created
    console.log('reset filters');
  }
}
