import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { keepLatestTask } from 'ember-concurrency';
import ENV from 'frontend-openproceshuis/config/environment';

export default class InventoryEditConceptualProcessModalComponent extends Component {
  @service store;

  @tracked title = undefined;
  @tracked processCategory = undefined;
  @tracked processDomain = undefined;
  @tracked processGroup = undefined;

  @tracked categories = [];
  @tracked domains = [];
  @tracked groups = [];

  constructor() {
    super(...arguments);
    this.resetProperties();
    this.loadOptionsTask.perform();
  }

  get isLoadingOptions() {
    return this.loadOptionsTask.isRunning;
  }

  @keepLatestTask
  *loadOptionsTask() {
    const all = yield this.store.query('conceptual-process', {
      include:
        'process-groups,process-groups.process-domains,process-groups.process-domains.process-categories',
      filter: { ':not:status': ENV.resourceStates.archived },
      page: { size: 2000 },
    });

    const groups = new Set();
    const domains = new Set();
    const categories = new Set();

    for (const p of all) {
      const g = p.processGroup;
      if (!g || g.isArchived) continue;
      groups.add(g);

      const d = g.processDomain;
      if (!d || d.isArchived) continue;
      domains.add(d);

      const c = d.processCategory;
      if (!c || c.isArchived) continue;
      categories.add(c);
    }

    this.groups = [...groups];
    this.domains = [...domains];
    this.categories = [...categories];
  }

  get availableDomains() {
    if (this.processGroup) return [this.processGroup.processDomain];
    if (this.processCategory) {
      return (this.domains ?? []).filter(
        (d) => d.processCategory?.get('id') === this.processCategory.id,
      );
    }
    return this.domains ?? [];
  }

  get availableGroups() {
    if (this.processDomain) {
      return (this.groups ?? []).filter(
        (g) => g.processDomain?.get('id') === this.processDomain.id,
      );
    }
    if (this.processCategory) {
      const domainIds = this.availableDomains.map((d) => d.id);
      return (this.groups ?? []).filter((g) =>
        domainIds.includes(g.processDomain?.get('id')),
      );
    }
    return this.groups ?? [];
  }

  get formIsDirty() {
    return !(
      this.title?.trim() === this.args.process?.title?.trim() &&
      this.processGroup?.id === this.args.process?.processGroup?.id &&
      this.processDomain?.id ===
        this.args.process?.processGroup?.processDomain?.id &&
      this.processCategory?.id ===
        this.args.process?.processGroup?.processDomain?.processCategory?.id
    );
  }

  get formIsValid() {
    return (
      this.title?.trim() &&
      this.processGroup &&
      this.processDomain &&
      this.processCategory
    );
  }

  get canSave() {
    return this.formIsDirty && this.formIsValid;
  }

  @action
  onSubmit(e) {
    e.preventDefault();
    this.save();
  }

  @action
  setTitle(e) {
    this.title = e.target.value;
  }

  @action
  handleProcessCategoryChange(category) {
    this.processCategory = category;
    this.processDomain = undefined;
    this.processGroup = undefined;
  }

  @action
  handleProcessDomainChange(domain) {
    this.processDomain = domain;
    this.processCategory = domain?.processCategory;
    this.processGroup = undefined;
  }

  @action
  handleProcessGroupChange(group) {
    this.processGroup = group;
    this.processDomain = group?.processDomain;
    this.processCategory = group?.processDomain?.processCategory;
  }

  @action
  resetProperties() {
    this.title = this.args.process?.title;
    this.processGroup = this.args.process?.processGroup;
    this.processDomain = this.processGroup?.processDomain;
    this.processCategory = this.processDomain?.processCategory;
  }

  @action
  close() {
    this.args?.onClose?.();
  }

  @action
  save() {
    if (!this.formIsValid) return;

    this.args.process.title = this.title?.trim();
    this.args.process.processGroups = this.processGroup
      ? [this.processGroup]
      : [];

    this.args?.onSave?.(this.args.process);
  }
}
