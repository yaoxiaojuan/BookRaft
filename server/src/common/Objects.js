const Objects = {

  containsAllKeys: (object, keys) => keys.reduce(
    (containsAllKeys, key) => containsAllKeys && object[key] !== undefined,
    true
  ),

  filterKeys: (object, keys) => {
    const result = {};
    keys.forEach(key => {
      if (object[key] !== undefined) {
        result[key] = object[key]
      }
    });
    return result;
  },

};

export default Objects;
