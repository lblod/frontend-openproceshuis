import Component from '@glimmer/component';
import { service } from '@ember/service';

export default class NavigationBar extends Component {
  @service currentSession;
}
