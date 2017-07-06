import http from 'http';
import Router from 'node-router';
const router = Router();

import BasicHandler from './handlers/BasicHandler';
import HelloHandler from './handlers/HelloHandler';
import GetTimerHandler from './handlers/GetTimerHandler';
import SetTimerHandler from './handlers/SetTimerHandler';

const accessControlAllowOrigin = '*';

router.push('GET', '/', BasicHandler.rootHandler);

router.push('POST', '/Hello', HelloHandler.getHandler());
router.push('POST', '/GetTimer', GetTimerHandler.getHandler());
router.push('POST', '/SetTimer', SetTimerHandler.getHandler());

router.push(BasicHandler.notFoundHandler);
router.push(BasicHandler.errorHandler);

const server = http.createServer(router).listen(2039);  // launch the server
console.log('node server is listening on http://127.0.0.1:2039');
