import Component from '@glimmer/component';

import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';

import { task, dropTask } from 'ember-concurrency';
import { task as trackedTask } from 'reactiveweb/ember-concurrency';
import { getMessageForErrorCode } from 'frontend-openproceshuis/utils/error-messages';

export default class ProcessInventoryProcessCard extends Component {
  @service toaster;
  @service store;

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

  get linkedProcessWarnText() {
    if (this.args.inventoryProcess?.isArchived) {
      return 'Dit proces werd gearchiveerd';
    }
    if (this.linkedConcept?.processGroup?.isArchived) {
      return 'Dit proces heeft gearchiveerde parameters';
    }

    return null;
  }

  get processConceptTitle() {
    return this.linkedConcept?.title || '/';
  }

  get processGroupLabel() {
    return this.linkedConcept?.processGroup?.label || '/';
  }

  get processDomainLabel() {
    return this.linkedConcept?.processGroup?.processDomain?.label || '/';
  }

  get processCategoryLabel() {
    return (
      this.linkedConcept?.processGroup?.processDomain?.processCategory?.label ||
      '/'
    );
  }

  get versionedProcessConceptTitle() {
    return this.versionedLinkedConcept?.title || '/';
  }

  get versionedProcessGroupLabel() {
    return this.versionedLinkedConcept?.processGroup?.label || '/';
  }

  get versionedProcessDomainLabel() {
    return (
      this.versionedLinkedConcept?.processGroup?.processDomain?.label || '/'
    );
  }

  get versionedProcessCategoryLabel() {
    return (
      this.versionedLinkedConcept?.processGroup?.processDomain?.processCategory
        ?.label || '/'
    );
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

  fetchInventoryProcess = task(
    { restartable: true },
    async (_inventoryProcess) => {
      if (!_inventoryProcess) {
        return null;
      }

      const fullModel = await this.store.findRecord(
        'conceptual-process',
        _inventoryProcess.id,
        {
          include: [
            'process-groups',
            'process-groups.process-domains',
            'process-groups.process-domains.process-categories',
          ].join(','),
        },
      );
      return fullModel;
    },
  );

  get linkedConcept() {
    return this.inventoryProcess?.value;
  }

  get versionedLinkedConcept() {
    return this.versionedInventoryProcess?.value;
  }

  inventoryProcess = trackedTask(this, this.fetchInventoryProcess, () => [
    this.args.inventoryProcess,
  ]);

  versionedInventoryProcess = trackedTask(
    this,
    this.fetchInventoryProcess,
    () => [this.args.versionedInventoryProcess],
  );
}
