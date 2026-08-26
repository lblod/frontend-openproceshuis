import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class DataCard extends Component {
  @tracked isCollapsed = false;

  constructor() {
    super(...arguments);
    this.isCollapsed = this.args.isInitiallyClosed ?? false;
  }

  @action
  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
  }
}
