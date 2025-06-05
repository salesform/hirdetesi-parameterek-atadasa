<script>
(function(){
  'use strict';
  // ════════════ CONFIG ════════════
  var CHECKOUT_HOSTS = [
    'f.bartfaibalazs.hu',
    'sf.salesform.hu'
  ];
  
  // PRIORITÁSOS PARAMÉTEREK - ezeket SOHA nem írjuk felül
  var PRIORITY_PARAMS = [
    // Google Ads
    'gclid', 'gclsrc', 'gbraid', 'wbraid',
    // Meta (Facebook/Instagram)
    'fbclid', 'fbp', 'fbc',
    // TikTok
    'ttclid', 
    // LinkedIn
    'li_fat_id',
    // Microsoft/Bing
    'msclkid',
    // Twitter
    'twclid'
  ];
  
  // UTM PARAMÉTEREK - ezeket kitöltjük a formokban
  var UTM_PARAMS = [
    'utm_source', 'utm_medium', 'utm_campaign', 
    'utm_content', 'utm_term', 'utm_id'
  ];
  
  // ════════════ CACHE & STATE ════════════
  var params = null; // Cache-elt paraméterek
  var hostSet = null; // Set a gyors host lookup-hoz
  var cookiesSaved = false; // Cookie mentés állapot
  var prioritySet = null; // Set a prioritásos paraméterekhez
  var utmSet = null; // Set az UTM paraméterekhez
  var processedFields = new WeakSet(); // Már feldolgozott mezők nyilvántartása
  
  // ════════════ INIT - EGYSZER FUTÓ RÉSZ ════════════
  function init(){
    // Host set létrehozása gyors lookup-hoz
    hostSet = new Set(CHECKOUT_HOSTS);
    
    // Priority set létrehozása
    prioritySet = new Set(PRIORITY_PARAMS);
    
    // UTM set létrehozása
    utmSet = new Set(UTM_PARAMS);
    
    // Paraméterek cache-elése és cookie-kból való kiegészítése
    params = mergeParamsWithCookies();
    
    // Ha nincsenek paraméterek, ne csináljunk semmit
    if(!Object.keys(params).length) return;
    
    // Cookie-k mentése/frissítése
    saveCookies();
    
    // UTM form kitöltés
    fillUtmForms();
    
    // Dinamikus formok figyelése
    observeNewForms();
    
    // Extra biztonság - újra kitöltjük 2 másodperc múlva
    setTimeout(fillUtmForms, 2000);
    
    // Linkek díszítése
    decorateExistingLinks();
    
    // Navigációs metódusok felülírása
    overrideNavMethods();
    
    // Click listener hozzáadása
    addClickListener();
  }
  
  // ════════════ UTILS ════════════
  function getParams(){
    if(!location.search) return {};
    
    var out = {};
    var parts = location.search.slice(1).split('&');
    
    for(var i = 0; i < parts.length; i++){
      if(!parts[i]) continue;
      var eq = parts[i].indexOf('=');
      var key = eq > -1 ? decodeURIComponent(parts[i].slice(0, eq)) : decodeURIComponent(parts[i]);
      var val = eq > -1 ? decodeURIComponent(parts[i].slice(eq + 1)) : '';
      if(key) out[key] = val;
    }
    return out;
  }
  
  function getCookieParams(){
    var cookies = {};
    if(!document.cookie) return cookies;
    
    var cookieArray = document.cookie.split(';');
    for(var i = 0; i < cookieArray.length; i++){
      var cookie = cookieArray[i].trim();
      var eq = cookie.indexOf('=');
      if(eq > -1){
        var key = cookie.slice(0, eq);
        var val = decodeURIComponent(cookie.slice(eq + 1));
        cookies[key] = val;
      }
    }
    return cookies;
  }
  
  function mergeParamsWithCookies(){
    var urlParams = getParams();
    var cookieParams = getCookieParams();
    
    var merged = {};
    
    // 1. Először minden cookie paramétert átveszünk
    for(var key in cookieParams){
      merged[key] = cookieParams[key];
    }
    
    // 2. URL paraméterek feldolgozása intelligens prioritással
    for(var key in urlParams){
      // Ha prioritásos paraméter van cookie-ban, NEM írjuk felül
      if(prioritySet.has(key) && cookieParams[key]){
        // Megtartjuk a cookie értéket, nem írjuk felül
        continue;
      }
      // Minden más paramétert frissítünk az URL-ből
      merged[key] = urlParams[key];
    }
    
    return merged;
  }
  
  function saveCookies(){
    if(cookiesSaved) return;
    var expires = new Date(Date.now() + 90 * 864e5).toUTCString();
    for(var k in params){
      document.cookie = k + '=' + encodeURIComponent(params[k]) + ';path=/;expires=' + expires;
    }
    cookiesSaved = true;
  }
  
  function decorateUrl(href){
    try{
      var u = new URL(href);
      for(var k in params){
        if(!u.searchParams.has(k)) u.searchParams.set(k, params[k]);
      }
      return u.toString();
    }catch(e){
      return href;
    }
  }
  
  function isCheckoutHost(host){
    return hostSet.has(host);
  }
  
  // ════════════ OPTIMALIZÁLT UTM FORM FILLING ════════════
  function getUtmParamFromField(field) {
    // Megvizsgáljuk a field különböző attribútumait és meghatározzuk, melyik UTM paraméterhez tartozik
    var attributes = [
      field.name || '',
      field.id || '',
      field.className || '',
      field.getAttribute('data-utm') || '',
      field.getAttribute('data-field') || '',
      field.getAttribute('placeholder') || ''
    ].join(' ').toLowerCase();
    
    // UTM paraméterek keresése az attribútumokban
    for(var i = 0; i < UTM_PARAMS.length; i++){
      var param = UTM_PARAMS[i];
      var paramVariants = [
        param,                           // utm_source
        param.replace(/_/g, '-'),        // utm-source
        param.replace(/_/g, ''),         // utmsource
        param.replace(/^utm_/, ''),      // source
        param.replace(/^utm_/, '').replace(/_/g, '-') // source (ha lenne underscore)
      ];
      
      for(var j = 0; j < paramVariants.length; j++){
        if(attributes.includes(paramVariants[j])){
          return param;
        }
      }
    }
    
    return null;
  }
  
  function fillUtmForms(){
    // Egy lépésben megkeressük az összes potenciális UTM mezőt
    var allInputs = document.querySelectorAll('input[type="hidden"], input[type="text"], input[type="email"], input:not([type])');
    var fieldMap = {}; // param -> [fields] mapping
    var filledCount = 0;
    
    // UTM paraméterek inicializálása
    UTM_PARAMS.forEach(function(param){
      fieldMap[param] = [];
    });
    
    // Végigmegyünk az összes input mezőn egyszer
    for(var i = 0; i < allInputs.length; i++){
      var field = allInputs[i];
      
      // Skip ha már feldolgoztuk ezt a mezőt
      if(processedFields.has(field)) continue;
      
      // Meghatározzuk, melyik UTM paraméterhez tartozik (ha egyáltalán)
      var utmParam = getUtmParamFromField(field);
      
      if(utmParam && params[utmParam]){
        // Csak akkor töltjük ki, ha üres, rejtett, vagy explicit UTM mező
        var shouldFill = !field.value || 
                        field.type === 'hidden' || 
                        field.hasAttribute('data-utm') ||
                        field.hasAttribute('data-field');
        
        if(shouldFill){
          field.value = params[utmParam];
          filledCount++;
          
          // Esemény triggerelése a form library-k számára
          triggerInputEvent(field);
          
          // Megjelöljük feldolgozottként
          processedFields.add(field);
        }
      }
    }
    
    if(filledCount > 0){
      console.log('UTM tracking: ' + filledCount + ' mező kitöltve');
    }
  }
  
  function triggerInputEvent(field){
    try {
      // Modern böngészőkhöz
      var inputEvent = new Event('input', {bubbles: true});
      var changeEvent = new Event('change', {bubbles: true});
      field.dispatchEvent(inputEvent);
      field.dispatchEvent(changeEvent);
    } catch(e) {
      // Fallback régebbi böngészőkhöz
      try {
        var inputEvent = document.createEvent('Event');
        inputEvent.initEvent('input', true, true);
        field.dispatchEvent(inputEvent);
        
        var changeEvent = document.createEvent('Event');
        changeEvent.initEvent('change', true, true);
        field.dispatchEvent(changeEvent);
      } catch(e2) {
        // Silent fail
      }
    }
  }
  
  function observeNewForms(){
    if(!window.MutationObserver) return;
    
    var observer = new MutationObserver(function(mutations){
      var shouldCheck = false;
      
      mutations.forEach(function(mutation){
        if(mutation.type === 'childList' && mutation.addedNodes.length > 0){
          for(var i = 0; i < mutation.addedNodes.length; i++){
            var node = mutation.addedNodes[i];
            if(node.nodeType === 1){ // Element node
              // Ellenőrizzük, hogy van-e benne form vagy input
              if(node.tagName === 'FORM' || 
                 node.tagName === 'INPUT' ||
                 (node.querySelector && node.querySelector('form, input'))){
                shouldCheck = true;
                break;
              }
            }
          }
        }
      });
      
      if(shouldCheck){
        // Debounce - csak 500ms után futtatjuk
        clearTimeout(observer.timeout);
        observer.timeout = setTimeout(fillUtmForms, 500);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  // ════════════ DOM MANIPULATION ════════════
  function decorateExistingLinks(){
    var links = document.getElementsByTagName('a'); // Gyorsabb mint querySelectorAll
    
    for(var i = 0; i < links.length; i++){
      var link = links[i];
      if(!link.href) continue;
      
      try{
        var u = new URL(link.href);
        if(isCheckoutHost(u.host)){
          link.href = decorateUrl(link.href);
        }
      }catch(e){}
    }
  }
  
  // ════════════ EVENT HANDLERS ════════════
  function addClickListener(){
    document.addEventListener('click', function(e){
      var link = e.target.closest('a[href]');
      if(!link) return;
      
      try{
        var u = new URL(link.href);
        if(isCheckoutHost(u.host) && !link.href.includes('fbclid=')){
          link.href = decorateUrl(link.href);
        }
      }catch(e){}
    }, true);
  }
  
  // ════════════ NAVIGATION OVERRIDES ════════════
  function overrideNavMethods(){
    var originalOpen = window.open;
    window.open = function(){
      var args = Array.prototype.slice.call(arguments);
      var url = args[0];
      try{
        var u = new URL(url, location.href);
        if(isCheckoutHost(u.host)){
          args[0] = decorateUrl(url);
          return originalOpen.apply(this, args);
        }
      }catch(e){}
      return originalOpen.apply(this, args);
    };
    
    ['assign', 'replace'].forEach(function(method){
      var original = window.location[method];
      window.location[method] = function(url){
        try{
          var u = new URL(url);
          if(isCheckoutHost(u.host)){
            return original.call(this, decorateUrl(url));
          }
        }catch(e){}
        return original.call(this, url);
      };
    });
    
    // location.href override - opcionális
    try {
      Object.defineProperty(window.location, 'href', {
        set: function(url){
          try{
            var u = new URL(url);
            if(isCheckoutHost(u.host)){
              history.replaceState(null, '', decorateUrl(url));
              return;
            }
          }catch(e){}
          history.replaceState(null, '', url);
        },
        get: function(){ return location.toString(); }
      });
    } catch(e) {}
  }
  
  // ════════════ STARTUP ════════════
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // Async futtatás hogy ne blokkolja a renderelést
    setTimeout(init, 0);
  }
})();
</script>
