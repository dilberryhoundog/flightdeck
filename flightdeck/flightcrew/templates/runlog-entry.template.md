# Run-log entry shape

`fc launch end` inserts one entry into `flightdeck/launch/RUNLOG.md` after the file's first heading (`# Run log`, created when the file is absent), so the newest entry is first. The mechanical fields arrive filled; every `<fill>` is a line the human completes at the gate. `fc runlog show [--spec S]` prints the entries newest first.

## Accepted family

Written for outcome `accepted` and `accepted-with-reservations`.

```
## {{ended_date}} · {{spec_name}} · {{launch}}
spec: {{spec_name}} v{{spec_version}} @ {{spec_commit}}
kickoff: {{kickoff_version}}
outcome: {{outcome}}
cost: {{agents}} agents · {{stop_blocks}} stop blocks · {{minutes}} minutes · {{tokens}}
kept: <fill>
reservation: <fill>
```

## Abandoned or partial family

Written for outcome `abandoned` and `partial`. `symptom` is pre-filled from the ending event. `partial` adds `landed` and `abandoned` naming the units; `kept` and `promote` are optional lines the human adds.

```
## {{ended_date}} · {{spec_name}} · {{launch}}
spec: {{spec_name}} v{{spec_version}} @ {{spec_commit}}
kickoff: {{kickoff_version}}
outcome: {{outcome}}
cost: {{agents}} agents · {{stop_blocks}} stop blocks · {{minutes}} minutes · {{tokens}}
symptom: {{symptom}}
seen on: <fill>
cause: <fill>
fixed on: <fill>
change: <fill>
watch: <fill>
landed: {{landed_units}}
abandoned: {{abandoned_units}}
kept: <fill>
promote: <fill>
```

## Observations

The observations of the last critic pass follow the fields, last in the entry:

```
observations:
{{observations}}
```

`fixed on` names the axis the change belongs to — context, verification, tooling or scope — so that entries can be counted by axis; `watch` names what the next run against this spec should confirm.
