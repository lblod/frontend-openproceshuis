import Component from '@glimmer/component';

import { service } from '@ember/service';
import { task } from 'ember-concurrency';

import { downloadFilesAsZip } from 'frontend-openproceshuis/utils/file-downloader';

export default class FileDownloadMultipleAsZip extends Component {
  @service toaster;

  downloadFiles = task({ drop: true }, async () => {
    if (!this.args.files) {
      this.toaster.error('Er werden geen bestanden gevonden', undefined, {
        timeOut: 5000,
      });
      return;
    }

    await downloadFilesAsZip(this.args.files, this.folderName);
    this.args.onDownloadSuccesful?.();
  });

  get folderName() {
    if (this.args.folderName) {
      return `${this.args.folderName.replace(/[^a-zA-Z0-9]/g, '')}`;
    }
    return 'bestanden';
  }

  get hasFiles() {
    return this.args.files?.length >= 1;
  }

  get buttonLabel() {
    return this.args.buttonLabel ?? 'Download';
  }
}
