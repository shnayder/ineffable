Working todo list for small stuff that's not worth tracking in issues

next: cleaning up state
- make things run again without annotations
    + update types based on latest plan
    + update store
    - update model
    - update components
    - add tests
- Allow doc edits:
    - change one word
- set up react devtools
 - check that changing word only rerenders its ancestors, not entire doc
        - fix as needed based on https://chatgpt.com/c/68542486-c028-8011-9044-2fc769faf28d?model=o4-mini — React.memo / PureComponent
- Further edits
    - add a word
    - remove a word
    - change a sentence
        - change a couple of words
        - split into two or more sentences
    - add a sentence
    - delete a sentence
    - change a paragraph — should "just work" based on sentences if I do it right

- add back annotations support

- and then we can finally get to the best practices side of the house and then the first AI bits


idea : some annotations can be elements in the tree, rather than attached to them. Or perhaps it's better to call it something else. Some sentences are "TODO: blah blah". Others are actual text. So it's a different kind of sentence, paragraph — a "real text" bit, or a multi-value type.

