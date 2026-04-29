import Component from '@glimmer/component';
import * as hdiff from '@benedicte/html-diff';
import { htmlSafe } from '@ember/template';

export default class SharedTextCompared extends Component {
  get isDifferent() {
    const { old, current } = this.args;
    return old !== current;
  }

  get displayText() {
    const { current } = this.args;
    return current?.trim() || '/';
  }

  get characterDiffAsHtml() {
    const { old, current } = this.args;
    if (!old || !current) return [];
    return htmlSafe(hdiff.htmlDiff(old, current));
  }
}
