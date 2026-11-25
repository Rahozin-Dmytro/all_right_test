# Exploratory-сесія

Мета — до написання автотестів зрозуміти реальну поведінку застосунків, знайти баги і зібрати локатори.
Кожен рядок підтверджений реальним запитом або станом сторінки; непідтверджене позначено окремо.

- **Дата:** 2026-11-25
- **UI:** https://www.saucedemo.com, користувач `standard_user`, Chromium (Playwright MCP)
- **API:** https://restful-booker.herokuapp.com, curl; усі створені бронювання видалено після сесії

## UI — saucedemo

| #   | Сценарій                                         | Очікувано                                                     | Фактично                                                                                                                        | Баг?                           |
| --- | ------------------------------------------------ | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| 1   | Логін                                            | Відкривається каталог                                         | `/inventory.html`, заголовок "Products"                                                                                         | ні                             |
| 2   | Каталог                                          | 6 товарів: назва, ціна, Add to cart                           | Так, ціни у форматі `$X.XX`                                                                                                     | ні                             |
| 3   | Сортування: 4 опції                              | Правильний порядок                                            | Правильний; два товари з однаковою ціною $15.99                                                                                 | ні                             |
| 4   | Reload після сортування                          | —                                                             | Скидається на "Name (A to Z)"                                                                                                   | спостереження                  |
| 5   | Details товару                                   | Та сама назва і ціна, що в каталозі                           | Так                                                                                                                             | ні                             |
| 6   | Details неіснуючого товару `?id=999`             | 404 або повідомлення, купити не можна                         | "ITEM NOT FOUND", ціна `$√-1`, **кнопка Add to cart активна**; після кліку бейдж "2", у кошику 1 товар, `cart-contents=[4,999]` | **так**                        |
| 7   | Checkout з товаром із п.6 у кошику               | Помилка або невалідний товар прибрано                         | **Білий екран** на `checkout-step-two.html`, console: `TypeError: Cannot read properties of undefined (reading 'price')`        | **так**                        |
| 8   | Checkout з порожнім кошиком                      | Кнопка Checkout недоступна або помилка                        | Оформлення проходить до "Thank you for your order!", Total $0.00                                                                | **так**                        |
| 9   | Checkout: усі поля — лише пробіли                | "Error: First Name is required"                               | Валідація пропускає на overview                                                                                                 | **так**                        |
| 10  | Reset App State з товаром у кошику               | Кошик порожній, на картках "Add to cart"                      | Кошик і бейдж очищено, але на картці товару лишається **"Remove"** до перезавантаження сторінки                                 | **так**                        |
| 11  | Console на всіх сторінках                        | Без помилок                                                   | 401 від `events.backtrace.io/...?universe=UNIVERSE&token=TOKEN` — SDK моніторингу з незаповненими плейсхолдерами                | **так**                        |
| 12  | Overview з порожнім кошиком                      | Єдиний формат цін                                             | `Item total: $0`, поруч `Tax: $0.00`                                                                                            | так, trivial                   |
| 13  | Checkout: 150 символів у полях, XSS-рядок        | Обмеження довжини                                             | Усе приймається (`maxLength` не задано); XSS-рядок не виконується                                                               | спостереження                  |
| 13a | Checkout: Zip/Postal Code = `abc!@#`             | Помилка валідації: індекс — лише літери, цифри, пробіл, дефіс | Валідація пропускає на overview                                                                                                 | **так**                        |
| 14  | Після Finish натиснути Back, потім Finish ще раз | Повернутись до завершеного замовлення неможливо               | Overview відкривається вже **порожнім** ($0.00), Finish спрацьовує — вдруге "Thank you for your order!"                         | **так**, спільна причина з п.8 |
| 15  | Підсумки overview, 2 товари                      | Item total + tax 8%                                           | $29.99 + $49.99 = $79.98, tax $6.40, total $86.38 — правильно                                                                   | ні                             |
| 16  | Після Finish                                     | Кошик очищено                                                 | Так                                                                                                                             | ні                             |
| 17  | Remove з кошика                                  | Товар зникає, бейдж зникає                                    | Так                                                                                                                             | ні                             |
| 18  | Logout, потім прямий URL `/inventory.html`       | Доступ закрито                                                | Редірект на логін, "You can only access '/inventory.html' when you are logged in."                                              | ні                             |
| 19  | Тривалість сесії                                 | —                                                             | Cookie `session-username` живе 10 хвилин                                                                                        | ризик для `storageState`       |

**Нез'ясоване (не баг, не відтворено):** після серії маніпуляцій з історією браузера (Back/Finish) сторінка каталогу
перестала реагувати на кліки навіть після reload. У чистому браузерному контексті все працює; кроки для відтворення не знайдено.

## API — restful-booker

| #   | Запит                                            | Очікувано            | Фактично                               | Баг?         |
| --- | ------------------------------------------------ | -------------------- | -------------------------------------- | ------------ |
| 1   | `POST /auth`, правильні дані                     | 200 + token          | 200 + token                            | ні           |
| 2   | `POST /auth`, неправильний пароль або `{}`       | 401                  | **200** `{"reason":"Bad credentials"}` | **так**      |
| 3   | `POST /booking` без `firstname`                  | 400 з описом помилки | **500** Internal Server Error          | **так**      |
| 4   | `POST /booking`, `totalprice: "abc"`             | 400                  | **200**, збережено `totalprice: null`  | **так**      |
| 5   | `POST /booking`, checkout раніше за checkin      | 400                  | **200**                                | **так**      |
| 6   | `POST /booking`, `totalprice: -100`              | 400                  | **200**                                | **так**      |
| 7   | `GET /booking/{id}`: неіснуючий або нечисловий   | 404                  | 404                                    | ні           |
| 8   | `PUT`/`DELETE` без токена або з невалідним       | 401 (або 403)        | 403                                    | спірно       |
| 9   | `PUT`/`DELETE` неіснуючого id з валідним токеном | 404                  | **405** Method Not Allowed             | **так**      |
| 10  | `PUT`, `PATCH` з валідним токеном                | 200 + оновлені дані  | Так                                    | ні           |
| 11  | `DELETE` існуючого                               | 200 або 204          | **201** Created                        | **так**      |
| 12  | `GET` після delete / повторний `DELETE`          | 404 / 404            | 404 / **405**                          | див. п.9     |
| 13  | `GET /ping`                                      | 200                  | 201 Created                            | так, trivial |

## Реєстр багів (ID для README і `test.fixme`)

| ID     | Пункт       | Коротко                                                              | Тест                                                 |
| ------ | ----------- | -------------------------------------------------------------------- | ---------------------------------------------------- |
| BUG-01 | UI п.6 + 7  | Неіснуючий товар (`?id=999`) додається в кошик і ламає checkout      | `tests/e2e/catalog/catalog.spec.ts` (fixme)          |
| BUG-02 | UI п.8      | Замовлення оформлюється з порожнім кошиком                           | `tests/e2e/checkout/checkout.spec.ts` (fixme)        |
| BUG-03 | UI п.14     | Back після Finish відкриває завершене замовлення, Finish спрацьовує  | `tests/e2e/checkout/checkout.spec.ts` (fixme)        |
| BUG-04 | UI п.9      | Поля checkout з самих пробілів проходять валідацію                   | `tests/e2e/checkout/checkout.spec.ts` (fixme)        |
| BUG-05 | UI п.13a    | Zip/Postal Code приймає спецсимволи                                  | `tests/e2e/checkout/checkout.spec.ts` (fixme)        |
| BUG-06 | UI п.10     | Reset App State лишає кнопку "Remove" на картці                      | —                                                    |
| BUG-07 | UI п.11     | SDK моніторингу шле запити з плейсхолдерами `UNIVERSE`/`TOKEN` → 401 | —                                                    |
| BUG-08 | UI п.12     | Неконсистентний формат суми: `$0` проти `$0.00` (trivial)            | —                                                    |
| BUG-09 | API п.2     | `POST /auth` з неправильними даними → 200 замість 401                | `tests/api/booking/booking-negative.spec.ts` (fixme) |
| BUG-10 | API п.3     | `POST /booking` без `firstname` → 500 замість 400                    | `tests/api/booking/booking-negative.spec.ts` (fixme) |
| BUG-11 | API п.4     | `totalprice: "abc"` приймається і зберігається як `null`             | —                                                    |
| BUG-12 | API п.5     | Бронювання з checkout раніше за checkin приймається                  | —                                                    |
| BUG-13 | API п.6     | Від'ємна `totalprice` приймається                                    | —                                                    |
| BUG-14 | API п.9, 12 | `PUT`/`DELETE` неіснуючого id → 405 замість 404                      | —                                                    |
| BUG-15 | API п.11    | `DELETE` → 201 Created замість 200/204                               | `tests/api/booking/booking.spec.ts` перевіряє 2xx    |
| BUG-16 | API п.13    | `GET /ping` → 201 замість 200 (trivial)                              | —                                                    |

API п.8 (403 замість 401 без токена) не баг: 403 задокументований у restful-booker, тест перевіряє саме його.

## Карта локаторів

| Сторінка                           | Елемент                     | Локатор                                                                                                                                |
| ---------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Login                              | Username / Password / Login | `getByPlaceholder('Username')` / `getByPlaceholder('Password')` / `getByRole('button', { name: 'Login' })`                             |
| Login                              | Помилка                     | `getByTestId('error')`                                                                                                                 |
| Header                             | Кошик / бейдж               | `getByTestId('shopping-cart-link')` (aria-label "Cart, empty" / "Cart, N items") / `getByTestId('shopping-cart-badge')`                |
| Header                             | Меню, Reset, Logout         | `getByRole('button', { name: 'Open Menu' })`, `getByTestId('reset-sidebar-link')`, `getByTestId('logout-sidebar-link')`                |
| Inventory                          | Сортування / обрана опція   | `getByRole('combobox', { name: 'Sort products' })` / `getByTestId('active-option')`                                                    |
| Inventory, Details, Cart, Overview | Картка / назва / ціна       | `getByTestId('inventory-item')` / `getByTestId('inventory-item-name')` / `getByTestId('inventory-item-price')`                         |
| Inventory                          | Перехід на details          | `getByTestId('inventory-item-name')` у картці (кнопок "View details for X" дві: назва і картинка)                                      |
| Details                            | Назад / Add to cart         | `getByRole('button', { name: 'Back to products' })` / `getByRole('button', { name: 'Add to cart' })`                                   |
| Cart                               | Кількість / кнопки          | `getByTestId('item-quantity')` / `getByRole('button', { name: 'Checkout' })` / `{ name: 'Continue Shopping' }`                         |
| Checkout: Your Information         | Форма, поля, помилка        | `getByRole('form', { name: 'Checkout information' })`, textbox "First Name" / "Last Name" / "Zip/Postal Code", `getByRole('alert')`    |
| Checkout: Overview                 | Суми / Finish               | `getByTestId('subtotal-label')` / `getByTestId('tax-label')` / `getByTestId('total-label')`, `getByRole('button', { name: 'Finish' })` |
| Checkout: Complete!                | Заголовок / Back Home       | `getByRole('heading', { name: 'Thank you for your order!' })` / `getByRole('button', { name: 'Back Home' })`                           |

## Висновки для автотестів

- Сортування за ціною перевіряти через впорядкованість цін, а не через точний порядок назв: два товари мають однакову ціну.
- Суми на overview обчислювати з цін на сторінці, порівнювати як числа.
- Баги з таблиць — тести з правильною поведінкою і `test.fixme` з посиланням на баг-репорт у README.

## Відомі ризики автотестів (знайдено, свідомо не закрито)

- **Зміна каталогу дає неочевидне падіння.** Тести сортування обчислюють очікуваний порядок з даних сторінки, а тест
  каталогу перевіряє кількість товарів (6) і формат. Якщо додадуть, перейменують або переоцінять товар, тест упаде,
  але причина буде видна не одразу. Рішення, якщо знадобиться: еталонний список товарів (назва + ціна) у `src/data`
  і окремий тест «контракт каталогу» з точним порівнянням.
- **Правило сортування назв задане припущенням.** Очікуваний порядок рахується через `localeCompare`; для поточних
  6 англомовних назв він збігається з сайтом. Для назв з іншим регістром, мовою чи діакритикою правило сайту може
  відрізнятися — тест дасть хибне падіння. Без явної локалі (`localeCompare(b, 'en')`) результат залежить від
  налаштувань машини, де запускаються тести.
- **Сесія 10 хвилин.** Cookie у `storageState` живе 10 хвилин від логіну в `auth.setup.ts`: якщо прогін триває довше,
  пізні тести можуть опинитись на сторінці логіну (не перевірено, зараз прогін триває секунди) — тримати в полі зору для CI.

Що вже перевірено: кожен UI-тест хоч раз бачили червоним на власній перевірці (тимчасові копії specs,
застосунок ламається через `page.addInitScript`):

- сортування — 4/4 падають, якщо сортування не працює або працює у зворотний бік (підміна `Array.prototype.sort`);
- каталог, details, кошик, логін, checkout — блокування кнопок Add to cart / Login / Continue / Finish і підміна
  текстів: ціна без `$`, інша ціна на details, податок $0.00 і ×10, total і item total на $1 більші;
- fixme-тести BUG-01…05 — на розблокованій копії падають на своїй перевірці, перевірки відсутності мають якір.
