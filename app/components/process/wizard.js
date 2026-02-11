import Component from '@glimmer/component';

import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class ProcessWizard extends Component {
  @tracked activeStepIndex = 1;

  @tracked process = null;

  @tracked fileWrappers = [];
  @tracked mainProcessFile = null;
  @tracked isBpmnElementExtractionDone = false;

  @action
  addFileToUploadedList(fileWrappers) {
    this.fileWrappers = fileWrappers;
  }

  get activeStep() {
    if (!this.steps[this.activeStepIndex]) {
      this.toaster.error(
        `Er liep iets mis. Stap ${this.activeStepIndex} bestaat niet.`,
        'wizard',
        { timeOut: 2500 },
      );
    }

    return this.steps[this.activeStepIndex];
  }

  @action
  async nextStep() {
    if (!this.steps[this.activeStepIndex].canGoToNextStep) {
      return null;
    }
    let nextStepIndex = this.activeStepIndex + 1;
    if (this.activeStepIsFinalStep) {
      return null;
    }
    while (
      this.steps[nextStepIndex] &&
      !this.steps[nextStepIndex].isStepShown
    ) {
      nextStepIndex++;
    }
    this.activeStepIndex = nextStepIndex;

    return this.steps[nextStepIndex];
  }

  @action
  previousStep() {
    const previousStepIndex = this.activeStepIndex - 1;
    this.activeStepIndex = previousStepIndex;
    if (this.steps[previousStepIndex]?.isStepShown) {
      return this.steps[previousStepIndex];
    } else {
      this.previousStep();
    }
  }

  get steps() {
    return [
      {
        // TODO - future step
        title: 'Selecteer een bestaand bestanden',
        isStepShown: false,
        canGoToNextStep: false,
        canGoToPreviousStep: false,
        isFirstStep: true,
      },
      {
        title: 'Upload nieuwe bestanden',
        isStepShown: true,
        canGoToNextStep: true,
        canGoToPreviousStep: false,
        isFirstStep: true,
      },
      {
        title: 'Selecteer het hoofdproces',
        isStepShown: true,
        canGoToNextStep: this.mainProcessFile,
        canGoToPreviousStep: false,
      },
      {
        title: 'Proces aanmaken',
        isStepShown: true,
        canGoToNextStep: this.process,
        canGoToPreviousStep: false,
      },
      {
        title: 'Bpmn element extractie',
        isStepShown: true,
        canGoToNextStep: this.isBpmnElementExtractionDone,
        canGoToPreviousStep: false,
      },
      {
        title: 'Process aangemaakt',
        isStepShown: true,
        canGoToNextStep: this.isBpmnElementExtractionDone,
        canGoToPreviousStep: false,
        isFinalStep: true,
      },
    ];
  }
}
