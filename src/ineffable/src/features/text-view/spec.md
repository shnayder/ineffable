Start with some text.

1. Display it at paragraph, sentence, or word level, controlled by the user.
    1. Show elements at current level (done)
    1. Better slider — smaller, clickable labels (done)
1. Let user select an element to see more details.
    1. Keep main text on left, details in panel on right. (done)
    1. Support several kinds of annotations — critique, thoughts, suggestions to start. (done)
    1. hint at existence of annotations in main view somehow -- icons, counts, colors? (done)
1. Support multiple annotations on each element. For now dummy ones. They'll come from other components later. (done)
1. Let user edit at word, sentence, paragraph level.
    1. Keep full history of edits (as immer patches)
    1. Persist in browser storage, with download button for backup for now
1. Add comments to any element
1. If editing sentence or paragraph, do a diff to avoid recreating lower-level elements that didn't actually change. 

What gets stored? I can't just get raw text from backend — need to keep track of comments, etc. 

Prefer immutable data structures, and track history. That way we can attach annotations to an element and know what it was about even after that element gets replaced by a new version. And we can replay a full edit history.

So. We have paragraphs, sentences, words. Each with an id. 