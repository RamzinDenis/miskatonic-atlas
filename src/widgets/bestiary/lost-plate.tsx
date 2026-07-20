/**
 * A wanting plate: the mount that should hold an engraving, and the
 * keeper's note where the engraving is not. Four of the atlas's beasts were
 * never drawn — the folio admits it in its own voice rather than hiding the
 * gap, and the day the art arrives the register's `art` field is filled and
 * this is gone.
 *
 * No hooks: the showcase island and the server-rendered leaf both print it.
 */

export function LostPlate({ fig, className = "" }: { fig: number; className?: string }) {
  return (
    <div className={`bestiary-figure ${className}`}>
      <div className="bestiary-mount">
        <span className="bestiary-mount-fig">Fig. {fig}</span>
        <p className="bestiary-mount-note">
          Plate wanting.
          <span className="mt-1 block">
            Withdrawn from the folio, or never engraved.
          </span>
        </p>
      </div>
    </div>
  );
}

/** The same empty mount at ribbon size — a number in a double rule. */
export function LostPlateThumb({ fig }: { fig: number }) {
  return (
    <span className="bestiary-mount bestiary-mount--thumb">
      <span className="bestiary-mount-fig">{fig}</span>
    </span>
  );
}
