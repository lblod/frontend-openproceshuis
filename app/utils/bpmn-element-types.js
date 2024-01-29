export const BpmnElementTypes = Object.freeze({
  BpmnElement: Symbol('BPMN-element'),
  BusinessRuleTask: Symbol('Bedrijfsregeltaak'),
  ManualTask: Symbol('Handmatige taak'),
  ReceiveTask: Symbol('Ontvangsttaak'),
  ScriptTask: Symbol('Scripttaak'),
  SendTask: Symbol('Verzendtaak'),
  Task: Symbol('Taak'),
  UserTask: Symbol('Gebruikerstaak'),
});
