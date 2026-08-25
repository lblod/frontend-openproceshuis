import Component from '@glimmer/component';

import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { task, timeout } from 'ember-concurrency';
import { service } from '@ember/service';

import removeFileNameExtension from '../../utils/file-extension-remover';
import { runInBatches } from '../../utils/batch';
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
  @tracked libraryFiles = [];
  @tracked areFilesCreated = false;
  @tracked loadingMessage = null;
  @tracked successMessage = null;
  @tracked isSelectMainDiagramDisabled = false;

  maxUploadAmount = 10;

  wizardStep = Object.freeze({
    SELECT_ACTION: 'select_action',
    UPLOAD_FILES: 'upload_files',
    SELECT_MAIN_PROCESS: 'select_main_process',
    CHANGE_MAIN_PROCESS: 'change_main_process',
    CREATE_PROCESS: 'create_process',
    UPDATE_PROCESS: 'update_process',
    CREATE_DIAGRAM_VERSION: 'create_diagram_version',
    ADD_FILES_TO_LIST: 'add_files_to_list',
    TO_PROCESS: 'to_process',
  });

  constructor(owner, args) {
    super(owner, args);
    if (this.args.initialAction) {
      this.currentAction = this.args.initialAction;
    }
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

  get sortedFiles() {
    const filesWithDiagramListItemPosition = this.files.map((_fileModel) => {
      _fileModel.position = this.diagramList?.diagrams.find(
        (d) => d.diagramFile?.id === _fileModel.id,
      ).position;
      return _fileModel;
    });

    return filesWithDiagramListItemPosition.sort(
      (a, b) => a.position - b.position,
    );
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
        isStepShown: this.args.process && !this.args.initialAction,
        canGoToNextStep: this.currentAction,
        nextStepButtonLabel: null,
        action: async () => await this.prepareWizard(),
      },
      {
        step: this.wizardStep.UPLOAD_FILES,
        title: 'Bestanden selecteren',
        isStepShown: [
          WizardAction.REPLACE_DIAGRAMS,
          WizardAction.ADD_FILES,
        ].includes(this.currentAction),
        canGoToNextStep:
          this.fileWrappers.length >= 1 || this.libraryFiles.length >= 1,
        nextStepButtonLabel: 'Uploaden',
      },
      {
        step: this.wizardStep.SELECT_MAIN_PROCESS,
        title: 'Hoofddiagram kiezen',
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
        step: this.wizardStep.ADD_FILES_TO_LIST,
        title: 'Bestanden toevoegen',
        isStepShown: this.currentAction === WizardAction.ADD_FILES,
        action: async () => await this.uploadAndAddFilesToList(),
        canGoToNextStep: false,
        nextStepButtonLabel: null,
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
    const processRouteName = this.router.currentRouteName.replace('.index', '');
    this.router.transitionTo(
      `${processRouteName}.manage-diagrams`,
      this.args.process.id,
      {
        queryParams: {
          previousRouteName: processRouteName,
          previousRouteModelId: this.args.process.id,
          previousRouteTitle: this.args.process.title,
        },
      },
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
      this.libraryFiles = [];
    }
    this.nextStep();
  }

  @action
  addFileToUploadedList(fileWrappers) {
    if (fileWrappers.length > this.maxUploadAmount) {
      for (const fw of fileWrappers) {
        fw.queue?.remove(fw);
      }
      this.toaster.error(
        `Je kan maximaal ${this.maxUploadAmount} bestanden tegelijk uploaden.`,
        null,
        { timeOut: 2500 },
      );
      return;
    }
    this.fileWrappers = fileWrappers;
  }

  @action
  addLibraryFilesToList(files) {
    this.libraryFiles = files;
  }

  @action
  setMainProcessFile(file) {
    this.mainProcessFile = file;
  }

  async prepareWizard() {
    this.successMessage = null;
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

  extractBboElementsFromBpmnFile(fileId) {
    try {
      this.api.fetch(`/bpmn?id=${fileId}`, {
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
    }
  }

  extractBboElementsFromVisioFile(fileId) {
    try {
      this.api.fetch(`/visio?id=${fileId}`, {
        method: 'POST',
      });
    } catch (error) {
      this.toaster.error(
        `Er liep iets mis bij het extraheren van de BPMN elementen uit het Visio bestand (${fileId})`,
        null,
        { timeOut: 2500 },
      );
    }
  }

  async batchUploadFileWrappers(fileWrappers) {
    const fileIds = [];
    const failedFileWrappers = [];

    await runInBatches(
      fileWrappers,
      async (_fileWrapper) => {
        const fileId = await this.saveFileInDatabase(_fileWrapper);
        if (!fileId) {
          failedFileWrappers.push(_fileWrapper);
        } else {
          fileIds.push(fileId);
        }
      },
      {
        batchSize: 1,
        onBatch: async (batchResults, batchStart) => {
          const processedCount = batchStart + batchResults.length;
          this.loadingMessage = `Bestanden worden opgeladen (${processedCount}/${fileWrappers.length})`;
        },
      },
    );

    return { fileIds, failedFileWrappers };
  }

  async uploadFiles(fileWrappers) {
    this.successMessage = null;
    const { fileIds, failedFileWrappers } =
      await this.batchUploadFileWrappers(fileWrappers);
    if (failedFileWrappers.length >= 1) {
      this.toaster.error(
        `Er konden ${failedFileWrappers.length} bestanden niet worden geüpload. Probeer het later opnieuw.`,
        null,
        { timeOut: 5000 },
      );
    }
    this.loadingMessage = 'Organizing the uploaded files';
    const fileModels = await this.store.query('file', {
      'filter[id]': fileIds.join(','),
      page: { size: this.maxUploadAmount },
    });
    this.files.push(...fileModels);
    this.files = [...this.files, ...this.libraryFiles];

    if (this.files.length === 0) {
      this.loadingMessage =
        'Oeps, hier liep iets mis. We brengen je terug naar de vorige stap';
      await timeout(500);
      this.activeStepIndex = this.activeStepIndex - 1;
      this.loadingMessage = null;
      return;
    }

    this.loadingMessage = null;
    this.successMessage = `${this.files.length === 1 ? 'Het bestand werd' : 'De bestanden werden'} succesvol opgeladen`;
    if (this.files.length === 1) {
      this.mainProcessFile = this.files[0];
      this.isSelectMainDiagramDisabled = true;
    }
    this.areFilesCreated = true;
  }

  async createNewDiagramListVersion(_diagramList, orderedItems = null) {
    const currentLists = Array.from(this.args.process.diagramLists);
    const newDiagramList = await this.diagram.cloneDiagramList(
      _diagramList,
      `v0.0.${currentLists.length}`,
      orderedItems,
    );
    this.args.process.diagramLists = [...currentLists, newDiagramList];

    return newDiagramList;
  }

  async changeMainDiagramOnProcess(mainFile) {
    this.successMessage = null;
    this.loadingMessage = 'Hoofddiagram aanpassen';
    try {
      const items = Array.from(this.diagramList.diagrams).sort(
        (a, b) => a.position - b.position,
      );
      const newMainIsCurrentMain = items[0]?.diagramFile.id === mainFile.id;
      if (!newMainIsCurrentMain) {
        const sorted = [
          items.find((item) => item.diagramFile.id === mainFile.id),
          ...items.filter((item) => item.diagramFile.id !== mainFile.id),
        ];
        this.loadingMessage = 'Nieuwe diagram versie aanmaken';
        await this.createNewDiagramListVersion(this.diagramList, sorted);
        this.loadingMessage = 'Nieuwe diagram versie linken aan het proces';
        await this.args.process.save();
      }

      this.process = this.args.process;
      this.loadingMessage = null;
      this.successMessage = 'Hoofddiagram werd succesvol aangepast';
    } catch {
      this.toaster.error(
        'Er liep iets mis bij het aanpassen van het hoofddiagram',
        null,
        { timeOut: 2500 },
      );
    } finally {
      this.loadingMessage = null;
    }
  }

  async createProcess(files) {
    this.successMessage = null;
    this.loadingMessage = 'Bezig met het aanmaken van het proces';
    try {
      const defaultRelevantUnit =
        await this.currentSession.group.classification;
      const created = new Date();
      const sortedFiles = this.putIdFirstInArray(files, this.mainProcessFile);
      const putFirstDiagramAsMain = true;
      const diagramList = await this.diagram.createDiagramListForFiles(
        sortedFiles,
        null,
        putFirstDiagramAsMain,
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
      this.loadingMessage = null;
      this.successMessage = 'Proces werd succesvol aangemaakt';
    } catch (error) {
      this.toaster.error(
        'Er liep iets mis bij het aanmaken van het proces',
        null,
        { timeOut: 2500 },
      );
    } finally {
      this.loadingMessage = null;
    }
  }

  async createNewDiagramVersion(files) {
    this.successMessage = null;
    this.loadingMessage = 'Nieuwe diagrammen toevoegen aan het proces';
    try {
      const sortedFiles = this.putIdFirstInArray(files, this.mainProcessFile);
      const currentLists = await this.args.process.diagramLists;
      this.loadingMessage = 'Nieuwe diagram versie aanmaken';
      const putFirstDiagramAsMain = true;
      const diagramList = await this.diagram.createDiagramListForFiles(
        sortedFiles,
        currentLists,
        putFirstDiagramAsMain,
      );
      this.args.process.diagramLists = [...currentLists, diagramList];
      this.loadingMessage = 'Nieuwe diagram versie linken aan het proces';
      await this.args.process.save();
      this.diagramList = diagramList;
      this.loadingMessage = null;
      this.successMessage = 'Proces werd succesvol aangepast';
    } catch (error) {
      this.toaster.error(
        'Er liep iets mis bij het aanpassen van het proces',
        null,
        { timeOut: 2500 },
      );
    } finally {
      this.loadingMessage = null;
    }
  }

  async uploadAndAddFilesToList() {
    this.successMessage = null;
    await this.uploadFiles(this.fileWrappers);
    if (this.files.length === 0) return;

    const now = new Date();
    const existingItems = Array.from(this.args.diagramList.diagrams);
    const maxPosition = existingItems.reduce(
      (max, item) => Math.max(max, item.position ?? 0),
      0,
    );
    this.successMessage = null;
    this.loadingMessage = 'Bestanden toevoegen als diagrammen';
    try {
      const newItems = await runInBatches(
        this.files,
        async (file, index) => {
          const item = this.store.createRecord('diagram-list-item', {
            position: maxPosition + index + 1,
            created: now,
            modified: now,
            diagramFile: file,
            subItems: [],
          });
          await item.save();
          return item;
        },
        {
          batchSize: 2,
          onBatch: async (_, batchStart) => {
            const processedCount = Math.min(batchStart + 2, this.files.length);
            this.loadingMessage = `Bestand toevoegen aan diagram (${processedCount}/${this.files.length})`;
          },
        },
      );
      this.loadingMessage = 'Proces uitbreiden met nieuwe diagrammen';
      await this.createNewDiagramListVersion(this.args.diagramList, [
        ...existingItems,
        ...newItems,
      ]);
      await this.args.process.save();
      this.successMessage = 'Bestanden succesvol toegevoegd';
      this.loadingMessage = null;
      this.args.onSaved?.();
      await this.router.refresh();
    } catch {
      this.toaster.error(
        'Er liep iets mis bij het toevoegen van de bestanden',
        null,
        { timeOut: 2500 },
      );
    } finally {
      this.loadingMessage = null;
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
    this.successMessage = null;
    this.loadingMessage = 'We brengen je naar het proces';
    await timeout(150);
    if (isUpdateOfProcess) {
      await this.router.refresh();
      this.args.onSaved?.();
    } else {
      this.router.transitionTo('processes.process', process.id);
    }
  }

  get isClosingModalBlocked() {
    if (this.loadingMessage) {
      return true;
    }
    if (
      this.successMessage &&
      this.currentAction !== WizardAction.CHANGE_MAIN_PROCESS
    ) {
      return true;
    }
    const blockingSteps = [
      this.wizardStep.UPDATE_PROCESS,
      this.wizardStep.CREATE_PROCESS,
    ];
    if (blockingSteps.includes(this.activeStep?.step)) {
      return true;
    }

    return false;
  }

  @action
  onCloseModal() {
    if (this.isClosingModalBlocked) {
      this.toaster.loading(`Er is nog een actie bezig`, 'wizard', {
        timeOut: 2500,
      });
      return;
    }
    this.args.onCloseModal?.();
  }
}
