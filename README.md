# dsh-workspace-default-model

Pick a **default model for each Workspace** in DeepSeek Harness. The choice
lives in a new **Workspace models** page in the left sidebar, and it applies to
every *new* Session started in that Workspace. Sessions that already exist are
never changed, and the process-wide default model is never overwritten.

## Install

Published on npm as **`dsh-workspace-default-model`**.

```sh
dsh plugin --profile <name> add dsh-workspace-default-model
```

Or add the market index in the Web UI (**Plugins → More → Custom plugin
markets**, then **Discover → Add index source**) and install from the card:

```text
https://iamafshiin.github.io/dsh-workspace-default-model/index.json
```

## What it looks like

- Left sidebar gets a row named **Workspace models**.
- The page lists every Workspace with a model picker (grouped by provider).
- `Global default` means "do nothing special" — that Workspace keeps using the
  deployment default from `@deepseek-ai/dsh-agent-default-model`.

## How it works

Two halves, one package:

| File | Half | Job |
|---|---|---|
| `index.js` | Host | Keeps the Workspace → model map in `$DSH_HOME/workspace-default-model.json`, serves two `/api/workspace-default-model/...` routes to the browser, and writes a `model/selection` Session event when a new Session starts in a mapped Workspace. |
| `client.js` | Browser | Registers the sidebar row (`sidebar.panellist`) and the main panel (`main`, keyed by `workspace-default-model`). |
| `cordis.patch.yml` | Bundle | Inserts the Host row. |

Applying the choice uses the same durable record the composer's model picker
writes, so the composer shows the Workspace default as the Session's current
model and the choice survives a reconnect.

Guards: only a Session with no request yet, not seeded, not a fork, not a
subagent, and without an explicit model selection is touched.

## Install (already done on this machine)

```powershell
# 1. package lives here
C:\Users\Afshin\.dsh\plugins\dsh-workspace-default-model

# 2. linked into the profile that serves the GUI
C:\Users\Afshin\.dsh\profiles\desktop\node_modules\dsh-workspace-default-model   (junction)

# 3. profile manifest names it as a bundle
C:\Users\Afshin\.dsh\profiles\desktop\package.json
  dependencies -> "dsh-workspace-default-model": "link:../../plugins/dsh-workspace-default-model"
  dsh.profile.bundles -> ... , "dsh-workspace-default-model"
```

HMR recomposes the profile when that bundles list changes, so no restart is
needed; a page reload shows the sidebar row.

## Remove

1. Delete `"dsh-workspace-default-model"` from `dsh.profile.bundles` in
   `C:\Users\Afshin\.dsh\profiles\desktop\package.json` (keep or drop the
   dependency entry).
2. Optionally delete `C:\Users\Afshin\.dsh\workspace-default-model.json`.
3. Delete the folder and the `node_modules` junction.

A backup of the original profile manifest sits beside it as
`package.json.bak-before-workspace-model`.

## Notes

- The map is keyed by Workspace id for the UI and matched by Workspace **path**
  when a Session starts, so re-adding a Workspace at the same path keeps the
  choice.
- Saving validates each provider/model against the live catalog; a model that
  is no longer advertised is rejected instead of being stored.

## Publish

DSH has no single built-in store. A "market" is one JSON index file that users
add to the **Discover** tab, so publishing means: ship the npm package, host an
index that lists it, and (optionally) list the repo in community catalogs.

1. **npm** – the name `dsh-workspace-default-model` is free. `package.json` is
   already publish-ready (`private` removed, `engines.dsh`, `files`, `license`).

   ```powershell
   cd C:\Users\Afshin\.dsh\plugins\dsh-workspace-default-model
   npm run check
   npm pack --dry-run      # 6 files, ~11 kB
   npm login
   npm publish
   ```

2. **GitHub** – public repo, so the market card can show **Source code** and the
   community catalog can index it.

3. **Index** – [docs/index.json](docs/index.json) plus
   [docs/icons/](docs/icons) are ready and validated with DSH's own
   `parseMarketIndex`. GitHub Pages serves that folder, so the index URL is
   `https://<user>.github.io/dsh-workspace-default-model/index.json`.

   Each release: bump `version`, republish, and add a matching entry under the
   plugin's `versions` in `index.json` (`version`, `publishTimestamp`,
   `source`, `engines.dsh`).

4. **Users install it** – Plugins page → **More** beside *Experimental plugins*
   → enable **Custom plugin markets** → **Discover** → **Add index source** →
   paste the index URL → **Install**. Direct install also works:
   `dsh plugin --profile <name> add dsh-workspace-default-model`.

5. **Community catalog** (unofficial, auto-published) – paste the public repo
   URL at <https://deepseekplugin.org/en/submit>.
