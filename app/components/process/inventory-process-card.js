import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { dropTask } from 'ember-concurrency';
import { inject as service } from '@ember/service';
import { getMessageForErrorCode } from 'frontend-openproceshuis/utils/error-messages';

export default class ProcessInventoryProcessCard extends Component {
  @service toaster;
  @tracked edit = false;
  @tracked linkedConceptChanged = false;
  @tracked conceptModalOpened = false;

  get linkedConcept() {
    return this.args.process.linkedConcept;
  }

  @action
  toggleEdit() {
    this.edit = !this.edit;
  }

  @action
  resetModel() {
    this.linkedConceptChanged = false;
    this.edit = false;
  }

  @action
  openConceptModal() {
    this.conceptModalOpened = true;
  }

  @action
  closeConceptModal() {
    this.conceptModalOpened = false;
  }

  @dropTask
  *updateModel(event) {
    event.preventDefault();

    if (this.linkedConceptChanged) {
      try {
        yield this.args.process.save();
        this.linkedConceptChanged = false;
        this.edit = false;
        this.toaster.success('Proces succesvol bijgewerkt', 'Gelukt!', {
          timeOut: 5000,
        });
      } catch (error) {
        console.error(error);
        const errorMessage = getMessageForErrorCode('oph.updateModelFailed');
        this.toaster.error(errorMessage, 'Fout');
        this.resetModel();
      }
    } else {
      this.resetModel();
    }
  }
}
