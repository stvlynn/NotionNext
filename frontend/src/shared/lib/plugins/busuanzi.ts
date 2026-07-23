/* eslint-disable */
type ReadyCallback = (this: Document) => void
type BusuanziData = Record<string, string>
type LegacyDocument = Document & {
  attachEvent?: (event: string, callback: () => void) => void
  detachEvent?: (event: string, callback: () => void) => void
}
type LegacyElement = HTMLElement & {
  doScroll?: (direction: string) => void
}

let bszCaller: {
  fetch: (url: string, callback: (data: BusuanziData) => void) => void
  evalCall: (
    callback: (data: BusuanziData) => void
  ) => (data: BusuanziData) => void
}
let bszTag: {
  bszs: string[]
  texts: (data: BusuanziData) => void
  hides: () => void
  shows: () => void
}
let scriptTag: HTMLScriptElement | null = null
let ready: (callback: ReadyCallback) => Document | undefined = () => undefined
let intervalId: ReturnType<typeof setInterval> | null = null;
let executeCallbacks: () => void = () => {};
let onReady: () => void = () => {};
let isReady = false;
let callbacks: ReadyCallback[] = [];

// 修复Node同构代码的问题
if (typeof document !== 'undefined') {
  ready = function (callback: ReadyCallback) {
    if (isReady || document.readyState === 'interactive' || document.readyState === 'complete') {
      callback.call(document);
    } else {
      callbacks.push(function (this: Document) {
        return callback.call(this);
      });
    }
    return document;
  };

  executeCallbacks = function () {
    for (let i = 0, len = callbacks.length; i < len; i++) {
      callbacks[i]?.apply(document);
    }
    callbacks = [];
  };

  onReady = function () {
    const legacyDocument = document as LegacyDocument
    if (!isReady) {
      isReady = true;
      executeCallbacks.call(window);
      if (document.removeEventListener) {
        document.removeEventListener('DOMContentLoaded', onReady, false);
      } else if (legacyDocument.attachEvent) {
        legacyDocument.detachEvent?.('onreadystatechange', onReady);
        if (window == window.top) {
          if (intervalId !== null) clearInterval(intervalId);
          intervalId = null;
        }
      }
    }
  };

  if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', onReady, false);
  } else if ((document as LegacyDocument).attachEvent) {
    (document as LegacyDocument).attachEvent?.('onreadystatechange', function () {
      if (/loaded|complete/.test(document.readyState)) {
        onReady();
      }
    });
    if (window == window.top) {
      intervalId = setInterval(function () {
        try {
          if (!isReady) {
            (document.documentElement as LegacyElement).doScroll?.('left');
          }
        } catch (e) {
          return;
        }
        onReady();
      }, 5);
    }
  }
}

bszCaller = {
  fetch: function (url: string, callback: (data: BusuanziData) => void) {
    const callbackName = 'BusuanziCallback_' + Math.floor(1099511627776 * Math.random())
    url = url.replace('=BusuanziCallback', '=' + callbackName)
    const tag = document.createElement('script');
    tag.type = 'text/javascript';
    tag.defer = true;
    tag.src = url;
    tag.referrerPolicy = "no-referrer-when-downgrade";
    scriptTag = tag;
    document.getElementsByTagName('HEAD')[0]?.appendChild(tag);
    ;(window as unknown as Record<string, unknown>)[callbackName] = this.evalCall(callback)
  },
  evalCall: function (callback: (data: BusuanziData) => void) {
    return function (data: BusuanziData) {
      ready(function () {
        try {
          callback(data);
          if (scriptTag && scriptTag.parentElement && scriptTag.parentElement.contains(scriptTag)) {
            scriptTag.parentElement.removeChild(scriptTag);
          }
        } catch (e) {
          // console.log(e);
          // bszTag.hides();
        }
      })
    }
  }
}

const fetchBusuanzi = () => {
  if (bszTag) {
    bszTag.hides();
  }
  bszCaller.fetch('//busuanzi.ibruce.info/busuanzi?jsonpCallback=BusuanziCallback', function (data: BusuanziData) {
    // console.log('不蒜子',data)
    bszTag.texts(data);
    bszTag.shows();
  })
}

bszTag = {
  bszs: ['site_pv', 'page_pv', 'site_uv'],
  texts: function (data: BusuanziData) {
    this.bszs.map(function (key: string) {
      const elements = document.getElementsByClassName('busuanzi_value_' + key)
      if (elements) {
        for (const element of Array.from(elements)) {
          element.innerHTML = data[key] ?? '';
        }
      }
    })
  },
  hides: function () {
    this.bszs.map(function (key: string) {
      const elements = document.getElementsByClassName('busuanzi_container_' + key)
      if (elements) {
        for (const element of Array.from(elements)) {
          if (element instanceof HTMLElement) {
            element.style.display = 'none';
          }
        }
      }
    })
  },
  shows: function () {
    this.bszs.map(function (key: string) {
      const elements = document.getElementsByClassName('busuanzi_container_' + key)
      if (elements) {
        for (const element of Array.from(elements)) {
          if (element instanceof HTMLElement) {
            element.style.display = 'inline';
          }
        }
      }
    })
  }
}

const busuanzi = {
  fetch: fetchBusuanzi
}

export { fetchBusuanzi as fetch }
export default busuanzi
