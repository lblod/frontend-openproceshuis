import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { dropTask } from 'ember-concurrency';
import { inject as service } from '@ember/service';
import { getMessageForErrorCode } from 'frontend-openproceshuis/utils/error-messages';

export default class ProcessInventoryProcessCard extends Component {
  @service toaster;
  @tracked edit = false;
  @tracked conceptModalOpened = false;

  @action
  toggleEdit() {
    this.edit = !this.edit;
  }

  @action
  resetModel() {
    this.edit = false;
  }

  @action
  openConceptModal() {
    this.conceptModalOpened = true;
  }

  @action
  closeConceptModal() {
    this.conceptModalOpened = false;
    this.edit = false;
  }

  @dropTask
  *updateModel(event) {
    event.preventDefault();
    try {
      yield this.args.process.save();
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
  }
}
