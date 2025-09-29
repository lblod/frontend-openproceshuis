export async function hasUsageInRelationOfConceptualProcess(
  modelId,
  modelName,
  emberStore,
) {
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
  const filters = filterMap[modelName] ?? {};
  const usages = await emberStore.query('conceptual-process', {
    ...filters,
    page: { size: 1 },
  });

  return Boolean(usages.length);
}
