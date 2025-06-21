Working todo list for small stuff that's not worth tracking in issues

next: cleaning up state
+ change types based roughly on chatgpt suggestion, normalizing:
    + Element of different "kinds" (paragraph, sentence, word)
        child ids
        + decide uuid or nanoid (look up nanoid)
    + Annotation points at an id
+ make a Document class
    + create from set of elements and annotations
    + maintain parent maps and other indexes as needed
    + helper function to parse from text
- set up unit testing
    + basic document test
    + vscode automation — run on save probably
- make things run again
    + Add document methods to read elements
        - add tests
    + update react components to use new stuff, pull from store
    - Zustand 1: add doc to a store
    - add mock annotations to version when loading
- allow single edit
    - Add document methods to edit doc
        - implement, test immutability -- change a word -> changes parent sentence -> doc
    - figure out how to edit in Zustand
    - text editing: let user change a word in some ugly way (modal? :)
    - set up react devtools
    - check that changing word only rerenders its ancestors, not entire doc
        - fix as needed based on https://chatgpt.com/c/68542486-c028-8011-9044-2fc769faf28d?model=o4-mini — React.memo / PureComponent
- persist to idb
- allow editing sentences, paragraphs
- annotation CRUD
- and then we can finally get to the best practices side of the house and then the first AI bits



idea : some annotations can be elements in the tree, rather than attached to them. Or perhaps it's better to call it something else. Some sentences are "TODO: blah blah". Others are actual text. So it's a different kind of sentence, paragraph — a "real text" bit, or a multi-value type.

