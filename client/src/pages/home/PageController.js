const PageController = {

  render: ({state, renderButtons, renderTimer}) => {
    if (state && state.minutes) {
      return renderTimer();
    } else {
      return renderButtons();
    }
  },

  // TODO: extract time calculation to src/common/DateAndTime.js
  getTimerString: ({state: {minutes, time}}) => {
    const endTime = new Date(new Date('01/01/1970 00:' + minutes + ':00').getTime() + Number.parseInt(time));
    const diff = new Date(endTime.getTime() - (new Date()).getTime());
    return diff.getMinutes() + ':' + diff.getSeconds();
  },

};

export default PageController;
