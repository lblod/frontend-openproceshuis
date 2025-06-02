const errorCodes = {
  'bpmn.error.uploadError': 'test',
};

export const getMessageForErrorCode = (key) => {
  const message = errorCodes[key];
  if (!message) {
    return 'Oeps, er is iets fout gelopen.';
  }
  return message;
};
