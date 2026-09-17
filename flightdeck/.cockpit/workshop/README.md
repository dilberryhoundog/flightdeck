# Workshop

Small fixes, defects and loose ends the pilot has come across. Not missions. A mission is reserved for bigger-scoped work the commander has said or the pilot has eventually noticed; the incubator is the pre-step for those, and not every spark is promoted. Everything smaller is left here to get fixed.

`workshop.json` is the index. Each item has an id `W###`, a title, where it came from, its status and where it was fixed. An item gets its own file `W###-slug.md` only when the fix needs notes longer than a line.

## How items move

- **Raised.** The pilot logs an item the moment a defect or loose end is noticed, with its source (a log, a crew finding, a test).
- **Swept.** When a mission aligns with an item, the item is swept into that mission and its status says so. Sweeping is the pilot's call.
- **Fixed.** Either by the pilot inside the cockpit, or by a workshop team dispatched to run a batch of items through. Fixes outside the cockpit still need a proposal in `base/` and the commander's approval.
- **Dropped.** An item that stops mattering is closed with a reason, never deleted.

Statuses: `open`, `swept`, `fixed`, `dropped`.

## Workshop teams

A workshop team is a crew dispatched to work a batch of open items rather than one mission. It gets the item ids, the sources, and the usual brief. Its reports land in `../notepad/`, and the pilot marks the items.
