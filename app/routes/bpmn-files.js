import Route from '@ember/routing/route';

export default class BpmnFilesRoute extends Route {
  async model() {
    const response = await fetch('http://localhost/bpmn-files');
    if (!response.ok) {
      throw new Error('Failed to fetch BPMN files');
    }
    const data = await response.json();
    return data.data;
  }
}
