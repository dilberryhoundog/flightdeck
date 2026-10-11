---
name: page
description: "Page kit for any HTML page an agent makes for the owner (reports, results, review pages): FlightDeck's theme, light and dark, phone width, nothing loaded but Google Fonts, and one closing button that copies only what the owner changed plus a ready prompt."
---

# Page kit

This is the kit for any web page an agent makes to show the owner something. It gives every page the same look (the FlightDeck theme), makes it work in light and dark and on a phone, and ends it with one button that copies back only what the owner changed.

The flight board (`/flight:board`) is a page made with this kit. Its "Copy my answers" button is its closing panel, in the paste-back format of the questions template (`FlightDeck answers for workshop <name>: file these into .flightdeck/<name>/questions.md`).

## When to use

Use it for any page an agent shows the owner: a report, a result, a review page, a set of options to pick from. The board uses it too.

Do not use it for notes that belong in a markdown file, or for a short answer that fits in chat.

## Rules

- One self-contained `.html` file. Everything the page needs is inside it.
- Copy the whole text of `${CLAUDE_SKILL_DIR}/theme.css` into a `<style>` in the head. Never link to it, so the page still works when it is moved or emailed.
- Load nothing from the network except the Google Fonts that the theme imports. No external scripts, images, frames or stylesheets.
- Use colours only through the theme's tokens (`var(--ink)`, `var(--surface)` and the rest). Do not write colour values of your own.
- Light and dark come from the theme and follow the owner's device. Setting `data-theme="light"` or `data-theme="dark"` on `<html>` forces one.
- Phone width: keep the 16px side gutter (`--gutter`) and put nothing wider than the screen.
- Use plain words, and explain any term in a few words the first time it appears.
- Put the page in the attempt folder of the work it belongs to, such as `.flightdeck/<workshop>/attempts/<label>/`. Never put it under `dev/` or `.claude/`.

## Skeleton

Start from this and fill it in. Keep the `<title>` to two to four words.

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Short page name</title>
<style>
/* Paste the whole text of ${CLAUDE_SKILL_DIR}/theme.css here. */
</style>
</head>
<body>
<main class="fd-page">
  <header class="fd-header">
    <h1>Short page name</h1>
    <p class="fd-sub">One plain line saying what this page is for.</p>
  </header>
  <section class="fd-section">
    <h2>Section name</h2>
    <div class="fd-card">
      <p>What the owner needs to see or decide.</p>
    </div>
  </section>
  <section class="fd-copy-panel">
    <button type="button" class="fd-btn fd-btn-primary" id="copy-changes">Copy my changes</button>
    <p id="copy-status" role="status">Nothing changed yet.</p>
    <textarea id="copy-out" readonly aria-label="Text to copy"></textarea>
  </section>
</main>
<script>
/* The closing panel script goes here (see "The closing copy panel"). */
</script>
</body>
</html>
```

## Classes

These are the whole vocabulary of the theme. Use them; do not invent new styles.

- `.fd-page`: the page wrapper. Maximum width 960px, centred, with the side gutter.
- `.fd-header`: the top of the page, with the `<h1>`.
- `.fd-sub`: a muted line under a heading.
- `.fd-section`: one block of the page, with its own `<h2>`.
- `.fd-card`: a bordered box for one thing.
- `.fd-row`: a bordered row, used for each item in a list (the board's workshops).
- `.fd-badge`: a small label. Add one of `.is-go` (good, done), `.is-info` (neutral news), `.is-accent` (needs a look), `.is-stop` (blocked or failed) or `.is-muted` (quiet).
- `.fd-btn`: a button. `.fd-btn-primary` marks the main one.
- `.fd-tabs` and `.fd-tab`: a row of tab buttons. The chosen tab has `aria-selected="true"`.
- `.fd-field`: a label above an input, select or textarea, full width.
- `.fd-question`: a `<fieldset>` for one question.
- `.fd-options`: the list of options inside a question. Add `.is-recommended` to the recommended one.
- `.fd-copy-panel`: the closing panel: the button, a status line and a read-only textarea.
- `.fd-warning`: a row that tells the owner something could not be read.
- `.fd-muted`: quiet text.
- `.fd-empty`: the line shown when a list has nothing in it.

The theme also styles `h1` to `h3` (heading font), `code`, `pre` (it scrolls inside its own box), `details` and `summary`, keyboard focus (a 2px outline), and `prefers-reduced-motion`.

The colour tokens, defined on `:root` with a dark set: `--bg`, `--surface`, `--surface-2`, `--ink`, `--ink-2`, `--ink-3`, `--line`, `--line-strong`, `--accent`, `--accent-bg`, `--accent-line`, `--go`, `--go-bg`, `--go-line`, `--info`, `--info-bg`, `--stop`, `--stop-bg`, `--code-bg`, `--focus`, `--shadow`.

The other tokens: `--font-body`, `--font-head` and `--font-mono` (fonts), `--radius` (8px corners) and `--gutter` (16px side space).

## The closing copy panel

Every page that collects anything from the owner ends with one `.fd-copy-panel` holding a button `Copy my changes`, a status line, and a read-only textarea that shows the same text.

The script keeps each field's starting value when the page loads. When the button is pressed it copies only the fields whose value is different from that starting value, in exactly this format:

```
Changes from <page title> (<page path>):
- <field label>: <new value>
- <field label>: <new value>
Ready prompt: <one line telling the agent what to do with these changes>
```

The first line names the page by its `<title>` and its path. Each changed field gets one line, with the label the owner saw. The last line is a ready prompt: one line telling the agent what to do with these changes.

When nothing changed, the button copies nothing and the status line says `Nothing changed yet.`

To copy, try `navigator.clipboard.writeText(text)`. If it is missing or fails, select the text in the textarea (`select()`) and call `document.execCommand('copy')`, and tell the owner to copy by hand if that fails too. Always put the same text in the textarea so it can be copied by hand.

## Check before handing it over

- Search the page for `http://` and `https://`. Only `fonts.googleapis.com` and `fonts.gstatic.com` may appear.
- Look at it at phone width (about 360px). Nothing may run past the screen edge.
- Read it once in dark mode.
