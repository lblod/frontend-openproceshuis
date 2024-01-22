import { helper } from '@ember/component/helper';
import generateBpmnDownloadUrl from 'frontend-processendatabank/utils/bpmn-download-url';

export default helper(function bpmnDownloadUrl([fileId]) {
  return generateBpmnDownloadUrl(fileId);
});
