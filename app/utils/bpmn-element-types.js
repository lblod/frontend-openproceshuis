export const BpmnElementTypes = Object.freeze({
  Association: 'Associatie',
  BpmnElement: 'BPMN-element',
  BoundaryEvent: 'Grensgebeurtenis',
  BusinessRuleTask: 'Bedrijfsregeltaak',
  Collaboration: 'Samenwerking',
  DataInputAssocation: 'Data-inputassociatie',
  DataObject: 'Dataobject',
  DataObjectReference: 'Dataobjectreferentie',
  DataOutputAssocation: 'Dataoutputassociatie',
  DataStoreReference: 'Dataopslagreferentie',
  EndEvent: 'Eindgebeurtenis',
  ErrorEventDefinition: 'Foutgebeurtenisdefinitie',
  Error: 'Fout',
  ExclusiveGateway: 'Exclusieve poort',
  InclusiveGateway: 'Inclusieve poort',
  IntermediateThrowEvent: 'Tussenliggende werpgebeurtenis',
  Lane: 'Baan',
  LaneSet: 'Baanset',
  ManualTask: 'Handmatige taak',
  MessageEventDefinition: 'Berichtgebeurtenisdefinitie',
  MessageFlow: 'Berichtenstroom',
  ParallelGateway: 'Parallelle poort',
  Participant: 'Deelnemer',
  Property: 'Eigenschap',
  ReceiveTask: 'Ontvangsttaak',
  ScriptTask: 'Scripttaak',
  SendTask: 'Verzendtaak',
  SequenceFlow: 'Sequentiestroom',
  ServiceTask: 'Servicetaak',
  StartEvent: 'Startgebeurtenis',
  SubProcess: 'Subproces',
  Task: 'Taak',
  TextAnnotation: 'Tekstannotatie',
  UserTask: 'Gebruikerstaak',
});

export const InvertedBpmnElementTypes = Object.entries(BpmnElementTypes).reduce(
  (acc, [key, value]) => {
    acc[value] = key;
    return acc;
  },
  {}
);
