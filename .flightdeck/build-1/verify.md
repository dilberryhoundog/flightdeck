# Verification for workshop build-1

## checks

- `node lab/checks/hard-rules.mjs --base origin/build-1 --owned auto`: prints only pass lines and exits 0
- `claude plugin validate flightdeck`: exits 0
- `node --test 'flightdeck/tests/*.test.mjs'`: exits 0

## questions

- Do the five-minute try steps work as written when followed literally?
- Is every owner-facing page and text free of jargon, or does it explain each term in plain words?
- Does the pull request description lead with the five-minute try?
