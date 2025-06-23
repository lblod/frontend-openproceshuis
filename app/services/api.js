import Service, { service } from '@ember/service';

export default class ApiService extends Service {
  @service toaster;

  errorCodes = {
    'bpmn.sessionIdNotFound': 'Session ID header werd niet gevonden.',
    'bpmn.groupUriNotFound':
      'Gebruiker maakt geen deel uit van een organisatie.',
    'bpmn.emptyVirtualFileId':
      'Bestand id ontbrak tijdens het uploaden van het bpmn bestand.',
    'bpmn.virtualFileIdNotFound':
      'Bestand id werd niet gevonden in onze server.',
    'bpmn.physicalFileIdNotFound': 'Kan bestand in pad niet vinden.',
    'bpmn.emptyContent':
      'Ongeldige inhoud: Het meegeleverde bestand bevat geen inhoud.',
    'bpmn.invalidContent':
      'Ongeldige inhoud: Het meegeleverde bestand heeft geen geldige inhoud.',
    'bpmn.errorDuringJobExecution': 'Error tijdens het uitvoeren van job',
  };

  getMessageForErrorCode = (key) => {
    const message = this.errorCodes[key];
    if (!message) {
      return 'Oeps, er is iets fout gelopen.';
    }
    return message;
  };

  async fetch(url, options) {
    const res = await fetch(url, options);
    if (!res.ok) {
      const resJson = await res.json();
      this.toaster.error(
        `API error: ${this.getMessageForErrorCode(resJson.errors[0].code)}`,
        'Fout',
        {
          timeOut: 5000,
        },
      );
    }
    return res;
  }
}
