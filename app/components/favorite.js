import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class Favorite extends Component {
  @tracked favorite = false;

  constructor() {
    super(...arguments);
    this.favorite = this.args.active;
  }

  @action
  toggleFavorite() {
    this.favorite = !this.favorite;
  }
}
