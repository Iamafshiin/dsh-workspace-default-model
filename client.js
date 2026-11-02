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
			'.wdm-row[data-color="true"]{box-shadow:inset 3px 0 0 var(--wdm-row-color)}',
			'.wdm-row[data-color="true"] .wdm-glyph{color:var(--wdm-row-color);background:color-mix(in srgb,var(--wdm-row-color) 18%,transparent)}',
			'.wdm-color{flex:none;width:22px;height:22px;box-sizing:border-box;border-radius:6px;border:1px solid var(--dsw-alias-border-l2);background:var(--wdm-color);cursor:pointer;padding:0}',
			'.wdm-color[data-empty="true"]{background:transparent;border-style:dashed}',
			'.wdm-color:hover{border-color:var(--dsw-alias-label-tertiary)}',
			'.wdm-color:focus-visible{outline:2px solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:1px}',
			'.wdm-color-pop{max-height:none;padding:10px 0 0}',
			'.wdm-swatches{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;padding:0 10px 10px}',
			'.wdm-swatch{width:22px;height:22px;box-sizing:border-box;border-radius:6px;border:1px solid var(--dsw-alias-border-l2);cursor:pointer;padding:0}',
			'.wdm-swatch[data-selected="true"]{outline:2px solid var(--dsw-alias-label-primary);outline-offset:1px}',
			'.wdm-color-row{display:flex;align-items:center;gap:8px;padding:0 10px 10px}',
			'.wdm-color-input{flex:none;width:30px;height:26px;padding:0;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:transparent;cursor:pointer}',
			'.wdm-hex{flex:1;min-width:0;height:26px;box-sizing:border-box;border-radius:6px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;padding:0 7px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}',
			'.wdm-hex:focus-visible{outline:2px solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:1px}',
			'.wdm-clear{flex:1;height:26px;border-radius:6px;border:1px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;cursor:pointer}',
			'.wdm-clear:hover:not(:disabled){color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-tertiary)}',
			'.wdm-clear:disabled{opacity:.45;cursor:default}',
			'div[role="treeitem"][data-row-key^="workspace:"][data-wdm-ws-color]{position:relative}',
			'div[role="treeitem"][data-row-key^="workspace:"][data-wdm-ws-color]::before{content:"";position:absolute;inset-inline-start:1px;top:50%;transform:translateY(-50%);width:4px;height:16px;border-radius:2px;background:var(--wdm-ws-color);pointer-events:none}',
			'.wdm-picker{position:relative;display:inline-flex;flex:none}',
			'.wdm-trigger{display:inline-flex;align-items:center;justify-content:space-between;gap:8px;text-align:left;overflow:hidden}',
			'.wdm-trigger-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
			'.wdm-chevron{flex:none;font-size:10px;line-height:1;color:var(--dsw-alias-label-tertiary)}',
			'.wdm-pop{position:fixed;z-index:1200;display:flex;flex-direction:column;max-height:320px;overflow:hidden;border:1px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md,10px);background:var(--dsw-alias-bg-layer-1);box-shadow:var(--dsw-elevation-prominent,0 10px 28px rgba(0,0,0,.38))}',
			'.wdm-pop-search{padding:8px;border-bottom:1px solid var(--dsw-alias-border-l2)}',
			'.wdm-input{width:100%;height:28px;box-sizing:border-box;border-radius:var(--dsw-radius-sm,8px);border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font:inherit;font-size:12.5px;padding:0 8px}',
			'.wdm-input:focus-visible{outline:2px solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:1px}',
			'.wdm-pop-list{overflow:auto;padding:4px;min-height:0}',
			'.wdm-pop-group{padding:8px 8px 3px;font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--dsw-alias-label-tertiary)}',
			'.wdm-opt{display:block;width:100%;text-align:left;padding:6px 9px;border:0;border-radius:var(--dsw-radius-sm,8px);background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12.5px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
			'.wdm-opt:hover,.wdm-opt-active{background:color-mix(in srgb,var(--dsw-alias-label-primary) 9%,transparent)}',
			'.wdm-opt[aria-selected="true"]{font-weight:600}',
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
		 * A searchable model picker: a button that opens a popover with a search
		 * field and the provider-grouped catalog. Rendered with fixed positioning
		 * so the card's rounded overflow never clips it.
		 * @param {any} props - groups, label, value, ariaLabel, onPick.
		 */
		function ModelPicker(props) {
			const groups = Array.isArray(props.groups) ? props.groups : []
			const [open, setOpen] = React.useState(false)
			const [query, setQuery] = React.useState('')
			const [active, setActive] = React.useState(0)
			const [position, setPosition] = React.useState(null)
			const triggerRef = React.useRef(null)
			const inputRef = React.useRef(null)

			/** Flattened, filtered options: the global default first, then models. */
			const flat = React.useMemo(() => {
				const needle = query.trim().toLowerCase()
				const out = [{ kind: 'global', label: 'Global default' }]
				for (const group of groups) {
					const groupMatches = needle !== '' && String(group.name ?? '').toLowerCase().includes(needle)
					for (const model of group.models) {
						const name = String(model.name ?? model.id)
						const hit =
							needle === '' ||
							groupMatches ||
							name.toLowerCase().includes(needle) ||
							String(model.id).toLowerCase().includes(needle)
						if (hit) out.push({ kind: 'model', provider: group.id, providerName: group.name, model: model.id, label: name })
					}
				}
				return out
			}, [groups, query])

			const close = React.useCallback(() => {
				setOpen(false)
				setQuery('')
				setActive(0)
			}, [])

			const openPanel = () => {
				const rect = triggerRef.current === null ? null : triggerRef.current.getBoundingClientRect()
				if (rect !== null) {
					const width = Math.max(rect.width, 280)
					const left = Math.min(rect.left, Math.max(8, window.innerWidth - width - 12))
					const below = rect.bottom + 6
					const flip = below + 320 > window.innerHeight && rect.top > 340
					setPosition({ left, top: flip ? Math.max(8, rect.top - 6 - 320) : below, width })
				}
				setOpen((wasOpen) => !wasOpen)
			}

			React.useEffect(() => {
				if (!open) return undefined
				const onPointerDown = (event) => {
					const node = event.target
					if (triggerRef.current !== null && triggerRef.current.contains(node)) return
					if (node instanceof Element && node.closest('.wdm-pop') !== null) return
					close()
				}
				const onKeyDown = (event) => {
					if (event.key === 'Escape') close()
				}
				const onScroll = () => close()
				document.addEventListener('mousedown', onPointerDown)
				document.addEventListener('keydown', onKeyDown)
				window.addEventListener('resize', onScroll)
				window.addEventListener('scroll', onScroll, true)
				const focusInput = () => {
					if (inputRef.current !== null) inputRef.current.focus()
				}
				const frame = typeof window.requestAnimationFrame === 'function' ? window.requestAnimationFrame(focusInput) : window.setTimeout(focusInput, 16)
				return () => {
					document.removeEventListener('mousedown', onPointerDown)
					document.removeEventListener('keydown', onKeyDown)
					window.removeEventListener('resize', onScroll)
					window.removeEventListener('scroll', onScroll, true)
					if (typeof window.cancelAnimationFrame === 'function') window.cancelAnimationFrame(frame)
					else window.clearTimeout(frame)
				}
			}, [open, close])

			const choose = (option) => {
				props.onPick(option.kind === 'global' ? '' : JSON.stringify([option.provider, option.model]))
				close()
			}

			const onKeyDown = (event) => {
				if (event.key === 'ArrowDown') {
					event.preventDefault()
					setActive((index) => Math.min(flat.length - 1, index + 1))
				} else if (event.key === 'ArrowUp') {
					event.preventDefault()
					setActive((index) => Math.max(0, index - 1))
				} else if (event.key === 'Enter') {
					event.preventDefault()
					const option = flat[active]
					if (option !== undefined) choose(option)
				}
			}

			/** Render rows, inserting a provider heading when the group changes. */
			const listItems = []
			let lastProvider = null
			flat.forEach((option, index) => {
				if (option.kind === 'model' && option.provider !== lastProvider) {
					lastProvider = option.provider
					listItems.push(
						h('div', { key: `group-${option.provider}`, className: 'wdm-pop-group' }, option.providerName ?? option.provider),
					)
				}
				listItems.push(
					h(
						'button',
						{
							key: option.kind === 'global' ? 'global' : `${option.provider}/${option.model}`,
							type: 'button',
							role: 'option',
							className: `wdm-opt${index === active ? ' wdm-opt-active' : ''}`,
							'aria-selected': index === 0 && option.kind === 'global' && props.value === '' ? 'true' : undefined,
							onClick: () => choose(option),
							onMouseEnter: () => setActive(index),
						},
						option.label,
					),
				)
			})

			return h(
				'span',
				{ className: 'wdm-picker' },
				h(
					'button',
					{
						ref: triggerRef,
						type: 'button',
						className: 'wdm-select wdm-trigger',
						'data-set': props.value === '' ? 'false' : 'true',
						'aria-label': props.ariaLabel,
						'aria-haspopup': 'listbox',
						'aria-expanded': open ? 'true' : 'false',
						title: props.label,
						onClick: openPanel,
					},
					h('span', { className: 'wdm-trigger-label' }, props.label),
					h('span', { className: 'wdm-chevron', 'aria-hidden': 'true' }, '▾'),
				),
				open
					? h(
							'div',
							{
								className: 'wdm-pop',
								style: position === null ? { left: 0, top: 0, width: 280 } : position,
							},
							h(
								'div',
								{ className: 'wdm-pop-search' },
								h('input', {
									ref: inputRef,
									className: 'wdm-input',
									type: 'search',
									value: query,
									placeholder: 'Search models…',
									'aria-label': 'Search models',
									onChange: (event) => {
										setQuery(event.target.value)
										setActive(0)
									},
									onKeyDown,
								}),
							),
							h('div', { className: 'wdm-pop-list', role: 'listbox' }, listItems),
						)
					: null,
			)
		}

		/** Preset colours offered by the picker; the hex field accepts anything else. */
		const COLOR_PRESETS = [
			'#e5484d',
			'#e57e48',
			'#e5b93c',
			'#a7d14a',
			'#4cc38a',
			'#3fb8af',
			'#4a9de5',
			'#6f6fe0',
			'#a86fe0',
			'#e06fb5',
			'#8d8d8d',
			'#c0a37c',
		]

		/**
		 * Colour picker for one Workspace: preset swatches, a native colour well,
		 * and a hex field, so any colour can be chosen.
		 * @param {any} props - value, label, ariaLabel, onPick.
		 */
		function ColorPicker(props) {
			const [open, setOpen] = React.useState(false)
			const [position, setPosition] = React.useState(null)
			const [draft, setDraft] = React.useState(typeof props.value === 'string' && props.value !== '' ? props.value : '#4a9de5')
			const triggerRef = React.useRef(null)

			const close = React.useCallback(() => setOpen(false), [])

			const openPanel = () => {
				const rect = triggerRef.current === null ? null : triggerRef.current.getBoundingClientRect()
				if (rect !== null) {
					const width = 214
					const left = Math.min(rect.left, Math.max(8, window.innerWidth - width - 12))
					const below = rect.bottom + 6
					const flip = below + 250 > window.innerHeight && rect.top > 280
					setPosition({ left, top: flip ? Math.max(8, rect.top - 6 - 250) : below, width })
				}
				setDraft(typeof props.value === 'string' && props.value !== '' ? props.value : '#4a9de5')
				setOpen((wasOpen) => !wasOpen)
			}

			React.useEffect(() => {
				if (!open) return undefined
				const onPointerDown = (event) => {
					const node = event.target
					if (triggerRef.current !== null && triggerRef.current.contains(node)) return
					if (node instanceof Element && node.closest('.wdm-pop') !== null) return
					close()
				}
				const onKeyDown = (event) => {
					if (event.key === 'Escape') close()
				}
				const onScroll = () => close()
				document.addEventListener('mousedown', onPointerDown)
				document.addEventListener('keydown', onKeyDown)
				window.addEventListener('resize', onScroll)
				window.addEventListener('scroll', onScroll, true)
				return () => {
					document.removeEventListener('mousedown', onPointerDown)
					document.removeEventListener('keydown', onKeyDown)
					window.removeEventListener('resize', onScroll)
					window.removeEventListener('scroll', onScroll, true)
				}
			}, [open, close])

			const choose = (color) => {
				props.onPick(color)
				close()
			}

			const commitHex = (text) => {
				const cleaned = String(text).trim().replace(/^#/, '').toLowerCase()
				if (/^[0-9a-f]{6}$/.test(cleaned)) choose(`#${cleaned}`)
				else if (/^[0-9a-f]{3}$/.test(cleaned)) choose(`#${cleaned[0]}${cleaned[0]}${cleaned[1]}${cleaned[1]}${cleaned[2]}${cleaned[2]}`)
			}

			const value = typeof props.value === 'string' ? props.value : ''

			return h(
				'span',
				{ className: 'wdm-picker' },
				h('button', {
					ref: triggerRef,
					type: 'button',
					className: 'wdm-color',
					'data-empty': value === '' ? 'true' : 'false',
					'aria-label': props.ariaLabel,
					'aria-haspopup': 'dialog',
					'aria-expanded': open ? 'true' : 'false',
					title: value === '' ? 'No colour' : value,
					style: { '--wdm-color': value === '' ? 'transparent' : value },
					onClick: openPanel,
				}),
				open
					? h(
							'div',
							{ className: 'wdm-pop wdm-color-pop', style: position === null ? { left: 0, top: 0, width: 214 } : position },
							h(
								'div',
								{ className: 'wdm-swatches' },
								COLOR_PRESETS.map((color) =>
									h('button', {
										key: color,
										type: 'button',
										className: 'wdm-swatch',
										'data-selected': value.toLowerCase() === color ? 'true' : 'false',
										title: color,
										style: { background: color },
										onClick: () => choose(color),
									}),
								),
							),
							h(
								'div',
								{ className: 'wdm-color-row' },
								h('input', {
									className: 'wdm-color-input',
									type: 'color',
									value: /^#[0-9a-f]{6}$/i.test(draft) ? draft : '#4a9de5',
									'aria-label': 'Pick any colour',
									onChange: (event) => {
										setDraft(event.target.value)
										choose(event.target.value)
									},
								}),
								h('input', {
									className: 'wdm-hex',
									type: 'text',
									value: draft,
									placeholder: '#4a9de5',
									'aria-label': 'Colour hex value',
									onChange: (event) => setDraft(event.target.value),
									onKeyDown: (event) => {
										if (event.key === 'Enter') {
											event.preventDefault()
											commitHex(draft)
										}
									},
								}),
							),
							h(
								'div',
								{ className: 'wdm-color-row' },
								h(
									'button',
									{
										type: 'button',
										className: 'wdm-clear',
										onClick: () => choose(''),
										disabled: value === '',
									},
									'No colour',
								),
							),
						)
					: null,
			)
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

			// Feed the sidebar painter so workspace rows carry their colour even
			// while this page is closed.
			React.useEffect(() => {
				if (props && typeof props.publishColors === 'function') props.publishColors(entries)
			}, [entries])

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
							result !== null && result !== undefined && result.error === 'colour-invalid'
								? 'That colour value is not a hex colour; try again.'
								: result !== null && result !== undefined && result.error === 'selection-unavailable'
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
				const previous = entries[workspace.workspaceId]
				const keptColor = previous !== undefined && previous.color !== undefined ? { color: previous.color } : {}
				if (rawValue === '') {
					if (previous === undefined || previous.color === undefined) delete nextEntries[workspace.workspaceId]
					else nextEntries[workspace.workspaceId] = { path: workspace.path, ...keptColor }
					save(nextEntries, 'Workspace follows the global default.')
					return
				}
				let pair
				try {
					pair = JSON.parse(rawValue)
				} catch {
					return
				}
				const provider = String(pair[0])
				const model = String(pair[1])
				const keepEffort =
					previous !== undefined &&
					previous.reasoningEffort !== undefined &&
					effortsFor(provider, model).some((effort) => effort.id === previous.reasoningEffort)
				nextEntries[workspace.workspaceId] = {
					path: workspace.path,
					...keptColor,
					provider,
					model,
					...(keepEffort ? { reasoningEffort: previous.reasoningEffort } : {}),
				}
				save(nextEntries, keepEffort ? 'Model and effort saved.' : 'Model saved.')
			}

			const pickEffort = (workspace, rawValue) => {
				const entry = entries[workspace.workspaceId]
				if (entry === undefined || entry.provider === undefined || entry.model === undefined) return
				const nextEntries = { ...entries }
				nextEntries[workspace.workspaceId] = {
					path: entry.path,
					...(entry.color === undefined ? {} : { color: entry.color }),
					provider: entry.provider,
					model: entry.model,
					...(rawValue === '' ? {} : { reasoningEffort: rawValue }),
				}
				save(nextEntries, rawValue === '' ? 'Effort follows the model default.' : 'Effort saved.')
			}

			const pickColor = (workspace, color) => {
				const entry = entries[workspace.workspaceId]
				const nextEntries = { ...entries }
				if (color === '') {
					if (entry === undefined) return
					if (entry.provider === undefined || entry.model === undefined) delete nextEntries[workspace.workspaceId]
					else {
						nextEntries[workspace.workspaceId] = {
							path: entry.path,
							provider: entry.provider,
							model: entry.model,
							...(entry.reasoningEffort === undefined ? {} : { reasoningEffort: entry.reasoningEffort }),
						}
					}
					save(nextEntries, 'Colour cleared.')
					return
				}
				nextEntries[workspace.workspaceId] = {
					path: workspace.path,
					color,
					...(entry === undefined || entry.provider === undefined || entry.model === undefined
						? {}
						: {
								provider: entry.provider,
								model: entry.model,
								...(entry.reasoningEffort === undefined ? {} : { reasoningEffort: entry.reasoningEffort }),
							}),
				}
				save(nextEntries, 'Colour saved.')
			}

			const configured = Object.keys(entries).length
			const rows = workspaces.map((workspace) => {
				const entry = entries[workspace.workspaceId]
				const hasModel = entry !== undefined && entry.provider !== undefined && entry.model !== undefined
				const value = hasModel ? JSON.stringify([entry.provider, entry.model]) : ''
				const title = typeof workspace.title === 'string' && workspace.title.trim() !== '' ? workspace.title : workspace.path
				const efforts = hasModel ? effortsFor(entry.provider, entry.model) : []
				const effortValue = hasModel && entry.reasoningEffort !== undefined ? entry.reasoningEffort : ''
				const effortDisabled = !hasModel || efforts.length === 0
				return h(
					'div',
					{
						key: workspace.workspaceId,
						className: 'wdm-row',
						'data-color': entry !== undefined && entry.color !== undefined ? 'true' : 'false',
						style: entry !== undefined && entry.color !== undefined ? { '--wdm-row-color': entry.color } : undefined,
					},
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
						h(ColorPicker, {
							value: entry !== undefined && entry.color !== undefined ? entry.color : '',
							ariaLabel: `Workspace colour for ${title}`,
							onPick: (color) => pickColor(workspace, color),
						}),
						h(ModelPicker, {
							groups,
							value,
							label: hasModel ? modelLabel(catalog, entry) : 'Global default',
							ariaLabel: `Default model for ${title}`,
							onPick: (rawValue) => pickModel(workspace, rawValue),
						}),
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
								'Give each Workspace its own colour, default model and reasoning effort. The colour marks the Workspace in the sidebar; the model applies to a new session started there. Nothing here changes a session that already exists.',
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

				/** Latest known colour map, mirrored onto the left sidebar's rows. */
				let colorMap = {}

				/**
				 * Mark each workspace row in the sidebar with its colour. The rows are
				 * rendered by ui-workspace and expose `data-row-key="workspace:<id>"`,
				 * so this only adds an attribute and a CSS variable; the visible bar is
				 * a pseudo-element from our stylesheet. React keeps ownership of the row.
				 */
				const paintSidebarColors = () => {
					if (typeof document === 'undefined') return
					const wanted = new Map()
					for (const [workspaceId, entry] of Object.entries(colorMap)) {
						if (entry !== null && typeof entry === 'object' && typeof entry.color === 'string' && entry.color !== '') {
							wanted.set(workspaceId, entry.color)
						}
					}
					for (const node of document.querySelectorAll('[data-wdm-ws-color]')) {
						const key = node.getAttribute('data-row-key') || ''
						const workspaceId = key.startsWith('workspace:') ? key.slice('workspace:'.length) : ''
						if (!wanted.has(workspaceId)) {
							node.removeAttribute('data-wdm-ws-color')
							node.style.removeProperty('--wdm-ws-color')
						}
					}
					for (const [workspaceId, color] of wanted) {
						const escaped = typeof CSS !== 'undefined' && typeof CSS.escape === 'function' ? CSS.escape(workspaceId) : workspaceId
						const node = document.querySelector(`[role="treeitem"][data-row-key="workspace:${escaped}"]`)
						if (node === null) continue
						node.setAttribute('data-wdm-ws-color', '')
						node.style.setProperty('--wdm-ws-color', color)
					}
				}

				const face = {
					loadState: () => getJson(STATE_PATH),
					saveState: (entries) => postEntries(entries),
					loadCatalog: () => getJson(CATALOG_PATH),
					publishColors: (entries) => {
						colorMap = entries !== null && typeof entries === 'object' ? entries : {}
						paintSidebarColors()
					},
				}

				// Keep the sidebar in step with re-renders, theme switches and reloads.
				ctx.effect(() => {
					if (typeof document === 'undefined') return () => {}
					let frame = null
					const run = () => {
						frame = null
						paintSidebarColors()
					}
					const schedule = () => {
						if (frame !== null) return
						frame =
							typeof window.requestAnimationFrame === 'function' ? window.requestAnimationFrame(run) : window.setTimeout(run, 32)
					}
					const observer = new MutationObserver(schedule)
					observer.observe(document.body, { childList: true, subtree: true })
					getJson(STATE_PATH)
						.then((result) => {
							if (result === null || result === undefined || result.ok !== true) return
							colorMap = result.entries ?? {}
							schedule()
						})
						.catch(() => {})
					return () => {
						observer.disconnect()
						if (frame !== null) {
							if (typeof window.cancelAnimationFrame === 'function') window.cancelAnimationFrame(frame)
							else window.clearTimeout(frame)
						}
					}
				}, 'workspace-default-model: sidebar colours')

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
