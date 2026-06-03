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
        next: () => this.args.onActionSelected(WizardAction.REPLACE_DIAGRAMS),
      },
      {
        label: 'Hoofdproces wijzigen',
        icon: 'ordered-list',
        iconColorClass: 'fill: var(--au-green-500) !important',
        description: 'Wijzig het hoofdproces van het proces.',
        next: () =>
          this.args.onActionSelected(WizardAction.CHANGE_MAIN_PROCESS),
      },
    ];
  }
}
