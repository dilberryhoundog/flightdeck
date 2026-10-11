---
description: The adversary, sent by the main session, finds a planted escaping defect.
model: sonnet
max_turns: 12
allowed_tools: [Agent, Read, Glob, Grep]
runs: 3
---
Send the flight:adversary agent to attack the code below against the criteria below, in cold mode, and report its findings word for word.

=== The Work ===

```js
function text(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/>/g, '&gt;');
}

function attr(value) {
  return text(value).replace(/"/g, '&quot;');
}
```

=== The Criteria ===

B5: block text is HTML-escaped so it cannot open a tag: the output never contains a raw `<` from block text.
