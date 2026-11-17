# Notes tool

A tool app: open a text file, let the model make notes on it (a title and up
to seven key points), and save them as Markdown.

What it shows:

- `permissions.model`: `atelier.ai.json` with a JSON Schema, on the person's own
  engine (their API key or Claude Code). The app ships no key.
- `permissions.files`: `atelier.files.open` for a file the person picks and
  `atelier.files.save` to a place they choose.
- Model output rendered as text (`textContent`), never as HTML.
- Every refusal (the model budget, no engine set up) shown as a sentence
  next to the button, so the person is never stuck.
- `atelier.storage` keeps the last notes; `atelier.test?.ready` reports how many
  points there are.
- The app uses the defaults: `root` is `app` and `entry` is `index.html`. It
  has no `kit`, because it imports nothing from the kit.

The review lists: "Can ask your Claude model one-off questions, which counts
toward your usage", "Can open and save files you choose, keep a folder you
pick, and ask for files of your own", and "Adds an app: Notes tool".

## Try it

1. Packs › **Load a folder…**, pick this folder, install.
2. Open **Notes tool**, paste a few paragraphs, press **Make notes**.
