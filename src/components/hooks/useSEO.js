import { useEffect } from 'react';

const BASE_URL = 'https://allplayuf.se';
const DEFAULT_TITLE = 'AllPlay UF – Fotbollsmatchmaking i Sverige';
const DEFAULT_DESC = 'Hitta och skapa fotbollsmatcher nära dig. Anslut till spelare i din stad och boka planer direkt via AllPlay UF.';

export function useSEO({ title, description, canonicalPath } = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} | AllPlay UF` : DEFAULT_TITLE;
    const desc = description || DEFAULT_DESC;
    const canonical = BASE_URL + (canonicalPath || window.location.pathname);

    document.title = fullTitle;

    setMeta('name', 'description', desc);
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:url', canonical);
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', desc);
    setLink('canonical', canonical);

    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title, description, canonicalPath]);
}

function setMeta(attrKey, attrVal, content) {
  let el = document.querySelector(`meta[${attrKey}="${attrVal}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrKey, attrVal);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel, href) {
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}
