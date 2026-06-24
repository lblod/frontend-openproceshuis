import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';

export default class ProcessesProcessManageDiagramsController extends Controller {
  queryParams = [
    'previousRouteTitle',
    'previousRouteModelId',
    'previousRouteName',
  ];

  @tracked previousRouteTitle;
  @tracked previousRouteModelId;
  @tracked previousRouteName;

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
