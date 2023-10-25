window.onload = function () {
	chrome.storage.local.get(['settings']).then((settingsJSON) => {
		if (Object.keys(settingsJSON).length) {
			console.log(settingsJSON)
            onLoadRemote(settingsJSON)
            onLoadTVProgram(settingsJSON)
        }
    })
}