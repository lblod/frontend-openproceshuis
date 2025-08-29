import Component from '@glimmer/component';

import { service } from '@ember/service';

export default class DownloadModalInventoryProcesses extends Component {
  @service processApi;

  get downloadCurrentPageHref() {
    return this.processApi.downloadLinkForInventoryProcessesPage(
      this.args.downloadOptions,
    );
  }
  get downloadAllHref() {
    return this.processApi.downloadLinkForInventoryProcesses(
      this.args.downloadOptions,
    );
  }
}
