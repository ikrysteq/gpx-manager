# PROTOTYPE: UI layout (throwaway)

Three radically different layouts of the whole gpx-manager UI on the app root, switchable via `?variant=A|B|C`,
the pink floating bar, or ← / →. Answers "what should the UI look like?" for issue #1 (layout, file panel,
overlap picker, Sync dialog, header). Fake in-memory data only: no backend, no persistence.

Run (from the repo root):

```sh
npm --prefix frontend install
npm --prefix frontend run prototype   # http://localhost:5173/?variant=A (also on the LAN for a phone)
```

- `&syncFail=1` shows a failed Ride History step (Statshunters 401).
- "state" on the pink bar shows the shared state (filter, selection, Trash, Sync).
- To find the overlap picker, open "Kraków okolice" and click near Kraków where Routes start together.

| | A: Workbench | B: Map-first | C: Rail + inline |
|---|---|---|---|
| Layout (desktop) | tree · sortable table · map | full-screen map, floating card (search, folder chip, list) | icon rail · breadcrumb folders + shape-thumbnail list · map |
| Layout (phone) | filter row + List/Map bottom tabs | map + draggable bottom sheet (peek/half/full) | app bar with List/Map segmented control + ⋯ menu |
| File panel | docked panel on map's right edge; phone: bottom sheet | detail screen inside the same card/sheet (back to list) | row expands inline; phone: full-screen page |
| Overlap picker | popover at the pointer; phone: bottom sheet | list screen inside the card/sheet | "colour lens": candidates recoloured + matching chips at the bottom |
| Sync dialog | centred modal, two columns | non-modal dark floating card, collapsible | full-height right side sheet, stacked |
| Header items | top bar: search, duplicates, Layers, Sync, Trash, Settings | floating map controls top-right | left rail (Library, Trash, Layers, Sync, Settings) |
