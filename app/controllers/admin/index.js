import Controller from '@ember/controller';
import { keepLatestTask } from 'ember-concurrency';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import ENV from 'frontend-openproceshuis/config/environment';

export default class AdminPanelController extends Controller {
  @service store;

  @tracked categories = [];
  @tracked domains = [];
  @tracked groups = [];
  @tracked categorizedData = [];
  @tracked isCollapsed = false;

  constructor() {
    super(...arguments);
    this.fetchAdminData.perform();
  }

  @action
  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
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

    const uniqueGroups = [...availableGroups];
    const uniqueDomains = [...availableDomains];
    const uniqueCategories = [...availableCategories];

    const nestedData = uniqueCategories.map((category) => {
      const domainsForCategory = uniqueDomains.filter(
        (domain) => domain.processCategory?.id === category.id,
      );

      const processedDomains = domainsForCategory.map((domain) => {
        const groupsForDomain = uniqueGroups.filter(
          (group) => group.processDomain?.id === domain.id,
        );
        return {
          id: domain.id,
          label: domain.label,
          groups: groupsForDomain,
        };
      });

      return {
        id: category.id,
        label: category.label,
        domains: processedDomains,
      };
    });

    this.categorizedData = nestedData;
  }
}
