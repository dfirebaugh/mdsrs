# mdsrs

> note: this is kind of me exploring how to build cross platform desktop apps.  I don't expect to tune up the SRS to be good enough to actually use.  If you're here looking for a flash card app, just use anki - it's great!

This is a flash card app that let's you build flash card decks with markdown.

Anything inside the `card-back` tag will be shown on the back of the flash card.

## Example Card

```markdown

# Front of card

<card-back>

# Back of card

</card-back>
```

### Dev

This app is built with [https://wails.io/](https://wails.io/).
To run it, you will need to download their binary [wails](https://wails.io/docs/gettingstarted/installation).

### TODO

- move to wails based events
- evaluate wails3
- evaluate moving app state to go code 
- improve modularity with the intent for the frontend to also work in a web environment (shared components).
- consider some kind of extension system
