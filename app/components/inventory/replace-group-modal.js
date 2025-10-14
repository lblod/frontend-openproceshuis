import Component from '@glimmer/component';

import { A } from '@ember/array';
import { action } from '@ember/object';
import { service } from '@ember/service';

import { tracked } from '@glimmer/tracking';

export default class InventoryReplaceGroupModal extends Component {
  @service store;
  @service toaster;
  @service('conceptual-process') cpService;

  @tracked newCategory;
  @tracked newDomain;
  @tracked newGroup;

  @tracked processes = A([]);

  constructor() {
    super(...arguments);
    this.newCategory = this.args.group.processDomain?.processCategory;
    this.newDomain = this.args.group.processDomain;
    this.cpService
      .getProcessesWithUsageOfGroup(this.args.group?.id)
      .then((usages) => this.processes.pushObjects(usages));
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

  get processCountInText() {
    return this.processes?.length >= 1 ? `(${this.processes.length})` : '';
  }

  get canReplaceGroup() {
    return this.newGroup && !this.isNewGroupSameAsOld;
  }

  @action
  async replaceInProcesses() {
    this.isReplacing = true;
    let replacedCount = 0;
    this.newGroup.replacedGroups.push(this.args.group);
    await this.newGroup.save();
    await Promise.all(
      this.processes.map(async (process) => {
        process.processGroups = [this.newGroup];
        try {
          await process.save();
          replacedCount++;
        } catch (error) {
          const message = `Er liep iets mis bij het vervangen van de groep op proces met id ${process.id}`;
          console.error(message);
          this.toaster.error(message, undefined, {
            timeOut: 5000,
          });
        }
      }),
    );
    this.args.onCancel?.();
    if (replacedCount === this.processes.length) {
      this.args.onAllProcessesUpdated?.();
    }
    if (replacedCount >= 1) {
      this.toaster.success(
        `Er werden ${replacedCount} processen aangepast`,
        undefined,
        {
          timeOut: 5000,
        },
      );
    } else {
      this.toaster.error(
        'Er liep iets mis want er werden geen processen aangepast.',
        undefined,
        {
          timeOut: 5000,
        },
      );
    }
    this.isReplacing = false;
  }
}
