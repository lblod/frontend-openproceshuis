import JSONAPIAdapter from '@ember-data/adapter/json-api';
import config from '../config/environment';

export default class ApplicationAdapter extends JSONAPIAdapter {
  host = config.APP.apiHost;

  pathForType(type) {
    let path = super.pathForType(type);

    if (type !== 'bpmn-file') path = `process-steps/${path}`;

    return path;
  }
}
