import Component from '@glimmer/component';
import * as hdiff from '@benedicte/html-diff';
import { htmlSafe } from '@ember/template';

export default class SharedTextCompared extends Component {
  get isDifferent() {
    const { old, current } = this.args;

    if (Array.isArray(old) && Array.isArray(current)) {
      if (old.length !== current.length) return true;
      return old.some((item, index) => item.id !== current[index].id);
    }

    return old !== current;
  }

  get characterDiffAsHtml() {
    const { old, current } = this.args;
    if (!old || !current) return [];
    return htmlSafe(hdiff.htmlDiff(old, current));
  }
}
