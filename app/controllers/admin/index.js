import Controller from '@ember/controller';
import { keepLatestTask } from 'ember-concurrency';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import ENV from 'frontend-openproceshuis/config/environment';

export default class AdminPanelController extends Controller {
  @service store;

  @tracked categories;
  @tracked domains;
  @tracked groups;

  constructor() {
    super(...arguments);
    this.fetchAdminData.perform();
  }

  @keepLatestTask
  *fetchAdminData() {
    const allConceptualProcesses = yield this.store.query(
      'conceptual-process',
      {
        include:
          'process-groups,process-groups.process-domains,process-groups.process-domains.process-categories',
        filter: {
          ':not:status': ENV.resourceStates.archived,
        },
        page: { size: 2000 },
      },
    );

    const availableGroups = new Set();
    const availableDomains = new Set();
    const availableCategories = new Set();

    for (const process of allConceptualProcesses) {
      const group = process.processGroup;
      if (!group || group.isArchived) continue;
      availableGroups.add(group);

      const domain = group.processDomain;
      if (!domain || domain.isArchived) continue;
      availableDomains.add(domain);

      const category = domain.processCategory;
      if (!category || category.isArchived) continue;
      availableCategories.add(category);
    }

    this.groups = [...availableGroups];
    this.domains = [...availableDomains];
    this.categories = [...availableCategories];
  }
}
