import Component from '@glimmer/component';

import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class WizardAddDiagrams extends Component {
  @tracked fileWrappers = [];
  @tracked files = [];

  @tracked activeTab = 'upload';

  get combinedFiles() {
    return [...this.fileWrappers, ...this.files] ?? [];
  }

  @action
  setActiveTab(tab) {
    this.activeTab = tab;
  }

  @action
  handleFileUpload(fileWrappers) {
    this.fileWrappers = fileWrappers.map((fw) => {
      fw._source = 'upload';
      return fw;
    });
    this.args.onFileWrappersChanged?.(fileWrappers);
  }

  @action
  addFileFromLibrary(_file) {
    this.files = [...this.files, _file];
    this.args.onLibraryFilesChanged?.(this.files);
  }

  @action
  removeFileWrapper(fileWrapper) {
    if (fileWrapper.queue) {
      fileWrapper.queue.remove(fileWrapper);
      this.fileWrappers = this.fileWrappers.filter((fw) => fw !== fileWrapper);
      this.args.onFileWrappersChanged?.(this.fileWrappers);
    } else {
      this.files = this.files.filter((f) => f !== fileWrapper);
      this.args.onLibraryFilesChanged?.(this.files);
    }
  }
}
