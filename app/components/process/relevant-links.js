import Component from '@glimmer/component';

import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';

import { isEmptyOrUrl } from '../../utils/custom-validators';

export default class ProcessRelevantLinks extends Component {
  @service store;
  @service toaster;

  @tracked isAddModalOpen = false;
  @tracked isEditModalOpen = false;
  @tracked isDeleteModalOpen = false;

  @tracked updateLinkModel;
  @tracked linkValue;

  get relevantLinks() {
    return this.args.process?.links ?? [];
  }

  get inputIsValid() {
    return isEmptyOrUrl(this.linkValue);
  }

  get canSaveChanges() {
    if (!this.linkValue) {
      return false;
    }
    return this.inputIsValid;
  }

  get canUpdateChanges() {
    if (!this.linkValue) {
      return false;
    }
    return this.inputIsValid && this.updateLinkModel?.href !== this.linkValue;
  }

  @action
  updateLinkValue(event) {
    this.linkValue = event.target?.value;
  }

  @action
  openAddModal() {
    this.isAddModalOpen = true;
    this.linkValue = null;
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
    this.linkValue = link.href;
  }

  @action
  async addLink() {
    const cleanLink = this.linkValue.trim();
    const linkModel = this.store.createRecord('link', {
      label: null,
      href: cleanLink,
    });
    const links = await this.args.process.links;
    if (links.find((l) => l.href === linkModel.href)) {
      this.toaster.error('Deze link heeft u al toegevoegd', undefined, {
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
      this.isAddModalOpen = false;
      this.linkValue = null;
    } catch (error) {
      this.toaster.error(
        'Er liep iets mis bij het toevoegen van de link',
        undefined,
        {
          timeOut: 5000,
        },
      );
    }
  }

  @action
  async deleteLink() {
    try {
      await this.updateLinkModel.destroyRecord();
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
  }

  @action
  async updateLink() {
    this.updateLinkModel.href = this.linkValue;
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
  }
}
