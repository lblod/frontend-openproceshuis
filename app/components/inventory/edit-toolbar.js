import Component from '@glimmer/component';

import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';

import ENV from 'frontend-openproceshuis/config/environment';

import { restartableTask, timeout } from 'ember-concurrency';

export default class InventoryEditToolbar extends Component {
  @service store;
  @service toaster;

  @tracked isCreating;
  @tracked isCreateModelOpen;

  @tracked isUpdating;
  @tracked isEditModelOpen;
  @tracked label;
  @tracked errorMessage;

  @tracked isDeleting;
  @tracked isDeleteModelOpen;

  @tracked isArchiving;
  @tracked isArchiveModelOpen;

  allowedModelNames = ['process-category', 'process-domain'];

  get isCreateModel() {
    return (
      !this.args.model &&
      this.args.modeName &&
      this.allowedModelNames.includes(this.args.modelName)
    );
  }

  get isEditModel() {
    return this.args.model;
  }

  get cleanLabel() {
    return this.label?.trim();
  }

  get isValidLabel() {
    return this.label && this.cleanLabel !== '' && !this.errorMessage;
  }

  get canSaveLabel() {
    return this.isValidLabel && this.cleanLabel !== this.args.model.label;
  }

  @action
  openEditModal() {
    this.label = this.args.model.label;
    this.isEditModelOpen = true;
  }

  onUpdateLabel = restartableTask(async (event) => {
    this.label = event.target?.value;
    await timeout(250);
    if (this.label) {
      this.errorMessage = null;
      const duplicates = await this.store.query(this.args.modelName, {
        'filter[:exact:label]': this.cleanLabel,
        page: { size: 1 },
      });
      if (
        duplicates.length !== 0 &&
        this.cleanLabel !== this.args.model.label
      ) {
        this.errorMessage = 'Deze naam bestaat al';
      } else {
        this.errorMessage = null;
      }
    } else {
      this.errorMessage = 'Dit veld is verplicht';
    }
  });

  @action
  async updateModelLabel() {
    this.isUpdating = true;
    try {
      this.args.model.label = this.cleanLabel;
      await this.args.model.save();
    } catch (error) {
      this.toaster.error(
        `Er liep iets mis bij het aanpassen van de naam naar ${this.cleanLabel}`,
        this.args.model.label,
        {
          timeOut: 5000,
        },
      );
    }
    this.isEditModelOpen = false;
    this.isUpdating = false;
  }

  @action
  async deleteModel() {
    this.isDeleting = true;
    try {
      await this.args.model.destroyRecord();
      this.toaster.success(`${this.args.model.label} verwijderd`, undefined, {
        timeOut: 5000,
      });
      this.args.onModelDeleted?.();
    } catch (error) {
      this.toaster.error(
        `Er liep iets mis bij het verwijderen van ${this.args.model.label}`,
        this.args.model.label,
        {
          timeOut: 5000,
        },
      );
    }
    this.isDeleteModelOpen = false;
    this.isDeleting = false;
  }

  @action
  async archiveModel() {
    this.isArchiving = true;
    try {
      this.args.model.status = ENV.resourceStates.archived;
      await this.args.model.save();
      this.toaster.success(`${this.args.model.label} gearchiveerd`, undefined, {
        timeOut: 5000,
      });
    } catch (error) {
      this.toaster.error(
        `Er liep iets mis bij het archiveren van ${this.args.model.label}`,
        this.args.model.label,
        {
          timeOut: 5000,
        },
      );
    }
    this.isArchiveModelOpen = false;
    this.isArchiving = false;
  }

  @action
  async unarchiveModel() {
    this.isArchiving = true;
    try {
      this.args.model.status = null;
      await this.args.model.save();
      this.toaster.success(`${this.args.model.label} hersteld`, undefined, {
        timeOut: 5000,
      });
    } catch (error) {
      this.toaster.error(
        `Er liep iets mis bij het hertellen van ${this.args.model.label}`,
        this.args.group.label,
        {
          timeOut: 5000,
        },
      );
    }
    this.isArchiveModelOpen = false;
    this.isArchiving = false;
  }
}
