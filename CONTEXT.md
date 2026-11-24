# gpx-manager

A private explorer and manager for a folder of GPX files: browse them, see their Routes together on a map, and find duplicates.

The Library, not a platform like Komoot or Strava, is where the user keeps every Route. Linking those platforms to a bike computer (e.g. Wahoo) syncs every saved route onto the device and buries the few that matter. Those platforms also make it hard, or paid, to manage many Routes visually on one map; here the map is a first-class way to manage the Library.

## Language

**GPX File**:
A single `.gpx` file in the Library, holding one Route. The unit you browse and delete.
_Avoid_: Document, record

**Route**:
The line a GPX File describes: a planned or exported way to ride. Drawn on the map and compared to find Duplicates.
_Avoid_: Track, path, line, course

**Library**:
The folder of GPX Files the app manages, mounted from the host machine.
_Avoid_: Repository, collection, volume

**Trash**:
A folder inside the Library where deleted GPX Files are moved, each remembering its original location so it can be restored there. Files leave the Library for good only when the Trash is emptied.
_Avoid_: Bin, quarantine, archive

**Activity**:
Something the user actually rode, as recorded in their Strava account. Never a line from a GPX File.
_Avoid_: Ride, workout, track, route

**Ride History**:
All of a user's Activities from Strava, shown as a map layer so they can see which lines they have already ridden.
_Avoid_: Heatmap, ridden layer, passed routes

**Sync**:
Bringing the app up to date with the Library on disk and with the user's Ride History. Runs at startup and when the user asks for it.
_Avoid_: Refresh, import, scan

**Identical Duplicate**:
Two or more GPX Files with exactly the same content (same size and checksum), whatever their names.
_Avoid_: Copy, clone

**Similar Duplicate**:
Two or more GPX Files whose Routes follow essentially the same line in either direction, though their content differs. A Route that merely contains another (a 200k that includes a 100k) is not a Similar Duplicate.
_Avoid_: Near-duplicate, match

**Owner**:
The user who may change the Library (delete GPX Files, empty the Trash). Other users may only view.
_Avoid_: Admin, superuser
