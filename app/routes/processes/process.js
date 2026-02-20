import Route from '@ember/routing/route';

import { service } from '@ember/service';

export default class ProcessesProcessRoute extends Route {
  @service plausible;
  @service store;
  @service router;
  @service session;
  @service diagram;

  queryParams = [
    {
      attachmentsPage: {
        replace: true,
        refreshModel: true,
      },
    },
    {
      attachmentsSize: {
        replace: true,
      },
    },
    {
      attachmentsSort: {
        replace: true,
      },
    },
  ];

  beforeModel(transition) {
    if (!this.session.isAuthenticated) {
      this.session.requireAuthentication(transition, 'auth.login');
    }
  }

  async model({ id }) {
    const process = await this.store.findRecord('process', id, {
      include: [
        'process-statistics',
        'publisher',
        'publisher.primary-site',
        'publisher.primary-site.contacts',
        'publisher.classification',
        'ipdc-products',
        'information-assets',
        'linked-concept',
        'linked-concept.process-groups.process-domains',
        'linked-concept.process-groups.process-domains.process-categories',
        'relevant-administrative-units',
      ].join(','),
    });
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

    return {
      process,
      breadcrumRouteName: this.router.currentRouteName?.replace('.index'),
      diagramList: await this.diagram.getLatestDiagramList(process.id),
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
  didTransition() {
    const scrollTo = this.paramsFor('processes.process')?.scrollTo;
    if (scrollTo) {
      const el = document.getElementById(scrollTo);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
