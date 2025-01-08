import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { downloadFileByUrl } from 'frontend-openproceshuis/utils/file-downloader';
import { service } from '@ember/service';

export default class ReportingController extends Controller {
  queryParams = ['page', 'size', 'sort'];

  @service router;

  @tracked page = 0;
  size = 20;
  @tracked sort = 'title';

  get reports() {
    return this.model.loadReportsTaskInstance.isFinished
      ? this.model.loadReportsTaskInstance.value
      : this.model.loadedReports;
  }

  get isLoading() {
    return this.model.loadReportsTaskInstance.isRunning;
  }

  get hasNoResults() {
    return (
      this.model.loadReportsTaskInstance.isFinished &&
      this.reports?.length === 0
    );
  }

  get hasErrored() {
    return this.model.loadReportsTaskInstance.isError;
  }

  @action
  async regenerateReport(report) {
    const response = await fetch('/reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          attributes: {
            reportName: report.title,
          },
        },
      }),
    });
    if (!response.ok) throw Error(response.status);

    this.router.refresh();
  }

  @action
  async downloadReport(report) {
    if (!report.file) return;

    const fileName = report.title.toLowerCase();
    await downloadFileByUrl(report.file.id, fileName);
  }
}
