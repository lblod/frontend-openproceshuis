import Controller from '@ember/controller';

import { action } from '@ember/object';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

export default class DiagramsDiagramIndexController extends Controller {
  @service toaster;
  @service router;
  @service eventTracking;

  queryParams = [
    'previousRouteTitle',
    'previousRouteModelId',
    'previousRouteName',
  ];

  @tracked previousRouteTitle;
  @tracked previousRouteModelId;
  @tracked previousRouteName;

  @action
  copyUrl() {
    try {
      navigator.clipboard.writeText(globalThis.location.href);
      this.toaster.success('Link naar diagram gekopieerd', undefined, {
        timeOut: 2500,
      });
    } catch (error) {
      this.toaster.error(
        'Er liep iets mis bij het kopiëren van de link naar de diagram detail pagina.',
        undefined,
        {
          timeOut: 5000,
        },
      );
      throw error;
    }
  }

  @action
  onFileDownloadedSuccessful(fileModel, targetExtension) {
    this.eventTracking.trackDownloadFileEvent(
      fileModel.id,
      fileModel.name,
      fileModel.extension,
      targetExtension,
      this.model.linkedProcesses?.[0],
    );
    this.eventTracking.incrementFileDownloads.perform(
      targetExtension,
      this.model.linkedProcesses?.[0]?.id,
    );
  }

  get hasPreviousRouteBreadCrumb() {
    return (
      this.previousRouteTitle &&
      this.previousRouteModelId &&
      this.previousRouteName
    );
  }

  get breadcrumbTitle() {
    return this.previousRouteTitle ?? this.model.file.name;
  }

  get breadcrumbModel() {
    return this.previousRouteModelId ?? this.model.diagram.id;
  }

  get breadcrumbRouteName() {
    return this.previousRouteName ?? 'diagrams.diagram';
  }
}
