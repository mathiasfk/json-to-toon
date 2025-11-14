const GA_MEASUREMENT_ID = 'G-WTVHB70X77';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

const isBrowser = typeof window !== 'undefined';
const isLocalhost = 
  isBrowser &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1');

type GtagArgs = [string, ...unknown[]];

if (isBrowser) {
  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function (...args: unknown[]) {
      window.dataLayer.push(args);
    };
}

export const gtag = (...args: GtagArgs) => {
  if (!isBrowser) {
    return;
  }

  if (isLocalhost) {
    console.debug('📊 Analytics (debug):', ...args);
    return;
  }

  if (typeof window.gtag === 'function') {
    window.gtag(...args);
  } else {
    window.dataLayer.push(args);
  }
};

const appendAnalyticsScript = () => {
  if (!isBrowser || isLocalhost) {
    return;
  }

  const existing = document.querySelector<HTMLScriptElement>(
    `script[src*="googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}"]`,
  );

  if (existing) {
    return;
  }

  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script.async = true;
  script.onload = () => {
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID);
  };

  document.head.appendChild(script);
};

export const initAnalytics = () => {
  appendAnalyticsScript();
};

if (isBrowser) {
  initAnalytics();
}


