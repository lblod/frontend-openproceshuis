import { htmlSafe } from '@ember/template';

const getContactMailToHtml = ({ visualText, mailSubject, mailBody }) => {
  const clickableText = visualText ?? 'Contacteer ons.';
  const mailto =
    'mailto:loketlokaalbestuur@vlaanderen.be' +
    `?subject=${encodeURIComponent(mailSubject)}` +
    `&body=${encodeURIComponent(mailBody)}`;
  return `<a href="${mailto}" target="_blank" >${clickableText}</a>`;
};

const getTimestampForMailBody = () => new Date().toLocaleString();
const getCommonMailSubject = (errorCode) => `OPH - fout ${errorCode} oplossen`;

export const ERROR_CODES = {
  'oph.fileDeletionError': htmlSafe(
    `Het verwijderen van het bestand is mislukt. Herlaad de pagina en probeer opnieuw. Blijft het probleem? ${getContactMailToHtml(
      {
        mailSubject: getCommonMailSubject('oph.fileDeletionError'),
        mailBody: `Deze email wordt gestuurd om de fout "oph.fileDeletionError" op ${getTimestampForMailBody()} op te lossen.\nHeb je meer relevante details die ons het probleem zouden kunnen helpen oplossen? Deel ze hier:`,
      },
    )}`,
  ),
  'oph.processDeletionError': htmlSafe(
    `Het verwijderen van het proces is mislukt. Herlaad de pagina en probeer opnieuw. Blijft het probleem? ${getContactMailToHtml(
      {
        mailSubject: getCommonMailSubject('oph.processDeletionError'),
        mailBody: `Deze email wordt gestuurd om de fout "oph.processDeletionError" op ${getTimestampForMailBody()} op te lossen.\nHeb je meer relevante details die ons het probleem zouden kunnen helpen oplossen? Deel ze hier:`,
      },
    )}`,
  ),
  'oph.updateModelFailed': htmlSafe(
    `Het bijwerken van het proces is mislukt. Herlaad de pagina en probeer opnieuw. Blijft het probleem? ${getContactMailToHtml(
      {
        mailSubject: getCommonMailSubject('oph.updateModelFailed'),
        mailBody: `Deze email wordt gestuurd om de fout "oph.updateModelFailed" op ${getTimestampForMailBody()} op te lossen.\nHeb je meer relevante details, zoals bijvoorbeeld de namen van de velden die je wou bijwerken, die ons het probleem zouden kunnen helpen oplossen? Deel ze hier:`,
      },
    )}`,
  ),
  'oph.icrDataUpdateFailed': htmlSafe(
    `Het bijwerken van de informatieclassificatie data is mislukt. Herlaad de pagina en probeer opnieuw. Blijft het probleem? ${getContactMailToHtml(
      {
        mailSubject: getCommonMailSubject('oph.icrDataUpdateFailed'),
        mailBody: `Deze email wordt gestuurd om de fout "oph.icrDataUpdateFailed" op ${getTimestampForMailBody()} op te lossen.\nHeb je meer relevante details, zoals bijvoorbeeld de namen van de velden die je wou bijwerken, die ons het probleem zouden kunnen helpen oplossen? Deel ze hier:`,
      },
    )}`,
  ),
  'oph.visioLatestDiagramDownloadFailed': htmlSafe(
    `Het visio-bestand kon niet worden gedownload als BPMN. Herlaad de pagina en probeer opnieuw. Blijft het probleem? ${getContactMailToHtml(
      {
        mailSubject: getCommonMailSubject(
          'oph.visioLatestDiagramDownloadFailed',
        ),
        mailBody: `Deze email wordt gestuurd om de fout "oph.visioLatestDiagramDownloadFailed" op ${getTimestampForMailBody()} op te lossen.\nHeb je meer relevante details die ons het probleem zouden kunnen helpen oplossen? Deel ze hier:`,
      },
    )}`,
  ),
  'oph.downloadLatestDiagramFailed': htmlSafe(
    `Het diagram kon niet worden gedownload. Herlaad de pagina en probeer opnieuw. Blijft het probleem? ${getContactMailToHtml(
      {
        mailSubject: getCommonMailSubject('oph.downloadLatestDiagramFailed'),
        mailBody: `Deze email wordt gestuurd om de fout "oph.downloadLatestDiagramFailed" op ${getTimestampForMailBody()} op te lossen.\nHeb je meer relevante details die ons het probleem zouden kunnen helpen oplossen? Deel ze hier:`,
      },
    )}`,
  ),
  'oph.addProcessFailed': 'Dit proces kon niet worden toegevoegd',
  'bpmn.sessionIdNotFound': htmlSafe(
    `De session ID header werd niet gevonden. Herlaad de pagina en probeer opnieuw. Blijft het probleem? ${getContactMailToHtml(
      {
        mailSubject: getCommonMailSubject('bpmn.sessionIdNotFound'),
        mailBody: `Deze email wordt gestuurd om de fout "bpmn.sessionIdNotFound" op ${getTimestampForMailBody()} op te lossen.\nHeb je meer relevante details die ons het probleem zouden kunnen helpen oplossen? Deel ze hier:`,
      },
    )}`,
  ),
  'bpmn.groupUriNotFound': htmlSafe(
    `De actie die je wou uitvoeren is mislukt omdat je niet meer ingelogd bent. Log opnieuw in en probeer nog eens. Blijft het probleem? ${getContactMailToHtml(
      {
        mailSubject: getCommonMailSubject('bpmn.groupUriNotFound'),
        mailBody: `Deze email wordt gestuurd om de fout "bpmn.groupUriNotFound" op ${getTimestampForMailBody()} op te lossen.\nHeb je meer relevante details die ons het probleem zouden kunnen helpen oplossen? Deel ze hier:`,
      },
    )}`,
  ),
  'bpmn.emptyVirtualFileId': htmlSafe(
    `Het opladen van het bestand is mislukt. Herlaad de pagina en probeer opnieuw. Blijft het probleem? ${getContactMailToHtml(
      {
        mailSubject: getCommonMailSubject('bpmn.emptyVirtualFileId'),
        mailBody: `Deze email wordt gestuurd om de fout "bpmn.emptyVirtualFileId" op ${getTimestampForMailBody()} op te lossen.\nHeb je meer relevante details die ons het probleem zouden kunnen helpen oplossen? Deel ze hier:`,
      },
    )}`,
  ),
  'bpmn.virtualFileIdNotFound': htmlSafe(
    `De actie die je wou uitvoeren is mislukt omdat we het bestand niet kunnen lokaliseren. ${getContactMailToHtml(
      {
        visualText: 'Contacteer ons',
        mailSubject: getCommonMailSubject('bpmn.virtualFileIdNotFound'),
        mailBody: `Deze email wordt gestuurd om de fout "bpmn.virtualFileIdNotFound" op ${getTimestampForMailBody()} op te lossen.\nHeb je meer relevante details die ons het probleem zouden kunnen helpen oplossen? Deel ze hier:`,
      },
    )} om dit probleem op te lossen.`,
  ),
  'bpmn.physicalFileIdNotFound': htmlSafe(
    `De actie die je wou uitvoeren is mislukt omdat we het bestand niet kunnen lokaliseren. ${getContactMailToHtml(
      {
        visualText: 'Contacteer ons',
        mailSubject: getCommonMailSubject('bpmn.physicalFileIdNotFound'),
        mailBody: `Deze email wordt gestuurd om de fout "bpmn.physicalFileIdNotFound" op ${getTimestampForMailBody()} op te lossen.\nHeb je meer relevante details die ons het probleem zouden kunnen helpen oplossen? Deel ze hier:`,
      },
    )} om dit probleem op te lossen.`,
  ),
  'bpmn.emptyContent': htmlSafe(
    `Het opladen van het BPMN-bestand is mislukt. ${getContactMailToHtml({
      visualText: 'Contacteer ons',
      mailSubject: getCommonMailSubject('bpmn.emptyContent'),
      mailBody: `Deze email wordt gestuurd om de fout "bpmn.emptyContent" op ${getTimestampForMailBody()} op te lossen.\nVoeg eventueel het bestand toe aan deze email, dan kunnen we je sneller helpen.\nHeb je meer relevante details die ons het probleem zouden kunnen helpen oplossen? Deel ze hier:`,
    })} om dit probleem op te lossen.`,
  ),
  'bpmn.invalidContent': htmlSafe(
    `Het opladen van het BPMN-bestand is mislukt. ${getContactMailToHtml({
      visualText: 'Contacteer ons',
      mailSubject: getCommonMailSubject('bpmn.invalidContent'),
      mailBody: `Deze email wordt gestuurd om de fout "bpmn.invalidContent" op ${getTimestampForMailBody()} op te lossen.\nVoeg eventueel het bestand toe aan deze email, dan kunnen we je sneller helpen.\nHeb je meer relevante details die ons het probleem zouden kunnen helpen oplossen? Deel ze hier:`,
    })} om dit probleem op te lossen.`,
  ),
  'bpmn.errorDuringJobExecution': htmlSafe(
    `Het diagram kon niet worden geüpdatet. Herlaad de pagina en probeer opnieuw. Blijft het probleem? ${getContactMailToHtml(
      {
        visualText: 'Contacteer ons',
        mailSubject: getCommonMailSubject('bpmn.errorDuringJobExecution'),
        mailBody: `Deze email wordt gestuurd om de fout "bpmn.errorDuringJobExecution" op ${getTimestampForMailBody()} op te lossen.\nVoeg eventueel het bestand toe aan deze email, dan kunnen we je sneller helpen.\nHeb je meer relevante details die ons het probleem zouden kunnen helpen oplossen? Deel ze hier:`,
      },
    )}`,
  ),
  'bpmn.fallBackError': 'Onbekende fout tijdens extraheren van processtappen',
  'visio.emptyVirtualFileId': htmlSafe(
    `Het opladen van het bestand is mislukt. Herlaad de pagina en probeer opnieuw. Blijft het probleem? ${getContactMailToHtml(
      {
        mailSubject: getCommonMailSubject('visio.emptyVirtualFileId'),
        mailBody: `Deze email wordt gestuurd om de fout "visio.emptyVirtualFileId" op ${getTimestampForMailBody()} op te lossen.\nHeb je meer relevante details die ons het probleem zouden kunnen helpen oplossen? Deel ze hier:`,
      },
    )}`,
  ),
  'visio.virtualFileIdNotFound': htmlSafe(
    `De actie die je wou uitvoeren is mislukt omdat we het bestand niet kunnen lokaliseren. ${getContactMailToHtml(
      {
        visualText: 'Contacteer ons',
        mailSubject: getCommonMailSubject('visio.virtualFileIdNotFound'),
        mailBody: `Deze email wordt gestuurd om de fout "visio.virtualFileIdNotFound" op ${getTimestampForMailBody()} op te lossen.\nHeb je meer relevante details die ons het probleem zouden kunnen helpen oplossen? Deel ze hier:`,
      },
    )} om dit probleem op te lossen.`,
  ),
  'visio.vsdxFileTypeExpected':
    'Ongeldig bestandsformaat: .vsdx-extensie verwacht.',
  'visio.physicalFileIdNotFound': htmlSafe(
    `De actie die je wou uitvoeren is mislukt omdat we het bestand niet kunnen lokaliseren. ${getContactMailToHtml(
      {
        visualText: 'Contacteer ons',
        mailSubject: getCommonMailSubject('visio.physicalFileIdNotFound'),
        mailBody: `Deze email wordt gestuurd om de fout "visio.physicalFileIdNotFound" op ${getTimestampForMailBody()} op te lossen.\nHeb je meer relevante details die ons het probleem zouden kunnen helpen oplossen? Deel ze hier:`,
      },
    )} om dit probleem op te lossen.`,
  ),
  'visio.targetExtensionNotSupported': 'Ongeldige doelformaat-extensie.',
  'visio.pdfConversionFailed': htmlSafe(
    `Het omzetten van het visio-bestand naar PDF is mislukt. Herlaad de pagina en probeer opnieuw. Blijft het probleem? ${getContactMailToHtml(
      {
        mailSubject: getCommonMailSubject('visio.pdfConversionFailed'),
        mailBody: `Deze email wordt gestuurd om de fout "visio.pdfConversionFailed" op ${getTimestampForMailBody()} op te lossen.\nHeb je meer relevante details die ons het probleem zouden kunnen helpen oplossen? Deel ze hier:`,
      },
    )}`,
  ),
  'visio.pdfConversionFilePathError': htmlSafe(
    `Het omzetten van het visio-bestand naar PDF is mislukt. Herlaad de pagina en probeer opnieuw. Blijft het probleem? ${getContactMailToHtml(
      {
        mailSubject: getCommonMailSubject('visio.pdfConversionFilePathError'),
        mailBody: `Deze email wordt gestuurd om de fout "visio.pdfConversionFilePathError" op ${getTimestampForMailBody()} op te lossen.\nHeb je meer relevante details die ons het probleem zouden kunnen helpen oplossen? Deel ze hier:`,
      },
    )}`,
  ),
  'visio.bpmnConversionFailed': htmlSafe(
    `Het omzetten van het visio-bestand naar BPMN is mislukt. Herlaad de pagina en probeer opnieuw. Blijft het probleem? ${getContactMailToHtml(
      {
        mailSubject: getCommonMailSubject('visio.bpmnConversionFailed'),
        mailBody: `Deze email wordt gestuurd om de fout "visio.bpmnConversionFailed" op ${getTimestampForMailBody()} op te lossen.\nHeb je meer relevante details die ons het probleem zouden kunnen helpen oplossen? Deel ze hier:`,
      },
    )}`,
  ),
  'visio.fallBackError': htmlSafe(
    `Het omzetten van het diagram naar een ander formaat is mislukt. Herlaad de pagina en probeer opnieuw. Blijft het probleem? ${getContactMailToHtml(
      {
        mailSubject: getCommonMailSubject('visio.fallBackError'),
        mailBody: `Deze email wordt gestuurd om de fout "visio.fallBackError" op ${getTimestampForMailBody()} op te lossen.\nHeb je meer relevante details die ons het probleem zouden kunnen helpen oplossen? Deel ze hier:`,
      },
    )}`,
  ),
};

export const getMessageForErrorCode = (key) =>
  ERROR_CODES[key] ?? 'Oeps, er is iets misgelopen!';
