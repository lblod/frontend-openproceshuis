import Component from '@glimmer/component';

export default class DownloadModalInventoryProcesses extends Component {
  get downloadCurrentPageHref() {
    const downloadPageOptions = this.args.downloadOptions;

    if (!this.args.downloadOptions.page) {
      downloadPageOptions.page = 0;
    }

    const query = this.optionsToQueryParams(downloadPageOptions);
    return `/process-api/download?${query.join('&')}`;
  }
  get downloadAllHref() {
    const downloadAllOptions = this.args.downloadOptions;
    delete downloadAllOptions.page;
    delete downloadAllOptions.size;

    const query = this.optionsToQueryParams(downloadAllOptions);
    return `/process-api/download?${query.join('&')}`;
  }

  optionsToQueryParams(options) {
    return Object.keys(options).map((key) => `${key}=${options[key]}`);
  }
}
