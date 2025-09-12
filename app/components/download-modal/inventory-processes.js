import Component from '@glimmer/component';

import { action } from '@ember/object';
import { service } from '@ember/service';

export default class DownloadModalInventoryProcesses extends Component {
  @service toaster;
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

  @action
  showIsDownloadingToast() {
    this.toaster.success('Inventaris processen worden gedownload', undefined, {
      timeOut: 5000,
    });
    this.args.onClickedDownloadButton?.();
  }
}
