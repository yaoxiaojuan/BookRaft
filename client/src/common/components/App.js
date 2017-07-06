import React from 'react';

import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

export default ({children}) => {
  return (
    <MuiThemeProvider>
      <div id="container">
        {children}
      </div>
    </MuiThemeProvider>
  );
}
