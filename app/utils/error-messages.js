import { htmlSafe } from '@ember/template';

const getVisioDownloadErrorMessage = () => {
  const mailto =
    'mailto:loketlokaalbestuur@vlaanderen.be' +
    `?subject=${encodeURIComponent('Visio kan niet downloaden als BPMN')}` +
    `?body=${encodeURIComponent(`\n\n${window.location.href}\n`)}`;
  const linkHtml = `<a href="${mailto}">Contacteer ons</a>`;
  return htmlSafe(
    `Het visio-bestand kon niet worden gedownload als BPMN. Herlaad de pagina en probeer opnieuw. Blijft het probleem? ${linkHtml}.`,
  );
};

export const ERROR_CODES = {
  // FRONTEND
  'oph.fileDeletionError':
    'Het verwijderen van het bestand is mislukt. Herlaad de pagina en probeer opnieuw. Blijft het probleem? Contacteer ons.',
  'oph.processDeletionError':
    'Het verwijderen van het proces is mislukt. Herlaad de pagina en probeer opnieuw. Blijft het probleem? Contacteer ons.',
  'oph.updateModelFailed':
    'Het bijwerken van het proces is mislukt. Herlaad de pagina en probeer opnieuw. Blijft het probleem? Contacteer ons.',
  'oph.icrDataUpdateFailed':
    'Het bijwerken van de informatieclassificatie data is mislukt. Herlaad de pagina en probeer opnieuw. Blijft het probleem? Contacteer ons.',
  'oph.visioLatestDiagramDownloadFailed': getVisioDownloadErrorMessage(),
  'oph.downloadLatestDiagramFailed': 'Bestand kon niet worden opgehaald',
  'oph.addProcessFailed': 'Dit proces kon niet worden toegevoegd',
  // BPMN
  'bpmn.sessionIdNotFound': 'Session ID header werd niet gevonden.',
  'bpmn.groupUriNotFound': 'Gebruiker maakt geen deel uit van een organisatie.',
  'bpmn.emptyVirtualFileId':
    'Bestand id ontbrak tijdens het uploaden van het bpmn bestand.',
  'bpmn.virtualFileIdNotFound': 'Bestand id werd niet gevonden in onze server.',
  'bpmn.physicalFileIdNotFound':
    'Kon de fysieke bestandslocatie niet achterhalen',
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
    'Kon de fysieke bestandslocatie niet achterhalen.',
  'visio.targetExtensionNotSupported': 'Ongeldige doelformaat-extensie.',
  'visio.pdfConversionFailed': 'Conversie naar PDF is mislukt.',
  'visio.pdfConversionFilePathError':
    'PDF-bestand werd niet gevonden na conversie.',
  'visio.bpmnConversionFailed': 'Conversie naar BPMN is mislukt.',
  'visio.fallBackError': 'Onbekende fout tijdens visio conversie',
};

export const getMessageForErrorCode = (key) =>
  ERROR_CODES[key] ?? 'Oeps, er is iets misgelopen!';
