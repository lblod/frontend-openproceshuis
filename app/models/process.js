import Model, { attr, belongsTo, hasMany } from '@ember-data/model';
import { modelValidator } from 'ember-model-validator';
import ENV from 'frontend-openproceshuis/config/environment';
import {
  isOnlyWhitespace,
  isEmptyOrEmail,
} from 'frontend-openproceshuis/utils/custom-validators';

@modelValidator
export default class ProcessModel extends Model {
  @attr('string') title;
  @attr('string') description;
  @attr('string') email;
  @attr('iso-date') created;
  @attr('iso-date') modified;
  @attr('string') status;
  @attr('boolean') isBlueprint;

  @belongsTo('group', { inverse: null, async: false }) publisher;
  @belongsTo('process-statistic', { inverse: 'process', async: false })
  processStatistics;
  @belongsTo('conceptual-process', {
    inverse: null,
    async: false,
  })
  linkedConcept;
  @hasMany('diagram-list', { inverse: null, async: false })
  diagramLists;
  @hasMany('file', { inverse: null, async: false })
  attachments;
  @hasMany('ipdc-product', {
    inverse: 'processes',
    async: false,
    polymorphic: true,
  })
  ipdcProducts;
  @hasMany('link', {
    inverse: null,
    async: true,
  })
  links;
  @hasMany('information-asset', { inverse: null, async: false })
  informationAssets;
  @hasMany('process', { inverse: 'linkedBlueprints', async: true })
  linkedBlueprints;
  @hasMany('group', { inverse: null, async: false })
  users;
  @hasMany('administrative-unit-classification-code', {
    inverse: 'processes',
    async: false,
  })
  relevantAdministrativeUnits;

  validations = {
    title: {
      presence: true,
      length: {
        maximum: 100,
      },
    },
    description: {
      length: {
        maximum: 3000,
      },
      custom: (_, value) => !isOnlyWhitespace(value),
    },
    email: {
      custom: (_, value) => isEmptyOrEmail(value),
    },
  };

  get isArchived() {
    return this.status === ENV.resourceStates.archived;
  }

  archive() {
    this.status = ENV.resourceStates.archived;
  }

  get isPublishedByAbbOrDv() {
    const ovoCodes = [ENV.ovoCodes.abb, ENV.ovoCodes.dv];
    return ovoCodes.includes(this.publisher?.identifier);
  }

  get href() {
    return `${window.location.origin}/processen/${this.id}`;
  }

  async save() {
    this.modified = new Date();
    await super.save(...arguments);
  }
}
