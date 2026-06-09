import Component from '@glimmer/component';

import { action } from '@ember/object';
import { service } from '@ember/service';

import { ARCHIVED_STATUS_URI } from '../../utils/well-known-uris';

export default class DiagramListDragAndDropSort extends Component {
  @service toaster;

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
            self: {
              position: 1,
            },
            parent: _listItem,
          },
        ];
      }

      return _listItem.subItems.map((subItem) => {
        return {
          label: subItem.diagramFile.name,
          self: subItem,
          parent: _listItem,
          isSubItem: true,
        };
      });
    };

    return sortedByPosition.map((listItem) => ({
      label: listItem.diagramFile.name,
      self: listItem,
      parent: this.args.diagramList,
      subItems: mapSubItems(listItem),
      isMainDiagram: true,
    }));
  }

  @action
  dragEnd({ sourceList, sourceIndex, targetList, targetIndex }) {
    if (sourceList === targetList && sourceIndex === targetIndex) return;

    const movedItem = sourceList[sourceIndex];
    const replacedWith = targetList[targetIndex];

    const movedItemOldPosition = movedItem.self.position;
    const replacedItemOldPosition = replacedWith.self.position;

    if (movedItem.parent.id !== replacedWith.parent.id) {
      const hasSubItems = Boolean(movedItem.self.subItems?.length);
      if (movedItem.isMainDiagram && hasSubItems) {
        this.toaster.error(
          'Je kan geen hoofddiagram met sub-diagrammen verplaatsen onder een andere hoofddiagram',
          undefined,
          {
            timeOut: 2500,
          },
        );
        return;
      }
      if (movedItem.isMainDiagram && !hasSubItems) {
        const sourceItems = movedItem.parent.diagrams ?? [];
        movedItem.parent.diagrams = sourceItems.filter(
          (item) => item.id !== movedItem.self.id,
        );
      } else if (movedItem.isSubItem) {
        const sourceItems = movedItem.parent.subItems ?? [];
        movedItem.parent.subItems = sourceItems.filter(
          (item) => item.id !== movedItem.self.id,
        );
      }
      if (replacedWith.isPlaceholder) {
        movedItem.self.position = 1;
        replacedWith.parent.subItems = [movedItem.self];
      } else if (replacedWith.isSubItem) {
        const targetSubDiagrams = replacedWith.parent.subItems ?? [];
        movedItem.self.position = targetSubDiagrams.length + 1;
        replacedWith.parent.subItems = [...targetSubDiagrams, movedItem.self];
      }
    } else {
      replacedWith.self.position = movedItemOldPosition;
      movedItem.self.position = replacedItemOldPosition;
    }
  }
}
