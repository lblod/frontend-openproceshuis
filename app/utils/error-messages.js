import { htmlSafe } from '@ember/template';

const getContactMailToHtml = ({ visualText, mailSubject, mailBody }) => {
  const mailto =
    'mailto:loketlokaalbestuur@vlaanderen.be' +
    `?subject=${encodeURIComponent(mailSubject)}` +
    `&body=${encodeURIComponent(mailBody)}`;
  return `<a href="${mailto}" target="_blank" >${visualText}</a>`;
};

const getTimestampForMailBody = () => new Date().toLocaleString();

export const ERROR_CODES = {
  'oph.fileDeletionError': htmlSafe(
    `Het verwijderen van het bestand is mislukt. Herlaad de pagina en probeer opnieuw. Blijft het probleem? ${getContactMailToHtml(
      {
        visualText: 'Contacteer ons.',
        mailSubject: 'OPH - fout oph.fileDeletionError oplossen',
        mailBody: `
        Deze email wordt gestuurd om de fout "oph.fileDeletionError" op ${getTimestampForMailBody()} op te lossen. 

        Heb je meer relevante details die ons het probleem zouden kunnen helpen oplossen? Deel ze hier: 
      `,
      },
    )}`,
  ),
  'oph.processDeletionError': htmlSafe(
    `Het verwijderen van het proces is mislukt. Herlaad de pagina en probeer opnieuw. Blijft het probleem? ${getContactMailToHtml(
      {
        visualText: 'Contacteer ons.',
        mailSubject: 'OPH - fout oph.processDeletionError oplossen',
        mailBody: `
        Deze email wordt gestuurd om de fout "oph.processDeletionError" op ${getTimestampForMailBody()} op te lossen. 

        Heb je meer relevante details die ons het probleem zouden kunnen helpen oplossen? Deel ze hier: 
      `,
      },
    )}`,
  ),
  'oph.updateModelFailed': htmlSafe(
    `Het bijwerken van het proces is mislukt. Herlaad de pagina en probeer opnieuw. Blijft het probleem? ${getContactMailToHtml(
      {
        visualText: 'Contacteer ons.',
        mailSubject: 'OPH - fout oph.updateModelFailed oplossen',
        mailBody: `
        Deze email wordt gestuurd om de fout "oph.updateModelFailed" op ${getTimestampForMailBody()} op te lossen. 

        Heb je meer relevante details, zoals bijvoorbeeld de namen van de velden die je wou bijwerken, die ons het probleem zouden kunnen helpen oplossen? Deel ze hier: 
      `,
      },
    )}`,
  ),
  'oph.icrDataUpdateFailed': htmlSafe(
    `Het bijwerken van de informatieclassificatie data is mislukt. Herlaad de pagina en probeer opnieuw. Blijft het probleem? ${getContactMailToHtml(
      {
        visualText: 'Contacteer ons.',
        mailSubject: 'OPH - fout oph.icrDataUpdateFailed oplossen',
        mailBody: `
        Deze email wordt gestuurd om de fout "oph.icrDataUpdateFailed" op ${getTimestampForMailBody()} op te lossen. 

        Heb je meer relevante details, zoals bijvoorbeeld de namen van de velden die je wou bijwerken, die ons het probleem zouden kunnen helpen oplossen? Deel ze hier: 
      `,
      },
    )}`,
  ),
  'oph.visioLatestDiagramDownloadFailed': htmlSafe(
    `Het visio-bestand kon niet worden gedownload als BPMN. Herlaad de pagina en probeer opnieuw. Blijft het probleem? ${getContactMailToHtml(
      {
        visualText: 'Contacteer ons.',
        mailSubject: 'OPH - fout oph.visioLatestDiagramDownloadFailed oplossen',
        mailBody: `
        Deze email wordt gestuurd om de fout "oph.visioLatestDiagramDownloadFailed" op ${getTimestampForMailBody()} op te lossen. 

        Heb je meer relevante details die ons het probleem zouden kunnen helpen oplossen? Deel ze hier: 
      `,
      },
    )}`,
  ),
  'oph.downloadLatestDiagramFailed': 'Bestand kon niet worden opgehaald',
  'oph.addProcessFailed': 'Dit proces kon niet worden toegevoegd',
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
