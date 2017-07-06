import Utils from '../common/Utils';

const HelloHandler = {

  hello: (data, callback) => {
    callback({success: true});
  },

  getHandler: () => Utils.getHandler(HelloHandler.hello, '/Hello'),

};

export default HelloHandler;
