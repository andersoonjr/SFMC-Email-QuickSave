(function () {
  'use strict';

  function detectStack() {
    const hostname = window.location.hostname;

    let match = hostname.match(/^mc\.([^.]+)\.exacttarget\.com$/);
    if (match && match[1] !== 'exacttarget') {
      return match[1] + '.';
    }

    // Contas legadas mais antigas, sem stack numerado no hostname (mc.exacttarget.com puro).
    if (hostname === 'mc.exacttarget.com') {
      return 's1.';
    }

    // Contas modernas (pós-migração) são servidas em <hash>.marketingcloudapps.com,
    // um único label sem stack numerado embutido — usamos o hostname inteiro.
    match = hostname.match(/^([a-z0-9-]+)\.marketingcloudapps\.com$/i);
    if (match) {
      return hostname + '.';
    }

    try {
      if (window.parent && window.parent.location) {
        const parentHostname = window.parent.location.hostname;
        const parentMatch = parentHostname.match(/^mc\.([^.]+)\.exacttarget\.com$/);
        if (parentMatch && parentMatch[1] !== 'exacttarget') {
          return parentMatch[1] + '.';
        }
        if (parentHostname === 'mc.exacttarget.com') {
          return 's1.';
        }
        const parentModernMatch = parentHostname.match(/^([a-z0-9-]+)\.marketingcloudapps\.com$/i);
        if (parentModernMatch) {
          return parentHostname + '.';
        }
      }
    } catch (e) {
    }

    return '';
  }

  function isMarketingCloud() {
    const hostname = window.location.hostname;
    return hostname.includes('exacttarget.com') || hostname.includes('marketingcloudapps.com');
  }

  function getPageInfo() {
    return {
      url: window.location.href,
      hostname: window.location.hostname,
      pathname: window.location.pathname,
      stack: detectStack(),
      isMarketingCloud: isMarketingCloud(),
      timestamp: Date.now()
    };
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getPageInfo') {
      sendResponse(getPageInfo());
    } else if (request.action === 'detectStack') {
      sendResponse({ stack: detectStack() });
    } else if (request.action === 'isLoggedIn') {
      const isLoggedIn = document.querySelector('[data-mc-user]') !== null ||
        document.querySelector('.mc-header') !== null ||
        document.querySelector('#mc-header') !== null ||
        window.location.pathname.includes('/cloud/') ||
        window.location.pathname.includes('/contentbuilder');
      sendResponse({ isLoggedIn });
    }
    return true;
  });

  if (isMarketingCloud()) {
    chrome.runtime.sendMessage({
      action: 'pageLoaded',
      pageInfo: getPageInfo()
    }).catch(() => {
    });
  }
})();
