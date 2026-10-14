# GRYHTML

Darmowy portal z grami przeglądarkowymi HTML5. Nowoczesny dark UI, kategorie, wyszukiwanie, ulubione (LocalStorage) i odtwarzacz oparty o iframe z katalogu [GameMonetize](https://gamemonetize.com).

**Technologia:** statyczny HTML5 + CSS3 + JavaScript ES6+ (bez bundlera, bez backendu). Gotowe do GitHub Pages.

## Funkcje

- Strona główna z sekcjami: popularne, nowe, przygodowe, akcja, mobilne, ostatnio grane
- Osobne strony kategorii (w tym wyszukiwanie po motywach Mario / Roblox / SpongeBob / Angry Birds – wyłącznie na podstawie tagów/tytułów z API)
- Wyszukiwanie z debouncingiem, sortowaniem i „Załaduj więcej”
- Ulubione i ostatnio grane w LocalStorage
- Player: `gra.html?idgry=ID` z iframe, pełnym ekranem, odświeżeniem, podobnymi grami
- Responsywność (desktop / tablet / mobile), menu hamburger
- Animacje CSS (reveal, hover) z `prefers-reduced-motion`
- Cache API w pamięci + LocalStorage (TTL 15 min)
- Brak gradientów – jednolite kolory zgodnie z design systemem

## Szybki start (lokalnie)

1. Sklonuj lub pobierz repozytorium.
2. Otwórz folder `gryhtml` w lokalnym serwerze HTTP (wymagane ze względu na CORS i `file://`):

```bash
# Python 3
cd gryhtml
python -m http.server 8080

# lub Node
npx serve .
```

3. Wejdź na `http://localhost:8080`.

> Bezpośrednie otwarcie `index.html` z dysku (`file://`) może blokować `fetch` do API.

## Wdrożenie na GitHub Pages

1. Utwórz repozytorium np. `gryhtml` na GitHub.
2. Wgraj **zawartość** folderu `gryhtml` (pliki HTML w katalogu głównym repo, nie zagnieżdżaj dodatkowego folderu, chyba że celowo hostujesz podścieżkę).
3. **Settings → Pages**:
   - Source: **Deploy from a branch**
   - Branch: `main` (lub `master`)
   - Folder: `/ (root)`
4. Zapisz. Po 1–2 minutach strona będzie pod:
   `https://TWOJ-LOGIN.github.io/gryhtml/`
5. Jeśli repozytorium nie nazywa się `gryhtml` albo hostujesz z podfolderu, wszystkie ścieżki są **względne** – działa bez zmian.

### Strona 404 na GitHub Pages

Umieść `404.html` w root – GitHub Pages automatycznie serwuje go przy nieznanych ścieżkach (w obrębie domeny projektu).

## Struktura

```
gryhtml/
├── index.html
├── kategorie.html
├── przygodowe.html, akcja.html, arcade.html, ...
├── angry-birds.html, spongebob.html, mario.html, roblox.html
├── szukaj.html
├── ulubione.html
├── gra.html
├── 404.html
├── README.md
└── assets/
    ├── css/style.css
    ├── js/
    │   ├── config.js
    │   ├── api.js
    │   ├── favorites.js
    │   ├── games.js
    │   ├── main.js
    │   ├── categories.js
    │   ├── search.js
    │   └── player.js
    └── img/favicon.svg
```

## API GameMonetize

Używane endpointy:

| Cel | URL |
|-----|-----|
| Katalog | `https://gamemonetize.com/feed.php?format=0&num=50&page=1` |
| Po ID | `https://gamemonetize.com/feed.php?format=0&id=88462` |
| Po nazwie | `https://gamemonetize.com/feed.php?format=0&name=mario&num=50&page=1` |
| Mobilne | `https://gamemonetize.com/feed.php?format=0&platform=1&num=50&page=1` |

API zwraca `Access-Control-Allow-Origin: *`, więc działa z przeglądarki bez proxy.

### Ograniczenia i CORS

- Jeśli API zwróci błąd sieciowy / 403 / pustą odpowiedź, UI pokazuje komunikat (nie udaje sukcesu).
- Przy całkowitej niedostępności katalogu na stronie głównej może pojawić się wpis demonstracyjny.
- Niektóre gry blokują osadzanie w iframe (nagłówki X-Frame-Options / CSP) – player pokazuje komunikat o błędzie.
- Nie wymyślamy dat ani rankingów popularności, jeśli API ich nie dostarcza.
- Kategorie „Mario”, „Roblox” itd. to **wyszukiwanie po frazie/tagach**, nie oficjalne licencje.

### Opcjonalne proxy (nie wymagane)

Jeśli w przyszłości CORS zostanie zaostrzony, możesz dodać Cloudflare Worker lub inny proxy. Podstawowy projekt pozostaje w pełni statyczny.

## Bezpieczeństwo

- Dane z API renderowane przez `textContent` / tworzenie elementów DOM (bez surowego `innerHTML` z API).
- Identyfikatory gier walidowane (alfanumeryczne).
- Adresy iframe tylko z domen `*.gamemonetize.co` / `gamemonetize.com` (HTTPS).
- Parametr URL nie pozwala wstrzyknąć dowolnego źródła iframe.

## Licencja i zastrzeżenia

Kod projektu GRYHTML możesz używać i modyfikować. Gry i media należą do ich właścicieli / GameMonetize. Nazwy kategorii nawiązujące do marek służą wyłącznie do wyszukiwania w publicznym feedzie i **nie oznaczają partnerstwa**.
