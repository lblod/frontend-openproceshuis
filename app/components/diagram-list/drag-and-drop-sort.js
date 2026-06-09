import Component from '@glimmer/component';

import { action } from '@ember/object';
import { ARCHIVED_STATUS_URI } from '../../utils/well-known-uris';

export default class DiagramListDragAndDropSort extends Component {
  get items() {
    if (!this.args.diagramList) {
      return [];
    }

    const nonArchivedItems = Array.from(this.args.diagramList.diagrams).filter(
      (listItem) => listItem.diagramFile.status !== ARCHIVED_STATUS_URI,
    );
    const sortedByPosition = nonArchivedItems.sort(
      (a, b) => a.position - b.position,
    );

    return sortedByPosition.map((listItem) => ({
      label: listItem.diagramFile.name,
      parent: listItem,
    }));
  }

  @action
  dragEnd({ sourceList, sourceIndex, targetList, targetIndex }) {
    if (sourceList === targetList && sourceIndex === targetIndex) return;

    const movedItem = sourceList[sourceIndex];
    const replacedWith = targetList[targetIndex];
    const movedItemOldPosition = movedItem.parent.position;
    const replacedItemOldPosition = replacedWith.parent.position;

    replacedWith.parent.position = movedItemOldPosition;
    movedItem.parent.position = replacedItemOldPosition;
  }
}
