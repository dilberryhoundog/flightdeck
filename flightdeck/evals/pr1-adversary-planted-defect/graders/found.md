---
type: llm
---
Passes only if the reported findings say that `<` is not escaped, so block text can open a tag (an HTML injection), and rate it high or medium severity. A finding that only mentions `>` or `&` does not pass.
