import test from 'ava';
import Targt from '../../../src/pages/home/PageController';

test('render', t => {
  let renderButtonsCounter = 0;
  let renderTimerCounter = 0;
  const renderButtons = () => {
    renderButtonsCounter += 1;
    return 'from renderButtons';
  };
  const renderTimer = () => {
    renderTimerCounter += 1;
    return 'from renderTimer';
  };

  t.is(renderButtonsCounter, 0);
  t.is(renderTimerCounter, 0);
  t.is(
    Targt.render({
      state: {
        minutes: 'not empty',
      },
      renderButtons,
      renderTimer,
    }),
    'from renderTimer'
  );

  t.is(
    Targt.render({
      state: {
        minutes: '',
      },
      renderButtons,
      renderTimer,
    }),
    'from renderButtons'
  );
  t.is(renderButtonsCounter, 1);
  t.is(renderTimerCounter, 1);

  t.is(
    Targt.render({
      state: {},
      renderButtons,
      renderTimer,
    }),
    'from renderButtons'
  );
  t.is(renderButtonsCounter, 2);
  t.is(renderTimerCounter, 1);

});
