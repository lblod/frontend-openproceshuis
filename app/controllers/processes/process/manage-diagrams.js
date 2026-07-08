import Controller from '@ember/controller';

import { action } from '@ember/object';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

import { task } from 'ember-concurrency';
import { WizardAction } from '../../../components/wizard/actions';

export default class ProcessesProcessManageDiagramsController extends Controller {
  @service router;
  @service toaster;
  @service diagram;

  addFilesAction = WizardAction.ADD_FILES;

  queryParams = [
    'previousRouteTitle',
    'previousRouteModelId',
    'previousRouteName',
  ];

  @tracked previousRouteTitle;
  @tracked previousRouteModelId;
  @tracked previousRouteName;

  @tracked diagramToDelete;
  @tracked isListChanged = false;

  saveDiagramStructure = task({ drop: true }, async (_diagramList) => {
    try {
      const currentLists = Array.from(this.model.process.diagramLists);
      const newDiagramList = await this.diagram.cloneDiagramList(
        _diagramList,
        `v0.0.${currentLists.length}`,
      );
      this.model.process.diagramLists = [...currentLists, newDiagramList];
      await this.model.process.save();
      this.toaster.success('Diagrammen structuur werd aangepast', undefined, {
        timeOut: 2500,
      });
    } catch (error) {
      this.toaster.error(
        'Er liep iets mis bij het aanpassen van de diagrammen structuur',
        undefined,
        {
          timeOut: 5000,
        },
      );
      await this.onResetStructure();
    } finally {
      this.isListChanged = false;
    }
  });

  @action
  onDeleteDiagram(_file) {
    const foundAsMainDiagram = this.model.diagramList.diagrams.find(
      (main) => main.diagramFile.id === _file.id,
    );

    if (foundAsMainDiagram) {
      if (
        foundAsMainDiagram.subItems?.filter((listItem) => !listItem.isArchived)
          .length >= 1
      ) {
        this.toaster.error(
          'Hoofdiagrammen met sub diagrammen kunnen niet verwijderd worden.',
          undefined,
          {
            timeOut: 5000,
          },
        );
        this.diagramToDelete = null;
        return;
      }
      this.diagramToDelete = foundAsMainDiagram;
    } else {
      const foundAsSubDiagram = this.model.diagramList.diagrams
        .flatMap((main) => main.subItems ?? [])
        .find((sub) => sub.diagramFile.id === _file.id);
      if (!foundAsSubDiagram) {
        this.diagramToDelete = null;
        return;
      }
      this.diagramToDelete = foundAsSubDiagram;
    }
  }

  deleteDiagram = task({ drop: true }, async () => {
    this.diagramToDelete?.archive();
    await this.router.refresh();
    this.toaster.success('Diagram werd succesvol verwijderd', undefined, {
      timeOut: 2500,
    });
    this.diagramToDelete = null;
  });

  @action
  async onResetStructure() {
    const diagramList = this.model.diagramList;

    for (const main of diagramList.diagrams) {
      for (const sub of main.subItems ?? []) {
        sub.rollbackAttributes();
      }
      main.rollbackAttributes();
    }
    diagramList.rollbackAttributes();
    await this.router.refresh();
    this.isListChanged = false;
  }

  @action
  onDiagramListChanged() {
    this.isListChanged = true;
  }

  get sortedFiles() {
    const filesWithDiagramListItemPosition = this.model.files.map(
      (_fileModel) => {
        _fileModel.position = this.model.diagramList.diagrams.find(
          (d) => d.diagramFile?.id === _fileModel.id,
        )?.position;
        return _fileModel;
      },
    );

    return filesWithDiagramListItemPosition.sort((a, b) => a > b);
  }

  @action
  onRemoveFile(_file) {
    console.log('remove file', _file?.id);
  }

  get hasPreviousRouteBreadCrumb() {
    return (
      this.previousRouteTitle &&
      this.previousRouteModelId &&
      this.previousRouteName
    );
  }

  get breadcrumbTitle() {
    return this.previousRouteTitle ?? this.model.process.title;
  }

  get breadcrumbModel() {
    return this.previousRouteModelId ?? this.model.process.id;
  }

  get breadcrumbRouteName() {
    return this.previousRouteName ?? 'processes.process';
  }
}
