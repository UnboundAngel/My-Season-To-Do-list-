# Resolving merge conflicts

This project is maintained in a single Git repository with long-lived branches that can drift from one another.
When GitHub reports conflicts (for example between `main` and a Codex-generated branch), fetch the latest refs and
resolve the edits locally before pushing.

## 1. Fetch the branch

```bash
git fetch origin codex/generate-vue-3-+-typescript-to-do-app-ntf4cw
```

If you created the branch locally, replace the remote name/branch name with the one listed in the pull request.

## 2. Create a work branch

```bash
git checkout -b merge/codex-ntf4cw origin/main
```

Starting from `origin/main` keeps the history linear and avoids stale files.

## 3. Merge and resolve

```bash
git merge --no-ff origin/codex/generate-vue-3-+-typescript-to-do-app-ntf4cw
```

Git will pause and mark the files with conflicts (for example `README.md`, `app.js`, `index.html`, and `styles.css`).
Open each file, keep the desired sections, delete the conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`), and save.

## 4. Commit the resolution

```bash
git add README.md app.js index.html styles.css
# add any other files listed by `git status`
git commit -m "Merge branch 'codex/generate-vue-3-+-typescript-to-do-app-ntf4cw'"
```

If you prefer to abort the merge and restart, run `git merge --abort`.

## 5. Push the resolved branch

```bash
git push -u origin merge/codex-ntf4cw
```

Then open a pull request from `merge/codex-ntf4cw` into `main`. After review, fast-forward `main` or
use GitHub's "Rebase and merge" button to keep the history clean.

---

### Why do conflicts happen so often?

Most Codex runs rebuild the entire application, touching the same core files (`README.md`, `index.html`, `styles.css`, etc.).
If `main` also changed those files since the branch split, Git cannot automatically pick a winner and asks for help.
Resolving the conflicts once consolidates the work so future branches start from the same baseline.

