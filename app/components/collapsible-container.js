import Component from '@glimmer/component';

import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class CollapsibleContainer extends Component {
  @tracked isCollapsed = false;

  constructor() {
    super(...arguments);

    this.isCollapsed = !!this.args.isCollapsedOnLoad;
  }

  @action
  toggleCollapse() {
    if (this.args.toggleOpen === true) {
      this.isCollapsed = false;
      this.args.onContainerLogicTakesOver?.();
    }
    this.isCollapsed = !this.isCollapsed;
  }

  get isContentShown() {
    return !this.isCollapsed || this.args.toggleOpen === true;
  }
}
