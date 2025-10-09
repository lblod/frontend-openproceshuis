import Component from '@glimmer/component';

import { action } from '@ember/object';
import { service } from '@ember/service';

import { tracked } from '@glimmer/tracking';

export default class InventoryReplaceGroupModal extends Component {
  @service store;

  @tracked newCategory;
  @tracked newDomain;
  @tracked newGroup;

  constructor() {
    super(...arguments);
    this.newCategory = this.args.group.processDomain?.processCategory;
    this.newDomain = this.args.group.processDomain;
  }

  @action
  setNewProcessCategory({ model }) {
    this.newCategory = model;
    this.newDomain = null;
    this.newGroup = null;
  }

  @action
  setNewProcessDomain({ model }) {
    this.newDomain = model;
    this.newGroup = null;
  }

  @action
  setNewProcessGroup({ model }) {
    this.newGroup = model;
  }

  get isNewGroupSameAsOld() {
    return this.args.group?.id === this.newGroup?.id;
  }
}
