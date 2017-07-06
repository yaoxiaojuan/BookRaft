import MongoClient from 'mongodb';
import Objects from '../common/Objects';

const Database = {

  getDatabaseUrl: () => 'mongodb://localhost:27017/persist_pomodoro',

  getMongoClientPromise: () => new Promise((resolve, reject) => {
    MongoClient.connect(Database.getDatabaseUrl(), (err, db) => {
      if (err) {
        reject(err);
      } else {
        resolve({db});
      }
    });
  }),

  createUniqueIndexPromise: ({db, collection, index}) => new Promise((resolve, reject) => {
    db.collection(collection).createIndex(
      index,
      {unique: true},
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve({db, collection, index, result});
        }
      }
    );
  }),

  getIndexInfoPromise: ({db, collection}) => new Promise((resolve, reject) => {
    db
      .collection(collection)
      .indexInformation((err, info) => {
        if (err) {
          reject(err);
        } else {
          resolve({db, collection, info});
        }
      });
  }),

  getAllConnectionsPromise: ({db}) => new Promise((resolve, reject) => {
    db.collections((err, collections) => {
      if (err) {
        reject(err);
      } else {
        resolve({db, collections});
      }
    });
  }),

  insertDocPromise: ({db, collection, doc}) => new Promise((resolve, reject) => {
    db.collection(collection).insert(doc, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve({db, collection, doc, result});
      }
    });
  }),

  findFirstDocPromise: ({db, collection, pattern}) => new Promise((resolve, reject) => {
    db.collection(collection).find(pattern).nextObject((err, doc) => {
      if (err) {
        reject(err);
      } else {
        resolve({db, collection, pattern, doc});
      }
    });
  }),

  collectionDropPromise: ({db, collection}) => new Promise((resolve, reject) => {
    db.collection(collection).drop((err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve({db, collection});
      }
    });
  }),

  upsertDocPromise: ({db, collection, pattern, doc}) => new Promise((resolve, reject) => {
    db.collection(collection).update(
      pattern,
      doc,
      {upsert: true},
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve({db, collection, pattern, doc, result});
        }
      }
    );
  }),

  deleteManyPromise: ({db, collection, pattern}) => new Promise((resolve, reject) => {
    db.collection(collection).deleteMany(pattern, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve({db, collection, pattern, result});
      }
    });
  }),

  // no test
  close: () => Database.getMongoClientPromise()
    .then(({db}) => db.close()),

  // no test
  printErrorAndQuit: err => {
    console.error('Database error:', err.message);
    process.exit();
  },

  allDocsInCollectionToString: (collection, doer) => Database.getMongoClientPromise()
    .then(({db}) => db.collection(collection).find({}).toArray())
    .then(docs => {
      let result = 'All docs in collection ' + collection + ' :';
      result = docs.reduce((result, doc) => result + '\n' + JSON.stringify(doc), result);
      doer(result);
      return Database.close();
    }),

  resetCollection: collection => Database.getMongoClientPromise()
    .then(({db}) => Database.deleteManyPromise({db, collection, pattern: {}}))
    .then(({db}) => Database.collectionDropPromise({db, collection}))
    .then(({db}) => db.close())
    .catch(Database.printErrorAndQuit),

  initialize: () => Database.getMongoClientPromise()
    .then(({db}) => Database.createUniqueIndexPromise({db, collection: 'sessions', index: 'token'}))
    .then(({db}) => db.close())
    .catch(Database.printErrorAndQuit),

};

Database.initialize();

Database.resetCollection('sessions');

// Database.allDocsInCollectionToString('sessions', console.log);

export default Database;
