import Component from '@glimmer/component';

import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';

import { restartableTask, timeout } from 'ember-concurrency';

export default class InventoryEditableGroupRow extends Component {
  @service toaster;
  @service store;

  @tracked isEditing;
  @tracked label;
  @tracked isDeleteModelOpen;
  @tracked isDeleting;

  get cleanLabel() {
    return this.label?.trim();
  }

  get isValidLabel() {
    return (
      this.label &&
      this.cleanLabel !== '' &&
      !this.errorMessage &&
      this.cleanLabel !== this.args.group.label
    );
  }

  @action
  toggleIsEditing() {
    if (!this.isEditing) {
      this.label = this.args.group.label;
    } else {
      this.label = null;
    }
    this.isEditing = !this.isEditing;
  }

  updateLabel = restartableTask(async (event) => {
    this.label = event.target?.value;
    await timeout(250);
    if (this.label) {
      this.errorMessage = null;
      const duplicates = await this.store.query('process-group', {
        'filter[process-domains][id]': this.args.domain.id,
        'filter[:exact:label]': this.cleanLabel,
        page: { size: 1 },
      });
      if (duplicates.length !== 0) {
        this.errorMessage = 'Deze group bestaat al';
      } else {
        this.errorMessage = null;
      }
    } else {
      this.errorMessage = 'Dit veld is verplicht';
    }
  });

  @action
  async saveGroupLabel() {
    try {
      this.args.group.label = this.cleanLabel;
      await this.args.group.save();
      this.toaster.success(
        'Procesgroep succesvol aangepast',
        this.args.domain.label,
        {
          timeOut: 5000,
        },
      );
    } catch (error) {
      this.toaster.error(
        'Er liep iets mis bij het aanpassen van de procesgroep',
        undefined,
        {
          timeOut: 5000,
        },
      );
    }
    this.toggleIsEditing();
  }

  @action
  async deleteGroupFromDomain() {
    this.isDeleting = true;
    try {
      const domainsOfGroup = await this.args.group.processDomains;
      const remainingDomains = domainsOfGroup.filter(
        (domain) => domain.id !== this.args.domain.id,
      );
      this.args.group.processDomains = remainingDomains;
      await this.args.group.save();
      this.args.onRemovedGroup?.();
      this.toaster.success(
        'Procesgroep verwijderd uit domein',
        this.args.domain.label,
        {
          timeOut: 5000,
        },
      );
    } catch (error) {
      this.toaster.error(
        'Er liep iets mis bij het verwijderen van de groep',
        undefined,
        {
          timeOut: 5000,
        },
      );
    }
    this.isDeleteModelOpen = false;
    this.isDeleting = false;
  }
}
