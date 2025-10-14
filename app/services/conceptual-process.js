import Service, { service } from '@ember/service';

export default class ConceptualProcessService extends Service {
  @service store;

  async getProcessesWithUsageOfGroup(groupId) {
    if (!groupId) {
      return [];
    }

    const usages = await this.store.query('conceptual-process', {
      'filter[process-groups][id]': groupId,
      page: { size: 9999 }, // or move it to the process service
    });

    return usages;
  }

  async hasUsageInRelationOfConceptualProcess(modelId, modelName) {
    const filterMap = {
      ['process-category']: {
        'filter[process-groups][process-domains][process-categories][id]':
          modelId,
      },
      ['process-domain']: {
        'filter[process-groups][process-domains][id]': modelId,
      },
      ['process-group']: {
        'filter[process-groups][id]': modelId,
      },
    };
    const filters = filterMap[modelName] ?? null;

    if (!filters) {
      throw new Error(
        `Model naam "${modelName}" bestaat niet op het conceptueel process`,
      );
    }

    const usages = await this.store.query('conceptual-process', {
      ...filters,
      page: { size: 1 },
    });

    return Boolean(usages.length);
  }
}
