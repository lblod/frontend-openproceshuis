import Component from '@glimmer/component';

import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';

import ENV from 'frontend-openproceshuis/config/environment';

export default class InventoryEditToolbar extends Component {
  @service store;
  @service toaster;

  @tracked isCreating;
  @tracked isCreateModelOpen;

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
