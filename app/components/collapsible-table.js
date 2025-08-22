import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class CollapsibleTableComponent extends Component {
  @tracked isCollapsed = false;

  @tracked isAddingNewGroup = false;

  @action
  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
  }

  @action
  addNewGroup() {
    this.isAddingNewGroup = true;
  }

  @action
  cancelAddingNewGroup() {
    this.isAddingNewGroup = false;
  }
}
