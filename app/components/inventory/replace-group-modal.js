import Component from '@glimmer/component';

import { action } from '@ember/object';
import { service } from '@ember/service';

import { tracked } from '@glimmer/tracking';

export default class InventoryReplaceGroupModal extends Component {
  @service store;

  @tracked newCategory;
  @tracked newDomain;

  @action
  setNewProcessCategory({ model }) {
    this.newCategory = model;
    this.newDomain = null;
  }

  @action
  setNewProcessDomain({ model }) {
    this.newDomain = model;
  }
}
