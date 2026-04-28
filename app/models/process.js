import Model, { attr, belongsTo, hasMany } from '@ember-data/model';
import { modelValidator } from 'ember-model-validator';
import ENV from 'frontend-openproceshuis/config/environment';
import {
  isOnlyWhitespace,
  isEmptyOrEmail,
  isEmptyOrUrl,
} from 'frontend-openproceshuis/utils/custom-validators';
import { service } from '@ember/service';
import { task } from 'ember-concurrency';

@modelValidator
export default class ProcessModel extends Model {
  @service currentSession;

  @attr('boolean', { defaultValue: false }) isVersionedResource;
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
  @hasMany('process', {
    inverse: 'linkedBlueprints',
    async: true,
    polymorphic: true,
    as: 'process',
  })
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

  get baseModelName() {
    return this.___recordState.identifier.type;
  }

  cleanupAttributes() {
    this.title = this.title?.trim();
    this.description = this.description?.trim();
    this.email = this.email?.trim();
  }

  async save() {
    this.modified = new Date();
    await super.save(...arguments);
    if (this.baseModelName !== 'versioned-process') {
      this.applyVersioning.perform();
    }
  }

  applyVersioning = task({ drop: true }, async () => {
    const currentVersions = await this.store.query('versioned-process', {
      'filter[canonical][id]': this.id,
      include: 'canonical',
      sort: 'canonical.created',
      page: {
        size: 1,
        number: 0,
      },
    });

    const processVersionData = await this.getProcessDataForVersioning();
    const versioned = this.store.createRecord('versioned-process', {
      ...processVersionData,
      canonical: this,
      previousVersion: currentVersions?.[0] ?? null,
    });
    await versioned.save();
  });

  async getProcessDataForVersioning() {
    const now = new Date();
    const data = {
      created: now,
      modified: now,
      title: this.title,
      description: this.description,
      email: this.email,
      status: this.status,
      isBlueprint: this.isBlueprint,
      additionalInformation: this.additionalInformation,
      hasControlMeasure: this.hasControlMeasure,
      // Relations
      publisher: await this.publisher,
      creator: await this.creator,
      linkedConcept: await this.linkedConcept,
      diagramLists: await this.diagramLists,
      attachments: await this.attachments,
      ipdcProducts: await this.ipdcProducts,
      links: await this.links,
      informationAssets: await this.informationAssets,
      linkedBlueprints: await this.linkedBlueprints,
      users: await this.users,
      relevantAdministrativeUnits: await this.relevantAdministrativeUnits,
    };

    return data;
  }
}
