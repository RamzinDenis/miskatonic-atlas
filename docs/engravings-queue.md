# Очередь генерации гравюр

> Процедура и стиль-блоки: `docs/engravings.md`. Сгенерированное вычёркивать.

## The Nameless City — сгенерировано 23.07, промпты сохранены для истории

### 1. ~~The Crawling Reptiles — гравюра-маска (жанр А)~~

Сделано 23.07: `monster-the-crawling-reptiles-of-the-nameless-city.png` →
маска бестиария aspect 0.765 + маргиналия в пустыне у города (3770, 1540).

Бестиарий (лист + витрина); маргиналия на карте — по решению владельца
(у пина города — суша Аравии; аннотатор мог рисовать и на пустой пустыне,
место есть юго-восточнее пина — иначе `BESTIARY_ONLY`).

Референсы: `public/plates/monster-cthulhu.png` + `monster-tornasuk.png`.

```
Highly detailed black-and-white ink engraving in the manner of a 19th-century
natural-history plate: dense crosshatching and stippling, pure black India ink
on a plain pure-white background. A single isolated figure, complete and
uncropped, centered with clear white margins on every side. No frame, no
border, no caption, no lettering, no signature, no background scenery.
Square canvas.

Subject, drawn strictly after the text of H. P. Lovecraft's "The Nameless
City" and nothing else:

"They were of the reptile kind, with body lines suggesting sometimes the
crocodile, sometimes the seal... In size they approximated a small man, and
their forelegs bore delicate and evidently flexible feet curiously like human
hands and fingers... Not Jove himself had had so colossal and protuberant a
forehead; yet the horns and the noselessness and the alligator-like jaw placed
the things outside all established categories."

A single reptilian creature the size of a small man, crawling low on four
limbs, seen in profile three-quarter view. Its body suggests both crocodile
and seal; its forelegs end in delicate, flexible feet uncannily like human
hands. The head has a colossal protuberant forehead, two horns, no nose, and
a long alligator-like jaw. It is gorgeously enrobed in an ornate mantle and
laden with ornaments of gold and jewels, like a mummified priest of a vanished
race. NOT a dinosaur, NOT a lizard-man standing upright — a crawling robed
thing.
```

### 2. ~~Plate VII «город под луной» — вклейка (жанр Б)~~

Сделано 23.07: `src/widgets/plates/the-nameless-city.png` →
`locations/the-nameless-city` (страница + превью пина + галерея рассказа).

Референсы: `src/widgets/plates/rlyeh.png` + `swamp-ritual.png`.

```
A full-page wood-engraved book plate in the manner of Gustave Doré: fine
parallel hatching, deep rich blacks, dramatic light, engraved on lightly
toned antique paper, enclosed in a thin single-rule border like an
illustration from a 19th-century edition. No text, no caption, no lettering,
no signature anywhere on the plate.

Subject, drawn strictly after the text of H. P. Lovecraft's "The Nameless
City" and nothing else:

"I was traveling in a parched and terrible valley under the moon, and afar I
saw it protruding uncannily above the sands as parts of a corpse might
protrude from an ill-made grave."

A vast ruined city half buried in desert sand under a cold full moon: low
broken walls and shapeless foundations protruding from the dunes like the
limbs of a corpse from a shallow grave. In the foreground a tiny lone figure
of a traveler with a camel looks on from a ridge of the dark valley, dwarfed
by the ruins and the moonlit sky. Deep shadows across the sand; the moon low
and huge.
```

### Опционально: «орда против светящегося эфира» (жанр Б, ¶38)

Вторая вклейка — «a nightmare horde of rushing devils... outlined against the
luminous aether of the abyss» — сцена для страницы рассказа. Промпт напишу,
если владелец захочет вторую пластину; иначе не генерируем (по одной вклейке
на рассказ, как у Dagon).

Сделано:

- ~~The Thing — гравюра-маска~~ (23.07: `monster-the-thing.png` → маска
  бестиария aspect 0.880 + маргиналия у острова Dagon'а)
- ~~Plate VI «тварь у монолита» — вклейка~~ (23.07: `monolith-rite.png` →
  `locations/cyclopean-monolith`)

Решено без генерации: **dagon (бог)** — остаётся утраченной пластиной,
в тексте только имя из филистимлянской легенды.
