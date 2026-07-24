# Региональная карта «Miskatonic Country» — спека подложки и интеграции

> Статус: решения согласованы с владельцем (сессия 2026-07-24).
> Закрывает пункт 4 бэклога PLAN.md. Опирается на ADR-0002 (вымышленная
> география получает иллюстрированную региональную карту через `mapId`;
> генерация здесь уместна), ADR-0003 (подлокации — секции страницы родителя,
> не пины) и редакторскую процедуру `docs/engravings.md`.

## Решения

1. **Подложка генерируется редактором** (канал engravings.md: Claude пишет
   промпт, владелец генерирует в ChatGPT несколько вариантов, отбирает один,
   Claude интегрирует).
2. **Без надписей.** Подложка — чистый рельеф; топонимы, пины и лейблы
   рендерит сайт, как уже делает на мировой карте. Орфография гарантирована,
   а топоним будущего рассказа добавляется строкой кода — без перегенерации
   и миграции координат (больное место ADR-0002).
3. **Топонимы — только из текстов корпуса** (правило engravings.md № 3).
   Поэтому на карте есть Kingsport (The Festival) и blasted heath (The Colour
   Out of Space) — оба рассказа ещё впереди, но их география закладывается
   сразу, чтобы не перерисовывать подложку через рассказ. Иннсмута и прочего
   внешнего мифоса нет: его нет в корпусе.
4. **`mapId: "new-england"`.** Значение default `"world"` в схеме не трогаем;
   валидация (`scripts/validate.ts`) должна проверять, что `mapId` — из
   реестра карт.
5. **Одна локация — одна карта.** `map` в схеме — один объект; локации-«мосты»
   (Boston, New England) остаются на мировой, на региональной они — часть
   рельефа без пина. Пересмотр (массив размещений) — только если реальная
   навигация упрётся, не впрок.
6. **Prominence действует и здесь**: региональная карта показывает только
   major. Подлокации (parentSlug) пинов не получают — их якорь на странице
   родителя (ADR-0003).

## Канон географии (цитаты корпуса)

| Объект | Привязка | Источник |
|---|---|---|
| Miskatonic River | верховья вьются «serpentlike» у подножий куполообразных холмов; долина — «the upper Miskatonic valley» | Dunwich ¶3, ¶51, ¶62 |
| Dunwich | north central Massachusetts; не та развилка Aylesbury pike сразу за Dean's Corners; деревня зажата между рекой и склоном Round Mountain, крытый мост, гниющие гамбрельные крыши | Dunwich ¶2–4 |
| Sentinel Hill, Cold Spring Glen, Devil's Hop Yard, Whateley farm | окрестности Данвича (ферма — 4 мили от деревни); всё это подлокации — на странице Данвича, не на карте | Dunwich ¶9–¶11, ¶17, ¶27, ¶74 |
| Aylesbury | ближайший к Данвичу город внешнего мира: пайк, врач Houghton, суд, полиция штата, газета Transcript | Dunwich ¶14, ¶29, ¶62, ¶94 |
| Arkham | город с Miskatonic University и его библиотекой («the nearest to him» от Данвича); газета Advertiser; крик слышен «half the sleepers of Arkham» | Dunwich ¶41, ¶53 |
| остров в Мискатонике | «the small island in the Miskatonic where the devil held court beside a curious stone altar» — у Аркхэма | Colour ¶11 |
| blasted heath | «West of Arkham the hills rise wild»; старая дорога через холмы, новая изгибается к югу; будущее водохранилище | Colour ¶1–3 |
| Kingsport | морской городок у гавани: верфи, мостики, «church-crowned central peak», лабиринт крутых улочек; рядом с Аркхэмом (после спасения в гавани рассказчика переводят в госпиталь St. Mary's в Аркхэме) | Festival ¶4, ¶27–28 |
| Boston / Harvard | внешний мир: Boston Globe, «students of archaic lore in Boston», Widener Library at Harvard | Dunwich ¶5, ¶24, ¶41, ¶51 |

## Раскладка кадра

Альбомный кадр, восток (Атлантика) — справа. Редакторские допущения сверх
канона помечены (*).

- **СЗ-четверть** — данвичский край: куполообразные лесистые холмы с кольцами
  камней на вершинах, деревушка у реки под Round Mountain, крытый мост.
- **Река** — от истоков на СЗ серпантином на юго-восток через долину к морю;
  устье у Аркхэма (*), перед городом — островок.
- **Восточный край** — побережье; Аркхэм на нижнем Мискатонике у моря (*).
- **Кингспорт** — на побережье южнее Аркхэма (*; канон говорит лишь «рядом»),
  компактный городок на холме над гаванью.
- **Между Данвичем и Аркхэмом** — Aylesbury pike с развилкой у Dean's Corners;
  Эйлсбери — городок на пайке юго-восточнее Данвича (*).
- **Западнее Аркхэма** — дикие лесистые холмы, серое выжженное пятно (blasted
  heath), старая прямая дорога и новая в обход к югу.
- **ЮВ-угол** — Бостон (крупный город на заливе) с Кембриджем/Гарвардом (*).
- Провиденса нет — реальная география остаётся на мировой карте.

Пины первой волны (после выбора подложки, кликером): `dunwich`, `arkham`,
`aylesbury`, `harvard`, `miskatonic-river`; далее — по мере рассказов
(Kingsport, blasted heath).

## Требования к изображению (жанр В — картографическая подложка)

- альбомный формат ≈4:3, длинная сторона ≥3072 px;
- тон и фактура — под скан Colton 1852 (`public/maps/world.jpg`): состаренная
  кремовая бумага, тонкая гравюрная линия, лёгкая ручная подкраска допустима;
- **никакого текста**: ни топонимов, ни картуша с надписью, ни легенды, ни
  цифр; роза ветров — только без букв;
- без рамки-паспарту (виньетку и износ добавляет сайт, как на мировой);
- города — крошечные скопления домиков, дороги — тонкие двойные линии,
  холмы — штриховка-hachure, леса — гравюрные кроны, море — стипль у берега.

## Промпт

Стиль-блок (вставляется в каждый промпт жанра В; референсом приложить
фрагмент `public/maps/world.jpg`):

```
An antique engraved regional map in the manner of a mid-19th-century American
county survey map: fine copperplate line work, hachured hills, tiny clusters
of house-shapes for towns, thin double-line roads, engraved forest canopies,
stippled shoreline and rippled sea, printed on aged cream paper with light
foxing and a subtle hand-tinted wash. CRITICAL: absolutely no lettering of
any kind — no place names, no title, no cartouche text, no legend, no
numbers, no signature; a compass rose is allowed only if it bears no letters.
No decorative border or frame. Landscape canvas, about 4:3.
```

Предмет (строго по текстам корпуса, без внешнего мифоса):

```
A fictional stretch of rural New England, drawn strictly after the geography
in H. P. Lovecraft's "The Dunwich Horror", "The Festival" and "The Colour
Out of Space" and nothing else. The Atlantic coast runs along the right
(eastern) edge. A river rises in the northwest among great rounded
dome-like wooded hills — some crowned with rings of standing stones — and
winds serpent-like southeast through a deep valley to the sea. Huddled
between the river and the steep slope of a round mountain in the northwest
sits a tiny decaying village reached by a covered wooden bridge. A turnpike
road runs from that lonely country southeast toward the coast, forking at a
tiny hamlet; on the pike stands a small market town. Near the river's mouth
on the coast lies an old town with a college, a small islet in the river
just above it. On the coast to its south, a compact ancient seaport climbs
a steep hill above a snug harbor with wharves, crowned by a church at its
peak. West of the college town the hills rise wild and wooded, with a small
grey blasted barren patch where an old straight road runs through and a
newer road curves around to the south. In the southeast corner spreads a
large city on a broad bay. Empty sea fills the remaining east; wild wooded
hills the rest.
```

## Чеклист отбора варианта

Вариант принимается, если читаются: изгибающаяся река СЗ→ЮВ; куполообразные
холмы с каменными кольцами на СЗ; деревушка + крытый мост + круглая гора;
пайк с развилкой и городком; город у устья с островком; портовый городок на
холме с гаванью южнее; выжженное пятно к западу от него; большой город на
заливе в ЮВ-углу; нигде нет ни одной буквы.

## Интеграция после выбора (порядок)

Кодовая обвязка (пп. 2–6) сделана заранее, 2026-07-24; реестр живёт в
`src/shared/maps.ts` (не в geometry.ts — чистые данные, доступные Node-скриптам),
geometry его реэкспортирует.

1. **Ассеты** (осталось): `public/maps/new-england.jpg` + производные через
   `scripts/build-map-images.mjs` (webp 1024/2048, lqip; скрипт печатает
   размеры для реестра, отсутствующий файл пропускает). Слой износа — потом,
   по желанию.
2. ✅ **Реестр карт** — `MAPS` в `src/shared/maps.ts` (id, title, url, размеры,
   лестница sheets; `calibrated` только у world — у вымышленной географии
   градусов нет). Шаблон записи new-england закомментирован в файле —
   вписать размеры после п. 1.
3. ✅ **`content.ts`**: `getMapLocations`/`getMapLegend`/`getPickerLocations`
   принимают `mapId`; легенда показывает только рассказы с пинами на этой
   карте; сид наследует карту якоря; `checkIntegrity` проверяет `mapId` ∈
   реестр.
4. ✅ **Роут** `/maps/[mapId]` (мировая остаётся главной `/`); `?focus=` и
   «View on the chart →» ведут на карту локации по её `mapId` (`chartPath`).
   Мировые слои (маршруты, твари-маргиналии) гейтятся `chart.id === "world"`.
   Угловая «врезка-указатель» между картами — при первом визуальном проходе.
5. ✅ **Пикер**: `/admin/coords?map=new-england`, переключатель карт в панели,
   очередь общая — размещение кликом падает на открытую карту, JSON-сниппет
   и save пишут `mapId` (world остаётся без поля, по default схемы).
6. ✅ **Врезки-миникарты** (`map-inset.tsx`): фрагмент подложки по `mapId`
   локации; без калибровки вместо градусов печатается название карты.
7. **Пины первой волны** кликером (осталось; список выше).
