import Controller from '@ember/controller';

import { action } from '@ember/object';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

import { task } from 'ember-concurrency';
import { WizardAction } from '../../../components/wizard/actions';

export default class ProcessesProcessManageDiagramsController extends Controller {
  @service router;
  @service toaster;

  addFilesAction = WizardAction.ADD_FILES;

  queryParams = [
    'previousRouteTitle',
    'previousRouteModelId',
    'previousRouteName',
  ];

  @tracked previousRouteTitle;
  @tracked previousRouteModelId;
  @tracked previousRouteName;

  @tracked isListChanged;

  saveDiagramStructure = task({ drop: true }, async (diagramList) => {
    try {
      for (const main of diagramList.diagrams) {
        await main.save();
      }

      const subItems = diagramList.diagrams.flatMap(
        (main) => main.subItems ?? [],
      );
      for (const sub of subItems) {
        await sub.save();
      }

      await diagramList.save();

      this.toaster.success('Diagrammen structuur werd aangepast', undefined, {
        timeOut: 2500,
      });
    } catch (error) {
      this.toaster.success(
        'Er liep iets mis bij het aanpassen van de diagrammen structuur',
        undefined,
        {
          timeOut: 5000,
        },
      );
    }
  });

  @action
  onCancel() {
    this.model.diagramList.rollbackAttributes();
    this.router.transitionTo(this.breadcrumbRouteName, this.breadcrumbModel);
  }

  @action
  onDiagramListChanged() {
    this.isListChanged = true;
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
