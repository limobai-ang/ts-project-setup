const debounce = (fn: Function, delay: number) => {
  let timer: number
  return function (this: any, ...args: any[]) {
    let context = this;
    clearTimeout(timer);
    timer = window.setTimeout(function () {
      fn.apply(context, args);
    }, delay);
  };
};

const _ResizeObserver = window.ResizeObserver;
window.ResizeObserver = class ResizeObserver extends _ResizeObserver {
  constructor(callback: ResizeObserverCallback) {
    const debouncedCallback = debounce(callback, 16);
    super(debouncedCallback);
  }
};