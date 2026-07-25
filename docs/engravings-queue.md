# Очередь генерации гравюр

> Процедура и стиль-блоки: `docs/engravings.md`. Сгенерированное вычёркивать.

## The Dunwich Horror — текущая очередь (составлена 25.07)

Рассказ дал шесть существ; правило 3 (`docs/engravings.md` — нет цитаты со
внешностью, нет гравюры) пропускает из них два.

**Гравируем:** `the-dunwich-horror`, `whippoorwills`.

**Остаются утраченными пластинами** — и это не пробел, а сам текст:
`yog-sothoth` (только «is the gate… is the key and guardian of the gate» —
отца никто не видит), `the-old-ones` («of Their semblance can no man know»
сказано прямым текстом), `elder-things` (только бред Армитеджа об их
намерении), `shub-niggurath` (один возглас «Iä Shub-Niggurath!» и ничего
больше — единственный из шести оставлен вообще без курации, без латыни).

**Обе сгенерированы и подключены 25.07.** Гейт `chart.id === "world"` со слоя
тварей снят той же правкой: у записи в `monsters.ts` появился `mapId`, и
дануичский ужас стал первой маргиналией не на мировом скане — сидит на голой
макушке купола над деревней (400, 330), выбор владельца. Птица осталась только
в фолио (`BESTIARY_ONLY`): единственный обычный зверь атласа, ему место на
листе, а не на полях карты.

### 1. ~~The Dunwich Horror — гравюра-маска (жанр А)~~

Референсы: `public/plates/monster-cthulhu.png` + `monster-tornasuk.png`.
Драфт эффектов для реестра: `["breath", "ink-shiver", "gaze-tilt",
"vermilion-pulse"]` — студенистая масса дышит, чернила дрожат, выпученные
глаза ведут за курсором, красные глаза получеловечьего лица тлеют киноварью.

```
Highly detailed black-and-white ink engraving in the manner of a 19th-century
natural-history plate: dense crosshatching and stippling, pure black India ink
on a plain pure-white background. A single isolated figure, complete and
uncropped, centered with clear white margins on every side. No frame, no
border, no caption, no lettering, no signature, no background scenery.
Square canvas.

Subject, drawn strictly after the text of H. P. Lovecraft's "The Dunwich
Horror" and nothing else:

"Bigger 'n a barn ... all made o' squirmin' ropes ... hull thing sort o'
shaped like a hen's egg bigger'n anything, with dozens o' legs like hogsheads
that haff shut up when they step ... nothin' solid abaout it—all like jelly,
an' made o' sep'rit wrigglin' ropes pushed clost together ... great bulgin'
eyes all over it ... ten or twenty maouths or trunks a-stickin' aout all along
the sides, big as stovepipes, an' all a-tossin' an' openin' an' shuttin' ...
all gray, with kinder blue or purple rings ... an' Gawd in Heaven—that haff
face on top!..."

"that face with the red eyes an' crinkly albino hair, an' no chin, like the
Whateleys.... It was a octopus, centipede, spider kind o' thing, but they was
a haff-shaped man's face on top of it, an' it looked like Wizard Whateley's,
only it was yards an' yards acrost...."

A single colossal boneless mass shaped like an enormous hen's egg standing on
end, its whole body built of separate writhing ropes pressed close together,
with no solid form anywhere — jelly, not flesh. Dozens of thick columnar legs
like barrels run down its sides, half telescoping as they step. Great bulging
eyes are scattered all over the body, and ten or twenty gaping trunk-like
mouths, each as wide as a stovepipe, stick out along the flanks, tossing and
opening. Crowning the top of the mass is a half-formed human face — an old
man's face with no chin, sunken red eyes and lank crinkly hair — grown
monstrously wide, as if a portrait had been stretched across the whole crest
of the thing. NOT a dragon, NOT a giant octopus, NOT a humanoid figure: an
egg-shaped heap of squirming ropes wearing a half-face like a crown.
```

### 2. Whippoorwills — гравюра-маска (жанр А)

Единственный обычный зверь во всём фолио: настоящая птица, названная в тексте
по имени, — и потому гравюра ей полагается ровно та, какую печатал бы
натуралист. Жуть — в подписи, не в рисунке.

Референсы: те же. Драфт эффектов: `["ink-shiver", "gaze-tilt"]` — мелкая
нервная птица, «дышать» ей не по размеру.

```
Highly detailed black-and-white ink engraving in the manner of a 19th-century
natural-history plate: dense crosshatching and stippling, pure black India ink
on a plain pure-white background. A single isolated figure, complete and
uncropped, centered with clear white margins on every side. No frame, no
border, no caption, no lettering, no signature, no background scenery.
Square canvas.

Subject, drawn strictly after the text of H. P. Lovecraft's "The Dunwich
Horror" and nothing else:

"the natives are mortally afraid of the numerous whippoorwills which grow
vocal on warm nights. It is vowed that the birds are psychopomps lying in wait
for the souls of the dying, and that they time their eery cries in unison with
the sufferer's struggling breath."

A single whippoorwill — the North American nightjar, Caprimulgus vociferus —
perched crosswise on a bare branch, in the exact manner of an ornithological
plate: the whole bird in profile three-quarter view, mottled bark-like
plumage rendered in fine stipple, large dark night-adapted eye, tiny beak
opened wide into the enormous gaping bristled mouth of its cry. Wings folded,
tail slightly spread. Nothing supernatural is added — an ordinary bird, drawn
from life, caught mid-call.
```

### 3. Plate VIII «заклинание на вершине» — вклейка (жанр Б)

Следующий свободный номер — **VIII** (I–VII заняты). Хозяин — страница
рассказа `stories/the-dunwich-horror` (как Plate IV у «Зова Ктулху»);
альтернатива — `locations/dunwich`, если захочется держать вклейку у места.

Сцена выбрана так, чтобы **не повторять бестиарий**: зверя на ней нет вовсе —
и это буквально по тексту, тварь невидима, толпа внизу видит только трёх
человечков и пустую вершину. Гравюра держится на цитатах ¶2, ¶17, ¶131, ¶133.

Референсы: `src/widgets/plates/rlyeh.png` + `swamp-ritual.png`.

```
A full-page wood-engraved book plate in the manner of Gustave Doré: fine
parallel hatching, deep rich blacks, dramatic light, engraved on lightly
toned antique paper, enclosed in a thin single-rule border like an
illustration from a 19th-century edition. No text, no caption, no lettering,
no signature anywhere on the plate.

Subject, drawn strictly after the text of H. P. Lovecraft's "The Dunwich
Horror" and nothing else:

"A purplish darkness, born of nothing more than a spectral deepening of the
sky's blue, pressed down upon the rumbling hills."

"One figure, he said, seemed to be raising its hands above its head at
rhythmic intervals... The weird silhouette on that remote peak must have been
a spectacle of infinite grotesqueness and impressiveness."

"the sky silhouettes with especial clearness the queer circles of tall stone
pillars with which most of them are crowned"

"the top of Sentinel Hill where the old table-like stone stands amidst its
tumulus of ancient bones"

A rounded, too-symmetrical bare hill seen from far below across a wooded
valley, its crown ringed with tall rough-hewn standing stones about a low
table-like altar-slab. Three tiny distant human figures stand on the topmost
ridge a little apart from the slab; the middle one has both arms raised above
its head. The sky above is a deep unnatural darkness pressing down on the
hills — not storm cloud but a spectral deepening of the daylight itself —
with a single stroke of lightning aloft. In the shadowed foreground, at the
mountain's foot, a small huddled crowd of countryfolk in shabby farm clothes
stands in a muddy road looking up, one of them steadying a brass telescope.
CRITICAL: the summit is empty apart from the three men and the stones — no
creature, no monster, nothing visible where the horror is. The terror is that
there is nothing to see.
```

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
