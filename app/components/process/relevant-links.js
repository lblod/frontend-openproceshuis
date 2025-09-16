import Component from '@glimmer/component';

import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

import { isEmptyOrUrl } from '../../utils/custom-validators';

export default class ProcessRelevantLinks extends Component {
  @tracked isAddModalOpen = false;
  @tracked linkValue;

  get inputIsValid() {
    return isEmptyOrUrl(this.linkValue);
  }

  get canSaveChanges() {
    if (!this.linkValue) {
      return false;
    }
    return this.inputIsValid;
  }

  get relevantLinks() {
    return [];
  }

  @action
  updateLinkValue(event) {
    this.linkValue = event.target?.value;
  }

  @action
  addLink() {
    const cleanLink = this.linkValue.trim();
    alert('Add link TODO => ' + cleanLink);
  }
}
