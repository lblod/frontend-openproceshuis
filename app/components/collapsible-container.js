import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class CollapsibleContainerComponent extends Component {
  @tracked isCollapsed = false;

  @action toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
  }
}
