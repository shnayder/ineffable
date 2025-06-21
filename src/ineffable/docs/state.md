# State management plan

# Desires

- let the user edit the document and persist changes, including adding comments
- prefer immutable data structures
- keep full version history — be able to replay the entire document history edit by edit.
- be flexible for development, as I add features, change format, etc — be able to load sample text, or migrate ongoing work
- still just local prototyping, but I want it backed up in dropbox at least, so not sure in-browser DB is enough unless there's a way to download as a file

## Plan

Tech:
- Use zustand to store document inside react
- Persist to IndexDB using idb
- use immer for immutable state and patches
- allow manual json downloads and upload for backup and restore

Design. 
- v0 just store the latest version, update in-place
    - "document": myDoc
    - doc annotations should live with the doc
    - "rules": TBD — or similar name.
- v0.1 store latest version, periodic snapshots (e.g. every 100 edits), and patches
- vN: indexes, restructuring, etc. TBD if and when needed.

Types
- allow annotations on any object, so use a single id space for for all document elements and annotations.
- all objects should be self-describing -- include a 'kind' field
- include a scheme version number in every object

- store document as one key, 




- Use Immer Patches: Record only the changes as patches.
Replay Efficiently: Use snapshots plus recent patches to reconstruct state quickly.
Persist in JSON: Save the snapshot and patch history to a file for Dropbox backup.
Plan for Migrations: Add a logical version to your stored data and build migration steps as needed.