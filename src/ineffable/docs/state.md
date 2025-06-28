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
- Persist to storage, later IndexDB using idb
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
- include a schema version number in every object

# Data store

- Elements: store document structure as a tree. Paragraphs, sentences, words, others later.
   - Each element has an id, kind, contents, and childrenIds.
   - stored normalized in a map: id -> Element
   - elements are immutable -> changes to the doc result in new elements being created, propagating up to the root of
     the document tree. 
- DocumentVersions: pointers to elements with kind=="document", including a version number.
   - we keep a map of these by number, as well as the latest number, so we can show the latest document or any
     previous one.
   - current version bumps every time anything changes — either the doc itself or any annotation

- Annotations: store comments, critiques, suggestions, etc. 
   - also immutable and versioned -> edits to the annotation make a new version.
- ElementAnnotations: mapping between annotations and elements. Also append-only.
   **Q**: won't support annotations on annotations this way. Make more general? Graph of objects? Parts are a tree, but parts don't have to be? Perhaps insist on DAG? Later...
   - annotationId, elementId, validFromVersion, validThroughVersion
   - validFromVersion set to current doc v when created
   - validThroughVersion starts null, set when annotation is superceded by a new one or deleted.

## scenarios

**Note**: For grown-up version of this, need transactions around all of these operations. 

Add an annotation on element el in doc version v:
  1. bump doc version: ++v
  1. create annotation object ann.0
  1. add mapping ann.0 <-> el, validFromVersion = v; validThroughVersion = null

Edit that annotation.
  1. set ann.0.validThroughVersion = v
  1. bump doc version ++v
  1. Create new annotation object ann.1, with prevVersionId = ann.0.id
  1. add mapping ann.1 <-> el, again validFromVersion = v; validThroughVersion = null

Delete annotation
  1. Same as edit, without creating new version
  1. set ann.0.validThroughVersion = v
  1. bump doc version ++v
 
Change element el.0, creating el.1 in its place.
  1. Note: multiple elements may be created at the same version — all parents of actual change, which may itself involve many elements.
  1. Note: el.0 <-> ann mappings are still valid, will naturally disappear from UI once el.0 is out of the tree. So just leave them alone.
  1. bump doc version ++v
  1. for all active annotations ann on el.0, optionally do a semantic check to see if they're still relevant, then make new mappings to el.1, with validFromVersion = v. 
     1. Could make this an async process later.

Look up current annotations on element el, at version v
  1. find all annotations mapping to el.id, with validFromVersion <= v && (v < validThroughVersion || validThroughVersion == null)

# Data model

The model will keep useful in-memory data structures to speed up access to various pieces, and encapsulate the logic of wrangling all the immutable data structures. 

Basic api:

Invariants:
- auto-creates empty doc if needed, so users can assume there's always a documentVersion and a root element.

Reads via read-only hooks for use by components
- model provides hooks that encapsulate reads. Components never need to touch the store directly.
    - useCurrentVersion()
    - useMaxVersionNumber()
    - useElement(id)
    - useAnnotations(elementId)

Writes
- createElement(parentId, atIndex, kind, contents): Id
    - create a new element, insert it at the specified position in the parent's child list. 0 is first. children.length is last.
    - uses same parsing logic as updateElement -- e.g. if you pass me a paragraph of text, will break it into sentences and words.
- updateElement(id, new contents): Id
    - for word, create new element with new contents and bubble up.
    - for sentence and above, parse contents, create new child elements or reuse old as necessary, then bubble up.
- deleteElement

- bulk load new doc:
    - updateElement(rootId, full text). Can make a wrapper.

- time travel:
    - setCurrentVersion(versionNum): void

- annotation CRUD
    - addAnnotation(elementId, contents): Id // returns annotation Id
    - updateAnnotation(annotationId, newContents): Id // returns new Id
    - changeAnnotationStatus(annotationId, newStatus): Id // returns new Id
    - deleteAnnotation(annotationId): void;


Model internals to maintain for efficient lookups:
- a map of parent elements for current version
- a map of active annotations for each element
- perhaps a count of annotations per element

// TODO: thought — take createAt handling out of store logic, handle it in the model, so I can just pass Element objects around
