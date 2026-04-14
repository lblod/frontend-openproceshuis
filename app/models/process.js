import Model, { attr, belongsTo, hasMany } from '@ember-data/model';
import { modelValidator } from 'ember-model-validator';
import ENV from 'frontend-openproceshuis/config/environment';
import {
  isOnlyWhitespace,
  isEmptyOrEmail,
  isEmptyOrUrl,
} from 'frontend-openproceshuis/utils/custom-validators';
import { service } from '@ember/service';

@modelValidator
export default class ProcessModel extends Model {
  @service currentSession;

  @attr('string') title;
  @attr('string') description;
  @attr('string') email;
  @attr('iso-date') created;
  @attr('iso-date') modified;
  @attr('string') status;
  @attr('boolean') isBlueprint;
  @attr('string') additionalInformation;
  @attr('string') hasControlMeasure;

  @belongsTo('group', { inverse: null, async: false }) publisher;
  @belongsTo('group', { inverse: null, async: false }) creator;
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
    async: false,
  })
  links;
  @hasMany('information-asset', {
    inverse: 'processes',
    async: false,
    polymorphic: true,
  })
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
    additionalInformation: {
      length: {
        maximum: 3000,
      },
    },
    hasControlMeasure: {
      custom: (_, value) => isEmptyOrUrl(value),
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

  get isUsedByCurrentGroup() {
    return this.users?.includes(this.currentSession.group);
  }

  get isCreatedAndModifiedOnSameDay() {
    if (!this.created || !this.modified) return false;

    const createdAt = new Date(this.created);
    const modifiedAt = new Date(this.modified);

    if (
      Number.isNaN(createdAt.getTime()) ||
      Number.isNaN(modifiedAt.getTime())
    ) {
      return false;
    }

    return (
      createdAt.getFullYear() === modifiedAt.getFullYear() &&
      createdAt.getMonth() === modifiedAt.getMonth() &&
      createdAt.getDate() === modifiedAt.getDate()
    );
  }

  get href() {
    return `${window.location.origin}/processen/${this.id}`;
  }

  async save() {
    this.modified = new Date();
    await super.save(...arguments);
  }
}
