---
type: "Pilot Decision"
unit: "XD-008"
name: "one decision each"
status: "draft"
draft: 3
stamp: ["2026-09-25", "Pilot: Ace", "f6216b95"]
answers: ["CO-090"]
approval: ""
---
# XD-008 — One decision per commander record

Answers CO-090. Draft 3, remade to CA-015: one action per unit, with its reason; the struck unit stays struck below. Each unit opens `+`.

+ I name exactly one commander record in every decision's `answers`, because CO-090 says a decision is generated against a single record, and the schema now caps `answers` at one id so the rule holds by machinery.
+ I write a longer page rather than a second record when one commander record needs a long answer, because the page is the unit the commander approves and two pages for one record would give him two approvals to make.
+ I split a decision that would answer several records into one page each, with the pages pointing at each other in prose, because each commander record must be able to be approved, negated or held on its own.
+ I keep the `answered_by` field on commander records and their rows, because it is the link from a record to its decision and it costs one line; what the commander struck below is the clerk's sweep for gaps, not the field, and I read the strike that way. If he meant the field too, one more strike settles it.
+ I answer an order when I am ready to act on it rather than on arrival, because CA-051 makes an order valid until settled, and a decision written before its action is known is redecided later.
+ Every CO, CQ and CI row carries `answered_by` once its decision exists; an order with no decision is a gap the clerk's start sweep reports. (CN: Too much footprint, for little gain)

# Commander Response

CA:{Extracted: CA-055} Commander has a pseudo record prefix 'CN:'. This pseudo record is only ever recorded inline in a document as a thought or point the commander wants to keep. They can be searched on demand but not intended for use.
