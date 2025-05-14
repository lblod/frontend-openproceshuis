import Component from '@glimmer/component';
import { service } from '@ember/service';

export default class ProcessBar extends Component {
  @service currentSession;
}
