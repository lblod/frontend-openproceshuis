import Component from '@glimmer/component';

import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class DiagramListTableRow extends Component {
  @tracked isSubRowOpen = false;

  get iconSubRowOpen() {
    return this.isSubRowOpen ? 'nav-down' : 'nav-right';
  }

  get subRowButtonClass() {
    return this.args.hasSubItems ? '' : 'hidden-element';
  }

  @action
  openCloseSubRows() {
    this.isSubRowOpen = !this.isSubRowOpen;
  }
}
