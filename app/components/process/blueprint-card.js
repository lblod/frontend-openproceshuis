import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { dropTask } from 'ember-concurrency';
import { inject as service } from '@ember/service';

export default class ProcessBlueprintCardComponent extends Component {
  @service toaster;
  @tracked edit = false;
  @tracked linkedBlueprintsChanged = false;

  get linkedBlueprints() {
    return this.args.process.linkedBlueprints || [];
  }

  @action
  toggleEdit() {
    this.edit = !this.edit;
  }

  @action
  resetModel() {
    this.linkedBlueprintsChanged = false;
    this.edit = false;
  }

  @dropTask
  *updateModel(event) {
    event.preventDefault();

    if (this.linkedBlueprintsChanged) {
      try {
        yield this.args.process.save();
        this.linkedBlueprintsChanged = false;
        this.edit = false;
        this.toaster.success('Proces succesvol bijgewerkt', 'Gelukt!', {
          timeOut: 5000,
        });
      } catch (error) {
        console.error(error);
        this.toaster.error('Proces kon niet worden bijgewerkt', 'Fout');
        this.resetModel();
      }
    } else {
      this.resetModel();
    }
  }

  @action
  setLinkedBlueprints(blueprintArray) {
    this.args.process.linkedBlueprints = blueprintArray;
    this.linkedBlueprintsChanged = true;
  }
}
