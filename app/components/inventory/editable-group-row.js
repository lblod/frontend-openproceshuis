import Component from '@glimmer/component';

import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';

import { restartableTask, timeout } from 'ember-concurrency';

import ENV from 'frontend-openproceshuis/config/environment';

export default class InventoryEditableGroupRow extends Component {
  @service toaster;
  @service store;
  @service('conceptual-process') cpService;

  @tracked isEditing;
  @tracked label;
  @tracked isDeleteModelOpen;
  @tracked isDeleting;
  @tracked isArchiveModelOpen;
  @tracked isArchiving;
  @tracked usageMessage;
  @tracked isCheckingForUsage;

  get isArchived() {
    return this.args.group.status === ENV.resourceStates.archived;
  }

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
        this.args.group.label,
        {
          timeOut: 5000,
        },
      );
    } catch (error) {
      this.toaster.error(
        'Er liep iets mis bij het aanpassen van de procesgroep',
        this.args.group.label,
        {
          timeOut: 5000,
        },
      );
    }
    this.toggleIsEditing();
  }

  async checkForUsage() {
    this.isCheckingForUsage = true;
    let hasUsage = false;
    try {
      hasUsage = await this.cpService.hasUsageInRelationOfConceptualProcess(
        this.args.group.id,
        'process-group',
      );
    } catch (error) {
      this.toaster.error(
        `Er liep iets mis bij het nakijken of ${this.args.group.label} gelinkt is aan een inventaris process`,
        this.args.group.label,
        {
          timeOut: 5000,
        },
      );
    }
    this.isCheckingForUsage = false;
    this.usageMessage = null;
    if (hasUsage) {
      this.usageMessage = `Er werden processen gevonden die gebruik maken van ${this.args.group.label}.`;
    }
  }

  @action
  async openArchiveModal() {
    this.isArchiveModelOpen = true;
    await this.checkForUsage();
  }

  @action
  async openDeleteModal() {
    this.isDeleteModelOpen = true;
    await this.checkForUsage();
  }

  @action
  async archiveGroup() {
    this.isArchiving = true;
    try {
      const domains = await this.args.group.processDomains;
      this.args.group.status = ENV.resourceStates.archived;
      this.args.group.processDomains = domains;
      await this.args.group.save();
      this.toaster.success(`${this.args.group.label} gearchiveerd`, undefined, {
        timeOut: 5000,
      });
    } catch (error) {
      this.toaster.error(
        'Er liep iets mis bij het archiveren van de groep',
        this.args.group.label,
        {
          timeOut: 5000,
        },
      );
    }
    this.isArchiveModelOpen = false;
    this.isArchiving = false;
  }
  @action
  async unArchiveGroup() {
    this.isArchiving = true;
    try {
      this.args.group.status = null;
      await this.args.group.save();
      this.toaster.success(`${this.args.group.label} hersteld`, undefined, {
        timeOut: 5000,
      });
    } catch (error) {
      this.toaster.error(
        'Er liep iets mis bij het hertellen van de groep',
        this.args.group.label,
        {
          timeOut: 5000,
        },
      );
    }
    this.isArchiveModelOpen = false;
    this.isArchiving = false;
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
      this.toaster.success(`${this.args.group.label} verwijderd`, undefined, {
        timeOut: 5000,
      });
    } catch (error) {
      this.toaster.error(
        'Er liep iets mis bij het verwijderen van de groep',
        this.args.group.label,
        {
          timeOut: 5000,
        },
      );
    }
    this.isDeleteModelOpen = false;
    this.isDeleting = false;
  }
}
