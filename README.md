# hirdetesi-parameterek-atadasa
segít, hogy a hirdetési paraméterek ne vesszenek el soha

🚀 Intelligens marketing paraméter továbbító script, amely automatikusan átviszi a tracking paramétereket a checkout (fizetési) oldalakra, megőrizve a fontos conversion tracking adatokat.
✨ Főbb funkciók

🎯 Intelligens prioritásos rendszer - Sosem vesznek el a fontos tracking ID-k
📧 Email marketing kompatibilis - Cookie-alapú paraméter megőrzés
⚡ Teljesítmény optimalizált - Minimális overhead, gyors futás
🔒 Biztonságos - Nem zavarják meg más JavaScript kódok
🌐 Multi-platform támogatás - Google, Meta, TikTok, LinkedIn, stb.

🎬 Hogyan működik

Első látogatás (pl. Facebook hirdetésből):
https://landing.com?fbclid=ABC123&utm_source=facebook

Email visszajuttatás (később):
https://landing.com?utm_source=email&utm_campaign=newsletter

Checkout link automatikus díszítése:
https://checkout.com/buy?fbclid=ABC123&utm_source=email&utm_campaign=newsletter


✅ Facebook tracking ID megmaradt!
✅ Email kampány adatok frissültek!
📋 Támogatott tracking paraméterek
🔒 Prioritásos paraméterek (sosem íródnak felül):

Google Ads: gclid, gclsrc, gbraid, wbraid
Meta (Facebook/Instagram): fbclid, fbp, fbc
TikTok: ttclid
LinkedIn: li_fat_id
Microsoft Bing: msclkid
Twitter: twclid

🔄 Frissíthető paraméterek:

UTM paraméterek: utm_source, utm_medium, utm_campaign, utm_term, utm_content
Custom paraméterek: Bármilyen egyedi paraméter

🛠️ Telepítés
1. Alapkonfiguráció
A script elején add meg a checkout domain(ek)et:
javascriptvar CHECKOUT_HOSTS = [
  'f.bartfaibalazs.hu',
  'sf.salesform.hu'
];
2. HTML-be beillesztés
html<head>
  <!-- Egyéb head tartalom -->
  <script>
    (function(){
      // Itt a teljes script kód
    })();
  </script>
</head>
3. Kész! 🎉
A script automatikusan:

Kinyeri az URL paramétereket
Elmenti cookie-kba (90 napra)
Díszíti a checkout linkeket
Kezeli a navigációs metódusokat

⚙️ Testreszabás
Checkout domainok hozzáadása
javascriptvar CHECKOUT_HOSTS = [
  'checkout1.com',
  'checkout2.com',
  'payment.example.com'
];
Prioritásos paraméterek módosítása
javascriptvar PRIORITY_PARAMS = [
  'gclid', 'fbclid', 'ttclid', // Alapértelmezett
  'custom_id', 'affiliate_id'  // Egyedi hozzáadás
];
📊 Teljesítmény

Inicializálás: < 1ms
Link díszítés: < 5ms (100 linknél)
Memory footprint: < 10KB
Korai kilépés: Ha nincsenek paraméterek, nulla overhead

🔧 Fejlett funkciók
Automatikus navigáció kezelés

window.open() felülírása
location.assign() felülírása
location.replace() felülírása
location.href setter felülírása

Cookie management

90 napos lejárat
Automatikus encoding/decoding
Ütközés kezelés

Event-based backup

Click listener backup
Capture phase event handling
Dupla díszítés elkerülése

🤝 Kompatibilitás
Támogatott böngészők

Chrome 60+
Firefox 55+
Safari 12+
Edge 79+

Framework kompatibilitás

✅ Vanilla JavaScript
✅ jQuery
✅ Bootstrap
⚠️ React/Vue/Angular (korlátozott SPA támogatás)

🐛 Hibakezelés
A script robust hibakezelést tartalmaz:

URL parsing hibák kezelése
Cookie írási hibák kezelése
DOM manipulation hibák kezelése
Graceful degradation

📈 Használati esetek
E-commerce
javascript// Termék oldalon
<a href="https://checkout.com/product-1">Vásárlás</a>
// Automatikusan lesz:
// https://checkout.com/product-1?fbclid=123&utm_source=facebook
Lead generation
javascript// Landing oldalon
<a href="https://forms.com/signup">Regisztráció</a>
// Automatikusan átviszi a tracking paramétereket
Multi-step funnels
javascript// Többlépcsős folyamatban minden lépésnél megtartja a paramétereket
🚀 Következő lépések

Tesztelés: Próbáld ki különböző forgatókönyvekkel
Monitorozás: Ellenőrizd a conversion tracking-et
Optimalizálás: Finomhangold a prioritásos paramétereket

📝 Changelog
v1.0.0

Alapvető URL paraméter továbbítás
Cookie-alapú perzisztencia
Checkout link díszítés

v2.0.0

Teljesítmény optimalizálás
Intelligens prioritásos rendszer
Email marketing kompatibilitás
Hibakezelés javítása

📄 Licenc
MIT License - Szabadon használható kereskedelmi projektekben is.
💡 Tippek

Tesztelés: Használd a böngésző Developer Tools-t a paraméterek ellenőrzésére
Debugging: Nézd meg a cookie-kat az Application tab-ban
Teljesítmény: Helyezd a script-et a <head> végére az optimális sebességért


Készítette: SalesForm.hu az Optimalizált marketing tracking megoldásokért 🎯
