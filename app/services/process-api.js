import Service from '@ember/service';

export default class ProcessApiService extends Service {
  downloadLinkForInventoryProcessesPage(downloadOptions) {
    const downloadPageOptions = downloadOptions;

    if (!downloadOptions.page) {
      downloadPageOptions.page = 0;
    }

    const query = this.optionsToQueryParams(downloadPageOptions);
    return `/process-api/conceptional-processes/download?${query.join('&')}`;
  }
  downloadLinkForInventoryProcesses(downloadOptions) {
    const downloadAllOptions = downloadOptions;
    delete downloadAllOptions.page;
    delete downloadAllOptions.size;

    const query = this.optionsToQueryParams(downloadAllOptions);
    return `/process-api/conceptional-processes/download?${query.join('&')}`;
  }

  optionsToQueryParams(options) {
    return Object.keys(options).map((key) => `${key}=${options[key]}`);
  }
}
