const TOKEN_KEY = 'persist-pomodoro-token';

const Session = {

  setToken: token => {
    sessionStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_KEY, token);
  },

  getToken: () => sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY),

};

export default Session;
