# QA Automation: saucedemo (UI) + restful-booker (API)

UI E2E- і API-тести на **Playwright Test + TypeScript**, CI на GitHub Actions. Тести написані в парі з
агентом (Claude Code) за правилами, які не лише описані, а й примусово виконуються hooks і ESLint: див. [AI_WORKLOG.md](AI_WORKLOG.md).

- **UI:** [saucedemo.com](https://www.saucedemo.com), користувач `standard_user`, Chromium.
- **API:** [restful-booker](https://restful-booker.herokuapp.com).
- **Результат:** 20 активних тестів, 9 тестів відомих багів (`test.fixme`), 16 баг-репортів нижче.

## Швидкий старт

Потрібен Node.js 22+.

```bash
git clone <repo-url> && cd <repo>
npm ci
cp .env.example .env                       # публічні demo-дані saucedemo і restful-booker
npx playwright install --with-deps chromium
npm test                                   # усі тести: setup → e2e + api
npm run report                             # HTML-звіт
```

| Команда                         | Що робить                                                          |
| ------------------------------- | ------------------------------------------------------------------ |
| `npm run test:e2e` / `test:api` | лише UI / лише API                                                 |
| `npm run test:smoke`            | критичний шлях (`@smoke`)                                          |
| `npm run test:regression`       | негативні й граничні сценарії, тести відомих багів (`@regression`) |
| `npm run test:new -- <file>`    | файл 3× без retries — доказ стабільності                           |
| `npm run check`                 | ESLint + `tsc`                                                     |

## Що покрито

| Область       | Сценарій                                                                                                                   | Тег                     | Файл                                         |
| ------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------- | -------------------------------------------- |
| Логін         | валідні дані → каталог                                                                                                     | `@smoke`                | `tests/e2e/auth/login.spec.ts`               |
| Логін         | locked user, неправильний пароль, порожній username → текст помилки                                                        | `@regression`           | `tests/e2e/auth/login.spec.ts`               |
| Каталог       | 6 товарів: назва, ціна `$X.XX`, кнопка Add to cart                                                                         | `@smoke`                | `tests/e2e/catalog/catalog.spec.ts`          |
| Каталог       | details показує ту саму назву і ціну, що й каталог                                                                         | `@regression`           | `tests/e2e/catalog/catalog.spec.ts`          |
| Сортування    | 4 опції: A→Z, Z→A, ціна ↑, ціна ↓ (стартує з іншого порядку)                                                               | `@regression`           | `tests/e2e/catalog/sorting.spec.ts`          |
| Кошик         | доданий товар у кошику; бейдж рахує кожен товар                                                                            | `@smoke`, `@regression` | `tests/e2e/cart/cart.spec.ts`                |
| Checkout      | замовлення 2 товарів: позиції, item total = сума цін, 0 < tax ≤ 27%, total = item total + tax, "Thank you", кошик порожній | `@smoke`                | `tests/e2e/checkout/checkout.spec.ts`        |
| Checkout      | обов'язкові поля: порожня форма, порожній last name, порожній postal code                                                  | `@regression`           | `tests/e2e/checkout/checkout.spec.ts`        |
| API flow      | auth → create → update (3 поля) → GET → delete → GET 404                                                                   | `@api @smoke`           | `tests/api/booking/booking.spec.ts`          |
| API негативні | неправильний пароль → немає токена; update без токена → 403, дані не змінились; неіснуючий id → 404                        | `@api @regression`      | `tests/api/booking/booking-negative.spec.ts` |
| Відомі баги   | BUG-01…05 (UI), BUG-09, BUG-10 (API): тест перевіряє **правильну** поведінку і стоїть у `test.fixme` до фіксу              | `@regression`           | див. баг-репорти                             |

Кожен тест хоч раз бачили червоним на власній перевірці: застосунок ламався навмисно на тимчасовій копії spec
(`page.addInitScript`, підмінені запити, знятий `fixme`). Деталі — [docs/exploratory.md](docs/exploratory.md).

## Що свідомо не покрито

| Що                                                                                                  | Чому                                                                                        |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Інші користувачі saucedemo (`problem_user`, `performance_glitch_user`, `error_user`, `visual_user`) | Завдання вимагає `standard_user`; `locked_out_user` використано лише для негативного логіну |
| Firefox, WebKit, мобільний viewport                                                                 | Завдання не вимагає; додається одним project у `playwright.config.ts`                       |
| Visual regression, accessibility (axe), performance                                                 | Окремі види тестування з власною інфраструктурою, поза обсягом завдання                     |
| Remove з кошика, logout                                                                             | Перевірено вручну на exploratory (працює); у ліміті часу пріоритет — checkout і баги        |
| BUG-06…08, BUG-11…16 без автотестів                                                                 | Minor/Trivial або дублюють уже покритий клас помилок (валідація API); задокументовано нижче |
| `PATCH`, `GET /booking` зі фільтрами                                                                | Не входять у флоу завдання                                                                  |

## Архітектура

- `src/fixtures/index.ts` — єдина точка входу: specs імпортують `test`/`expect` лише звідси й отримують page objects, API-клієнт і дані як fixtures.
- `src/pages/` — page object на сторінку: `readonly` локатори + методи-дії, **без assertions**; спільний UI (header) — `src/components/`.
- `src/api/BookingClient.ts` — клієнт над `APIRequestContext`: сирі методи повертають `APIResponse` (для негативних тестів), `*AndParse` — типізовані дані.
- `src/data/` — builders з унікальними даними на кожен запуск; `src/config/env.ts` — єдине джерело env, падає одразу, якщо змінної немає.
- Логін один раз у `tests/auth.setup.ts` → `storageState`; setup і cleanup API-даних — у fixtures, teardown видаляє бронювання навіть після падіння.
- Локатори: `getByRole` → `getByLabel`/`getByPlaceholder` → `getByTestId` (`data-test`); перевірки відсутності — лише після якоря, що екран відмалювався.

## CI

[.github/workflows/tests.yml](.github/workflows/tests.yml): push у будь-яку гілку і pull request у `main` →
`npm ci` → `npm run check` → Chromium → `npm test`. **Звіт:** вкладка Actions → прогін → Artifacts →
`playwright-report` (14 днів; для падінь — скріншот, відео і trace повтору).

Налаштування репозиторію: Settings → Secrets and variables → Actions. Variables: `BASE_URL`, `API_URL`;
secrets: `STANDARD_USER`, `LOCKED_USER`, `USER_PASSWORD`, `API_ADMIN_USER`, `API_ADMIN_PASSWORD` (імена як у `.env.example`).

Свідомі рішення:

- **Flaky-тест валить CI.** `retries: 1` лише щоб зняти trace і відрізнити flaky від зламаного; `failOnFlakyTests` робить прогін червоним, якщо тест пройшов тільки з повтору.
- **Secrets — лише кроку з тестами**, а не всьому job: install-скрипти залежностей їх не бачать.
- **Actions прив'язані до SHA коміту** (версія в коментарі), а не до рухомого тегу.
- **Подвійний прогін на PR.** Коли в гілки є PR, кожен push запускає два прогони (push і pull_request). Так виконується вимога «запуск на push» для гілок без PR, а PR має власний статус.
- Новий push скасовує попередній прогін тієї ж гілки; для скасованих прогонів звіт не завантажується.

## Відомі ризики (знайдено, свідомо не закрито)

- **Спільний публічний API-сервер.** Тести працюють лише зі своїми бронюваннями (унікальні дані, власний id, teardown), список і кількість бронювань не перевіряють. Якщо дані на сервері скинуть посеред тесту, він упаде — від тестів це не залежить.
- **Зміна каталогу.** Очікуваний порядок сортування обчислюється з даних сторінки, а тест каталогу перевіряє 6 товарів; зміна асортименту дасть падіння з неочевидною причиною. Рішення за потреби — еталонний список товарів і окремий тест «контракт каталогу».
- **Сесія saucedemo живе 10 хвилин.** Зараз прогін триває ~10 с; при рості набору понад 10 хвилин пізні тести опиняться на сторінці логіну.

## Баг-репорти

Середовище для всіх UI-багів: saucedemo.com, `standard_user`, Chromium (Playwright), 2026-11-25.
API: restful-booker.herokuapp.com, curl, 2026-11-25. Очікувана поведінка API — за семантикою HTTP.
Повний протокол exploratory-сесії — [docs/exploratory.md](docs/exploratory.md).

| ID                | Коротко                                             | Severity | Priority | Тест               |
| ----------------- | --------------------------------------------------- | -------- | -------- | ------------------ |
| [BUG-01](#bug-01) | Неіснуючий товар додається в кошик і ламає checkout | Major    | Medium   | fixme              |
| [BUG-02](#bug-02) | Замовлення оформлюється з порожнім кошиком          | Major    | Medium   | fixme              |
| [BUG-03](#bug-03) | Back після Finish відкриває завершене замовлення    | Minor    | Medium   | fixme              |
| [BUG-04](#bug-04) | Поля checkout з самих пробілів проходять валідацію  | Minor    | Medium   | fixme              |
| [BUG-05](#bug-05) | Zip/Postal Code приймає спецсимволи                 | Minor    | Low      | fixme              |
| [BUG-06](#bug-06) | Reset App State лишає кнопку "Remove"               | Minor    | Low      | —                  |
| [BUG-07](#bug-07) | SDK моніторингу шле запити з плейсхолдерами → 401   | Minor    | Medium   | —                  |
| [BUG-08](#bug-08) | `$0` проти `$0.00` на overview                      | Trivial  | Low      | —                  |
| [BUG-09](#bug-09) | `POST /auth` з неправильними даними → 200           | Major    | Medium   | fixme              |
| [BUG-10](#bug-10) | `POST /booking` без `firstname` → 500               | Major    | Medium   | fixme              |
| [BUG-11](#bug-11) | `totalprice: "abc"` зберігається як `null`          | Major    | High     | —                  |
| [BUG-12](#bug-12) | Checkout раніше за checkin приймається              | Major    | Medium   | —                  |
| [BUG-13](#bug-13) | Від'ємна `totalprice` приймається                   | Major    | High     | —                  |
| [BUG-14](#bug-14) | `PUT`/`DELETE` неіснуючого id → 405                 | Minor    | Low      | —                  |
| [BUG-15](#bug-15) | `DELETE` → 201 Created                              | Minor    | Low      | flow перевіряє 2xx |
| [BUG-16](#bug-16) | `GET /ping` → 201 Created                           | Trivial  | Low      | —                  |

<a id="bug-01"></a>

### BUG-01: Неіснуючий товар додається в кошик і ламає checkout

- **Передумови:** у кошику Sauce Labs Backpack.
- **Кроки:** 1. Відкрити `/inventory-item.html?id=999`. 2. Натиснути Add to cart. 3. Відкрити кошик → Checkout → заповнити форму → Continue.
- **Очікуваний:** сторінка «товар не знайдено» без можливості купити; checkout працює з наявними товарами.
- **Фактичний:** сторінка "ITEM NOT FOUND" з ціною `$√-1` і **активною** Add to cart; після кліку бейдж "2", у кошику 1 товар, `cart-contents=[4,999]`. На `checkout-step-two.html` — білий екран, у console `TypeError: Cannot read properties of undefined (reading 'price')`.
- **Severity / Priority:** Major / Medium. Падіння checkout і зіпсований кошик, але стан досяжний лише ручним редагуванням URL.
- **Тест:** `tests/e2e/catalog/catalog.spec.ts` — «should not allow adding to cart when product does not exist» (fixme).

<a id="bug-02"></a>

### BUG-02: Замовлення оформлюється з порожнім кошиком

- **Кроки:** 1. З порожнім кошиком відкрити кошик. 2. Checkout → заповнити форму → Continue. 3. Finish.
- **Очікуваний:** Checkout недоступний (кнопка прихована або вимкнена) або показує помилку.
- **Фактичний:** оформлення проходить до "Thank you for your order!", Total `$0.00`.
- **Severity / Priority:** Major / Medium. Створюються порожні замовлення; грошей не втрачено, тож не High.
- **Тест:** `tests/e2e/checkout/checkout.spec.ts` — «should not allow checkout when cart is empty» (fixme).

<a id="bug-03"></a>

### BUG-03: Back після Finish відкриває завершене замовлення

- **Передумови:** у кошику один товар.
- **Кроки:** 1. Оформити замовлення до "Thank you for your order!". 2. Натиснути Back у браузері. 3. Натиснути Finish.
- **Очікуваний:** повернутися до завершеного замовлення неможливо.
- **Фактичний:** overview відкривається порожнім (`$0.00`), Finish спрацьовує — вдруге "Thank you for your order!".
- **Severity / Priority:** Minor / Medium. Друге замовлення порожнє, але причина спільна з BUG-02 і виправляється разом із ним.
- **Тест:** `tests/e2e/checkout/checkout.spec.ts` — «should not reopen completed order when user goes back after finish» (fixme).

<a id="bug-04"></a>

### BUG-04: Поля checkout з самих пробілів проходять валідацію

- **Передумови:** у кошику один товар, відкрито Checkout: Your Information.
- **Кроки:** 1. У First Name, Last Name і Zip/Postal Code ввести `   ` (3 пробіли). 2. Continue.
- **Очікуваний:** "Error: First Name is required" (і аналогічно для кожного поля окремо).
- **Фактичний:** валідація пропускає на overview.
- **Severity / Priority:** Minor / Medium. Замовлення без імені й адреси неможливо доставити.
- **Тест:** `tests/e2e/checkout/checkout.spec.ts` — три кейси «… contains only spaces», по одному на поле (fixme).

<a id="bug-05"></a>

### BUG-05: Zip/Postal Code приймає спецсимволи

- **Передумови:** у кошику один товар, відкрито Checkout: Your Information.
- **Кроки:** 1. Заповнити ім'я і прізвище, у Zip/Postal Code ввести `abc!@#`. 2. Continue.
- **Очікуваний:** помилка валідації: індекс містить лише літери, цифри, пробіл і дефіс.
- **Фактичний:** валідація пропускає на overview.
- **Severity / Priority:** Minor / Low.
- **Тест:** `tests/e2e/checkout/checkout.spec.ts` — «should reject postal code when it contains special characters» (fixme).

<a id="bug-06"></a>

### BUG-06: Reset App State лишає кнопку "Remove"

- **Кроки:** 1. Додати товар у кошик. 2. Меню → Reset App State.
- **Очікуваний:** кошик порожній, на всіх картках "Add to cart".
- **Фактичний:** кошик і бейдж очищено, але на картці товару лишається "Remove" до перезавантаження сторінки.
- **Severity / Priority:** Minor / Low.

<a id="bug-07"></a>

### BUG-07: SDK моніторингу шле запити з плейсхолдерами

- **Кроки:** 1. Відкрити будь-яку сторінку. 2. Подивитись console / network.
- **Очікуваний:** без помилок.
- **Фактичний:** 401 від `events.backtrace.io/...?universe=UNIVERSE&token=TOKEN` — конфігурація SDK не заповнена.
- **Severity / Priority:** Minor / Medium. Користувач цього не бачить, але помилки з продакшну не доходять до моніторингу — команда сліпа до інших багів.

<a id="bug-08"></a>

### BUG-08: Неконсистентний формат суми на overview

- **Кроки:** 1. З порожнім кошиком відкрити Checkout → заповнити форму → Continue.
- **Очікуваний:** усі суми у форматі `$X.XX`.
- **Фактичний:** `Item total: $0`, поруч `Tax: $0.00`.
- **Severity / Priority:** Trivial / Low.

<a id="bug-09"></a>

### BUG-09: `POST /auth` з неправильними даними відповідає 200

- **Кроки:** `POST /auth` з `{"username":"admin","password":"wrong-password"}` або `{}`.
- **Очікуваний:** 401 Unauthorized.
- **Фактичний:** 200 OK, тіло `{"reason":"Bad credentials"}`.
- **Severity / Priority:** Major / Medium. Клієнт, що перевіряє статус, вважає невдалий логін успішним (саме тому `BookingClient` перевіряє наявність токена явно).
- **Тест:** `tests/api/booking/booking-negative.spec.ts` — «should return 401 when password is wrong» (fixme).

<a id="bug-10"></a>

### BUG-10: `POST /booking` без `firstname` відповідає 500

- **Кроки:** `POST /booking` з валідним тілом без поля `firstname`.
- **Очікуваний:** 400 Bad Request з описом помилки.
- **Фактичний:** 500 Internal Server Error, тіло `Internal Server Error`.
- **Severity / Priority:** Major / Medium. Помилка клієнта обробляється як збій сервера, без пояснення, що не так.
- **Тест:** `tests/api/booking/booking-negative.spec.ts` — «should return 400 when firstname is missing» (fixme).

<a id="bug-11"></a>

### BUG-11: `totalprice: "abc"` зберігається як `null`

- **Кроки:** `POST /booking` з `"totalprice": "abc"`.
- **Очікуваний:** 400 Bad Request.
- **Фактичний:** 200 OK, бронювання збережено з `totalprice: null`.
- **Severity / Priority:** Major / High. Тихе пошкодження даних: бронювання без ціни.

<a id="bug-12"></a>

### BUG-12: Бронювання з checkout раніше за checkin приймається

- **Кроки:** `POST /booking` з `bookingdates.checkout` раніше за `bookingdates.checkin`.
- **Очікуваний:** 400 Bad Request.
- **Фактичний:** 200 OK, бронювання створено.
- **Severity / Priority:** Major / Medium.

<a id="bug-13"></a>

### BUG-13: Від'ємна `totalprice` приймається

- **Кроки:** `POST /booking` з `"totalprice": -100`.
- **Очікуваний:** 400 Bad Request.
- **Фактичний:** 200 OK, бронювання створено.
- **Severity / Priority:** Major / High. Від'ємна сума в грошовому полі.

<a id="bug-14"></a>

### BUG-14: `PUT`/`DELETE` неіснуючого id відповідає 405

- **Кроки:** `PUT` або `DELETE /booking/{id}` з валідним токеном для id, якого немає (зокрема повторний `DELETE`).
- **Очікуваний:** 404 Not Found.
- **Фактичний:** 405 Method Not Allowed.
- **Severity / Priority:** Minor / Low. Клієнт не відрізняє «немає запису» від «метод не підтримується».

<a id="bug-15"></a>

### BUG-15: `DELETE` відповідає 201 Created

- **Кроки:** `DELETE /booking/{id}` існуючого бронювання з валідним токеном.
- **Очікуваний:** 200 OK або 204 No Content.
- **Фактичний:** 201 Created (бронювання видаляється).
- **Severity / Priority:** Minor / Low.
- **Тест:** flow-тест `tests/api/booking/booking.spec.ts` перевіряє успіх як 2xx і окремо — що GET після видалення дає 404.

<a id="bug-16"></a>

### BUG-16: `GET /ping` відповідає 201 Created

- **Кроки:** `GET /ping`.
- **Очікуваний:** 200 OK.
- **Фактичний:** 201 Created.
- **Severity / Priority:** Trivial / Low.
