# DO NOT EDIT THESE JSON FILES MANUALLY

The following files in this directory are managed by the admin mode + nightly snapshot action:

- `generals.json`
- `skills.json`
- `faq.json`

Manual PR edits to these files will be flagged by CI (`.github/workflows/data-files-guard.yml`).
If you need to edit them outside the admin UI:

1. Either commit with `[snapshot]` somewhere in the message (the nightly action does this)
2. Or label the PR `data-edit-approved` (use sparingly; prefer the admin UI)

Other JSON files in this directory (`cards.json`, `card-text.json`, `ocr-*`, `parsed-*`, etc.) are NOT
managed by admin mode and remain editable via PR.
