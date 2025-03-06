import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class ProcessFilterByBlueprintComponent extends Component {
  @tracked isBlueprint = false;

  @action
  toggleBlueprintFilter() {
    this.isBlueprint = !this.isBlueprint;
    this.args.onChange(this.isBlueprint);
  }
}
