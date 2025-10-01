import Component from '@glimmer/component';

import { service } from '@ember/service';
import { dropTask } from 'ember-concurrency';

import { getMessageForErrorCode } from 'frontend-openproceshuis/utils/error-messages';
import ENV from 'frontend-openproceshuis/config/environment';

export default class InventoryDeleteProcessModal extends Component {
  @service toaster;

  deleteProces = dropTask(async () => {
    try {
      this.args.process.status = ENV.resourceStates.archived;
      await this.args.process.save();
      this.toaster.success('Proces succesvol verwijderd.', 'Gelukt!', {
        timeOut: 5000,
      });
      this.args.onProcessDeleted?.();
    } catch (error) {
      const errorMessage = getMessageForErrorCode('oph.processDeletionError');
      this.toaster.error(errorMessage, 'Fout', { timeOut: 5000 });
    }
  });
}
