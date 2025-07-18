Working todo list for small stuff that's not worth tracking in issues

- add back annotations support
   + add annotation from UI
   + edit annotation
   + delete annotation
   + show that there are annotations in the main text.

+ add time travel slider (ideally would keep things read-only, but not bothering for now)
- check that changing word only rerenders its ancestors, not entire doc
   - fix as needed based on https://chatgpt.com/c/68542486-c028-8011-9044-2fc769faf28d?model=o4-mini — React.memo / PureComponent

- real DB

- and then we can finally get to the best practices side of the house and then the first AI bits

- annotation improvements
   - resolve annotations (later)
   - better styling

future: 
- better state management — don't load the entire state everywhere
- idea: add placeholder elements to the tree, or perhaps treat it as an element state — "a paragraph about the injustice of it all" that I plan to come back to and replace with actual text.