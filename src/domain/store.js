export function createStore(initialState) {
  let state = Object.freeze({ ...initialState });
  const listeners = [];

  function getState() {
    return state;
  }

  function setState(partialState) {
    state = Object.freeze({
      ...state,
      ...partialState,
    });

    listeners.forEach((listener) => listener(state));
  }

  function subscribe(listener) {
    listeners.push(listener);

    return function unsubscribe() {
      const index = listeners.indexOf(listener);
      if (index >= 0) {
        listeners.splice(index, 1);
      }
    };
  }

  return {
    getState,
    setState,
    subscribe,
  };
}
