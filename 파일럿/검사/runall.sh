#!/bin/bash
cd "$(dirname "$0")"
for t in e2e2 e2e5 e2e6 e2e7 e2e8 e2e9 e2e10 e2e11 attack; do
  timeout 900 node $t.js > $t.out 2>&1
  echo "$t exit=$?" >> $t.out
done
echo ALLDONE > done.flag
