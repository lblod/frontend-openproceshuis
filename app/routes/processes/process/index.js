import Route from '@ember/routing/route';
import { service } from '@ember/service';

export default class ProcessesProcessIndexRoute extends Route {
  @service plausible;
  @service store;

  async model(_params, transition) {
    const { id } = this.modelFor(this.getModelNameForRoute(transition));
    const process = await this.store.findRecord('process', id);
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

    return { process };
  }

  setupController(controller) {
    super.setupController(...arguments);
    controller.reset();
  }

  resetController(controller) {
    super.resetController(...arguments);
    controller.reset();
  }
  didTransition() {
    const scrollTo = this.paramsFor('processes.process')?.scrollTo;
    if (scrollTo) {
      const el = document.getElementById(scrollTo);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  getModelNameForRoute(transition) {
    const routeMap = [
      {
        testString: 'shared-processes',
        routeName: 'shared-processes.process',
      },
      {
        testString: 'my-local-government',
        routeName: 'my-local-government.process',
      },
    ];

    const toRouteName = transition?.to?.name;
    for (const route of routeMap) {
      if (toRouteName && toRouteName.includes(route.testString)) {
        return route.routeName;
      }
    }

    return 'processes.process';
  }
}
