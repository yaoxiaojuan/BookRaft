import randomToken from 'random-token';
import Utils from '../common/Utils';
import Database from '../common/Database';

const COLLECTION = 'sessions';

const SetTimerHandler = {

  queryTokenPromise: ({token}) => new Promise((resolve, reject) => {
    Database.getMongoClientPromise()
      .then(({db}) => Database.findFirstDocPromise({db, collection: COLLECTION, pattern: {token}}))
      .then(({db, doc}) => {
        resolve({db, doc});
      })
      .catch(reject);
  }),

  setTimer: (data, callback) => {
    if (!data.token) {
      data.token = randomToken(16);
    }
    SetTimerHandler.queryTokenPromise(data)
      .then(({db, doc}) => {
        if (doc) {
          callback({
            success: true,
            token: data.token,
            time: doc.time,
            minutes: doc.minutes
          });
        } else {
          const doc = {
            token: data.token,
            time: '' + (new Date()).getTime(),
            minutes: '' + data.minutes,
          };
          return Database.insertDocPromise({db, collection: COLLECTION, doc});
        }
      })
      .then(({db, doc}) => {
        db.close();
        callback({
          success: true,
          token: data.token,
          time: doc.time,
          minutes: doc.minutes,
        });
      })
      .catch((error) => callback({success: false, error: error}));
  },

  getHandler: () => Utils.getHandler(SetTimerHandler.setTimer, '/SetTimer'),

};

export default SetTimerHandler;
