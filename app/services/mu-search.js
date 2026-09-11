import Service from '@ember/service';

export default class MuSearchService extends Service {
  async searchOnProcesses(params) {
    await this._validateServiceOnline();

    const pageNumber = params.page ?? 0;
    const pageSize = params.size ?? 20;

    const filters = this._buildMuSearchAndFilter(params);
    const queryParams = new URLSearchParams({
      ...filters,
      'filter[:has-no:isVersionedResource]': true,
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

  _buildMuSearchAndFilter(params) {
    const { title } = params;

    const filters = {};
    if (title) filters['filter[title,description]'] = title;

    return filters;
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
