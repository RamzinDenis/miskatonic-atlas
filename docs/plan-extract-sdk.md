# План — extract/merge через Anthropic SDK (бэклог, пункт 2)

Зафиксирован 2026-07-23 по итогам grilling-сессии. Пересматривает ADR-0001:
LLM-шаги пайплайна переезжают из плейбуков-в-сессии-Claude-Code в скрипты на
Anthropic SDK. Промпты (`prompts/extract.md`, `prompts/merge.md`) и контракт
«выход — черновики в `content/drafts/`, ревью человеком в `/admin/review`» не
меняются. Детерминированные шаги (normalize, verify-quotes, check-drafts,
validate) — как были.

## Решения сессии

1. **Скоуп — оба LLM-шага**: `scripts/extract.mts` и `scripts/merge.mts`.
   Пайплайн «рассказ → merged-черновики» воспроизводится командами, человек
   появляется только на ревью. Закрывает consequence ADR-0001.
2. **Модель — `claude-sonnet-5`** ($2/$10 за Mtok, интро-цена до 2026-08-31).
   Adaptive thinking включён по умолчанию (поле `thinking` не передавать),
   sampling-параметры не передавать (Sonnet 5 их отвергает). Смета ~$2–3 на
   весь оставшийся корпус; бюджет консоли $20.
3. **Structured outputs**: `output_config.format` через `zodOutputFormat`
   (`@anthropic-ai/sdk/helpers/zod`, метод `client.messages.parse()`).
   Секции Output обоих плейбуков формализуются в Zod-схемы:
   OccurrenceRecord (окно извлечения) и merged-черновик (финальная схема
   сущности + блок `_draft`; `paragraph` в sources). Схемы — в отдельном
   модуле (`src/shared/draft-schemas.ts`), контентные `schemas.ts` не трогаем.
   Правила извлечения/слияния остаются текстом промпта как есть.
4. **Merge в две волны, как в M2**: волна 1 — локации (в контексте реестр
   слагов существующего `content/`), волна 2 — персонажи + существа (реестр
   волны 1 + существующий контент). Обогащение существующих сущностей — по
   правилам плейбука (совпадение имени/слага → старт от существующего JSON).
   `REVIEW.md` рассказа генерирует скрипт детерминированно из данных — LLM
   его больше не пишет.
5. **Порядок — Dagon первым, целиком**: extract → verify-quotes → merge →
   check-drafts → ревизия в `/admin/review`. Гейт тот же, что в M2: ≥70%
   as-is+edited → гнать остальные четыре (The Nameless City, The Festival,
   The Colour Out of Space, The Dunwich Horror); иначе чинить
   промпты/скрипт, не тащить объёмом. Это же — проверка боем ревью-UI
   (бэклог, пункт 1).

## Механика

- **Ключ**: `ANTHROPIC_API_KEY` в `.env.local` (уже в .gitignore). Запуск:
  `node --env-file=.env.local scripts/extract.mts <storySlug>` (Node ≥20.6,
  без dotenv-зависимости). npm-скрипты `extract` / `merge` с прокинутым
  `--env-file`.
- **Зависимость**: `@anthropic-ai/sdk` (dev). Установка согласована.
- **Идемпотентность**: существующие файлы окон пропускаются, `--force` —
  перепрогон. Окна пишутся на диск по мере готовности.
- **Оркестрация**: `extract.mts` в конце сам запускает `npm run
  verify-quotes` и падает при битых цитатах. `merge.mts` предполагает
  зелёный verify-quotes, после себя подсказывает `npm run check-drafts`.
- **Параллелизм**: окна — до 4 одновременно (rate-limit первого тира);
  ретраи 429/5xx у SDK из коробки. Волны merge — последовательно,
  стримингом (`client.messages.stream` + `finalMessage`, max_tokens 64000).
- **Учёт стоимости**: каждый вызов логирует usage-токены; в конце прогона —
  итог по токенам и долларам.
- **Вход extract**: окно 12 абзацев, перекрытие 2 — как в плейбуке; рендер
  `¶<n> [Chapter <c>]: <text>`; правила+Output из `prompts/extract.md`
  вставляются в промпт из файла (плейбук — источник истины).

## Порядок исполнения (новая сессия)

1. Корпус: скачать 5 рассказов с Project Gutenberg в `corpus/raw/` (источник
   во фронтматтере), `npm run normalize`.
2. `npm i -D @anthropic-ai/sdk`; `draft-schemas.ts`; `extract.mts`;
   `merge.mts`; npm-скрипты.
3. Прогон Dagon, ревизия в `/admin/review`, счётчики гейта.
4. По гейту — остальные четыре рассказа; координаты новых локаций через
   `/admin/coords`; прогон курации prominence (режим Curation ревью-UI).
5. ADR-0003 «extract/merge через Anthropic SDK» (суперсидит ADR-0001, статус
   0001 → superseded), правка PLAN.md, коммит.

## Вне скоупа

События/таймлайн, пересмотр промптов (только перенос исполнителя), Batch API
(объём мал, интерактивность ценнее 50% скидки), региональная карта.
