/**
 * dsh-workspace-default-model — browser half.
 *
 * Loaded as a classic script through `window.__ModuleLoader__.load()`, like
 * every other DSH client bundle. Two contributions:
 *   - a row in the left sidebar's panel list (slot `sidebar.panellist`), and
 *   - the main panel that row opens (`main`, keyed by the same id).
 *
 * The panel lists every Workspace with a model picker. Choices are stored by
 * the host half (one JSON document under the Harness home) and applied when a
 * new Session starts in that Workspace; the picker itself changes nothing
 * about the current Session.
 *
 * Only `react` is required as a module; every colour comes from a `--dsw-*`
 * token so a theme swap degrades appearance rather than rendering.
 */

window.__ModuleLoader__.load({
	id: 'dsh-workspace-default-model',
	factory(require) {
		'use strict'

		const React = require('react')
		const h = React.createElement

		/** Panel id shared by the sidebar row and the main panel. */
		const PANEL_ID = 'workspace-default-model'
		/** Host routes. */
		const STATE_PATH = '/api/workspace-default-model/state'
		const CATALOG_PATH = '/api/workspace-default-model/catalog'

		const CSS = [
			'.wdm-page{height:100%;overflow:auto;padding:26px 30px 40px;color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family,inherit);font-size:14px;line-height:1.55;box-sizing:border-box}',
			'.wdm-inner{max-width:820px;margin:0 auto;display:flex;flex-direction:column;gap:18px}',
			'.wdm-head{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;flex-wrap:wrap}',
			'.wdm-title{margin:0;font-size:16px;line-height:24px;font-weight:600}',
			'.wdm-lede{margin:5px 0 0;color:var(--dsw-alias-label-secondary);font-size:12.5px;max-width:600px}',
			'.wdm-badge{flex:none;font-size:11.5px;padding:2px 8px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-tertiary)}',
			'.wdm-card{border:1px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-lg,14px);background:var(--dsw-alias-bg-layer-1);overflow:hidden}',
			'.wdm-row{display:flex;align-items:center;gap:14px;padding:12px 16px;min-width:0}',
			'.wdm-row + .wdm-row{border-top:1px solid var(--dsw-alias-border-l2)}',
			'.wdm-glyph{flex:none;display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:var(--dsw-radius-sm,8px);background:color-mix(in srgb,var(--dsw-alias-label-primary) 7%,transparent);color:var(--dsw-alias-label-secondary)}',
			'.wdm-main{flex:1 1 auto;min-width:0}',
			'.wdm-name{display:block;font-size:13.5px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
			'.wdm-sub{display:block;margin-top:2px;color:var(--dsw-alias-label-tertiary);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
			'.wdm-select{flex:none;max-width:290px;min-width:180px;height:30px;border-radius:var(--dsw-radius-sm,8px);border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font:inherit;font-size:12.5px;padding:0 8px;cursor:pointer}',
			'.wdm-select:focus-visible{outline:2px solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:1px}',
			'.wdm-select[data-set="true"]{border-color:color-mix(in srgb,var(--dsw-alias-state-business-primary) 55%,var(--dsw-alias-border-l2))}',
			'.wdm-select:disabled{opacity:.5;cursor:default;border-color:var(--dsw-alias-border-l2)}',
			'.wdm-picks{flex:none;display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}',
			'.wdm-effort{max-width:150px;min-width:112px}',
			'.wdm-note{padding:12px 16px;border:1px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-lg,14px);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);font-size:12.5px}',
			'.wdm-note b{display:block;margin-bottom:3px;color:var(--dsw-alias-label-primary);font-size:12.5px}',
			'.wdm-status{font-size:12px;color:var(--dsw-alias-label-tertiary)}',
			'.wdm-error{padding:9px 12px;border-radius:var(--dsw-radius-sm,8px);border:1px solid color-mix(in srgb,var(--dsw-alias-state-error-primary) 42%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 10%,transparent);color:var(--dsw-alias-state-error-primary);font-size:12.5px}',
			'.wdm-empty{padding:22px 16px;text-align:center;color:var(--dsw-alias-label-tertiary);font-size:12.5px}',
			'.wdm-default{display:flex;align-items:center;gap:10px;justify-content:space-between;flex-wrap:wrap}',
			'.wdm-default code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;color:var(--dsw-alias-label-primary)}',
		].join('\n')

		/** The left-sidebar row glyph: a model chip. */
		function ModelChipIcon(props) {
			const size = props && typeof props.size === 'number' && props.size > 0 ? props.size : 16
			return h(
				'svg',
				{
					width: size,
					height: size,
					viewBox: '0 0 16 16',
					fill: 'none',
					focusable: 'false',
					'aria-hidden': 'true',
					style: { display: 'block' },
				},
				h('rect', { x: 2.2, y: 2.2, width: 11.6, height: 11.6, rx: 2.4, stroke: 'currentColor', strokeWidth: 1.3 }),
				h('path', { d: 'M5.2 8h5.6', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round' }),
				h('path', { d: 'M8 5.2v5.6', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round', opacity: 0.65 }),
			)
		}

		/** The folder glyph a Workspace row uses. */
		function FolderIcon() {
			return h(
				'svg',
				{
					width: 15,
					height: 15,
					viewBox: '0 0 16 16',
					fill: 'none',
					focusable: 'false',
					'aria-hidden': 'true',
					style: { display: 'block' },
				},
				h('path', {
					d: 'M2 5.1c0-1.1.9-2 2-2h2.1c.4 0 .8.2 1 .5l.8 1h4.1c1.1 0 2 .9 2 2v4.3c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V5.1z',
					stroke: 'currentColor',
					strokeWidth: 1.25,
				}),
			)
		}

		/**
		 * Resolve a provider/model pair to a display label from the catalog.
		 * @param {{ groups?: any[] } | null} catalog
		 * @param {{ provider: string, model: string }} selection
		 * @returns {string}
		 */
		function modelLabel(catalog, selection) {
			if (catalog === null || catalog === undefined || !Array.isArray(catalog.groups)) return `${selection.provider} / ${selection.model}`
			const group = catalog.groups.find((item) => item.id === selection.provider)
			const model = group === undefined ? undefined : group.models.find((item) => item.id === selection.model)
			const providerName = group === undefined ? selection.provider : group.name
			const modelName = model === undefined ? selection.model : model.name
			return `${providerName} / ${modelName}`
		}

		/**
		 * The main panel: one row per Workspace, one model picker per row.
		 * @param {any} props - standard slot props plus this plugin's inject face.
		 */
		function WorkspaceModelsPage(props) {
			const useWorkspaces = props && typeof props.useWorkspaces === 'function' ? props.useWorkspaces : null
			const workspaces = useWorkspaces === null ? [] : useWorkspaces((state) => state.items) ?? []
			const [entries, setEntries] = React.useState({})
			const [catalog, setCatalog] = React.useState(null)
			const [stateError, setStateError] = React.useState(null)
			const [catalogError, setCatalogError] = React.useState(null)
			const [status, setStatus] = React.useState('')
			const [loaded, setLoaded] = React.useState(false)

			React.useEffect(() => {
				let alive = true
				const loadState = props && typeof props.loadState === 'function' ? props.loadState : null
				const loadCatalog = props && typeof props.loadCatalog === 'function' ? props.loadCatalog : null
				if (loadState !== null) {
					loadState()
						.then((result) => {
							if (!alive) return
							if (result !== null && result !== undefined && result.ok) setEntries(result.entries ?? {})
							else setStateError('Could not read the saved workspace defaults.')
						})
						.catch(() => {
							if (alive) setStateError('Could not read the saved workspace defaults.')
						})
						.finally(() => {
							if (alive) setLoaded(true)
						})
				} else {
					setLoaded(true)
					setStateError('This page cannot reach the host plugin.')
				}
				if (loadCatalog !== null) {
					loadCatalog()
						.then((result) => {
							if (!alive) return
							if (result !== null && result !== undefined && result.ok) setCatalog(result.value ?? null)
							else setCatalogError('Could not read the model catalog.')
						})
						.catch(() => {
							if (alive) setCatalogError('Could not read the model catalog.')
						})
				}
				return () => {
					alive = false
				}
			}, [])

			const save = (nextEntries, message) => {
				const saveState = props && typeof props.saveState === 'function' ? props.saveState : null
				if (saveState === null) {
					setStateError('This page cannot reach the host plugin.')
					return
				}
				setStatus('Saving…')
				setEntries(nextEntries)
				saveState(nextEntries)
					.then((result) => {
						if (result !== null && result !== undefined && result.ok) {
							setEntries(result.entries ?? nextEntries)
							setStateError(null)
							setStatus(message)
							return
						}
						setStateError(
							result !== null && result !== undefined && result.error === 'selection-unavailable'
								? 'That model or reasoning effort is not available any more; pick another one.'
								: 'Saving failed; the previous choice is still in place.',
						)
						setStatus('')
					})
					.catch(() => {
						setStateError('Saving failed; the previous choice is still in place.')
						setStatus('')
					})
			}

			const groups = catalog !== null && Array.isArray(catalog.groups) ? catalog.groups : []

			/**
			 * The reasoning efforts one model advertises, from the loaded catalog.
			 * @param {string} provider
			 * @param {string} model
			 * @returns {Array<{ id: string, name: string, description?: string }>}
			 */
			const effortsFor = (provider, model) => {
				const group = groups.find((item) => item.id === provider)
				const entry = group === undefined ? undefined : group.models.find((item) => item.id === model)
				const reasoning = entry === undefined ? undefined : entry.reasoning
				return reasoning !== undefined && reasoning !== null && Array.isArray(reasoning.efforts) ? reasoning.efforts : []
			}

			const pickModel = (workspace, rawValue) => {
				const nextEntries = { ...entries }
				if (rawValue === '') {
					delete nextEntries[workspace.workspaceId]
					save(nextEntries, 'Workspace follows the global default.')
					return
				}
				let pair
				try {
					pair = JSON.parse(rawValue)
				} catch {
					return
				}
				const previous = entries[workspace.workspaceId]
				const provider = String(pair[0])
				const model = String(pair[1])
				const keepEffort =
					previous !== undefined &&
					previous.reasoningEffort !== undefined &&
					effortsFor(provider, model).some((effort) => effort.id === previous.reasoningEffort)
				nextEntries[workspace.workspaceId] = {
					path: workspace.path,
					provider,
					model,
					...(keepEffort ? { reasoningEffort: previous.reasoningEffort } : {}),
				}
				save(nextEntries, keepEffort ? 'Model and effort saved.' : 'Model saved.')
			}

			const pickEffort = (workspace, rawValue) => {
				const entry = entries[workspace.workspaceId]
				if (entry === undefined) return
				const nextEntries = { ...entries }
				nextEntries[workspace.workspaceId] =
					rawValue === ''
						? { path: entry.path, provider: entry.provider, model: entry.model }
						: {
								path: entry.path,
								provider: entry.provider,
								model: entry.model,
								reasoningEffort: rawValue,
							}
				save(nextEntries, rawValue === '' ? 'Effort follows the model default.' : 'Effort saved.')
			}

			const configured = Object.keys(entries).length
			const rows = workspaces.map((workspace) => {
				const entry = entries[workspace.workspaceId]
				const value = entry === undefined ? '' : JSON.stringify([entry.provider, entry.model])
				const title = typeof workspace.title === 'string' && workspace.title.trim() !== '' ? workspace.title : workspace.path
				const efforts = entry === undefined ? [] : effortsFor(entry.provider, entry.model)
				const effortValue = entry !== undefined && entry.reasoningEffort !== undefined ? entry.reasoningEffort : ''
				const effortDisabled = entry === undefined || efforts.length === 0
				return h(
					'div',
					{ key: workspace.workspaceId, className: 'wdm-row' },
					h('span', { className: 'wdm-glyph', 'aria-hidden': 'true' }, h(FolderIcon)),
					h(
						'span',
						{ className: 'wdm-main' },
						h('span', { className: 'wdm-name', title }),
						h('span', { className: 'wdm-sub' }, workspace.path),
					),
					h(
						'span',
						{ className: 'wdm-picks' },
						h(
							'select',
							{
								className: 'wdm-select',
								'data-set': entry === undefined ? 'false' : 'true',
								value,
								'aria-label': `Default model for ${title}`,
								title: entry === undefined ? 'Follows the global default' : modelLabel(catalog, entry),
								onChange: (event) => pickModel(workspace, event.target.value),
							},
							h('option', { value: '' }, 'Global default'),
							groups.map((group) =>
								h(
									'optgroup',
									{ key: group.id, label: group.name },
									group.models.map((model) =>
										h('option', { key: `${group.id}/${model.id}`, value: JSON.stringify([group.id, model.id]) }, model.name),
									),
								),
							),
						),
						h(
							'select',
							{
								className: 'wdm-select wdm-effort',
								'data-set': effortValue === '' ? 'false' : 'true',
								value: effortValue,
								disabled: effortDisabled,
								'aria-label': `Default reasoning effort for ${title}`,
								title: effortDisabled
									? entry === undefined
										? 'Pick a model first'
										: 'This model has no reasoning effort setting'
									: 'Reasoning effort',
								onChange: (event) => pickEffort(workspace, event.target.value),
							},
							h('option', { value: '' }, entry === undefined ? 'Effort' : 'Model default'),
							efforts.map((effort) =>
								h('option', { key: effort.id, value: effort.id, title: effort.description }, effort.name),
							),
						),
					),
				)
			})

			const globalDefault = catalog !== null && catalog.default ? modelLabel(catalog, catalog.default) : 'the global default model'

			return h(
				'div',
				{ className: 'wdm-page' },
				h(
					'div',
					{ className: 'wdm-inner' },
					h(
						'div',
						{ className: 'wdm-head' },
						h(
							'div',
							null,
							h('h1', { className: 'wdm-title' }, 'Workspace models'),
							h(
								'p',
								{ className: 'wdm-lede' },
								'Give each Workspace its own default model and reasoning effort. A new session started in that Workspace begins on them; changing them never touches a session that already exists.',
							),
						),
						h('span', { className: 'wdm-badge' }, `${configured} of ${workspaces.length} set`),
					),
					stateError === null ? null : h('div', { className: 'wdm-error' }, stateError),
					catalogError === null ? null : h('div', { className: 'wdm-error' }, catalogError),
					h(
						'div',
						{ className: 'wdm-card' },
						loaded && workspaces.length === 0
							? h('div', { className: 'wdm-empty' }, 'No Workspaces yet. Add one in the sidebar, then come back.')
							: rows,
					),
					h(
						'div',
						{ className: 'wdm-note' },
						h(
							'div',
							{ className: 'wdm-default' },
							h(
								'span',
								null,
								h('b', null, 'Fallback'),
								h('span', null, 'Workspaces without a choice start on '),
								h('code', null, globalDefault),
								h('span', null, '.'),
							),
							h('span', { className: 'wdm-status' }, status),
						),
					),
				),
			)
		}

		return {
			/** Cordis client services this browser half needs. */
			inject: ['slots'],
			/** @param {any} ctx */
			apply(ctx) {
				ctx.effect(() => {
					if (typeof document === 'undefined') return () => {}
					const style = document.createElement('style')
					style.setAttribute('data-plugin', 'dsh-workspace-default-model')
					style.textContent = CSS
					document.head.appendChild(style)
					return () => {
						style.remove()
					}
				}, 'workspace-default-model: styles')

				/** @param {string} url @returns {Promise<any>} */
				async function getJson(url) {
					const response = await fetch(url, {
						method: 'GET',
						credentials: 'same-origin',
						cache: 'no-store',
						headers: { accept: 'application/json' },
					})
					if (!response.ok) throw new Error(`HTTP ${response.status}`)
					return await response.json()
				}

				/** @param {Record<string, unknown>} entries @returns {Promise<any>} */
				async function postEntries(entries) {
					const response = await fetch(STATE_PATH, {
						method: 'POST',
						credentials: 'same-origin',
						cache: 'no-store',
						headers: { accept: 'application/json', 'content-type': 'application/json' },
						body: JSON.stringify({ entries }),
					})
					if (!response.ok) throw new Error(`HTTP ${response.status}`)
					return await response.json()
				}

				const face = {
					loadState: () => getJson(STATE_PATH),
					saveState: (entries) => postEntries(entries),
					loadCatalog: () => getJson(CATALOG_PATH),
				}

				// The main panel is keyed by the same id the sidebar row uses; the
				// layout selects it when the row is clicked.
				ctx.slots.inject('main', () =>
					ctx.slots.register(
						{
							name: 'main',
							key: PANEL_ID,
							inject: () => face,
						},
						WorkspaceModelsPage,
					),
				)

				ctx.slots.inject('sidebar.panellist', () =>
					ctx.slots.register(
						{
							name: 'sidebar.panellist',
							id: PANEL_ID,
							order: 40,
							label: 'Workspace models',
						},
						ModelChipIcon,
					),
				)
			},
		}
	},
})
