import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class FooterLink extends Component {
  @action
  linkFocus() {
    const contentElement = document.getElementById('content');
    contentElement.focus();
    contentElement.scrollTo(0, 0);
  }
}
