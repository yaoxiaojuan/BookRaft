import querystring from 'querystring';

const Utils = {

  // no test
  getHandler: (processor, endPoint) => {
    const handler = (request, response, next) => {
      response.setHeader('access-control-allow-origin', '*');
      if (request.path !== endPoint) {
        next();
      } else {
        request.setEncoding('utf-8');
        var postData = '';
        request.addListener('data', postDataChunk => postData += postDataChunk);
        request.addListener('end', () => {
          var params = querystring.parse(postData);
          processor(params, result => {
            response.send((result.error && result.error.statusCode) || 200, result);
          });
        });
      }
    };
    return handler;
  },

};

export default Utils;
