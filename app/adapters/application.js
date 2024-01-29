import JSONAPIAdapter from '@ember-data/adapter/json-api';
import config from '../config/environment';

export default class ApplicationAdapter extends JSONAPIAdapter {
  host = config.APP.apiHost;

  pathForType(type) {
    let path = super.pathForType(type);

    if (!['bpmn-file', 'bpmn-element'].includes(type))
      path = `bpmn-elements/${path}`;

    return path;
  }
}
