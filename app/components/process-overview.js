import Component from '@glimmer/component';

export default class ProcessOverviewComponent extends Component {
  get loadProcessesTaskInstance() {
    return this.args.model?.loadProcessesTaskInstance;
  }

  get processes() {
    return this.loadProcessesTaskInstance?.isFinished
      ? this.loadProcessesTaskInstance.value
      : this.args.model?.loadedProcesses;
  }

  get isLoading() {
    return this.loadProcessesTaskInstance?.isRunning ?? false;
  }

  get hasNoResults() {
    return (
      this.loadProcessesTaskInstance?.isFinished && this.processes?.length === 0
    );
  }

  get hasErrored() {
    return this.loadProcessesTaskInstance?.isError ?? false;
  }
}
