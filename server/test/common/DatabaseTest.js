import test from 'ava';
import MongoClient from 'mongodb';
import Target from '../../src/common/Database';
import Objects from '../../src/common/Objects';

const getDatabaseUrl = Target.getDatabaseUrl;

test.before(t => {
  Target.getDatabaseUrl = () => 'mongodb://localhost:27017/persist_pomodoro_DatabaseTest';
});

test.after(t => {
  Target.getDatabaseUrl = getDatabaseUrl;
});

test.serial('getMongoClientPromise', async t => {
  await t.notThrows(Target.getMongoClientPromise(), 'should not reject');
  const object = await Target.getMongoClientPromise();
  t.deepEqual(Objects.filterKeys(object, ['db']), object, 'object only has one field "db"');
  t.true(object.db.collection instanceof Function, 'object.db is a mongo db object');
  await object.db.close();
});

const getCleanDatabase = async () => {
  const db = (await Target.getMongoClientPromise()).db;
  await db.dropDatabase();
  await db.close();
  return (await Target.getMongoClientPromise()).db;
};

test.serial('DatabaseTest: getCleanDatabase', async t => {
  const db = await getCleanDatabase();

  const collections = await db.collections();
  t.is(collections.length, 0);
  await db.close();
});

test.serial('createUniqueIndexPromise', async t => {
  const db = await getCleanDatabase();
  const input = {
    db,
    collection: 'collection_name',
    index: 'index_name',
  };
  const object = await Target.createUniqueIndexPromise(input);
  t.deepEqual(Objects.filterKeys(object, ['db', 'collection', 'index', 'result']), object, 'object only has these fields');
  t.deepEqual(object.db, db);
  t.is(object.collection, 'collection_name');
  t.is(object.index, 'index_name');
  t.is(object.result, 'index_name_1');

  const indexInformation = await db.collection('collection_name').indexInformation();
  t.deepEqual(indexInformation, { _id_: [ [ '_id', 1 ] ], index_name_1: [ [ 'index_name', 1 ] ] }, 'correct index has been created');
  await db.close();
});

const getDatabaseWithIndex = async () => {
  const db = await getCleanDatabase();
  const input = {
    db,
    collection: 'collection_name',
    index: 'index_name',
  };
  await Target.createUniqueIndexPromise(input);
  return db;
};

test.serial('DatabaseTest: getDatabaseWithIndex', async t => {
  const db = await getDatabaseWithIndex();

  const collections = (await db.collections())
    .filter(({namespace}) => namespace !== 'persist_pomodoro_DatabaseTest.system.indexes');
  t.is(collections.length, 1, 'only one collection');
  t.is(collections[0].namespace, 'persist_pomodoro_DatabaseTest.collection_name', 'collection name is correct');

  t.deepEqual(
    await db.collection('collection_name').indexInformation(),
    { _id_: [ [ '_id', 1 ] ], index_name_1: [ [ 'index_name', 1 ] ] },
    'index information is correct'
  );
  await db.close();
});

test.serial('getIndexInfoPromise', async t => {
  const db = await getDatabaseWithIndex();
  const input = {
    db,
    collection: 'collection_name',
  };
  const object = await Target.getIndexInfoPromise(input);
  t.deepEqual(Objects.filterKeys(object, ['db', 'collection', 'info']), object, 'object only has these fields');
  t.deepEqual(object.db, db);
  t.is(object.collection, 'collection_name');
  t.deepEqual(object.info, { _id_: [ [ '_id', 1 ] ], index_name_1: [ [ 'index_name', 1 ] ] });
  await db.close();
});

test.serial('getAllConnectionsPromise for empty database', async t => {
  const db = await getCleanDatabase();
  const object = await Target.getAllConnectionsPromise({db});
  t.deepEqual(Objects.filterKeys(object, ['db', 'collections']), object, 'object only has these fields');
  t.deepEqual(object.db, db);
  t.deepEqual(object.collections, []);
  await db.close();
});

test.serial('getAllConnectionsPromise for database with 1 collection', async t => {
  const db = await getDatabaseWithIndex();
  const object = await Target.getAllConnectionsPromise({db});
  t.deepEqual(Objects.filterKeys(object, ['db', 'collections']), object, 'object only has these fields');
  t.deepEqual(object.db, db);
  const collections = object.collections.filter(({namespace}) => namespace !== 'persist_pomodoro_DatabaseTest.system.indexes');
  t.is(collections.length, 1);
  t.is(collections[0].namespace, 'persist_pomodoro_DatabaseTest.collection_name');
  await db.close();
});

const getDatabaseAfterOneInsertion = async () => {
  const db = await getDatabaseWithIndex();
  const input = {
    db,
    collection: 'collection_name',
    doc: {
      index_name: 'unique_value_name',
    },
  };
  return (await Target.insertDocPromise(input)).db;
};

test.serial('DatabaseTest: getDatabaseAfterOneInsertion', async t => {
  const db = await getDatabaseAfterOneInsertion();
  const collections = (await db.collections())
    .filter(({namespace}) => namespace !== 'persist_pomodoro_DatabaseTest.system.indexes');
  t.is(collections.length, 1, 'only one collection');
  t.is(collections[0].namespace, 'persist_pomodoro_DatabaseTest.collection_name', 'collection name is correct');

  t.deepEqual(
    await db.collection('collection_name').indexInformation(),
    { _id_: [ [ '_id', 1 ] ], index_name_1: [ [ 'index_name', 1 ] ] },
    'index information is correct'
  );

  const documents = await db.collection('collection_name').find({}).toArray();
  t.is(documents.length, 1, 'only one document');
  t.is(documents[0].index_name, 'unique_value_name');

  await db.close();
});

test.serial('insertDocPromise to empty database', async t => {
  const db = await getDatabaseWithIndex();
  const documentsBefore = await db.collection('collection_name').find({}).toArray();
  t.is(documentsBefore.length, 0, 'no document intially');

  const input = {
    db,
    collection: 'collection_name',
    doc: {
      index_name: 'unique_value_name',
    },
  };
  const object = await Target.insertDocPromise(input);
  t.deepEqual(Objects.filterKeys(object, ['db', 'collection', 'doc', 'result']), object, 'object only has these fields');
  t.deepEqual(object.db, db);
  t.is(object.collection, 'collection_name');
  t.deepEqual(Objects.filterKeys(object.doc, ['index_name']), {
    index_name: 'unique_value_name',
  });
  t.is(object.result.result.ok, 1);

  const documentsAfter = await db.collection('collection_name').find({}).toArray();
  t.is(documentsAfter.length, 1, 'only one document');
  t.is(documentsAfter[0].index_name, 'unique_value_name');

  await db.close();
});

test.serial('insertDocPromise to non-empty database successfully', async t => {
  const db = await getDatabaseAfterOneInsertion();
  const documentsBefore = await db.collection('collection_name').find({}).toArray();
  t.is(documentsBefore.length, 1, 'only one document');
  t.is(documentsBefore[0].index_name, 'unique_value_name');

  const input = {
    db,
    collection: 'collection_name',
    doc: {
      index_name: 'unique_value_name_another',
    },
  };
  const object = await Target.insertDocPromise(input);
  t.deepEqual(Objects.filterKeys(object, ['db', 'collection', 'doc', 'result']), object, 'object only has these fields');
  t.deepEqual(object.db, db);
  t.is(object.collection, 'collection_name');
  t.deepEqual(Objects.filterKeys(object.doc, ['index_name']), {
    index_name: 'unique_value_name_another',
  });
  t.is(object.result.result.ok, 1);

  const documentsAfter = await db.collection('collection_name').find({}).toArray();
  t.is(documentsAfter.length, 2, 'only one document');
  t.is(documentsAfter[0].index_name, 'unique_value_name');
  t.is(documentsAfter[1].index_name, 'unique_value_name_another');

  await db.close();
});

test.serial('insertDocPromise to non-empty database, rejected by duplication', async t => {
  const db = await getDatabaseAfterOneInsertion();
  const documentsBefore = await db.collection('collection_name').find({}).toArray();
  t.is(documentsBefore.length, 1, 'only one document');
  t.is(documentsBefore[0].index_name, 'unique_value_name');

  const input = {
    db,
    collection: 'collection_name',
    doc: {
      index_name: 'unique_value_name',
    },
  };
  const error = await t.throws(Target.insertDocPromise(input));
  t.is(error.code, 11000, 'the error is a duplicate key error');

  const documentsAfter = await db.collection('collection_name').find({}).toArray();
  t.is(documentsAfter.length, 1, 'only one document');
  t.is(documentsAfter[0].index_name, 'unique_value_name');

  await db.close();
});

test.serial('findFirstDocPromise for empty database', async t => {
  const db = await getCleanDatabase();
  const input = {
    db,
    collection: 'collection_name',
    pattern: {},
  };
  const object = await Target.findFirstDocPromise(input);
  t.deepEqual(Objects.filterKeys(object, ['db', 'collection', 'pattern', 'doc']), object, 'object only has these fields');
  t.deepEqual(object.db, db);
  t.is(object.collection, 'collection_name');
  t.deepEqual(object.pattern, {});
  t.is(object.doc, null);
  await db.close();
});

test.serial('findFirstDocPromise for database with no match', async t => {
  const db = await getDatabaseAfterOneInsertion();
  const input = {
    db,
    collection: 'collection_name',
    pattern: {
      index_name: 'unique_value_name_mismatch',
    },
  };
  const object = await Target.findFirstDocPromise(input);
  t.deepEqual(Objects.filterKeys(object, ['db', 'collection', 'pattern', 'doc']), object, 'object only has these fields');
  t.deepEqual(object.db, db);
  t.is(object.collection, 'collection_name');
  t.deepEqual(object.pattern, {index_name: 'unique_value_name_mismatch'});
  t.is(object.doc, null);
  await db.close();
});

test.serial('findFirstDocPromise for database with match', async t => {
  const db = await getDatabaseAfterOneInsertion();
  const input = {
    db,
    collection: 'collection_name',
    pattern: {
      index_name: 'unique_value_name',
    },
  };
  const object = await Target.findFirstDocPromise(input);
  t.deepEqual(Objects.filterKeys(object, ['db', 'collection', 'pattern', 'doc']), object, 'object only has these fields');
  t.deepEqual(object.db, db);
  t.is(object.collection, 'collection_name');
  t.deepEqual(object.pattern, {index_name: 'unique_value_name'});
  t.is(object.doc.index_name, 'unique_value_name');
  await db.close();
});

test.serial('findFirstDocPromise for database with * pattern (should return the first doc)', async t => {
  const db = await getDatabaseAfterOneInsertion();
  await Target.insertDocPromise({
    db,
    collection: 'collection_name',
    doc: {
      index_name: 'unique_value_name_another',
    },
  });
  const input = {
    db,
    collection: 'collection_name',
    pattern: {},
  };
  const object = await Target.findFirstDocPromise(input);
  t.deepEqual(Objects.filterKeys(object, ['db', 'collection', 'pattern', 'doc']), object, 'object only has these fields');
  t.deepEqual(object.db, db);
  t.is(object.collection, 'collection_name');
  t.deepEqual(object.pattern, {});
  t.is(object.doc.index_name, 'unique_value_name');
  await db.close();
});

test.serial('collectionDropPromise', async t => {
  const db = await getDatabaseWithIndex();
  const collectionsBefore = (await db.collections())
    .filter(({namespace}) => namespace !== 'persist_pomodoro_DatabaseTest.system.indexes');
  t.is(collectionsBefore.length, 1, 'there is one collection in the db intially');
  t.is(collectionsBefore[0].namespace, 'persist_pomodoro_DatabaseTest.collection_name')

  const input = {
    db,
    collection: 'collection_name',
  };
  const object = await Target.collectionDropPromise(input);
  t.deepEqual(Objects.filterKeys(object, ['db', 'collection']), object, 'object only has these fields');
  t.deepEqual(object.db, db);
  t.is(object.collection, 'collection_name');

  const collectionsAfter = (await db.collections())
    .filter(({namespace}) => namespace !== 'persist_pomodoro_DatabaseTest.system.indexes');
  t.is(collectionsAfter.length, 0, 'there is no collection in the db afterward');

  await db.close();
});

test.serial('upsertDocPromise into empty database', async t => {
  const db = await getDatabaseWithIndex();
  const documentsBefore = await db.collection('collection_name').find({}).toArray();
  t.is(documentsBefore.length, 0, 'only one document');

  const input = {
    db,
    collection: 'collection_name',
    pattern: {index_name: 'unique_value_name'},
    doc: {
      index_name: 'unique_value_name',
    },
  };
  const object = await Target.upsertDocPromise(input);
  t.deepEqual(Objects.filterKeys(object, ['db', 'collection', 'pattern', 'doc', 'result']), object, 'object only has these fields');
  t.deepEqual(object.db, db);
  t.is(object.collection, 'collection_name');
  t.deepEqual(object.pattern, {index_name: 'unique_value_name'});
  t.deepEqual(object.doc, {
    index_name: 'unique_value_name',
  });
  t.deepEqual(object.result.result.ok, 1);

  const documentsAfter = await db.collection('collection_name').find({}).toArray();
  t.is(documentsAfter.length, 1, 'only one document');
  t.is(documentsAfter[0].index_name, 'unique_value_name');

  await db.close();
});

test.serial('upsertDocPromise into non-empty database with no match', async t => {
  const db = await getDatabaseAfterOneInsertion();
  const documentsBefore = await db.collection('collection_name').find({}).toArray();
  t.is(documentsBefore.length, 1, 'only one document');
  t.is(documentsBefore[0].index_name, 'unique_value_name');

  const input = {
    db,
    collection: 'collection_name',
    pattern: {index_name: 'unique_value_name_another'},
    doc: {
      index_name: 'unique_value_name_another',
    },
  };
  const object = await Target.upsertDocPromise(input);
  t.deepEqual(Objects.filterKeys(object, ['db', 'collection', 'pattern', 'doc', 'result']), object, 'object only has these fields');
  t.deepEqual(object.db, db);
  t.is(object.collection, 'collection_name');
  t.deepEqual(object.pattern, {index_name: 'unique_value_name_another'});
  t.deepEqual(object.doc, {
    index_name: 'unique_value_name_another',
  });
  t.deepEqual(object.result.result.ok, 1);

  const documentsAfter = await db.collection('collection_name').find({}).toArray();
  t.is(documentsAfter.length, 2, 'only one document');
  t.is(documentsAfter[0].index_name, 'unique_value_name');
  t.is(documentsAfter[1].index_name, 'unique_value_name_another');

  await db.close();
});

test.serial('upsertDocPromise into non-empty database with match', async t => {
  const db = await getDatabaseAfterOneInsertion();
  const documentsBefore = await db.collection('collection_name').find({}).toArray();
  t.is(documentsBefore.length, 1, 'only one document');
  t.is(documentsBefore[0].index_name, 'unique_value_name');
  t.is(documentsBefore[0].additional_field, undefined);

  const input = {
    db,
    collection: 'collection_name',
    pattern: {index_name: 'unique_value_name'},
    doc: {
      index_name: 'unique_value_name',
      additional_field: 'additional_field_name',
    },
  };
  const object = await Target.upsertDocPromise(input);
  t.deepEqual(Objects.filterKeys(object, ['db', 'collection', 'pattern', 'doc', 'result']), object, 'object only has these fields');
  t.deepEqual(object.db, db);
  t.is(object.collection, 'collection_name');
  t.deepEqual(object.pattern, {index_name: 'unique_value_name'});
  t.deepEqual(object.doc, {
    index_name: 'unique_value_name',
    additional_field: 'additional_field_name',
  });
  t.deepEqual(object.result.result.ok, 1);

  const documentsAfter = await db.collection('collection_name').find({}).toArray();
  t.is(documentsAfter.length, 1, 'only one document');
  t.is(documentsAfter[0].index_name, 'unique_value_name');
  t.is(documentsAfter[0].additional_field, 'additional_field_name');

  await db.close();
});

const getDatabaseAfterTwoInsertions = async () => {
  const db = await getDatabaseAfterOneInsertion();
  const input = {
    db,
    collection: 'collection_name',
    doc: {
      index_name: 'unique_value_name_another',
      additional_field: 'additional_field_name_another',
    },
  };
  return (await Target.insertDocPromise(input)).db;
};

test.serial('DatabaseTest: getDatabaseAfterTwoInsertions', async t => {
  const db = await getDatabaseAfterTwoInsertions();
  const collections = (await db.collections())
    .filter(({namespace}) => namespace !== 'persist_pomodoro_DatabaseTest.system.indexes');
  t.is(collections.length, 1, 'only one collection');
  t.is(collections[0].namespace, 'persist_pomodoro_DatabaseTest.collection_name', 'collection name is correct');

  t.deepEqual(
    await db.collection('collection_name').indexInformation(),
    { _id_: [ [ '_id', 1 ] ], index_name_1: [ [ 'index_name', 1 ] ] },
    'index information is correct'
  );

  const documents = await db.collection('collection_name').find({}).toArray();
  t.is(documents.length, 2, 'exactly two document');
  t.is(documents[0].index_name, 'unique_value_name');
  t.is(documents[0].additional_field, undefined);
  t.is(documents[1].index_name, 'unique_value_name_another');
  t.is(documents[1].additional_field, 'additional_field_name_another');

  await db.close();
});

test.serial('deleteManyPromise in empty database', async t => {
  const db = await getDatabaseWithIndex();
  const documentsBefore = await db.collection('collection_name').find({}).toArray();
  t.is(documentsBefore.length, 0, 'only one document');

  const input = {
    db,
    collection: 'collection_name',
    pattern: {},
  };
  const object = await Target.deleteManyPromise(input);
  t.deepEqual(Objects.filterKeys(object, ['db', 'collection', 'pattern', 'result']), object, 'object only has these fields');
  t.deepEqual(object.db, db);
  t.is(object.collection, 'collection_name');
  t.deepEqual(object.pattern, {});
  t.deepEqual(object.result.result.ok, 1);
  t.deepEqual(object.result.result.n, 0, 'deleted 0');
  t.deepEqual(object.result.deletedCount, 0, 'deleted 0');

  const documentsAfter = await db.collection('collection_name').find({}).toArray();
  t.is(documentsAfter.length, 0, 'only one document');

  await db.close();
});

test.serial('deleteManyPromise in non-empty database with no match', async t => {
  const db = await getDatabaseAfterTwoInsertions();
  const documentsBefore = await db.collection('collection_name').find({}).toArray();
  t.is(documentsBefore.length, 2, 'exactly two document');
  t.is(documentsBefore[0].index_name, 'unique_value_name');
  t.is(documentsBefore[0].additional_field, undefined);
  t.is(documentsBefore[1].index_name, 'unique_value_name_another');
  t.is(documentsBefore[1].additional_field, 'additional_field_name_another');

  const input = {
    db,
    collection: 'collection_name',
    pattern: {
      index_name: 'unique_value_name_mismatch',
    },
  };
  const object = await Target.deleteManyPromise(input);
  t.deepEqual(Objects.filterKeys(object, ['db', 'collection', 'pattern', 'result']), object, 'object only has these fields');
  t.deepEqual(object.db, db);
  t.is(object.collection, 'collection_name');
  t.deepEqual(object.pattern, {index_name: 'unique_value_name_mismatch'});
  t.deepEqual(object.result.result.ok, 1);
  t.deepEqual(object.result.result.n, 0, 'deleted 0');
  t.deepEqual(object.result.deletedCount, 0, 'deleted 0');

  const documentsAfter = await db.collection('collection_name').find({}).toArray();
  t.is(documentsAfter.length, 2, 'exactly two document');
  t.is(documentsAfter[0].index_name, 'unique_value_name');
  t.is(documentsAfter[0].additional_field, undefined);
  t.is(documentsAfter[1].index_name, 'unique_value_name_another');
  t.is(documentsAfter[1].additional_field, 'additional_field_name_another');

  await db.close();
});

test.serial('deleteManyPromise in non-empty database with one match', async t => {
  const db = await getDatabaseAfterTwoInsertions();
  const documentsBefore = await db.collection('collection_name').find({}).toArray();
  t.is(documentsBefore.length, 2, 'exactly two document');
  t.is(documentsBefore[0].index_name, 'unique_value_name');
  t.is(documentsBefore[0].additional_field, undefined);
  t.is(documentsBefore[1].index_name, 'unique_value_name_another');
  t.is(documentsBefore[1].additional_field, 'additional_field_name_another');

  const input = {
    db,
    collection: 'collection_name',
    pattern: {
      index_name: 'unique_value_name',
    },
  };
  const object = await Target.deleteManyPromise(input);
  t.deepEqual(Objects.filterKeys(object, ['db', 'collection', 'pattern', 'result']), object, 'object only has these fields');
  t.deepEqual(object.db, db);
  t.is(object.collection, 'collection_name');
  t.deepEqual(object.pattern, {index_name: 'unique_value_name'});
  t.deepEqual(object.result.result.ok, 1);
  t.deepEqual(object.result.result.n, 1, 'deleted 1');
  t.deepEqual(object.result.deletedCount, 1, 'deleted 1');

  const documentsAfter = await db.collection('collection_name').find({}).toArray();
  t.is(documentsAfter.length, 1, 'exactly one document');
  t.is(documentsAfter[0].index_name, 'unique_value_name_another');
  t.is(documentsAfter[0].additional_field, 'additional_field_name_another');

  await db.close();
});

test.serial('deleteManyPromise in non-empty database with * match', async t => {
  const db = await getDatabaseAfterTwoInsertions();
  const documentsBefore = await db.collection('collection_name').find({}).toArray();
  t.is(documentsBefore.length, 2, 'exactly two document');
  t.is(documentsBefore[0].index_name, 'unique_value_name');
  t.is(documentsBefore[0].additional_field, undefined);
  t.is(documentsBefore[1].index_name, 'unique_value_name_another');
  t.is(documentsBefore[1].additional_field, 'additional_field_name_another');

  const input = {
    db,
    collection: 'collection_name',
    pattern: {},
  };
  const object = await Target.deleteManyPromise(input);
  t.deepEqual(Objects.filterKeys(object, ['db', 'collection', 'pattern', 'result']), object, 'object only has these fields');
  t.deepEqual(object.db, db);
  t.is(object.collection, 'collection_name');
  t.deepEqual(object.pattern, {});
  t.deepEqual(object.result.result.ok, 1);
  t.deepEqual(object.result.result.n, 2, 'deleted 2');
  t.deepEqual(object.result.deletedCount, 2, 'deleted 2');

  const documentsAfter = await db.collection('collection_name').find({}).toArray();
  t.is(documentsAfter.length, 0, 'no document');

  await db.close();
});

test.serial('allDocsInCollectionToString for empty collection', async t => {
  const db = await getDatabaseAfterTwoInsertions();
  await Target.allDocsInCollectionToString(
    'collection_name_mismatch',
    result => t.is(result, 'All docs in collection collection_name_mismatch :', 'no documents')
  )
  await db.close();
});

test.serial('allDocsInCollectionToString for collection with docs', async t => {
  const db = await getDatabaseAfterTwoInsertions();
  await Target.allDocsInCollectionToString(
    'collection_name',
    result => {
      const lines = result.split('\n');
      t.is(lines.length, 3, 'one title and two documents');
      t.is(lines[0], 'All docs in collection collection_name :');
      const document1 = JSON.parse(lines[1]);
      t.is(document1.index_name, 'unique_value_name');
      const document2 = JSON.parse(lines[2]);
      t.is(document2.index_name, 'unique_value_name_another');
      t.is(document2.additional_field, 'additional_field_name_another');
    }
  );
  await db.close();
});

test.serial('resetCollection', async t => {
  const db = await getDatabaseAfterTwoInsertions();
  const documentsBefore = await db.collection('collection_name').find({}).toArray();
  t.is(documentsBefore.length, 2, 'exactly two document');
  t.is(documentsBefore[0].index_name, 'unique_value_name');
  t.is(documentsBefore[0].additional_field, undefined);
  t.is(documentsBefore[1].index_name, 'unique_value_name_another');
  t.is(documentsBefore[1].additional_field, 'additional_field_name_another');

  await Target.resetCollection('collection_name');

  const documentsAfter = await db.collection('collection_name').find({}).toArray();
  t.is(documentsAfter.length, 0, 'no document');
  await db.close();
});

test.serial('initialize', async t => {
  const db = await getCleanDatabase();
  t.deepEqual(await db.collections(), [], 'no collections');

  await Target.initialize();

  const collections = (await db.collections())
    .filter(({namespace}) => namespace !== 'persist_pomodoro_DatabaseTest.system.indexes');
  t.is(collections.length, 1, 'exactly two collections');
  const namespaces = collections.map(collection => collection.namespace);
  t.true(namespaces.indexOf('persist_pomodoro_DatabaseTest.users') !== -1);
  t.deepEqual(await db.collection('users').indexInformation(), { _id_: [ [ '_id', 1 ] ], username_1: [ [ 'username', 1 ] ] });
  t.deepEqual(await db.collection('users').find({}).toArray(), [], 'no documents');
  await db.close();
});
