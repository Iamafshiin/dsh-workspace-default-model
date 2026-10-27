/**
 * dsh-workspace-default-model — host half.
 *
 * One job: remember a default model per Workspace and put it on a Session the
 * moment that Session starts inside one of those Workspaces, so the user's
 * first message in `D:\work\acme` goes to the model they chose for `acme`
 * without touching the process-wide default.
 *
 * Three pieces, all ordinary DSH plugin surface:
 *   - `apply` registers the plugin and one `agent/created` listener;
 *   - a small JSON document under the Harness home keeps the map;
 *   - two routes let the browser half read/write the map and read the model
 *     catalog. They register inside the Connection's authentication fence, so
 *     a headless composition (no Connection) simply stays inert.
 *
 * Applying the default is a durable `model/selection` event, the same record
 * the composer's model picker writes: the Session's projection reports it as
 * pending and prompt assembly snapshots it on the next request. That keeps the
 * choice scoped to the Session (the process-wide default in
 * `agentDefaultModel` is never rewritten) and leaves the picker in step.
 */

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'

/** Package name; also the client module id and the Loader row's plugin name. */
export const name = 'dsh-workspace-default-model'

/** The model catalog and the model-membership check read this service. */
export const inject = ['llm']

/** Route the browser half reads and writes for the workspace map. */
export const STATE_PATH = '/api/workspace-default-model/state'

/** Route the browser half reads for the provider-grouped model catalog. */
export const CATALOG_PATH = '/api/workspace-default-model/catalog'

/** Shape version of the persisted document. */
const FILE_VERSION = 1

/** How long one catalog read is reused, in milliseconds. */
const CATALOG_TTL_MS = 30_000

/**
 * Register the plugin.
 * @param {import('@deepseek-ai/cordis').Context} ctx
 */
export function apply(ctx) {
  const store = createStore(ctx)
  const routes = { catalog: null, catalogAt: 0 }

  ctx.inject(['connection'], (scoped) => {
    const conn = scoped.connection
    if (conn === undefined || conn === null || conn.fetch === undefined) return
    const effect = typeof scoped.effect === 'function' ? scoped.effect.bind(scoped) : ctx.effect.bind(ctx)
    try {
      effect(
        () =>
          conn.fetch.register({
            path: STATE_PATH,
            methods: ['GET', 'POST'],
            requestBody: 'buffered',
            fetch: (request) => handleState(request, store, ctx),
          }),
        'workspace-default-model: state route',
      )
      effect(
        () =>
          conn.fetch.register({
            path: CATALOG_PATH,
            methods: ['GET'],
            requestBody: 'buffered',
            fetch: () => handleCatalog(ctx, routes),
          }),
        'workspace-default-model: catalog route',
      )
    } catch (error) {
      warn(ctx, `route registration skipped: ${messageOf(error)}`)
    }
  })

  ctx.effect(() => {
    const off = ctx.on('agent/created', (payload) => applyWorkspaceDefault(ctx, store, payload))
    return () => {
      if (typeof off === 'function') off()
    }
  }, 'workspace-default-model: session defaults')
}

/**
 * Put a Workspace's default model onto a Session that starts in it.
 *
 * Only a Session that has sent nothing yet is touched, only a top-level one
 * (a fork, a seeded copy, or a subagent keeps whatever it inherited), and only
 * when the user has not already picked a model in it. Everything else keeps
 * the normal DSH behaviour.
 * @param {import('@deepseek-ai/cordis').Context} ctx
 * @param {ReturnType<typeof createStore>} store
 * @param {unknown} payload - the `agent/created` event payload.
 */
function applyWorkspaceDefault(ctx, store, payload) {
  try {
    const agent = payload && typeof payload === 'object' ? payload.agent : undefined
    const session = agent === undefined || agent === null ? undefined : agent.session
    if (session === undefined || session === null) return
    const header = session.header
    if (header === undefined || header === null || typeof header !== 'object') return
    if (header.parentSession !== undefined || header.origin === 'subagent' || header.isSeeded === true) return
    if (typeof header.cwd !== 'string' || !store.loaded()) return
    if (typeof session.requestHeader === 'function' && session.requestHeader() !== undefined) return
    if (hasModelSelection(session)) return
    const entry = store.lookup(header.cwd)
    if (entry === undefined) return
    session.append('model/selection', {
      provider: entry.provider,
      model: entry.model,
      ...(entry.reasoningEffort === undefined ? {} : { reasoningEffort: entry.reasoningEffort }),
    })
    info(
      ctx,
      `${entry.provider}/${entry.model}${entry.reasoningEffort === undefined ? '' : ` (${entry.reasoningEffort})`} applied to session ${String(session.id)} in ${header.cwd}`,
    )
  } catch (error) {
    warn(ctx, `could not apply a workspace default: ${messageOf(error)}`)
  }
}

/**
 * Whether the Session log already carries a model selection the user made.
 * @param {any} session
 * @returns {boolean}
 */
function hasModelSelection(session) {
  try {
    if (typeof session.snapshotEvents !== 'function') return false
    return session.snapshotEvents().some((event) => event?.type === 'model/selection')
  } catch {
    return false
  }
}

/**
 * Answer one state request. `GET` returns the document; `POST` replaces the
 * entry map after checking that every model is currently advertised, and
 * returns the document it stored.
 * @param {Request} request
 * @param {ReturnType<typeof createStore>} store
 * @param {import('@deepseek-ai/cordis').Context} ctx
 * @returns {Promise<Response>}
 */
async function handleState(request, store, ctx) {
  try {
    const method = String(request?.method ?? 'GET').toUpperCase()
    if (method === 'GET') return jsonResponse({ ok: true, ...(await store.read()) })
    if (method !== 'POST') return jsonResponse({ ok: false, error: 'method-not-allowed' }, 405)

    let payload
    try {
      payload = JSON.parse(await request.text())
    } catch {
      return jsonResponse({ ok: false, error: 'unreadable-body' }, 400)
    }
    const entries = normalizeEntries(payload?.entries)
    const invalid = await validateSelections(ctx, entries)
    if (invalid.length > 0) {
      return jsonResponse({ ok: false, error: 'selection-unavailable', invalid }, 200)
    }
    return jsonResponse({ ok: true, ...(await store.write(entries)) })
  } catch (error) {
    warn(ctx, `state request failed: ${messageOf(error)}`)
    return jsonResponse({ ok: false, error: 'state-failed', entries: {} })
  }
}

/**
 * List each provider's advertised models plus the process-wide default, for the
 * browser half's picker. Reads are reused for {@link CATALOG_TTL_MS}.
 * @param {import('@deepseek-ai/cordis').Context} ctx
 * @param {{ catalog: unknown, catalogAt: number }} cache
 * @returns {Promise<Response>}
 */
async function handleCatalog(ctx, cache) {
  try {
    if (cache.catalog !== null && Date.now() - cache.catalogAt < CATALOG_TTL_MS) {
      return jsonResponse({ ok: true, value: cache.catalog })
    }
    const providers = typeof ctx.llm?.listProviders === 'function' ? ctx.llm.listProviders() : []
    const groups = []
    const failures = []
    for (const provider of providers) {
      try {
        const models = await ctx.llm.listModels(provider.id)
        const entries = []
        for (const model of models) {
          const entry = {
            id: model.id,
            name: model.name ?? model.id,
            ...(model.description === undefined ? {} : { description: model.description }),
          }
          const reasoning = await reasoningOf(ctx, provider.id, model.id)
          if (reasoning !== undefined) entry.reasoning = reasoning
          entries.push(entry)
        }
        groups.push({
          id: provider.id,
          name: provider.name ?? provider.id,
          models: entries,
        })
      } catch (error) {
        failures.push({ id: provider.id, name: provider.name ?? provider.id, message: messageOf(error) })
      }
    }
    const fallback = ctx.get('agentDefaultModel')
    const value = {
      groups: groups.filter((group) => group.models.length > 0),
      failures,
      default: fallback === undefined ? null : fallback.currentSelection(),
    }
    cache.catalog = value
    cache.catalogAt = Date.now()
    return jsonResponse({ ok: true, value })
  } catch (error) {
    warn(ctx, `catalog request failed: ${messageOf(error)}`)
    return jsonResponse({ ok: false, error: 'catalog-failed' })
  }
}

/**
 * Read one model's advertised reasoning efforts.
 * @param {import('@deepseek-ai/cordis').Context} ctx
 * @param {string} provider
 * @param {string} model
 * @returns {Promise<{ efforts: Array<{ id: string, name: string, description?: string }>, defaultEffort?: string } | undefined>}
 */
async function reasoningOf(ctx, provider, model) {
  try {
    if (typeof ctx.llm?.resolveModelInfo !== 'function') return undefined
    const info = await ctx.llm.resolveModelInfo(provider, model)
    const reasoning = info === null || info === undefined ? undefined : info.reasoning
    if (reasoning === null || reasoning === undefined) return undefined
    const efforts = []
    for (const effort of Array.isArray(reasoning.efforts) ? reasoning.efforts : []) {
      if (typeof effort?.id !== 'string' || effort.id === '') continue
      efforts.push({
        id: effort.id,
        name: typeof effort.name === 'string' && effort.name !== '' ? effort.name : effort.id,
        ...(typeof effort.description === 'string' ? { description: effort.description } : {}),
      })
    }
    return {
      efforts,
      ...(typeof reasoning.defaultEffort === 'string' ? { defaultEffort: reasoning.defaultEffort } : {}),
    }
  } catch {
    // A model without adapter metadata simply advertises no effort setting.
    return undefined
  }
}

/**
 * Report every stored selection the live catalog no longer accepts: an unknown
 * provider or model, or a reasoning effort that model does not advertise.
 * @param {import('@deepseek-ai/cordis').Context} ctx
 * @param {Record<string, { provider: string, model: string, reasoningEffort?: string }>} entries
 * @returns {Promise<Array<{ workspaceId: string, reason: 'model' | 'effort', provider: string, model: string, reasoningEffort?: string }>>}
 */
async function validateSelections(ctx, entries) {
  const providers = typeof ctx.llm?.listProviders === 'function' ? ctx.llm.listProviders() : []
  const known = new Set(providers.map((provider) => provider.id))
  const models = new Map()
  const efforts = new Map()
  const invalid = []
  for (const [workspaceId, entry] of Object.entries(entries)) {
    if (!known.has(entry.provider)) {
      invalid.push({ workspaceId, reason: 'model', provider: entry.provider, model: entry.model })
      continue
    }
    let ids = models.get(entry.provider)
    if (ids === undefined) {
      try {
        ids = (await ctx.llm.listModels(entry.provider)).map((model) => model.id)
      } catch {
        ids = []
      }
      models.set(entry.provider, ids)
    }
    if (!ids.includes(entry.model)) {
      invalid.push({ workspaceId, reason: 'model', provider: entry.provider, model: entry.model })
      continue
    }
    if (entry.reasoningEffort === undefined) continue
    const key = `${entry.provider}\u0000${entry.model}`
    let advertised = efforts.get(key)
    if (advertised === undefined) {
      advertised = new Set()
      const reasoning = await reasoningOf(ctx, entry.provider, entry.model)
      for (const effort of reasoning === undefined ? [] : reasoning.efforts) advertised.add(effort.id)
      efforts.set(key, advertised)
    }
    if (!advertised.has(entry.reasoningEffort)) {
      invalid.push({
        workspaceId,
        reason: 'effort',
        provider: entry.provider,
        model: entry.model,
        reasoningEffort: entry.reasoningEffort,
      })
    }
  }
  return invalid
}

/**
 * The persisted map: one JSON document, loaded once, written atomically and
 * serialised through a single promise chain so two quick saves cannot
 * interleave a stale read with a fresh write.
 * @param {import('@deepseek-ai/cordis').Context} ctx
 */
export function createStore(ctx) {
  const file = join(resolveHome(), 'workspace-default-model.json')
  /** @type {{ version: number, entries: Record<string, { path: string, provider: string, model: string }> } | undefined} */
  let cache
  let ready = false
  let chain = Promise.resolve()
  /** @type {Map<string, { provider: string, model: string, reasoningEffort?: string }>} */
  let byPath = new Map()

  const index = () => {
    byPath = new Map()
    for (const entry of Object.values(cache?.entries ?? {})) {
      const key = pathKey(entry.path)
      if (key === '') continue
      byPath.set(key, {
        provider: entry.provider,
        model: entry.model,
        ...(entry.reasoningEffort === undefined ? {} : { reasoningEffort: entry.reasoningEffort }),
      })
    }
  }

  async function load() {
    try {
      const parsed = JSON.parse(await readFile(file, 'utf8'))
      cache = { version: FILE_VERSION, entries: normalizeEntries(parsed?.entries) }
    } catch (error) {
      if (error?.code !== 'ENOENT') warn(ctx, `ignoring unreadable state file: ${messageOf(error)}`)
      cache = { version: FILE_VERSION, entries: {} }
    }
    index()
    ready = true
    return cache
  }

  /** Kick the first read; the listener waits for it rather than blocking activation. */
  const firstLoad = load().catch(() => {
    cache = { version: FILE_VERSION, entries: {} }
    index()
    ready = true
  })

  return {
    /** @returns {boolean} whether the map has been read once. */
    loaded() {
      return ready
    },
    /**
     * Resolve a Session's working directory to its Workspace default.
     * @param {string} cwd
     * @returns {{ provider: string, model: string, reasoningEffort?: string } | undefined}
     */
    lookup(cwd) {
      if (!ready) return undefined
      return byPath.get(pathKey(cwd))
    },
    /** @returns {Promise<{ version: number, entries: Record<string, { path: string, provider: string, model: string }> }>} */
    async read() {
      await firstLoad
      return cache
    },
    /**
     * Replace the map.
     * @param {Record<string, { path: string, provider: string, model: string }>} entries
     * @returns {Promise<{ version: number, entries: any }>}
     */
    write(entries) {
      const next = { version: FILE_VERSION, entries: normalizeEntries(entries) }
      chain = chain.then(async () => {
        cache = next
        index()
        await mkdir(dirname(file), { recursive: true })
        const temp = `${file}.tmp-${process.pid}-${Date.now()}`
        await writeFile(temp, `${JSON.stringify(next, null, 2)}\n`, 'utf8')
        await rename(temp, file)
      })
      return chain.then(() => next)
    },
  }
}

/**
 * Coerce anything into the entry map this plugin stores: workspace id as key,
 * absolute path, a provider/model pair, and an optional reasoning effort.
 * Anything else is dropped rather than rejected, so a hand-edited file cannot
 * wedge the page.
 * @param {unknown} value
 * @returns {Record<string, { path: string, provider: string, model: string, reasoningEffort?: string }>}
 */
export function normalizeEntries(value) {
  /** @type {Record<string, { path: string, provider: string, model: string, reasoningEffort?: string }>} */
  const entries = {}
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return entries
  for (const [rawKey, rawEntry] of Object.entries(value)) {
    const workspaceId = String(rawKey).trim()
    if (workspaceId === '' || workspaceId.length > 200) continue
    if (rawEntry === null || typeof rawEntry !== 'object') continue
    const path = typeof rawEntry.path === 'string' ? rawEntry.path.trim() : ''
    const provider = typeof rawEntry.provider === 'string' ? rawEntry.provider.trim() : ''
    const model = typeof rawEntry.model === 'string' ? rawEntry.model.trim() : ''
    const effort = typeof rawEntry.reasoningEffort === 'string' ? rawEntry.reasoningEffort.trim() : ''
    if (path === '' || provider === '' || model === '') continue
    entries[workspaceId] = {
      path,
      provider,
      model,
      ...(effort === '' || effort.length > 64 ? {} : { reasoningEffort: effort }),
    }
  }
  return entries
}

/**
 * Comparison key for a working directory: separators unified, no trailing
 * separator, case-insensitive on Windows.
 * @param {string} path
 * @returns {string}
 */
function pathKey(path) {
  if (typeof path !== 'string' || path.trim() === '') return ''
  const unified = path.trim().replace(/\//g, '\\').replace(/\\+$/, '')
  return process.platform === 'win32' ? unified.toLowerCase() : unified
}

/**
 * Resolve the Harness home the way the rest of DSH does: an explicit
 * `DSH_HOME` wins, otherwise `<home>/.dsh`.
 * @returns {string}
 */
function resolveHome() {
  const fromEnv = process.env.DSH_HOME
  if (typeof fromEnv === 'string' && fromEnv.trim() !== '') {
    const value = fromEnv.trim()
    return resolve(value === '~' ? homedir() : value.replace(/^~(?=[/\\])/, homedir()))
  }
  return join(homedir(), '.dsh')
}

/**
 * @param {unknown} payload
 * @param {number} [status]
 * @returns {Response}
 */
function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

/** @param {unknown} error @returns {string} */
function messageOf(error) {
  return error instanceof Error ? error.message : String(error)
}

/** @param {import('@deepseek-ai/cordis').Context} ctx @param {string} text */
function info(ctx, text) {
  try {
    ctx.logger?.info?.(`[workspace-default-model] ${text}`)
  } catch {
    // A missing logger must never be the reason a plugin fails.
  }
}

/** @param {import('@deepseek-ai/cordis').Context} ctx @param {string} text */
function warn(ctx, text) {
  try {
    ctx.logger?.warn?.(`[workspace-default-model] ${text}`)
  } catch {
    // A missing logger must never be the reason a plugin fails.
  }
}
