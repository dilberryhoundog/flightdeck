# Topics

The commander's statements, mined from session transcripts and written advice, filed against timeless flightdeck system topics. This is the one home for the commander's words in the cockpit: `../../quarters/commander/MANIFEST-orders.json` holds dated orders to the pilot and points here; `../../base/MANIFEST-decisions.json` holds rulings on requests and points here. A record in `../../records/` is distilled from a topic; when the topic changes, the record is updated.

Only timeless flightdeck system topics enter. Mission, launch and run chatter does not; it would clog the log. This store is also the model for later mission-level extraction.

`MANIFEST-topics.json` indexes topics. Each topic is `<slug>.json`: `{"id", "title", "scope", "record" (path or null), "updated", "statements": [{"ref", "date", "statement", "context"}]}`. `ref` is `<session>:<line>` for a transcript (the line the sentence sits on, as grep returns it) or a cockpit path for written advice; `statement` is the commander's verbatim typing; `context` is one line of lead-up so the statement can be read alone. Newer statements supersede older ones on the same point; a superseded statement stays with `"superseded_by": "<ref>"` rather than being deleted, until the topic is purged.

Maintained by a team for now (topic extractor, record writer, discovery, validator, adversary) and, once the pattern holds, by the pilot in chat as statements arrive.
