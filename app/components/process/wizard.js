import Component from '@glimmer/component';

import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { task, timeout } from 'ember-concurrency';
import { service } from '@ember/service';

import removeFileNameExtension from '../../utils/file-extension-remover';
import { WizardAction } from '../wizard/actions';

export default class ProcessWizard extends Component {
  @service toaster;
  @service store;
  @service api;
  @service currentSession;
  @service diagram;
  @service router;

  @tracked activeStepIndex = 0;

  @tracked process = null;
  @tracked files = [];
  @tracked mainProcessFile = null;
  @tracked diagramList = null;
  @tracked currentAction = WizardAction.REPLACE_DIAGRAMS;
  @tracked disabledActions = [];

  @tracked fileWrappers = [];
  @tracked areFilesCreated = false;
  @tracked loadingMessage = null;
  @tracked showSuccessMessage = false;
  @tracked isSelectMainDiagramDisabled = false;

  wizardStep = Object.freeze({
    SELECT_ACTION: 'select_action',
    UPLOAD_FILES: 'upload_files',
    SELECT_MAIN_PROCESS: 'select_main_process',
    CHANGE_MAIN_PROCESS: 'change_main_process',
    STRUCTURE_DIAGRAMS: 'structure_diagrams',
    CREATE_PROCESS: 'create_process',
    UPDATE_PROCESS: 'update_process',
    CREATE_DIAGRAM_VERSION: 'create_diagram_version',
    TO_PROCESS: 'to_process',
  });

  constructor(owner, args) {
    super(owner, args);
    const firstShownIndex = this.steps.findIndex((step) => step.isStepShown);
    if (firstShownIndex > 0) {
      this.activeStepIndex = firstShownIndex;
    }
    this.executeCurrentStepActionAsTask.perform();
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
    await this.activeStep.actionAtEndOfStep?.();
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
    if (this.activeStep?.action) {
      await this.activeStep.action();
    }
  });

  get steps() {
    return [
      {
        step: this.wizardStep.SELECT_ACTION,
        title: 'Diagrammen wijzigen',
        isStepShown: this.args.process,
        canGoToNextStep: this.currentAction,
        nextStepButtonLabel: null,
        action: async () => await this.prepareWizard(),
      },
      {
        step: this.wizardStep.STRUCTURE_DIAGRAMS,
        title: 'Diagrammen structuur',
        isStepShown: this.currentAction === WizardAction.STRUCTURE_DIAGRAMS,
        canGoToNextStep: true,
        nextStepButtonLabel: 'Aanpassen',
        canCancelStep: true,
        actionAtEndOfStep: async () =>
          await this.saveDiagramStructure(this.diagramList),
      },
      {
        step: this.wizardStep.UPLOAD_FILES,
        title: 'Bestanden selecteren',
        isStepShown: this.currentAction === WizardAction.REPLACE_DIAGRAMS,
        canGoToNextStep: this.fileWrappers.length >= 1,
        nextStepButtonLabel: 'Uploaden',
      },
      {
        step: this.wizardStep.SELECT_MAIN_PROCESS,
        title: 'Hoofdproces kiezen',
        isStepShown: [
          WizardAction.REPLACE_DIAGRAMS,
          WizardAction.CHANGE_MAIN_PROCESS,
        ].includes(this.currentAction),
        action: async () => await this.uploadFiles(this.fileWrappers),
        canGoToNextStep: this.mainProcessFile,
        nextStepButtonLabel: this.args.process
          ? 'Aanpassen'
          : 'Proces aanmaken',
      },
      {
        step: this.wizardStep.UPDATE_PROCESS,
        title: 'Proces aanpassen',
        isStepShown: this.currentAction === WizardAction.CHANGE_MAIN_PROCESS,
        action: async () =>
          await this.changeMainDiagramOnProcess(this.mainProcessFile),
        canGoToNextStep: this.process,
        nextStepButtonLabel: 'Ga naar proces',
      },
      {
        step: this.wizardStep.CREATE_PROCESS,
        title: 'Proces aanmaken',
        isStepShown:
          !this.args.process &&
          this.currentAction === WizardAction.REPLACE_DIAGRAMS,
        action: async () => await this.createProcess(this.files),
        canGoToNextStep: this.process,
        nextStepButtonLabel: 'Ga naar proces',
      },
      {
        step: this.wizardStep.CREATE_DIAGRAM_VERSION,
        title: 'Nieuwe diagram versie aanmaken',
        isStepShown:
          this.args.process &&
          this.currentAction === WizardAction.REPLACE_DIAGRAMS,
        action: async () => await this.createNewDiagramVersion(this.files),
        canGoToNextStep: this.diagramList,
        nextStepButtonLabel: 'Bekijk proces',
      },
      {
        step: this.wizardStep.TO_PROCESS,
        title: 'Naar het proces',
        isStepShown: true,
        action: async () =>
          await this.goToProcess(
            this.process ?? this.args.process,
            Boolean(this.args.process),
          ),
        canGoToNextStep: false,
        nextStepButtonLabel: null,
      },
    ];
  }

  @action
  async restoreAndCloseWizard() {
    this.loadingMessage = 'We sluiten de wizard af';
    await this.router.refresh();
  }

  @action
  manageDiagrams() {
    this.args.onCloseModal?.();
    this.router.transitionTo(
      'processes.process.manage-diagrams',
      this.args.process.id,
    );
  }

  @action
  async onQuickActionSelected(action) {
    this.currentAction = action;
    if (this.currentAction === WizardAction.CHANGE_MAIN_PROCESS) {
      this.mainProcessFile = null;
    }
    if (this.currentAction === WizardAction.REPLACE_DIAGRAMS) {
      this.diagramList = null;
      this.files = [];
      this.fileWrappers = [];
    }
    this.nextStep();
  }

  @action
  addFileToUploadedList(fileWrappers) {
    this.fileWrappers = fileWrappers;
  }

  @action
  setMainProcessFile(file) {
    this.mainProcessFile = file;
  }

  async prepareWizard() {
    this.showSuccessMessage = false;
    this.loadingMessage = null;
    if (this.args.process) {
      this.diagramList = await this.diagram.getLatestDiagramList(
        this.args.process.id,
      );
      this.files = this.diagram.getAvailableFilesFromList(
        this.diagramList,
        false,
      );
      if (this.files.length === 1) {
        this.disabledActions = [WizardAction.CHANGE_MAIN_PROCESS];
      }
    }
  }

  async saveDiagramStructure(diagramList) {
    for (const main of diagramList.diagrams) {
      await main.save();
    }

    const subItems = diagramList.diagrams.flatMap(
      (main) => main.subItems ?? [],
    );
    for (const sub of subItems) {
      await sub.save();
    }

    await diagramList.save();
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

  async extractBboElementsFromBpmnFile(fileId) {
    this.loadingMessage = 'Processtappen extraheren (bpmn)';
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
        `Er liep iets mis bij het extraheren van de BPMN elementen uit het BPMN bestand (${fileId})`,
        null,
        { timeOut: 2500 },
      );
    } finally {
      this.loadingMessage = null;
    }
  }

  async extractBboElementsFromVisioFile(fileId) {
    this.loadingMessage = 'Processtappen extraheren (visio)';
    try {
      await timeout(250);
      await this.api.fetch(`/visio?id=${fileId}`, {
        method: 'POST',
      });
    } catch (error) {
      this.toaster.error(
        `Er liep iets mis bij het extraheren van de BPMN elementen uit het Visio bestand (${fileId})`,
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
          await this.extractBboElementsFromBpmnFile(fileId);
        }
        if (file.isVisioFile) {
          await this.extractBboElementsFromVisioFile(fileId);
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
          { timeOut: 5000 },
        );
      }
      this.fileWrappers = this.fileWrappers.filter(
        (file) => file.id !== fileWrapper.id,
      );
    }
    if (this.files.length === 0) {
      this.loadingMessage =
        'Oeps, hier liep iets mis. We brengen je terug naar de vorige stap';
      await timeout(1500);
      this.activeStepIndex = this.activeStepIndex - 1;
      this.showSuccessMessage = false;
      this.loadingMessage = null;
      return;
    }

    this.loadingMessage = `${this.files.length === 1 ? 'Het bestand werd' : 'De bestanden werden'} succesvol opgeladen`;
    this.showSuccessMessage = true;
    if (this.files.length === 1) {
      this.mainProcessFile = this.files[0];
      this.isSelectMainDiagramDisabled = true;
    }
    this.areFilesCreated = true;
  }

  async changeMainDiagramOnProcess(mainFile) {
    this.showSuccessMessage = false;
    this.loadingMessage = 'Hoofddiagram aanpassen';
    try {
      await timeout(500);
      const items = Array.from(this.diagramList.diagrams).sort(
        (a, b) => a.position - b.position,
      );

      const sorted = [
        items.find((item) => item.diagramFile.id === mainFile.id),
        ...items.filter((item) => item.diagramFile.id !== mainFile.id),
      ];

      for (let i = 0; i < sorted.length; i++) {
        sorted[i].position = i + 1;
        await sorted[i].save();
      }

      await this.args.process.save();
      this.process = this.args.process;
      this.showSuccessMessage = true;
    } catch {
      this.toaster.error(
        'Er liep iets mis bij het aanpassen van het hoofddiagram',
        null,
        { timeOut: 2500 },
      );
    } finally {
      this.loadingMessage = 'Hoofddiagram werd succesvol aangepast';
      this.showSuccessMessage = true;
    }
  }

  async createProcess(files) {
    this.showSuccessMessage = false;
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
      this.showSuccessMessage = true;
    } catch (error) {
      this.toaster.error(
        'Er liep iets mis bij het aanmaken van het proces',
        null,
        { timeOut: 2500 },
      );
    } finally {
      this.loadingMessage = 'Proces werd succesvol aangemaakt';
    }
  }

  async createNewDiagramVersion(files) {
    this.showSuccessMessage = false;
    this.loadingMessage = 'Nieuwe diagrammen toevoegen aan het proces';
    try {
      const fileIds = files.map((file) => file.id);
      const sortedFileIds = this.putIdFirstInArray(
        fileIds,
        this.mainProcessFile.id,
      );
      const currentLists = await this.args.process.diagramLists;
      const diagramList = await this.diagram.createDiagramListForFiles(
        sortedFileIds,
        currentLists,
      );
      this.args.process.diagramLists = [...currentLists, diagramList];
      await this.args.process.save();
      this.diagramList = diagramList;
      this.showSuccessMessage = true;
    } catch (error) {
      this.toaster.error(
        'Er liep iets mis bij het aanpassen van het proces',
        null,
        { timeOut: 2500 },
      );
    } finally {
      this.loadingMessage = 'Proces werd succesvol aangepast';
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

  async goToProcess(process, isUpdateOfProcess) {
    this.showSuccessMessage = false;
    this.loadingMessage = 'We brengen je naar het process';
    await timeout(150);
    if (isUpdateOfProcess) {
      await this.router.refresh();
      this.args.onSaved?.();
    } else {
      this.router.transitionTo('processes.process', process.id);
    }
  }
}
