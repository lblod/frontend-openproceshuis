import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class InventoryDeleteConceptualProcessModalComponent extends Component {
  @action
  cancel() {
    this.args?.onCancel?.();
  }

  @action
  confirm() {
    this.args?.onConfirm?.();
  }
}
