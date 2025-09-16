import Component from '@glimmer/component';

import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';

import { isEmptyOrUrl } from '../../utils/custom-validators';

export default class ProcessRelevantLinks extends Component {
  @service store;

  @tracked isAddModalOpen = false;
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

  @action
  updateLinkValue(event) {
    this.linkValue = event.target?.value;
  }

  @action
  async addLink() {
    const cleanLink = this.linkValue.trim();
    const link = this.store.createRecord('link', {
      label: null,
      href: this.linkValue,
    });
    const links = await this.args.process.links;
    links.push(cleanLink);

    if (links.find((l) => l.href === link.href)) {
      this.toaster.error('Deze link heeft u al toegevoegd', undefined, {
        timeOut: 5000,
      });
      link.deleteRecord();
      return;
    }

    await link.save();
    await this.args.process.save();
  }
}
