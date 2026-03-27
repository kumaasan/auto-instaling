Bot automatyzuje sesje na instaling.pl przy użyciu Puppeteera (symulacja przeglądarki). Bot jest w stanie robić słówka w każdym języku, nie tylko niemieckim.

---

## 📋 Wymagania aby używać skryptu

- Node.js >= 22
    
- npm (instalowany razem z Node.js)
    
- Konto na instaling.pl
    

> ⚠️ Przy pierwszej instalacji `puppeteer` pobierze Chromium — może to potrwać kilka minut.

---

## 🚀 Instalacja bota

Upewnij się, że masz Node.js w wersji 22 lub większej:

```bash
git clone https://github.com/kumaasan/auto-instaling.git

cd auto-instaling

npm install
```

---

## ▶️ Uruchomienie

```bash
node index.js
```

---

## ⚙️ Konfiguracja

Przed uruchomieniem upewnij się, że:

- podałeś dane logowania (login i hasło) w odpowiednim miejscu w kodzie. Chcę zaznaczyć, że name w tym momencie jest tylko dla ułatwienia identyfikować czyja sesja aktualnie się robi gdy skrypt jest wykonywany dla wielu użytkowników  
```js
const users = [
	{ login: "", password: "", name: ""}
]
```

## 🌐 Konfiguracja przeglądarki:
w kodzie jest to przedstawione w  ==executablePath== :
```js
const browser = await puppeteer.launch({  
  headless: false,  
  defaultViewport: null,  
  args: ["--start-maximized", "--mute-audio"],  
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"  
});
```

**macOS:**

```
/Applications/Google Chrome.app/Contents/MacOS/Google Chrome
```

**Windows:**

```
C:\Program Files\Google\Chrome\Application\chrome.exe
```

**Linux:**

```
/usr/bin/google-chrome
```

⚠️ Jeśli nie ustawisz poprawnej ścieżki, bot się nie uruchomi.

---

## 📦 Użyte technologie

- Node.js
    
- puppeteer – automatyzacja przeglądarki
    
- chalk – kolorowanie outputu w terminalu
    

---

## ❗ Uwagi

- Bot symuluje działanie użytkownika w przeglądarce
    
- Używaj na własną odpowiedzialność (zgodnie z regulaminem instaling.pl)
    
- Możliwe zmiany na stronie instaling.pl mogą zepsuć działanie bota
    

---

## 🛠️ Troubleshooting

**Problem:** Bot nie działa / strona się nie ładuje  
➡️ Spróbuj:

- zaktualizować dependencies: `npm install`
- sprawdzić wersję Node.js: `node -v`
- uruchomić ponownie skrypt
- sprawdzić czy na stronie instaling.pl nie zmieniły się klasy lub ID elementów

