import Route from '@ember/routing/route';
import { task } from 'ember-concurrency';
import { service } from '@ember/service';

export default class ProcessesIndexRoute extends Route {
  @service session;
  @service store;
  @service muSearch;

  queryParams = {
    page: { refreshModel: true },
    sort: { refreshModel: true },
    title: { refreshModel: true, replace: true },
    modifiedSince: { refreshModel: true, replace: true },
    classifications: { refreshModel: true, replace: true },
    group: { refreshModel: true, replace: true },
    creator: { refreshModel: true, replace: true },
    blueprint: { refreshModel: true },
    ipdcProducts: { refreshModel: true, replace: true },
    linkedConcept: { refreshModel: true, replace: true },
    linkedConceptGroup: { refreshModel: true, replace: true },
    linkedConceptDomain: { refreshModel: true, replace: true },
    linkedConceptCategory: { refreshModel: true, replace: true },
  };

  beforeModel(transition) {
    this.session.requireAuthentication(transition, 'auth.login');
  }

  async model(params) {
    return {
      loadProcessesTaskInstance: this.loadProcessesTask.perform(params),
      loadedProcesses: this.loadProcessesTask.lastSuccesful?.value,
    };
  }

  loadProcessesTask = task(
    { keepLatest: true, cancelOn: 'deactivate' },
    async (params) => {
      const { ids, meta } = await this.muSearch.searchOnProcesses(params);
      let query = {
        filter: {
          id: ids.join(','),
        },
        include: [
          'publisher',
          'creator',
          'users',
          'publisher.classification',
          'relevant-administrative-units',
          'linked-concept',
          'linked-concept.process-groups.process-domains',
          'linked-concept.process-groups.process-domains.process-categories',
        ].join(','),
      };

      const processModels = await this.store.query('process', query);
      const sortedProcesses = processModels.slice().sort((a, b) => {
        return ids.indexOf(a.id) - ids.indexOf(b.id);
      });

      sortedProcesses.meta = meta;

      return sortedProcesses;
    },
  );
}
