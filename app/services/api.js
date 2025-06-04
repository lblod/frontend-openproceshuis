import Service, { service } from '@ember/service';

export default class ApiService extends Service {
  @service toaster;

  async fetch(url, options) {
    const api = url.includes('/bpmn')
      ? 'Bpmn'
      : url.includes('/visio')
        ? 'Visio'
        : 'Unknown';
    const res = await fetch(url, options);
    if (!res.ok) {
      const resJson = await res.json();
      this.toaster.error(
        `${api} service error: ${resJson.errors[0].message}`,
        'Fout',
        { timeOut: 5000 },
      );
    }
    return res;
  }
}
