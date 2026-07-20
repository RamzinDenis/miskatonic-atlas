# План: раздел Bestiarium — витрина существ и «листы натуралиста»

> Статус: решения согласованы с владельцем (гриль-сессия 2026-07-20), к исполнению в отдельной сессии.
> Исполнителю: перед кодом прочитать доки этой версии Next — `node_modules/next/dist/docs/01-app/01-getting-started/{03-layouts-and-pages,04-linking-and-navigating,05-server-and-client-components}.md` (см. AGENTS.md); идти по «Порядку работ» внизу, каждый этап имеет проверяемый результат.

## Контекст

В атласе уже есть 7 существ как контент (`content/creatures/*.json`, страницы `/creatures/[slug]` через EntityArticle), но нет индексной страницы раздела — существа находимы только через `/contents` и клики по тварям-маргиналиям на карте. Нужен интересный интерактивный раздел-бестиарий в духе «панели выбора персонажа», с переходом на страницу существа. Арт (гравюры + альфа-маски) есть у 3 из 7; пайплайн масок (`scripts/build-monster-masks.mjs`) и техника покраски `.mask-ink` (`background-color: currentColor` + `mask: var(--ink-mask)`) готовы. 3D и новые зависимости не используем.

## Согласованные решения

1. **Техника** — живые 2D-гравюры: альфа-маски + CSS-анимация «оживления», без 3D-библиотек.
2. **Компоновка индекса** — витрина «выбор персонажа»: одна тварь крупно, имя/латынь/эпитет/пара строк, «Открыть лист»; внизу лента миниатюр, переключение кликом/стрелками.
3. **Лист существа** — «полный лист натуралиста»: крупная живая гравюра, имена + латынь + эпитет, легенда, сведения, «где водится», свидетельства-цитаты.
4. **Состав** — все 7; у 4 без арта — диегетическая заглушка «гравюра утрачена/изъята»; арт добавляется позже заменой в реестре.
5. **Сцена** — пергаментный лист в обвязке `(pages)`, не full-bleed.
6. **Контент не трогаем** — CreatureSchema без изменений; легенда = `description`, сведения из готовых полей. Латынь/эпитеты/арт/эффекты/порядок — UI-реестр бестиария (по образцу вклеек). Драфт латыни — Claude, владелец правит.
7. **Имя и вход** — маршрут `/creatures`, титул **BESTIARIUM**, в SiteHeader пункт «Bestiary» между Map и Index; в CONTEXT.md — «Бестиарий», «Маргиналия», уточнение «Значимости».

## Реализация

### Новые файлы

| Файл | Роль |
|---|---|
| `src/widgets/bestiary/registry.ts` | UI-реестр (по образцу `plates/index.tsx`): латынь, эпитет, порядок, арт (маска + aspect + эффекты). Чистые данные без `"use client"` — импортируется сервером и островом |
| `src/widgets/bestiary/figure.tsx` | `"use client"`. «Живая гравюра»: слои `.mask-ink` + эффекты + JS-параллакс. Используется витриной и листом |
| `src/widgets/bestiary/lost-plate.tsx` | Заглушка «гравюра изъята»: пустое паспарту + пометка хранителя. Без хуков — работает в обоих графах |
| `src/widgets/bestiary/showcase.tsx` | `"use client"`. Остров витрины: сцена + лента, выбор, клавиатура, aria |
| `src/app/(pages)/creatures/page.tsx` | Серверная страница `/creatures`: `getCreatures()` → join с реестром → сериализуемые `BestiaryEntry[]`; лист с титулом BESTIARIUM; `export const metadata` |
| `public/bestiary/{cthulhu,tornasuk,black-winged-ones}.webp` | Крупные маски ~1024px (генерит скрипт, коммитятся) |

### Изменяемые файлы

| Файл | Изменение |
|---|---|
| `scripts/build-monster-masks.mjs` | Третий прогон: `monster-*.png` → `public/bestiary/*.webp`, `BESTIARY_SIZE = 1024`; энкодер по расширению выхода (`.webp` → `.webp({quality: 82, alphaQuality: 90})`) |
| `src/app/globals.css` | Секция `/* --- Bestiarium --- */`: классы `.bestiary-*`, keyframes, расширение блока `prefers-reduced-motion`. Не в `@layer` (как остальные секции файла) |
| `src/app/(pages)/creatures/[slug]/page.tsx` | Переоформление в «лист натуралиста»: отказ от `EntityArticle` (прецедент — `locations/[slug]/page.tsx`), живая гравюра, латынь/эпитет из реестра, вклейка cthulhu сохраняется |
| `src/shared/ui/site-header.tsx` | Пункт `Bestiary` (`/creatures`) между Map и Index |
| `src/widgets/entity-article/index.tsx` | Только докстринг (теперь это шаблон только персонажей) |
| `CONTEXT.md` | Термины «Бестиарий», «Маргиналия», уточнение «Значимость» (формулировки ниже) |
| `PLAN.md` | Запись о разделе Bestiarium (этап после Фазы 3) |

Не трогаем: `schemas.ts`, `content/*`, `content.ts` (хватает `getCreatures`/`getCreature`, строки 182/186), `world-map/*`, `plates/index.tsx`, `next.config.ts`.

### Архитектура витрины `/creatures`

Сервер собирает и передаёт острову:

```ts
interface BestiaryEntry {
  slug: string; name: string; classification: string; summary: string;
  latin: string; epithet: string; fig: number;      // номер фигуры в витрине
  art: { mask: string; aspect: number; effects: BestiaryEffect[] } | null;
}
```

Билд-ассерт взаимной полноты реестра и контента (несовпадение слагов → `throw` валит SSG).

Остров `showcase.tsx`:
- Состояние — локальный `useState` (индекс). **Без URL-hash**: при SSG первый кадр всегда дефолтный (рассинхрон гидрации), а shareable-единица — сам лист `/creatures/[slug]`.
- Паттерн WAI-ARIA tabs, automatic activation: лента `role="tablist"`, миниатюры — `<Link href="/creatures/…" role="tab" aria-selected>` с перехватом клика (`preventDefault` → выбор). **Без JS каждая миниатюра — обычная ссылка**: важно, 4 minor-существа не попадают в Index, витрина — их единственное серверное место в навигации (краулеры/no-JS получают все 7 якорей).
- Roving tabindex; `←`/`→` с wrap, `Home`/`End`; `scrollIntoView({inline:"nearest", behavior: smooth|auto по reduced-motion})`.
- Сцена: `role="tabpanel"`; вся сцена — `<Link>` на лист активного существа (клик/Enter открывает); под фигурой имя, латынь курсивом, эпитет, `summary` (line-clamp ~3), кнопка-ссылка «Open the leaf».
- Все 7 фигур смонтированы стопкой (absolute в одном `aspect-ratio: 1/1` боксе), переключение — opacity/visibility crossfade; неактивные `aria-hidden`. Это прогревает маски (при `display:none` mask не фетчится) и даёт кроссфейд без CLS.
- Мобильный: лента `overflow-x-auto` + scroll-snap; параллакс не вешается при `(hover: none)`.
- Prefetch: дефолт `<Link>` — 7 статических листов префетчатся из вьюпорта, дёшево.

### Эффекты «оживления»

```ts
export type BestiaryEffect = "breath" | "ink-shiver" | "gaze-tilt" | "vermilion-pulse";
```

Слои `figure.tsx` (каждому transform — свой элемент):

```
.bestiary-figure        aspect-ratio: 1/1; color: var(--ink)   ← паспарту-бокс
└ .bestiary-tilt        perspective + rotateX/rotateY из --gx/--gy (JS)
  └ .bestiary-fx-breath animation: scale-«дыхание»
    ├ .bestiary-layer.mask-ink            базовые чернила, --ink-mask: url(webp)
    │   (+ .bestiary-fx-shiver при ink-shiver)
    └ .bestiary-layer--vermilion.mask-ink color: var(--ink-accent); пульс
```

- `breath` — 8s ease-in-out `scale(1→1.015)`, origin bottom center.
- `ink-shiver` — keyframes со `steps(1,end)`: нерегулярные тычки 0.5–1px + 0.2deg — дрожь оттиска. Только transform.
- `gaze-tilt` — `pointermove` → нормированные `--gx/--gy` (rAF-троттлинг) → `rotateY(calc(var(--gx)*6deg)) rotateX(...)`; `pointerleave` — плавный возврат. Не вешается при reduced-motion и `(hover: none)`.
- `vermilion-pulse` — дубль-слой в `--ink-accent` (#75371a), `opacity 0→0.22→0` ~11s.
- Hover: сцена/миниатюры перекрашиваются в вермильон целиком, активная миниатюра остаётся вермильонной — как `.atlas-monster:hover`/`.atlas-pin--active` на карте.
- `INK_ROUGH_FILTER` **не** переиспользуем: SVG-фильтр для инлайн-SVG, на растре статичен и дорог; шероховатость уже в масках.
- Reduced-motion — в существующем `@media`: `[class*="bestiary-fx-"]{animation:none}`, tilt off, transitions off; остаётся статичная гравюра.

Заглушка `lost-plate.tsx`: тот же aspect-бокс; паспарту `border: 3px double var(--paper-line)` (рифма к `.legend-cartouche`), по центру `Fig. N` (Playfair italic) и пометка хранителя: «Plate wanting.» / «Withdrawn from the folio, or never engraved.» Миниатюра — та же двойная рамка с номером. Замена на арт = заполнить `art` в реестре + положить маску.

### Крупные маски

- `BESTIARY_SIZE = 1024`, выход `public/bestiary/<slug>.webp`; запуск `node scripts/build-monster-masks.mjs` (старые png регенерятся байт-в-байт, в git-статусе только новое). Скрипт печатает aspect — перенести в реестр.
- Почему webp: png при 1024px — 400–700 КБ, webp с альфой — ~100–250 КБ (суммарно ≤700 КБ); прецедент webp есть (`page-wear.webp`), `mask-image: url(*.webp)` поддержан evergreen-браузерами.
- Миниатюры ленты — готовые 300px `/maps/monsters/*.png`.
- Cthulhu на листе — **маска, не полная гравюра** (3 МБ png на клиент не едет; 1024-маска общая с витриной, при ширине листа ~448px это ретина-запас 2.3x). Вклейка Plate I (legrasse-idol) остаётся отдельно.

### Лист существа `/creatures/[slug]`

Компоновка напрямую (прецедент `locations/[slug]/page.tsx`), реиспользуем `ChipSection` и `SourcesSection` из `sections.tsx` (строки 10/36). `MapInset` не используем: у существа нет своих координат, «где водится» = ссылки на локации.

1. `← Bestiarium` (на `/creatures`).
2. Шапка: `h1` имя + бейдж classification; строкой ниже латынь курсивом + эпитет; `.parchment-rule`.
3. Живая гравюра `BestiaryFigure` (или `LostPlate`) с подписью `Fig. N — Bestiarium`.
4. `summary` (text-lg) → `description` (drop-cap-абзацы).
5. Вклейка `getPlate("creatures", slug)` — после description.
6. Fate-блок (текущая разметка), `ChipSection "Haunts"` (локации), `SourcesSection`, «Appears in», `❦`.

Сохраняем: `dynamicParams = false`, `generateStaticParams`, `await params`, `PageProps<"/creatures/[slug]">`, `generateMetadata`.

Метаданные `/creatures` — статический `export const metadata` (прецедент `contents/page.tsx`): title «Bestiary», description «The bestiarium of the atlas — every beast, devil and Great Old One on record…».

### Тексты реестра (драфт — владелец правит; язык сайта английский, `lang="en"`)

Порядок: сперва с артом, затем утраченные; major вперёд внутри групп.

| # | slug | Латынь | Эпитет |
|---|---|---|---|
| 1 | cthulhu | *Cthulhu rlyehensis* | The dreamer in the sunken city |
| 2 | tornasuk | *Tornasuk groenlandicus* | Supreme elder devil of the ice |
| 3 | black-winged-ones | *Nigripennes nemorum* | Killers out of the haunted wood |
| 4 | great-old-ones | *Prisci siderei* | Star-born rulers of the elder earth |
| 5 | white-polypous-thing | *Polypus lacustris* | Nightmare itself; to see it is to die |
| 6 | bat-winged-devils | *Vespertilio infernalis* | Worshipers out of inner earth |
| 7 | black-spirits-of-earth | *Umbrae telluris* | Of whom old Castro dared not speak |

Эффекты: cthulhu `[breath, gaze-tilt, vermilion-pulse]`; tornasuk `[ink-shiver, gaze-tilt]`; black-winged-ones `[breath, ink-shiver, gaze-tilt]`; остальные `art: null`. Подзаголовок витрины: «Being the beasts, devils and Great Old Ones on record in the atlas — drawn where any hand dared draw them.»

### CONTEXT.md — формулировки

**Бестиарий (Bestiary):** Кураторская витрина всех существ атласа (`/creatures`) и «листы натуралиста» на их страницах. Слой представления: латинские имена, эпитеты, «живые» гравюры, заглушки утраченных гравюр и порядок показа живут в UI-реестре и в контент, черновики и пайплайн не попадают. В отличие от карты и Index, бестиарий показывает существа любой значимости. _Avoid_: каталог существ (как поле контента), галерея.

**Маргиналия (Marginalia):** Рисованная пометка «владельца экземпляра» на полях карты — существо, дорисованное поверх печатного листа. Как вклейка и маршрут — редакторская подача в слое представления (UI); может изображать существо любой значимости и в контент не попадает. _Avoid_: монстр карты (как сущность), декор (без уточнения слоя).

**Значимость (Prominence)** — дополнить: «Кураторские витрины — бестиарий и маргиналии карты — показывают и проходных существ: это подача раздела, а не вынос сущности в общую навигацию; в Index и меню проходные сущности по-прежнему не попадают.»

## Порядок работ и верификация

1. **Маски**: правка скрипта → прогон. Чек: 3 webp в `public/bestiary/` ≲700 КБ, старые png не изменились (`git status`), aspect записаны.
2. **Реестр**: тексты, эффекты, порядок. Чек: tsc/lint зелёные.
3. **CSS + figure/lost-plate + лист твари**. Чек: `npm run dev` — 7 листов открываются, cthulhu живой + Plate I на месте, у 4 — паспарту, персонажи не задеты.
4. **Витрина + хедер**. Чек: выбор/стрелки/Enter, переходы, hover.
5. **Документация**: CONTEXT.md, PLAN.md.
6. **Финал**: `npm run validate`, `npm run lint`, `npm run build` — в сводке `/creatures` + 7 prerendered листов, всё static. Ручной чек-лист: клавиатура (Tab → лента, стрелки, Home/End, Enter); hover-вермильон; `prefers-reduced-motion` (анимаций нет, контент цел); ширина 360px; отключённый JS (миниатюры — обычные ссылки); `/creatures/nyarlathotep` → 404; карта не регрессировала.

## Риски Next 16 и обход

- `params` — Promise: только на `[slug]`-странице, `await params` + `PageProps<"/creatures/[slug]">` сохраняем.
- `PageProps<'/creatures'>` генерится typegen-ом после dev/build — статической странице пропсы не нужны, не используем (прецедент `contents/page.tsx`).
- Остров: пропсы строго сериализуемые (plain JSON); `ReactNode` вклейки в остров не передаётся. `dynamic({ssr:false})` не нужен (window на импорте не трогаем) — остров пререндерится в HTML, отсюда и no-JS-деградация.
- Tailwind v4: новые классы только в `globals.css`, вне `@layer` (как соседние секции).

## Ключевые файлы

- `src/widgets/bestiary/registry.ts` (новый — ядро раздела)
- `src/app/(pages)/creatures/page.tsx` (новый), `src/app/(pages)/creatures/[slug]/page.tsx`
- `src/widgets/bestiary/{showcase,figure,lost-plate}.tsx` (новые)
- `src/app/globals.css`, `scripts/build-monster-masks.mjs`, `src/shared/ui/site-header.tsx`
- `CONTEXT.md`, `PLAN.md`
