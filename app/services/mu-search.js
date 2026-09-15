import Service from '@ember/service';

export default class MuSearchService extends Service {
  async searchOnProcesses(params) {
    await this._validateServiceOnline();

    const pageNumber = params.page ?? 0;
    const pageSize = params.size ?? 20;

    const filters = this._buildMuSearchFilter(params);
    const sort = this._buildMuSearchSort(params.sort);
    const queryParams = new URLSearchParams({
      ...filters,
      ...sort,
      'filter[:has-no:canonical]': true,
      'filter[:has-no:status]': true,
      'page[number]': pageNumber,
      'page[size]': pageSize,
    });

    const response = await fetch(
      `/search/processes/search?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/vnd.api+json',
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }

    const { count, data } = await response.json();

    return {
      ids: data.map((result) => result.id),
      meta: this._createMetaForResults(count, pageNumber, pageSize),
      page: {
        number: pageNumber,
        size: pageSize,
      },
    };
  }

  _buildMuSearchFilter(params) {
    const {
      title,
      modifiedSince,
      classifications,
      group,
      creator,
      blueprint,
      ipdcProducts,
    } = params;

    const filters = {};
    if (title) {
      filters['filter[:sqs:title,description]'] = title;
    }
    if (modifiedSince) {
      filters['filter[:gte:modified]'] = modifiedSince;
    }
    if (classifications) {
      // Direct path targeting the nested uuid field
      filters['filter[relevantAdministrativeUnits.uuid]'] = classifications;
    }
    if (group) {
      filters['filter[publisher.name.keyword]'] = group;
    }
    if (creator) {
      filters['filter[creator.name.keyword]'] = creator;
    }
    if (blueprint) {
      filters['filter[isBlueprint]'] = blueprint;
    }
    if (ipdcProducts) {
      filters['filter[ipdcProductIds]'] = ipdcProducts;
    }

    return filters;
  }

  _buildMuSearchSort(sortField) {
    if (!sortField) {
      return {};
    }

    const isDescending = sortField.startsWith('-');
    if (isDescending) {
      sortField = sortField.replace('-', '');
    }

    const sortKeys = {
      title: 'title.keyword',
      description: 'description.keyword',
      modified: 'modified',
      classification: 'relevantAdministrativeUnits.name.keyword',
      organization: 'publisher.name.keyword',
      creator: 'creator.name.keyword',
    };

    if (!Object.keys(sortKeys).includes(sortField)) {
      return {};
    }

    return {
      [`sort[${sortKeys[sortField]}]`]: isDescending ? 'desc' : 'asc',
    };
  }

  async _validateServiceOnline() {
    const response = await fetch('/search/health');

    if (!response.ok) {
      throw new Error('Unreachable service: mu-search');
    }

    return true;
  }

  _createMetaForResults(totalCount, page, size) {
    const meta = {};
    meta.count = totalCount;
    meta.pagination = {
      first: {
        number: 0,
      },
      self: {
        number: page,
        size: size,
      },
      last: {
        number: Math.floor(meta.count / size),
      },
    };
    if (page * size < meta.count) {
      meta.pagination.next = {
        number: page + 1,
        size: size,
      };
    }
    if (page > 0) {
      meta.pagination.prev = {
        number: page - 1,
        size: size,
      };
    }

    return meta;
  }
}
