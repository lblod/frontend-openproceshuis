import Component from '@glimmer/component';

import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';

import { isEmptyOrUrl } from '../../utils/custom-validators';

export default class ProcessRelevantLinks extends Component {
  @service store;
  @service toaster;

  @tracked isEditModalOpen = false;
  @tracked isDeleteModalOpen = false;
  @tracked isExecutingAction = false;

  @tracked updateLinkModel;
  @tracked labelValue;
  @tracked linkValue;

  get relevantLinks() {
    return this.args.process?.links ?? [];
  }

  get isLinkValid() {
    return isEmptyOrUrl(this.linkValue);
  }

  get isLabelValid() {
    return !this.labelValue || this.labelValue.trim() != '';
  }

  get canSaveChanges() {
    if (!this.linkValue) {
      return false;
    }
    return this.isLinkValid && !this.isExecutingAction;
  }

  get canUpdateChanges() {
    if (!this.linkValue) {
      return false;
    }
    return (
      this.isLinkValid &&
      this.isInputDivergingFromStartValue &&
      !this.isExecutingAction
    );
  }

  get cleanLabel() {
    return this.labelValue?.trim();
  }

  get cleanLink() {
    return this.linkValue?.trim();
  }

  get isInputDivergingFromStartValue() {
    if (!this.updateLinkModel) {
      return false;
    }
    if (this.cleanLabel != this.updateLinkModel.label) {
      return true;
    }
    if (this.cleanLink != this.updateLinkModel.href) {
      return true;
    }

    return false;
  }

  @action
  updateLabelValue(event) {
    this.labelValue = event.target?.value;
  }

  @action
  updateLinkValue(event) {
    this.linkValue = event.target?.value;
  }

  @action
  openDeleteModal(link) {
    this.isDeleteModalOpen = true;
    this.updateLinkModel = link;
  }

  @action
  openEditModal(link) {
    this.isEditModalOpen = true;
    this.updateLinkModel = link;
    this.labelValue = link.label;
    this.linkValue = link.href;
  }

  @action
  closeAddModal() {
    this.resetLabelAndValueToNull();
    this.args.closeModal?.();
  }

  @action
  closeEditModal() {
    this.isEditModalOpen = false;
    this.resetLabelAndValueToNull();
  }

  resetLabelAndValueToNull() {
    this.linkValue = null;
    this.labelValue = null;
  }

  @action
  async addLink() {
    this.isExecutingAction = true;
    const linkModel = this.store.createRecord('link', {
      label: this.cleanLabel,
      href: this.cleanLink,
    });
    const links = await this.args.process.links;
    if (links.find((l) => l.href === linkModel.href)) {
      this.toaster.error('Deze link werd al toegevoegd.', undefined, {
        timeOut: 5000,
      });
      linkModel.deleteRecord();
      this.linkValue = null;
      return;
    }
    links.push(linkModel);
    try {
      await linkModel.save();
      await this.args.process.save();
      this.toaster.success('Link toegevoegd', undefined, {
        timeOut: 5000,
      });
      this.args.onLinkAdded?.();
    } catch (error) {
      this.closeAddModal();
      this.toaster.error(
        'Er liep iets mis bij het toevoegen van de link',
        undefined,
        {
          timeOut: 5000,
        },
      );
    }
    this.resetLabelAndValueToNull();
    this.isExecutingAction = false;
  }

  @action
  async deleteLink() {
    try {
      this.isExecutingAction = true;
      await this.updateLinkModel.destroyRecord();
      this.isDeleteModalOpen = false;
      this.updateLinkModel = null;
      this.toaster.success('Link succesvol verwijderd', undefined, {
        timeOut: 5000,
      });
    } catch (error) {
      this.toaster.error(
        'Er liep iets mis bij het verwijderen van de link',
        undefined,
        {
          timeOut: 5000,
        },
      );
    }
    this.isExecutingAction = false;
  }

  @action
  async updateLink() {
    this.isExecutingAction = true;
    this.updateLinkModel.label = this.cleanLabel;
    this.updateLinkModel.href = this.cleanLink;
    try {
      await this.updateLinkModel.save();
      this.toaster.success('De link werd succesvol aangepast', undefined, {
        timeOut: 5000,
      });
      this.isEditModalOpen = false;
      this.updateLinkModel = null;
      this.linkValue = null;
    } catch (error) {
      this.toaster.error(
        'Er liep iets mis bij het aanpassen van de link',
        undefined,
        {
          timeOut: 5000,
        },
      );
    }
    this.resetLabelAndValueToNull();
    this.isExecutingAction = false;
  }
}
