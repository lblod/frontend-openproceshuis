import Component from '@glimmer/component';

import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { task, timeout } from 'ember-concurrency';
import { service } from '@ember/service';

import removeFileNameExtension from '../../utils/file-extension-remover';

export default class ProcessWizard extends Component {
  @service toaster;
  @service store;
  @service api;
  @service currentSession;
  @service diagram;
  @service router;

  @tracked activeStepIndex = 0;

  @tracked process = null;

  @tracked fileWrappers = [];
  @tracked files = [];
  @tracked mainProcessFile = null;
  @tracked areFilesCreated = false;
  @tracked loadingMessage = null;

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

  get steps() {
    return [
      {
        title: 'Upload bestanden',
        isStepShown: true,
        canGoToNextStep: this.fileWrappers.length >= 1,
        nextStepButtonLabel: 'Uploaden',
      },
      {
        title: 'Selecteer het hoofdproces',
        isStepShown: true,
        action: async () => await this.uploadFiles(this.fileWrappers),
        canGoToNextStep: this.mainProcessFile,
        nextStepButtonLabel: 'Process aanmaken',
      },
      {
        title: 'Proces aanmaken',
        isStepShown: true,
        action: async () => await this.createProcess(this.files),
        canGoToNextStep: this.process,
        nextStepButtonLabel: 'Ga naar proces',
      },
      {
        title: 'Naar het process',
        isStepShown: true,
        action: async () => await this.goToProcess(this.process),
        canGoToNextStep: false,
        nextStepButtonLabel: null,
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
    }
  }

  async extractBpmnElementsFromFile(fileId) {
    this.loadingMessage = 'Processtappen extraheren';
    try {
      await timeout(250);
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
      this.loadingMessage = null;
    }
  }

  async uploadFiles(fileWrappers) {
    for (const fileWrapper of fileWrappers) {
      this.loadingMessage = `Bestand worden opgeladen (${this.files.length + 1}/${this.fileWrappers.length + this.files.length})`;
      await timeout(250);
      const fileId = await this.saveFileInDatabase(fileWrapper);
      if (fileId) {
        const file = await this.store.findRecord('file', fileId);
        if (file.isBpmnFile) {
          await this.extractBpmnElementsFromFile(fileId);
        }
        this.files.push(file);
      } else {
        this.loadingMessage = 'Oeps, hier liep iets mis';
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
    this.loadingMessage = null;
    this.areFilesCreated = true;
  }

  async createProcess(files) {
    this.loadingMessage = 'Bezig met het aanmaken van het proces';
    try {
      await timeout(250);
      const defaultRelevantUnit =
        await this.currentSession.group.classification;
      const created = new Date();
      const fileIds = files.map((file) => file.id);
      const sortedFileIds = this.putIdFirstInArray(
        fileIds,
        this.mainProcessFile.id,
      );
      const diagramList = await this.diagram.createDiagramListForFiles(
        sortedFileIds,
        null,
      );
      const process = this.store.createRecord('process', {
        title: removeFileNameExtension(
          this.mainProcessFile.name,
          this.mainProcessFile.extension,
        ),
        created: created,
        modified: created,
        publisher: this.currentSession.group,
        diagramLists: [diagramList],
        relevantAdministrativeUnits: [defaultRelevantUnit],
      });
      await process.save();
      this.process = process;
    } catch (error) {
      this.toaster.error(
        'Er liep iets mis bij het aanmaken van het proces',
        null,
        { timeOut: 2500 },
      );
    } finally {
      this.loadingMessage = 'Proces werd succesvol aangemaakt!';
    }
  }

  putIdFirstInArray(ids, firstId) {
    const index = ids.indexOf(firstId);
    if (index > -1) {
      ids.splice(index, 1);
      ids.unshift(firstId);
    }

    return ids;
  }

  async goToProcess(process) {
    this.loadingMessage = 'We brengen je naar het process';
    await timeout(250);
    this.router.transitionTo('processes.process', process.id);
    this.loadingMessage = null;
  }
}
