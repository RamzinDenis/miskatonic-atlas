# Атлас Лавкрафта — техническая документация тестового проекта

Рабочее название: **Miskatonic Atlas** (заменишь). Интерактивный атлас «Страны Лавкрафта» — карта, локации, персонажи, существа и таймлайн, автоматически извлечённые из текстов рассказов с ручной доводкой.

## 1. Цели и не-цели

**Цели:**
- Работающее публичное демо для валидации (пост в сообщества, лендинг, интервью).
- Обкатать пайплайн «текст → структурированная библия мира» — ядро будущего продукта.
- Портфолио: LLM entity extraction, RAG-подход, интерактивные карты, SSG/SEO.

**Не-цели (для теста):**
- Никакой загрузки пользовательских рукописей, аккаунтов, биллинга.
- Никакой БД в рантайме — все данные статические, собираются на этапе билда.
- Не вылизывать пайплайн до продуктового качества: 70% автоматики + ручная правка приемлемы.

## 2. Юридическая база (важно, читать до выбора текстов)

- **ЕС (ты в Эстонии):** Лавкрафт умер в 1937, срок «жизнь + 70 лет» истёк — все его тексты в общественном достоянии в ЕС.
- **США (твоя аудитория и хостинг):** безопасны произведения, опубликованные **до 1930 включительно** (правило 95 лет, на 2026 год). Поздние вещи («Хребты безумия», «Тень над Иннсмутом», посмертные публикации вроде «Сомнамбулического поиска Кадата») формально в серой зоне — для демо не бери, даже если «все так делают».

**Рекомендованный корпус (все ≤1929, чисто в США и ЕС):**

| Рассказ | Год | Что даёт атласу |
|---|---|---|
| Dagon | 1919 | остров, Дагон |
| The Nameless City | 1921 | Безымянный город, Аравия |
| The Festival | 1925 | Кингспорт |
| The Call of Cthulhu | 1928 | Р'льех, Ктулху, культ, география половины планеты |
| The Colour Out of Space | 1927 | Аркхэм, ферма Гарднера |
| The Dunwich Horror | 1929 | Данвич, Мискатоникский университет, Уэйтли |

Шесть рассказов ≈ 60–70 тыс. слов — достаточно для насыщенного атласа и честного теста пайплайна. Источники текстов: Project Gutenberg (gutenberg.org, есть основные рассказы), зеркала на hplovecraft.com. Складывай исходники в `corpus/` с указанием источника в фронтматтере.

**Лицензия репозитория:** код — MIT; в README явная секция о статусе текстов (public domain, годы публикации). Это заодно демонстрирует юридическую аккуратность будущим клиентам.

## 3. Стек

| Слой | Выбор | Почему |
|---|---|---|
| Фреймворк | Next.js 15, App Router, **full SSG** | твой стек; статика = SEO + бесплатный хостинг + скорость |
| Язык | TypeScript strict | — |
| Карта | **Leaflet + react-leaflet, CRS.Simple** | простейший способ повесить маркеры на иллюстрированную карту-картинку; MapLibre — оверкилл без тайлов |
| Стили | Tailwind | скорость |
| Данные | JSON-файлы в `content/`, валидация через **Zod** | «content as code»: git-диффы правок, ноль инфраструктуры |
| Пайплайн | Node/TS CLI-скрипты + **Anthropic SDK** (structured output через tool use) | ядро будущего продукта |
| Граф связей (опц.) | d3-force или sigma.js | этап polish |
| Аналитика | Plausible / Umami | демо — инструмент валидации, метрики обязательны |
| Хостинг | Vercel или Cloudflare Pages | статика, бесплатный тир |

Сознательно НЕ используем сейчас: Postgres/pgvector, NestJS, BullMQ, очереди. Это этап продукта; в архитектуре ниже отмечено, что куда мигрирует.

## 4. Архитектура

Два независимых контура, связанных только форматом данных:

```
[corpus/*.txt]
   → scripts/extract.ts   (чанкинг → Claude API → черновики сущностей)
   → content/drafts/*.json
   → ручная ревизия + merge (PR самому себе)
   → content/{locations,characters,creatures,stories,events}/*.json
   → Zod-валидация на билде
   → Next.js SSG → статический сайт
```

Правило: **фронтенд никогда не знает про LLM.** Он читает провалидированные JSON. Благодаря этому пайплайн можно переписывать/улучшать, не трогая сайт, а в продуктовой фазе заменить `content/` на Postgres, не меняя типы.

## 5. Модель данных

`src/shared/schemas.ts` — единый источник типов (Zod → выводим TS-типы):

```ts
import { z } from "zod";

export const SourceRef = z.object({
  storySlug: z.string(),          // "the-call-of-cthulhu"
  quote: z.string().max(600),     // цитата-основание (PD — можно смело)
  context: z.string().optional(), // позиция: глава/абзац
});

export const LocationSchema = z.object({
  slug: z.string(),
  name: z.string(),
  nameRu: z.string().optional(),
  type: z.enum(["city","town","building","region","ruin","sea","other"]),
  summary: z.string(),            // 2–3 предложения, своими словами
  description: z.string(),        // развёрнуто, markdown
  map: z.object({ x: z.number(), y: z.number() }).optional(), // пиксели карты
  realWorld: z.string().optional(),   // прототип: "Салем, Массачусетс"
  appearsIn: z.array(z.string()),     // slugs рассказов
  connectedTo: z.array(z.string()),   // slugs локаций
  sources: z.array(SourceRef).min(1), // каждый факт трассируется к тексту!
  image: z.string().optional(),
});

export const CharacterSchema = z.object({
  slug: z.string(),
  name: z.string(),
  role: z.enum(["protagonist","witness","cultist","scholar","other"]),
  summary: z.string(),
  description: z.string(),
  locations: z.array(z.string()),
  appearsIn: z.array(z.string()),
  fate: z.string().optional(),        // у Лавкрафта это важное поле :)
  sources: z.array(SourceRef).min(1),
});

export const CreatureSchema = CharacterSchema.extend({
  role: z.undefined().optional(),
  classification: z.enum(["great-old-one","deity","race","entity"]),
});

export const EventSchema = z.object({
  slug: z.string(),
  title: z.string(),
  date: z.string(),               // "1925-03" | "1846" | "prehistory"
  dateSort: z.number(),           // для сортировки таймлайна
  summary: z.string(),
  locations: z.array(z.string()),
  characters: z.array(z.string()),
  appearsIn: z.array(z.string()),
  sources: z.array(SourceRef).min(1),
});
```

Поле `sources` с цитатой — ключевая фича и для демо (кликабельное «основание» каждого факта повышает доверие), и для продукта (авторы захотят видеть, откуда пайплайн взял факт). Закладывай сразу.

## 6. Пайплайн извлечения (`scripts/`)

### 6.1 Шаги

1. **`normalize.ts`** — чистка исходников: убрать шапки Gutenberg, нормализовать переносы, разбить на пронумерованные абзацы. Выход: `corpus/normalized/{slug}.json` (`{ slug, title, year, paragraphs: string[] }`).
2. **`extract.ts`** — по рассказу: окно ~3–4 тыс. токенов с перекрытием в 2 абзаца → вызов Claude с tool use (схема ниже) → сырые упоминания сущностей. Модель: `claude-sonnet-4-6`, temperature 0.
3. **`merge.ts`** — дедупликация: группировка по нормализованному имени + алиасам ("Cthulhu" / "great Cthulhu" / "the sleeper of R'lyeh"), слияние упоминаний в одну сущность, конфликтные поля помечаются `NEEDS_REVIEW`. Второй проход LLM: «вот N упоминаний, это одна сущность? сведи в карточку».
4. **Ручная ревизия** — правишь черновики из `content/drafts/`, переносишь в `content/`. Веди счёт: сколько сущностей ок как есть / поправлено / мусор — это метрика качества пайплайна, пригодится в питчах («точность извлечения X%»).
5. **`validate.ts`** — Zod-прогон всех файлов + проверка целостности ссылок (каждый slug в `connectedTo`/`locations` существует). Вешается в CI и на `prebuild`.

### 6.2 Схема extraction-вызова (эскиз)

```ts
const tool = {
  name: "report_entities",
  description: "Report every named location, character, creature and dated event in the passage",
  input_schema: {
    type: "object",
    properties: {
      locations: { type: "array", items: { /* name, type, evidenceQuote, paragraph */ } },
      characters: { type: "array", items: { /* name, role, evidenceQuote, paragraph */ } },
      creatures:  { type: "array", items: { /* ... */ } },
      events:     { type: "array", items: { /* title, dateText, evidenceQuote */ } },
    },
    required: ["locations","characters","creatures","events"],
  },
};
```

Правила промпта, которые сэкономят часы:
- «Extract only what is explicitly in the passage. Do not use outside knowledge of Lovecraft's mythos» — иначе модель тащит факты из фанона и поздних авторов.
- Обязательная `evidenceQuote` на каждую сущность — галлюцинации отваливаются сами: цитату можно машинно проверить точным поиском по тексту (добавь этот чек в `merge.ts`).
- Проси имена «as written in the text», алиасы отдельным полем.

### 6.3 Стоимость

Корпус ~70 тыс. слов ≈ 100 тыс. токенов; с перекрытием окон и вторым проходом merge — грубо 300–400 тыс. входных токенов. На Sonnet это единицы долларов за полный прогон. Можно позволить себе итерации.

## 7. Карта

Подход: **одна иллюстрированная картинка + Leaflet CRS.Simple** (пиксельные координаты, без геопривязки).

- Основа: стилизованная карта Новой Англии Лавкрафта (Аркхэм, Данвич, Кингспорт, Иннсмут-регион, Мискатоник) + врезки-миникарты для удалённых точек (Р'льех в Тихом океане, Безымянный город). Одна большая карта мира на 6 рассказов будет пустой — «регион + врезки» смотрится богаче.
- Изображение: 2048–4096 px, можно сгенерировать AI-иллюстрацию в стиле старинной карты и доработать, либо отрисовать SVG поверх схемы. Тёмная сепия/пергамент — атмосфера продаёт демо.
- Компонент: `react-leaflet`, `L.CRS.Simple`, `ImageOverlay`, маркеры из `location.map.{x,y}`. Клик по маркеру → panel-превью → переход на страницу локации.
- Координаты проставляются руками: маленькая admin-страница (dev-only route), где кликаешь по карте и получаешь `{x, y}` для вставки в JSON — час работы, сэкономит массу возни.

## 8. Структура приложения

FSD-lite (полный FSD для проекта такого размера — оверкилл, но слои соблюдаем):

```
src/
  app/                      # роуты (App Router, всё generateStaticParams)
    page.tsx                # карта — главная
    locations/[slug]/page.tsx
    characters/[slug]/page.tsx
    creatures/[slug]/page.tsx
    stories/[slug]/page.tsx # рассказ: сводка + все его сущности
    timeline/page.tsx
    about/page.tsx          # что это, PD-статус, CTA «хочу такой атлас для своей книги»
  widgets/                  # WorldMap, EntityCard, Timeline, RelationGraph
  entities/                 # location/, character/, ... (типы + ui-карточки)
  shared/                   # schemas.ts, lib/content.ts (чтение+валидация JSON), ui/
content/
  locations/*.json  characters/*.json  creatures/*.json  events/*.json  stories/*.json
  drafts/                   # выход пайплайна до ревизии (в .gitignore или отдельной ветке)
corpus/
  raw/  normalized/
scripts/
  normalize.ts  extract.ts  merge.ts  validate.ts
```

**SEO-требования (это точка всей затеи — органический трафик):**
- `generateMetadata` на каждой странице: title вида «Arkham — Lovecraft Atlas», описание из `summary`.
- OG-изображения через `next/og` (карточка сущности на фоне карты) — обязательно, демо будут шарить в соцсетях/Discord.
- `sitemap.xml`, `robots.txt`, JSON-LD (`Place`/`Person`/`CreativeWork`).
- Каждая страница — полноценный HTML на билде (никаких client-only данных).

## 9. Этапы

**M0 — каркас (1 вечер).** Репозиторий, Next.js + TS + Tailwind, Zod-схемы, 3 локации руками в JSON, деплой на Vercel. Пайплайна ещё нет — сначала убедись, что контент-цикл «JSON → страница» работает.

**M1 — пайплайн на одном рассказе (1 неделя).** «The Call of Cthulhu»: normalize → extract → merge → ревизия. Цель — понять реальное качество извлечения и время ревизии на рассказ. Это главный технический риск проекта, поэтому он первый.

**M2 — карта (3–4 вечера).** Изображение карты, Leaflet-виджет, admin-кликер координат, маркеры, панель-превью.

**M3 — полный корпус (1 неделя).** Остальные 5 рассказов через пайплайн, страницы персонажей/существ/таймлайн, перекрёстные ссылки.

**M4 — полировка и запуск (3–4 вечера).** OG-картинки, метадата, Plausible, страница about с CTA и формой email, пост в r/Lovecraft + r/worldbuilding. Метрики успеха: дочитываемость (время на сайте), доля перешедших на ≥3 страницы, конверсия в email.

Итого ~4–5 недель при 10 ч/нед. Если к концу M1 ревизия одного рассказа занимает больше 3–4 часов — стоп, чинить пайплайн, а не тащить объёмом.

## 10. Мост к продукту (чтобы решения не пришлось переделывать)

| Демо | Продукт |
|---|---|
| `content/*.json` | таблицы Postgres + pgvector (схемы уже есть — Zod → Drizzle почти механически) |
| `scripts/extract.ts` вручную | NestJS + BullMQ: джоба на загруженную рукопись |
| ручная ревизия в git | UI ревизии для автора («подтвердить/поправить сущность») |
| одна карта-картинка | загрузка карты автором либо автогенерация схемы |
| Vercel-статика | тот же Next.js + рендер по подписке |

Дисциплина одна: весь доступ к данным — только через `shared/lib/content.ts`. Тогда миграция на БД — замена одного модуля.
