# QA Automation: saucedemo (UI) + restful-booker (API)

UI E2E- і API-тести на **Playwright Test + TypeScript**, CI на GitHub Actions. Тести написані в парі з
агентом (Claude Code): як він налаштований, промпти і де помилявся — [AI_WORKLOG.md](AI_WORKLOG.md).

## Як читати (3 хвилини)

- **Ядро завдання:** [UI-тести](tests/e2e) (логін, каталог, сортування, кошик, checkout + негативні),
  [API flow і негативні](tests/api/booking), [CI](.github/workflows/tests.yml), [баг-репорти](#баг-репорти) нижче.
- **Понад завдання, свідомо:** exploratory-сесія до коду ([docs/exploratory.md](docs/exploratory.md)); знайдені баги
  покриті тестами з **правильною** поведінкою в `test.fixme`; кожен тест хоч раз бачили червоним на навмисно
  зламаному застосунку; flaky-тест валить CI, а не ховається за retry.

**Результат:** 20 активних тестів (5 `@smoke`, 15 `@regression`), 9 тестів відомих багів у `test.fixme`, 10 баг-репортів.

## Швидкий старт

Потрібен Node.js 22+ (версія в `.nvmrc`).

```bash
git clone https://github.com/Rahozin-Dmytro/all_right_test.git && cd all_right_test
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
| `npm run check`                 | ESLint + `tsc` + Prettier; те саме запускає CI                     |

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

## Що свідомо не покрито

| Що                                                                                                  | Чому                                                                                        |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Інші користувачі saucedemo (`problem_user`, `performance_glitch_user`, `error_user`, `visual_user`) | Завдання вимагає `standard_user`; `locked_out_user` використано лише для негативного логіну |
| Firefox, WebKit, мобільний viewport                                                                 | Завдання не вимагає; додається одним project у `playwright.config.ts`                       |
| Visual regression, accessibility (axe), performance                                                 | Окремі види тестування з власною інфраструктурою, поза обсягом завдання                     |
| Remove з кошика, logout                                                                             | Перевірено вручну на exploratory (працює); у ліміті часу пріоритет — checkout і баги        |
| BUG-11…13 без автотестів                                                                            | Той самий клас помилок (валідація API), що й покритий BUG-10                                |
| `PATCH`, `GET /booking` зі фільтрами                                                                | Не входять у флоу завдання                                                                  |

## Архітектура

- `src/fixtures/index.ts` — єдина точка входу: specs імпортують `test`/`expect` лише звідси й отримують page objects, API-клієнт і дані як fixtures.
- `src/pages/` — page object на сторінку: `readonly` локатори + методи-дії, **без assertions**; спільний UI (header) — `src/components/`.
- `src/api/BookingClient.ts` — сирі методи повертають `APIResponse` (для негативних тестів), `*AndParse` — дані, перевірені zod-схемою з `src/api/types.ts`.
- `src/data/` — builders з унікальними даними на кожен запуск; `src/config/env.ts` — єдине джерело env, падає одразу, якщо змінної немає.
- Логін один раз у `tests/auth.setup.ts` → `storageState`; setup і cleanup API-даних — у fixtures, teardown видаляє бронювання навіть після падіння.
- Локатори: `getByRole` → `getByLabel`/`getByPlaceholder` → `getByTestId` (`data-test`); перевірки відсутності — лише після якоря, що екран відмалювався.

## CI

[.github/workflows/tests.yml](.github/workflows/tests.yml): push у будь-яку гілку і pull request у `main` →
`npm ci` → `npm run check` → Chromium → `npm test`. **Звіт:** вкладка Actions → прогін → Artifacts →
`playwright-report` (14 днів; для падінь — скріншот, відео і trace повтору). Variables `BASE_URL`, `API_URL` і
secrets з іменами як у `.env.example` задаються в Settings → Secrets and variables → Actions.

`retries: 1` лише щоб зняти trace і відрізнити flaky від зламаного, а `failOnFlakyTests` робить прогін червоним,
якщо тест пройшов тільки з повтору. Secrets бачить лише крок з тестами; actions прив'язані до SHA коміту.

## Відомі ризики (знайдено, свідомо не закрито)

- **Спільний публічний API-сервер.** Тести працюють лише зі своїми бронюваннями (унікальні дані, власний id, teardown). Якщо дані на сервері скинуть посеред тесту, він упаде — від тестів це не залежить.
- **Зміна каталогу.** Тест каталогу перевіряє 6 товарів, а порядок сортування обчислюється з даних сторінки; зміна асортименту дасть падіння з неочевидною причиною. Рішення за потреби — еталонний «контракт каталогу».
- **Сесія saucedemo живе 10 хвилин.** Зараз прогін триває ~10 с; при рості набору понад 10 хвилин пізні тести опиняться на сторінці логіну.

## Баг-репорти

Середовище для всіх UI-багів: saucedemo.com, `standard_user`, Chromium (Playwright), 2026-11-25.
API: restful-booker.herokuapp.com, curl, 2026-11-25. Очікувана поведінка API — за семантикою HTTP.
Ще 6 дрібних дефектів (Minor/Trivial: BUG-06…08, BUG-14…16) — у реєстрі [docs/exploratory.md](docs/exploratory.md#реєстр-багів-id-для-readme-і-testfixme).

| ID                | Коротко                                             | Severity | Priority | Тест  |
| ----------------- | --------------------------------------------------- | -------- | -------- | ----- |
| [BUG-01](#bug-01) | Неіснуючий товар додається в кошик і ламає checkout | Major    | Medium   | fixme |
| [BUG-02](#bug-02) | Замовлення оформлюється з порожнім кошиком          | Major    | Medium   | fixme |
| [BUG-03](#bug-03) | Back після Finish відкриває завершене замовлення    | Minor    | Medium   | fixme |
| [BUG-04](#bug-04) | Поля checkout з самих пробілів проходять валідацію  | Minor    | Medium   | fixme |
| [BUG-05](#bug-05) | Zip/Postal Code приймає спецсимволи                 | Minor    | Low      | fixme |
| [BUG-09](#bug-09) | `POST /auth` з неправильними даними → 200           | Major    | Medium   | fixme |
| [BUG-10](#bug-10) | `POST /booking` без `firstname` → 500               | Major    | Medium   | fixme |
| [BUG-11](#bug-11) | `totalprice: "abc"` зберігається як `null`          | Major    | High     | —     |
| [BUG-12](#bug-12) | Checkout раніше за checkin приймається              | Major    | Medium   | —     |
| [BUG-13](#bug-13) | Від'ємна `totalprice` приймається                   | Major    | High     | —     |

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
