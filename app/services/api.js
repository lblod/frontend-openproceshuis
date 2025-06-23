import Service, { service } from '@ember/service';

export default class ApiService extends Service {
  @service toaster;

  errorCodes = {
    // BPMN
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
    'bpmn.fallBackError': 'Onbekende fout tijdens extraheren van processtappen',
    // VISIO
    'visio.emptyVirtualFileId':
      'Bestand id ontbrak tijdens het uploaden van het bpmn bestand.',
    'visio.virtualFileIdNotFound': 'Bestand-ID werd niet teruggevonden.',
    'visio.vsdxFileTypeExpected':
      'Ongeldig bestandsformaat: .vsdx-extensie verwacht.',
    'visio.physicalFileIdNotFound':
      'Kon de fysieke bestandslocatie niet vinden.',
    'visio.targetExtensionNotSupported': 'Ongeldige doelformaat-extensie.',
    'visio.pdfConversionFailed': 'Conversie naar PDF is mislukt.',
    'visio.pdfConversionFilePathError':
      'PDF-bestand werd niet gevonden na conversie.',
    'visio.bpmnConversionFailed': 'Conversie naar BPMN is mislukt.',
    'visio.fallBackError': 'Onbekende fout tijdens visio conversie',
  };

  getMessageForErrorCode = (key) =>
    this.errorCodes[key] ?? 'Oeps, er is iets misgelopen!';

  async fetch(url, options) {
    const res = await fetch(url, options);
    if (!res.ok) {
      const resJson = await res.json();
      const errorMessage = this.getMessageForErrorCode(resJson.errors[0].code);
      this.toaster.error(`API error: ${errorMessage}`, 'Fout', {
        timeOut: 5000,
      });
    }
    return res;
  }
}
