import Component from '@glimmer/component';
import { service } from '@ember/service';
import { restartableTask } from 'ember-concurrency';
import { task as trackedTask } from 'reactiveweb/ember-concurrency';

import { ARCHIVED_STATUS_URI } from '../../utils/well-known-uris';

export default class ProcessDisplayIcrField extends Component {
  @service store;

  get fieldConfig() {
    const config = FIELDS[this.args.field];

    if (!config) {
      throw new Error(
        `Veld "${this.args.field}" bestaat niet op Process::DisplayIcrField`,
      );
    }

    return config;
  }

  fetchInformationAssets = restartableTask(async (processId) => {
    if (!processId) {
      return [];
    }

    return await this.store.query('information-asset', {
      'filter[processes][id]': processId,
      'filter[:not:status]': ARCHIVED_STATUS_URI,
    });
  });

  informationAssets = trackedTask(this, this.fetchInformationAssets, () => [
    this.args.process?.id,
  ]);

  get assets() {
    return Array.from(this.informationAssets.value ?? []);
  }

  get isScore() {
    return this.fieldConfig.type === 'score';
  }

  get score() {
    const scores = this.assets.map(
      (_asset) => _asset[this.fieldConfig.attribute],
    );

    if (scores.length === 0) {
      return null;
    }

    return Math.max(...scores);
  }

  get hasData() {
    return this.assets.some((_asset) => _asset[this.fieldConfig.attribute]);
  }
}

const FIELDS = {
  availability: { type: 'score', attribute: 'availabilityScore' },
  integrity: { type: 'score', attribute: 'integrityScore' },
  confidentiality: { type: 'score', attribute: 'confidentialityScore' },
  professionalData: {
    type: 'boolean',
    attribute: 'containsProfessionalData',
  },
  personalData: { type: 'boolean', attribute: 'containsPersonalData' },
  specialPersonalData: {
    type: 'boolean',
    attribute: 'containsSensitivePersonalData',
  },
};
