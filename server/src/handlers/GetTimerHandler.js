import randomToken from 'random-token';
import Utils from '../common/Utils';
import Database from '../common/Database';

const COLLECTION = 'sessions';

const GetTimerHandler = {

  queryTokenPromise: ({token}) => new Promise((resolve, reject) => {
    Database.getMongoClientPromise()
      .then(({db}) => Database.findFirstDocPromise({db, collection: COLLECTION, pattern: {token}}))
      .then(({db, doc}) => {
        resolve({db, doc});
      })
      .catch(reject);
  }),

  getTimer: (data, callback) => {
    if (!data.token) {
      data.token = randomToken(16);
    }
    GetTimerHandler.queryTokenPromise(data)
      .then(({db, doc = {}}) => {
        callback({
          success: true,
          token: data.token,
          time: doc.time,
          minutes: doc.minutes
        });
      })
      .catch((error) => callback({success: false, error: error}));
  },

  getHandler: () => Utils.getHandler(GetTimerHandler.getTimer, '/GetTimer'),

};

export default GetTimerHandler;
