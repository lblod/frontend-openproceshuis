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
  @tracked isUploadingFile = false;
  @tracked isExtractingBpmnElements = false;
  @tracked isCreatingFiles = false;
  @tracked areFilesCreated = false;
  @tracked isRoutingToProcess = false;

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
      return `Bestand worden opgeladen (${this.files.length + 1}/${this.fileWrappers.length + this.files.length})`;
    }
    if (this.isCreatingFiles) {
      return `Bezig met het opladen van ${this.fileWrappers.length} bestanden`;
    }
    if (this.isCreatingProcess) {
      return `Bezig met het aanmaken van het proces`;
    }
    if (this.isRoutingToProcess) {
      return `We brengen je naar je proces`;
    }

    return null;
  }

  async uploadFiles(fileWrappers) {
    this.isCreatingFiles = true;
    for (const fileWrapper of fileWrappers) {
      await timeout(250);
      const fileId = await this.saveFileInDatabase(fileWrapper);
      if (fileId) {
        const file = await this.store.findRecord('file', fileId);
        if (file.isBpmnFile) {
          await timeout(250);
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

  async createProcess(files) {
    this.isCreatingProcess = true;
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
      this.isCreatingProcess = false;
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
    this.isRoutingToProcess = true;
    await timeout(250);
    this.router.transitionTo('processes.process', process.id);
    this.isRoutingToProcess = false;
  }
}
