import JSONAPIAdapter from '@ember-data/adapter/json-api';

export default class ApplicationAdapter extends JSONAPIAdapter {
  pathForType(type) {
    let path = super.pathForType(type);

    if (!['file', 'bpmn-element'].includes(type))
      path = `bpmn-elements/${path}`;

    return path;
  }
}
