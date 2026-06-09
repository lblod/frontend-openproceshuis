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

    const mapSubItems = (_listItem) => {
      if (_listItem.subItems?.length === 0) {
        return [
          {
            isPlaceholder: true,
          },
        ];
      }

      return _listItem.subItems.map((subItem) => {
        return {
          label: subItem.diagramFile.name,
          self: subItem,
          parent: _listItem,
        };
      });
    };

    return sortedByPosition.map((listItem) => ({
      label: listItem.diagramFile.name,
      self: listItem,
      parent: this.args.diagramList,
      subItems: mapSubItems(listItem),
    }));
  }

  @action
  dragEnd({ sourceList, sourceIndex, targetList, targetIndex }) {
    if (sourceList === targetList && sourceIndex === targetIndex) return;

    const movedItem = sourceList[sourceIndex];
    const replacedWith = targetList[targetIndex];
    const movedItemOldPosition = movedItem.self.position;
    const replacedItemOldPosition = replacedWith.self.position;

    replacedWith.self.position = movedItemOldPosition;
    movedItem.self.position = replacedItemOldPosition;
  }
}
