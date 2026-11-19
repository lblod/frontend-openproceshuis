import Component from '@glimmer/component';
import { service } from '@ember/service';
import { restartableTask } from 'ember-concurrency';
import { task as trackedTask } from 'reactiveweb/ember-concurrency';

export default class ConceptualProcessDisplayField extends Component {
  @service store;

  get fieldConfig() {
    const config = FIELDS[this.args.field];

    if (!config) {
      throw new Error(
        `Veld "${this.args.field}" bestaat niet op ConceptualProcess::DisplayField`,
      );
    }

    return config;
  }

  fetchConceptualProcess = restartableTask(
    async (conceptualProcess, include) => {
      if (!conceptualProcess || include.length === 0) {
        return conceptualProcess ?? null;
      }

      return await this.store.findRecord(
        'conceptual-process',
        conceptualProcess.id,
        {
          reload: true,
          include: include.join(','),
        },
      );
    },
  );

  conceptualProcess = trackedTask(this, this.fetchConceptualProcess, () => [
    this.args.conceptualProcess,
    this.fieldConfig.include,
  ]);

  get label() {
    return this.fieldConfig.label(this.conceptualProcess?.value);
  }

  get hasLinkToProcess() {
    return (
      this.args.field === 'process' && this.conceptualProcess?.value?.number
    );
  }
}

const FIELDS = {
  process: {
    include: [],
    label: (conceptualProcess) => conceptualProcess?.title,
  },
  group: {
    include: ['process-groups'],
    label: (conceptualProcess) => conceptualProcess?.processGroup?.label,
  },
  domain: {
    include: ['process-groups', 'process-groups.process-domains'],
    label: (conceptualProcess) =>
      conceptualProcess?.processGroup?.processDomain?.label,
  },
  category: {
    include: [
      'process-groups',
      'process-groups.process-domains',
      'process-groups.process-domains.process-categories',
    ],
    label: (conceptualProcess) =>
      conceptualProcess?.processGroup?.processDomain?.processCategory?.label,
  },
};
