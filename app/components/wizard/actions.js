import Component from '@glimmer/component';
import { action } from '@ember/object';

export const WizardAction = Object.freeze({
  REPLACE_DIAGRAMS: 'replace_diagrams',
  CHANGE_MAIN_PROCESS: 'change_main_process',
  STRUCTURE_DIAGRAMS: 'structure_diagrams',
  ADD_FILES: 'add_files',
});

export default class WizardActions extends Component {
  get quickActions() {
    return [
      {
        id: WizardAction.REPLACE_DIAGRAMS,
        label: 'Bestanden vervangen',
        icon: 'upload',
        iconStyle: 'fill: var(--au-blue-900) !important',
        description: 'Upload nieuwe versies van bestaande diagrammen.',
        isDisabled: this.isActionDisabled(WizardAction.REPLACE_DIAGRAMS),
        disabledReason: 'Deze actie is tijdelijk niet beschikbaar',
        onSelect: () => {
          if (!this.isActionDisabled(WizardAction.REPLACE_DIAGRAMS)) {
            this.args.onQuickActionSelected(WizardAction.REPLACE_DIAGRAMS);
          }
        },
      },
      {
        id: WizardAction.CHANGE_MAIN_PROCESS,
        label: 'Hoofdproces wijzigen',
        icon: 'ordered-list',
        iconStyle: 'fill: var(--au-green-500) !important',
        description: 'Kies welk diagram het hoofdproces is.',
        isDisabled: this.isActionDisabled(WizardAction.CHANGE_MAIN_PROCESS),
        disabledReason:
          'Je hebt één diagram geüpload. Dit is automatisch het hoofddiagram.',
        onSelect: () => {
          if (!this.isActionDisabled(WizardAction.CHANGE_MAIN_PROCESS)) {
            this.args.onQuickActionSelected(WizardAction.CHANGE_MAIN_PROCESS);
          }
        },
      },
    ];
  }

  get isManageDiagramsDisabled() {
    return this.isActionDisabled(WizardAction.STRUCTURE_DIAGRAMS);
  }

  isActionDisabled(action) {
    return this.args.disabledActions?.includes(action);
  }

  @action
  onManageDiagrams() {
    if (!this.isManageDiagramsDisabled) {
      this.args.onManageDiagrams?.();
    }
  }
}
