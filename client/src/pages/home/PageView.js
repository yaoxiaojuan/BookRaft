import React from 'react';
import RaisedButton from 'material-ui/RaisedButton';

import Controller from './PageController';
import Styles from './PageStyles.css';
import Session from '../../common/Session';

export default class PageView extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
    };
    this.getTimer();
  };

  onClick = (minutes) => this.setTimer(minutes);

  setTimer = minutes => {
    fetch('http://127.0.0.1:2039/SetTimer', {
      method: 'POST',
      body: 'token=' + (Session.getToken() || '') +
        '&minutes=' + minutes,
    })
    .then(response => response.json())
    .then((responseJson) => {
      if (responseJson.success) {
        Session.setToken(responseJson.token);
        this.setState({
          minutes: responseJson.minutes,
          time: responseJson.time,
        });
      }
    })
  };

  getTimer = minutes => {
    fetch('http://127.0.0.1:2039/GetTimer', {
      method: 'POST',
      body: 'token=' + (Session.getToken() || ''),
    })
    .then(response => response.json())
    .then((responseJson) => {
      if (responseJson.success && responseJson.time !== 'undefined' && responseJson.minutes !== 'undefined') {
        Session.setToken(responseJson.token);
        this.setState({
          minutes: responseJson.minutes,
          time: responseJson.time,
        });
      }
    })
  };

  renderButtons = () => {
    return (
      <div className={Styles.wrapper}>
        <RaisedButton
          label="45 Minutes Work"
          primary={true}
          style={{margin: 12}}
          onClick={() => this.onClick(45)}
          />
        <RaisedButton
          label="5 Minutes Break"
          secondary={true}
          style={{margin: 12}}
          onClick={() => this.onClick(5)}
        />
        <RaisedButton
          label="15 Minutes Break"
          secondary={true}
          style={{margin: 12}}
          onClick={() => this.onClick(15)}
          />
      </div>
    );
  };

  renderTimer = () => (
    <div className={Styles.timerWrapper}>
      {Controller.getTimerString(this)}
    </div>
  );

  render = () => Controller.render(this);

}
