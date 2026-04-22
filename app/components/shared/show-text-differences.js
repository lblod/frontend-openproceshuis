import Component from '@glimmer/component';

import * as hdiff from '@benedicte/html-diff';
import { htmlSafe } from '@ember/template';
export default class SharedShowTextDifferences extends Component {
  get diffAsHtml() {
    const { oldText, newText } = this.args;

    if (!oldText || !newText) return [];
    return htmlSafe(hdiff.htmlDiff(oldText, newText));
  }
}
