import Component from '@glimmer/component';

import { action } from '@ember/object';
import { service } from '@ember/service';

export default class InventoryProcessTableRow extends Component {
  @service store;
  @service currentSession;

  get rows() {
    return this.args.labels.map((label, i) => {
      return {
        value: this.args.process[label],
        isLastRow: i + 1 === this.args.labels.length,
      };
    });
  }

  @action
  async editInventoryProcess() {
    const model = await this.getProcessModel();
    this.args.onEditInventoryProcess?.(model);
  }
  @action
  async openDeleteModal() {
    const model = await this.getProcessModel();
    this.args.onOpenDeleteModal?.(model);
  }

  async getProcessModel() {
    const processes = await this.store.query('conceptual-process', {
      'filter[id]': this.args.process?.id,
    });
    if (processes.length === 0) {
      throw new Error(
        `Geen inventaris proces gevonden met id ${this.args.process?.id}`,
      );
    }

    return processes.at(0);
  }
}
