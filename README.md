# dsh-workspace-default-model

Give each **Workspace** in DeepSeek Harness its own **colour**, **default model**
and **reasoning effort**. The choices live in a new **Workspace models** page in
the left sidebar: the colour marks the Workspace in the sidebar itself, and the
model applies to every *new* Session started in that Workspace. Sessions that
already exist are never changed, and the process-wide default model is never
overwritten.

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
- The page lists every Workspace with a colour chip, a model picker, and a
  reasoning-effort picker.
- The colour chip opens preset swatches, an OS colour well, and a hex field, so
  any colour can be picked. A saved colour paints a bar on the Workspace's row
  in the left sidebar and tints that row here.
- The model picker is searchable: type to filter by model name, id, or provider,
  move with `↑`/`↓`, confirm with `Enter`, close with `Esc`.
- `Global default` / `Model default` mean "do nothing special" — that Workspace
  keeps using the deployment default from `@deepseek-ai/dsh-agent-default-model`,
  or the model's own default effort.
- A model that advertises no reasoning levels keeps the effort picker disabled.
- Colour and model are independent: a Workspace can carry a colour with no model
  override, and clearing the model keeps the colour.

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
- Saving validates each provider/model against the live catalog, each reasoning
  effort against what that model advertises, and each colour as a hex value; an
  unavailable choice is rejected instead of being stored.
- The sidebar bar is the only DOM the plugin touches: it sets one attribute and
  one CSS variable on the row that already carries
  `data-row-key="workspace:<id>"`, and a stylesheet draws the bar. React keeps
  ownership of the row.

## Changelog

- **0.3.0** – per-Workspace colour: preset swatches, colour well and hex field in
  the panel, a colour bar on the sidebar row, and colours that live independently
  of the model. Storage moved to document version 2 (version 1 files still load).
- **0.2.0** – reasoning effort per Workspace next to the model, and a searchable
  model picker (filter by name, id, or provider; keyboard navigation). The
  catalog route now reports each model's levels, saving validates them, and the
  Session event carries `reasoningEffort`.
- **0.1.0** – first release: a default model per Workspace.

## Publish

DSH has no single built-in store. A "market" is one JSON index file that users
add to the **Discover** tab, so publishing means: ship the npm package, host an
index that lists it, and (optionally) list the repo in community catalogs.

1. **npm** – published as `dsh-workspace-default-model`. `package.json` is
   publish-ready (`private` removed, `engines.dsh`, `files`, `license`).

   ```powershell
   cd C:\Users\Afshin\.dsh\plugins\dsh-workspace-default-model
   npm run check
   npm pack --dry-run      # 6 files, ~12 kB
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
