Working todo list for small stuff that's not worth tracking in issues

next: cleaning up state
+ make things run again without annotations
    + update types based on latest plan
    + update store
    + update model
    + update components
    + add tests
+ Allow doc edits:
    + change one word
    + change one sentence
    + change one paragraph
    + make the edit box the same-ish size as the original text.
+ set up react devtools
+ fix createdAt mess — for now, have caller set it. Cleaner: have a wrapper type helper like WithCreatedAt<Element>.
+ get rid of contents in non-leaf elements and recompute dynamically, or ensure it updates with edits.
   + perhaps those are equivalent — I suppose I could have a lazy recompute or eager one. And really no need to store it. Let's make it dynamic, and add a cache if it seems warranted later.
+ fix storage so it actually persists (don't overwrite with sample text every time)
+ reuse unchanged child elements when editing mid-tree nodes
+ Further edits
    + add a word
    + change a sentence
        + change a couple of words
        + split into two or more sentences
    + add a sentence
    + change a paragraph — should "just work" based on sentences if I do it right
    + remove a word
    + delete a sentence
    + add a paragraph
+ select vs edit gestures -- click to select, double-click or hit enter to edit?
- merge!
- add back annotations support
- add time travel slider -- keep things read-only at first
- check that changing word only rerenders its ancestors, not entire doc
   - fix as needed based on https://chatgpt.com/c/68542486-c028-8011-9044-2fc769faf28d?model=o4-mini — React.memo / PureComponent


- and then we can finally get to the best practices side of the house and then the first AI bits


idea (for later): add placeholder elements to the tree, or perhaps treat it as an element state — "a paragraph about the injustice of it all" that I plan to come back to and replace with actual text. 

future: 
- real DB
- periodic sync to google docs or file or something
- 