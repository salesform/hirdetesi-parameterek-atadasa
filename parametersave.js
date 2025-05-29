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
  
  // ════════════ CACHE & STATE ════════════
  var params = null; // Cache-elt paraméterek
  var hostSet = null; // Set a gyors host lookup-hoz
  var cookiesSaved = false; // Cookie mentés állapot
  var prioritySet = null; // Set a prioritásos paraméterekhez
  
  // ════════════ INIT -EGYSZER FUTÓ RÉSZ ════════════
  function init(){
    // Host set létrehozása gyors lookup-hoz
    hostSet = new Set(CHECKOUT_HOSTS);
    
    // Priority set létrehozása
    prioritySet = new Set(PRIORITY_PARAMS);
    
    // Paraméterek cache-elése és cookie-kból való kiegészítése
    params = mergeParamsWithCookies();
    
    // Ha nincsenek paraméterek, ne csináljunk semmit
    if(!Object.keys(params).length) return;
    
    // Cookie-k mentése/frissítése
    saveCookies();
    
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
    window.open = function(url){
      try{
        var u = new URL(url);
        if(isCheckoutHost(u.host)){
          return originalOpen.call(this, decorateUrl(url));
        }
      }catch(e){}
      return originalOpen.call(this, url);
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
