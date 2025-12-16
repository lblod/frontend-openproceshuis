import Service, { service } from '@ember/service';
import { getMessageForErrorCode } from 'frontend-openproceshuis/utils/error-messages';

export default class ApiService extends Service {
  @service toaster;

  async fetch(url, options) {
    const res = await fetch(url, options);
    if (!res.ok) {
      const resJson = await res.json();
      const errorMessage = getMessageForErrorCode(resJson.errors[0].code);
      this.toaster.error(errorMessage, 'API Fout', {
        timeOut: 5000,
      });
    }
    return res;
  }
}
