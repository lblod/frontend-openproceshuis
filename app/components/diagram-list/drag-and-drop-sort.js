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
    const maxPosition = (items) =>
      Math.max(0, ...items.map((item) => item.position ?? 0));
    if (sourceList === targetList && sourceIndex === targetIndex) return;

    const movedItem = sourceList[sourceIndex];
    const replacedWith = targetList[targetIndex];
    const effectiveTarget = replacedWith ?? targetList[targetList.length - 1];

    if (!effectiveTarget) return;

    const movedItemOldPosition = movedItem.self.position;

    if (movedItem.parent.id !== effectiveTarget.parent.id) {
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
      if (effectiveTarget.isPlaceholder) {
        movedItem.self.position = 1;
        effectiveTarget.parent.subItems = [movedItem.self];
      } else if (effectiveTarget.isSubItem) {
        const targetSubDiagrams = effectiveTarget.parent.subItems ?? [];
        movedItem.self.position = maxPosition(targetSubDiagrams) + 1;
        effectiveTarget.parent.subItems = [
          ...targetSubDiagrams,
          movedItem.self,
        ];
      } else if (effectiveTarget.isMainDiagram) {
        const mainDiagrams = effectiveTarget.parent.diagrams ?? [];
        if (replacedWith) {
          const insertAt = effectiveTarget.self.position;
          mainDiagrams.forEach((d) => {
            if (d.position >= insertAt) d.position += 1;
          });
          movedItem.self.position = insertAt;
        } else {
          movedItem.self.position = maxPosition(mainDiagrams) + 1;
        }
        effectiveTarget.parent.diagrams = [...mainDiagrams, movedItem.self];
      }
    } else {
      if (!replacedWith) {
        movedItem.self.position = effectiveTarget.self.position + 1;
      } else {
        const replacedItemOldPosition = replacedWith.self.position;
        replacedWith.self.position = movedItemOldPosition;
        movedItem.self.position = replacedItemOldPosition;
      }
    }
  }
}
