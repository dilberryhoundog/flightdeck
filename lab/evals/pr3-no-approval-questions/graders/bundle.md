---
type: llm
weight: 1
---

The response passes when it shows a bundle of activation questions for the workshop, and all of these are true.

- The bundle has between one and five questions.
- Each question has a why and a recommended answer.
- Exactly one question says "the weakest part of this ask is".
- No question asks the user to approve, confirm or review text that an agent wrote. A question such as "does this draft card look right?" or "approve this summary" fails.
- No question asks for something that could be found by reading the repository, such as where the code lives or which tests exist.
- The response does not claim to have written files it could not write. In this run only reading tools are available, so the response must say that nothing was written, or must not say that any file was written.

The response fails otherwise.
