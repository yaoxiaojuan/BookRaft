const rootHandler = (request, response, next) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  if (request.path === '/') {
    response.send(200, 'this is the server of the backend editor');
  } else {
    next();
  }
};

const notFoundHandler = (request, response, next) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.send(404, 'page not found');
};

const errorHandler = (error, request, response, next) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.send(error);
};

export default {rootHandler, notFoundHandler, errorHandler};
