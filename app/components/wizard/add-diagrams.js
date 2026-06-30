import Component from '@glimmer/component';

import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class WizardAddDiagrams extends Component {
  @tracked fileWrappers = [];
  @tracked activeTab = 'upload';

  @action
  setActiveTab(tab) {
    this.activeTab = tab;
  }

  @action
  handleFileUpload(fileWrappers) {
    this.fileWrappers = fileWrappers;
    this.args.onFileWrappersChanged?.(fileWrappers);
  }

  @action
  removeFileWrapper(fileWrapper) {
    fileWrapper.queue.remove(fileWrapper);
    this.fileWrappers = this.fileWrappers.filter((fw) => fw !== fileWrapper);
    this.args.onFileWrappersChanged?.(this.fileWrappers);
  }
}
