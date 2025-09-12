import Service from '@ember/service';

export default class ProcessApiService extends Service {
  async fetchInventoryProcessesTableContent(fetchOptions) {
    const queryOptions = fetchOptions;

    if (!fetchOptions.page) {
      queryOptions.page = 0;
    }

    const query = this.optionsToQueryParams(queryOptions);

    const response = await fetch(
      `/process-api/conceptual-processes/table-content?${query.join('&')}`,
    );

    if (!response.ok) {
      throw new Error(
        'Er liep iets mis bij het ophalen van de content voor de inventaris tabel',
      );
    }
    const tableContent = await response.json();
    const content = tableContent.content;
    content.meta = tableContent.meta;

    return {
      sortableHeaderLabels: tableContent.headerLabels,
      headerLabels: tableContent.headerLabels.map((sh) => sh.label),
      content,
    };
  }

  downloadLinkForInventoryProcessesPage(downloadOptions) {
    const downloadPageOptions = downloadOptions;

    if (!downloadOptions.page) {
      downloadPageOptions.page = 0;
    }

    const query = this.optionsToQueryParams(downloadPageOptions);
    return `/process-api/conceptual-processes/download?${query.join('&')}`;
  }
  downloadLinkForInventoryProcesses(downloadOptions) {
    const downloadAllOptions = downloadOptions;
    delete downloadAllOptions.page;
    delete downloadAllOptions.size;

    const query = this.optionsToQueryParams(downloadAllOptions);
    return `/process-api/conceptual-processes/download?${query.join('&')}`;
  }

  optionsToQueryParams(options) {
    return Object.keys(options).map((key) => `${key}=${options[key]}`);
  }
}
