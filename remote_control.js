const fetchJSON = async function (url) {
	await fetch(url).then((r) => Promise.resolve(r.json()))
}

const remoteActions = {
	volUp: 115,
	volDown: 114,
	volMute: 113,

	chanUp: 402,
	chanDown: 403,

	power: 116,

	dirUp: 103,
	dirDown: 108,
	dirLeft: 105,
	dirRight: 106,
	dirOk: 352,
	dirBack: 158,
	dirMenu: 139,

	playPause: 164,
	playForward: 159,
	playBackward: 168,
	playRec: 167,
	playVOD: 393,

	number: 512
}

const buttonNames = {
	volUp: 'Volume Up',
	volDown: 'Volume Down',
	volMute: 'Mute',

	chanUp: 'Channel Up',
	chanDown: 'Channel Down',

	power: 'Power',

	dirUp: 'Up',
	dirDown: 'Down',
	dirLeft: 'Left',
	dirRight: 'Right',
	dirOk: 'OK',
	dirBack: 'Back',
	dirMenu: 'Menu',

	playPause: 'Play/Pause',
	playForward: 'Forward',
	playBackward: 'Backward',
	playRec: 'Record',
	playVOD: 'VOD'
}

const DEBUG_MODE = false
var HTTP_QUERIES = localStorage.getItem('liveMode') == 'true' ?? true
var loopMacro = { handler: function () {}, index: 0 }
var macroMode = false

//http://192.168.1.23:8080/remoteControl/cmd?operation=01&key=402&mode=0
function buildURL(keyCode = '0', mode = 'get', host = '192.168.1.23', port = 8080) {
	const url = new URL(`http://${host}:${port}`)
	url.pathname = 'remoteControl/cmd'
	url.searchParams.append('operation', mode == 'get' ? '10' : '01')
	url.searchParams.append('mode', '0')
	url.searchParams.append('key', keyCode)
	return url.href
}

function getRequest(url = '') {
	const bypassRequester = document.querySelector('iframe#urlRequester')
	if (HTTP_QUERIES) bypassRequester.src = url
	setTimeout(() => {
		bypassRequester.src = 'none'
	}, 100)
}

function testKey() {
	const keyURL = buildURL(remoteActions['volMute'], 'get')
	const rep = getRequest(keyURL)
	return rep
}

function getKeyName(key = 'dirOk') {
	// console.log(key)
	return parseInt(key) ? key : buttonNames[key]
}

function sendKey(key = '0') {
	const remoteURL = buildURL(key, DEBUG_MODE ? 'get' : 'set')
	getKeyName(key)
	if (HTTP_QUERIES) getRequest(remoteURL)
}

function getKey(event) {
	const target = event.target
	const key = target.getAttribute('data-key')
	const needConfirm = target.hasAttribute('ask-confirm') ? target.getAttribute('ask-confirm') : false
	const keyNumber = key == 'number' ? target.getAttribute('data-num') : -1
	const keyAction = key == 'number' ? remoteActions[key] + parseInt(keyNumber) : remoteActions[key]

	const keyName = getKeyName(target.hasAttribute('data-num') ? target.getAttribute('data-num') : key)
	if (HTTP_QUERIES) {
		if (needConfirm) {
			if (confirm(`Do you want to press the ${keyName} button ?`)) {
				sendKey(keyAction)
				console.log(`Confirm pressing key ${key}: ${keyName}`)
			}
		} else {
			sendKey(keyAction)
			console.log(`Key ${key} pressed → ${keyName}`)
		}
	} else {
		console.log(`[Debug] Pressing key ${key}: ${keyName}`)
	}
	return keyAction
}

function macroKeys(list = [], delay = 250) {
	loopMacro['index'] = 0
	loopMacro['handler'] = setInterval(() => {
		const keyToPress = list[loopMacro['index']]
		console.log(keyToPress)

		if (HTTP_QUERIES) sendKey(keyToPress)

		loopMacro['index']++
		if (loopMacro['index'] >= list.length) {
			clearInterval(loopMacro['handler'])
			console.log('Macro loop done')
			loopMacro['handler'] = () => {}
		}
	}, delay)
	return list
}

function setVolumeLevel(level = 1, delay = 250) {
	var volList = []
	for (var i = 0; i < 15; i++) volList.push(remoteActions['volDown'])
	for (var i = 0; i < level; i++) volList.push(remoteActions['volUp'])

	macroKeys(volList, delay)
}

function onLoadRemote(settings) {
	var listKeys = []
	document.querySelectorAll('div[data-key]').forEach((key, index) => {
		const keyType = key.getAttribute('data-key')
		const keyNumber = keyType == 'number' ? key.getAttribute('data-number') : 0

		$(key).click(getKey)
	})

	console.log(`Keyboard Input: ${settings['settings']['enableKeyboard'] ? '✔️' : '❌'}`)
	if (settings['settings']['enableKeyboard']) {
		document.addEventListener('keydown', (event) => {
			event.preventDefault()
			const key = event.key
			// console.log(key)

			switch (key) {
				case 'Enter': {
					if (macroMode) {
						console.log(`Macro executed ! → ${listKeys}`)
						for (var i = 0; i < listKeys.length; i++) listKeys[i] = remoteActions['number'] + listKeys[i]
						macroKeys(listKeys, 250)
						listKeys = []
						macroMode = false
					} else {
						sendKey(remoteActions['dirOk'])
					}
					break
				}
				case 'Backspace': {
					if (!macroMode) sendKey(remoteActions['dirBack'])
					else {
						macroMode = false
						listKeys = []
					}
					break
				}
				case 'M': {
					if (!macroMode) sendKey(remoteActions['dirMenu'])
					break
				}
				case 'm': {
					if (!macroMode) sendKey(remoteActions['volMute'])
					break
				}
				case 'Space':
				case 'p': {
					if (!macroMode) sendKey(remoteActions['playPause'])
					break
				}
				case '+': {
					if (!macroMode) sendKey(remoteActions['volUp'])
					break
				}
				case '-': {
					if (!macroMode) sendKey(remoteActions['volDown'])
					break
				}
				case 'PageUp': {
					if (!macroMode) sendKey(remoteActions['chanUp'])
					break
				}
				case 'PageDown': {
					if (!macroMode) sendKey(remoteActions['chanDown'])
					break
				}
				case '.': {
					if (!macroMode) sendKey(remoteActions['dirMenu'])
					break
				}
				case 'Escape': {
					if (!macroMode) {
						//  Close only if in the extension
						if (location.protocol == 'chrome-extension:') window.close()
					}
					macroMode = false
					break
				}
				default: {
					if (key.startsWith('Arrow')) {
						if (event.shiftKey) {
							if (key.includes('Left') || key.includes('Right')) {
								const keyName = key == 'ArrowLeft' ? 'playBackward' : 'playForward'
								sendKey(remoteActions[keyName])
								console.log(keyName)
							}
						} else {
							const keyName = key.replace('Arrow', 'dir')
							sendKey(remoteActions[keyName])
							console.log(keyName)
						}
					}

					if (parseInt(key) || key == '0') {
						console.log(key)
						macroMode = true
						listKeys.push(parseInt(key))
						if (listKeys.length > 3) {
							for (var i = 0; i < listKeys.length; i++) {
								listKeys[i] = listKeys[i + 1]
							}
							listKeys.pop()
						}
						document.querySelector('div#macro').innerHTML = '<h3>Press Enter to set the channel</h3></br><p>'
						listKeys.forEach((value, index) => {
							document.querySelector('div#macro').innerHTML += `${value}`
						})
						document.querySelector('div#macro').innerHTML += `</p>`
					}
					break
				}
			}

			document.querySelector('div#macro').setAttribute('state', macroMode ? 'enabled' : 'disabled')
			if (!macroMode) document.querySelector('div#macro').innerHTML = ''
		})
	}

	$('div#live-mode').click(() => {
		HTTP_QUERIES = !(localStorage.getItem('liveMode') == 'true') ?? true
		localStorage.setItem('liveMode', `${HTTP_QUERIES}`)
		document.querySelector('div#live-mode').setAttribute('live-mode', HTTP_QUERIES)
		console.log(`Click on LiveStatus → ${HTTP_QUERIES}`)
	})
	document.querySelector('div#live-mode').setAttribute('live-mode', HTTP_QUERIES)
}
