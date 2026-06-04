import Component from '@glimmer/component';

export const WizardAction = Object.freeze({
  REPLACE_DIAGRAMS: 'replace_diagrams',
  CHANGE_MAIN_PROCESS: 'change_main_process',
});

export default class WizardActions extends Component {
  get actions() {
    return [
      {
        label: 'Bestanden vervangen',
        icon: 'upload',
        iconColorClass: 'fill: var(--au-blue-900) !important',
        description: 'Upload nieuwe bestanden om de diagrammen te vervangen.',
        next: () => {
          if (this.isActionDisabled(WizardAction.REPLACE_DIAGRAMS)) {
            return;
          }
          this.args.onActionSelected(WizardAction.REPLACE_DIAGRAMS);
        },
        isDisabled: this.isActionDisabled(WizardAction.REPLACE_DIAGRAMS),
        disabledReason: 'Deze actie is tijdelijk niet beschikbaar',
      },
      {
        label: 'Hoofdproces wijzigen',
        icon: 'ordered-list',
        iconColorClass: 'fill: var(--au-green-500) !important',
        description: 'Wijzig het hoofdproces van het proces.',
        next: () => {
          if (this.isActionDisabled(WizardAction.CHANGE_MAIN_PROCESS)) {
            return;
          }
          this.args.onActionSelected(WizardAction.CHANGE_MAIN_PROCESS);
        },
        isDisabled: this.isActionDisabled(WizardAction.CHANGE_MAIN_PROCESS),
        disabledReason:
          'Je hebt één diagram geüpload. Dit is automatisch het hoofddiagram.',
      },
    ];
  }

  isActionDisabled(action) {
    return this.args.disabledActions?.includes(action);
  }
}
