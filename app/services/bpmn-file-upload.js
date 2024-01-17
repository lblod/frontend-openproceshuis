import Service from '@ember/service';
import config from '../config/environment';

export default class BpmnFileUploadService extends Service {
  async uploadFile(file) {
    let formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${config.APP.apiHost}/bpmn-files`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('File upload failed');
    }

    return response.json();
  }
}
