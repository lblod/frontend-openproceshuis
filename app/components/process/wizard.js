import Component from '@glimmer/component';

import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { task } from 'ember-concurrency';
import { service } from '@ember/service';

export default class ProcessWizard extends Component {
  @service toaster;
  @service store;
  @service api;

  @tracked activeStepIndex = 0;

  @tracked process = null;

  @tracked fileWrappers = [];
  @tracked files = [];
  @tracked mainProcessFile = null;
  @tracked isUploadingFile = false;
  @tracked isExtractingBpmnElements = false;
  @tracked areFilesCreated = false;

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
    this.executeCurrentStepActionAsTask.perform();
  }

  executeCurrentStepActionAsTask = task({ drop: true }, async () => {
    await this.activeStep.action();
  });

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
        title: 'Upload bestanden',
        isStepShown: true,
        canGoToNextStep: this.fileWrappers.length >= 1,
        nextStepButtonLabel: 'Uploaden',
        canGoToPreviousStep: false,
        isFirstStep: true,
      },
      {
        title: 'Selecteer het hoofdproces',
        isStepShown: true,
        action: async () => await this.uploadFiles(this.fileWrappers),
        canGoToNextStep: this.mainProcessFile,
        nextStepButtonLabel: 'Process aanmaken',
        canGoToPreviousStep: false,
      },
      {
        title: 'Proces aanmaken',
        isStepShown: true,
        action: async () => alert('create the process + diagram list!'),
        canGoToNextStep: this.process,
        nextStepButtonLabel: 'Ga naar proces',
        canGoToPreviousStep: false,
      },
    ];
  }

  @action
  addFileToUploadedList(fileWrappers) {
    this.fileWrappers = fileWrappers;
  }

  @action
  setMainProcessFile(file) {
    this.mainProcessFile = file;
  }

  async saveFileInDatabase(uploadedFile) {
    this.isUploadingFile = true;
    try {
      const response = await uploadedFile.upload('/files', {
        'Content-Type': 'multipart/form-data',
      });
      const body = await response.json();
      return body?.data?.id;
    } catch {
      this.toaster.error(
        `Er ging iets mis bij het opslaan van het bestand (${uploadedFile.name})`,
        null,
        { timeOut: 2500 },
      );
      return;
    } finally {
      this.isUploadingFile = false;
    }
  }

  async extractBpmnElementsFromFile(fileId) {
    this.isExtractingBpmnElements = true;
    try {
      await this.api.fetch(`/bpmn?id=${fileId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/vnd.api+json',
        },
      });
    } catch (error) {
      this.toaster.error(
        `Er liep iets mis bij het extraheren van de BPMN elementen uit het bestand (${fileId})`,
        null,
        { timeOut: 2500 },
      );
    } finally {
      this.isExtractingBpmnElements = false;
    }
  }

  get uploadFileMessage() {
    if (this.isExtractingBpmnElements) {
      return 'Processtappen extraheren';
    }
    if (this.isUploadingFile) {
      return `Bestand worden opgeladen (${this.files.length}/${this.fileWrappers.length})`;
    }
    if (this.isCreatingFiles) {
      return `Bezig met het opladen van ${this.fileWrappers.length} bestanden`;
    }

    return null;
  }

  async uploadFiles(fileWrappers) {
    this.isCreatingFiles = true;
    for (const fileWrapper of fileWrappers) {
      const fileId = await this.saveFileInDatabase(fileWrapper);
      if (fileId) {
        const file = await this.store.findRecord('file', fileId);
        if (file.isBpmnFile) {
          await this.extractBpmnElementsFromFile(fileId);
        }
        this.files.push(file);
      } else {
        this.fileWrappers = this.fileWrappers.filter(
          (file) => file.id !== fileWrapper.id,
        );
        this.toaster.error(
          `${fileWrapper.name} is verwijderd uit de bestanden lijst. Probeer het later opnieuw.`,
          null,
          { timeOut: 2500 },
        );
      }
      this.fileWrappers = this.fileWrappers.filter(
        (file) => file.id !== fileWrapper.id,
      );
    }
    this.isCreatingFiles = false;
    this.areFilesCreated = true;
  }
}
