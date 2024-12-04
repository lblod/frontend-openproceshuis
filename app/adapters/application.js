import JSONAPIAdapter from '@ember-data/adapter/json-api';

export default class ApplicationAdapter extends JSONAPIAdapter {
  buildURL(modelName, id, snapshot, requestType, query) {
    // Query object containing
    //   'paramKey': ['paramValueA', 'paramValueB']
    // Should lead to URL containing query params
    //   paramKey=paramValueA&paramKey=paramValueB
    // Instead of
    //   paramKey[]=paramValueA&paramKey[]=paramValueB

    let url = super.buildURL(modelName, id, snapshot, requestType, query);

    if (query) {
      const customParams = [];

      for (let key in query) {
        if (Array.isArray(query[key])) {
          query[key].forEach((item) => {
            customParams.push(
              `${encodeURIComponent(key)}=${encodeURIComponent(item)}`
            );
          });
          delete query[key];
        }
      }

      if (customParams.length > 0) {
        const customQueryString = customParams.join('&');
        url += `?${customQueryString}`;
      }
    }

    return url;
  }
}
