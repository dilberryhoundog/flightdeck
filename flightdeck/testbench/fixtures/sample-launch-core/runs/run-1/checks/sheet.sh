#!/bin/sh
# A sheet check prints the path of the judge's return for its id and nothing else (I15). $1 is the run folder.
run="${1:-.}"
echo "$run/returns/judge-T5.json"
exit 0
