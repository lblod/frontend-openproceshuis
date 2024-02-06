import { helper } from '@ember/component/helper';
import generateBpmnDownloadUrl from 'frontend-openproceshuis/utils/bpmn-download-url';

export default helper(function bpmnDownloadUrl([fileId, fileName]) {
  return generateBpmnDownloadUrl(fileId, fileName);
});
