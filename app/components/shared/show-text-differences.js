import Component from '@glimmer/component';

import * as jsdiff from 'diff';

export default class SharedShowTextDifferences extends Component {
  get diffParts() {
    const { oldText, newText } = this.args;

    if (!oldText || !newText) return [];

    const diff = jsdiff.diffWordsWithSpace(oldText, newText);

    diff.forEach((part) => {
      if (part.added) {
        part.classStyle = 'added-text';
      }
      if (part.removed) {
        part.classStyle = 'deleted-text';
      }
      return part;
    });

    return diff;
  }
}
