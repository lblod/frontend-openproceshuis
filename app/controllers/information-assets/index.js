import Controller from '@ember/controller';

import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { restartableTask, timeout } from 'ember-concurrency';

export default class InformationAssetsIndexController extends Controller {
  size = 20;
  queryParams = ['page', 'size'];
  @service store;
  @service router;
  @service currentSession;

  @tracked isLoadingRoute;
  @tracked page = 0;
  @tracked sort = 'title';
  @tracked title = null;

  get informationAssets() {
    return this.model.informationAssets.isFinished
      ? this.model.informationAssets.value
      : this.model.loadedInformationAssets;
  }

  get isLoading() {
    return this.model.informationAssets.isRunning;
  }

  setTitle = restartableTask(async (event) => {
    await timeout(250);
    this.title = event.target?.value;
  });

  @action
  resetFilters() {
    this.title = null;
    this.page = 0;
    this.sort = 'title';
  }
}
