import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class ProcessesProcessIndexRoute extends Route {
  @service plausible;
  @service store;
  @service processApi;

  async model() {
    const process = this.modelFor('processes.process');
    let stats = process.processStatistics;

    if (!stats) {
      stats = this.store.createRecord('process-statistic', {
        process,
      });
    }

    this.plausible.trackEvent('Raadpleeg proces', {
      'Proces-ID': process?.id,
      Procesnaam: process?.title,
      'Bestuur-ID': process?.publisher?.id,
      Bestuursnaam: process?.publisher?.name,
    });

    stats.processViews += 1;
    await stats.save();

    const usedByUserCount = await this.processApi.getUsersForProcess(
      process.id,
    );

    return {
      process,
      usedByUserCount,
    };
  }

  setupController(controller) {
    super.setupController(...arguments);
    controller.reset();
  }

  resetController(controller) {
    super.resetController(...arguments);
    controller.reset();
  }
}
