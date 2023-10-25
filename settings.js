Array.prototype.remove = function (rValue) {
	var has_key = false
	var removed_index = -1
	const old = this
	old.forEach((value, index) => {
		if (removed_index >= 0) {
			this[index] = old[index + 1]
		} else {
			if (JSON.stringify(rValue) == JSON.stringify(value)) {
				removed_index = index
				this[index] = old[index + 1]
				has_key = true
			}
		}
	})
	delete this[old.length - 1]
	this.flat()
	return has_key
}

var commonSettings = {
	settings: {
		favourites: ['livetv_tv5monde_ctv'],
		boxIP: 23,
		keyboardInput: true,
		displayProgram: true
	}
}

function updateSettings() {
    chrome.storage.local.set(commonSettings).then(r=>{
        console.log('Settings have been updated !')
    })
}


function channelClick(event) {
	const target = event.target
    const channelID = target.getAttribute('channel-id')
	const favStatus = target.getAttribute('favourite') == '✔️'
	target.setAttribute('favourite', favStatus ? '❌' : '✔️')
	if (favStatus) {
        commonSettings['settings']['favourites'].remove(channelID)
		console.log(`Removed ${target.innerText} from favourite`)
	} else {
        commonSettings['settings']['favourites'].push(channelID)
		console.log(`Added ${target.innerText} to favourite`)
	}
    updateSettings()
}

function ipChange(event) {
    const target = event.target
    const newIP = parseInt(target.value)
    commonSettings['settings']['boxIP'] = newIP
    console.log(`IP address successfully changed to '192.168.1.${newIP}'`)
    updateSettings()
}

function checkboxChanged(event) {
    const target = event.target
    const paramName = target.name
    const isChecked = target.checked

    commonSettings['settings'][paramName] = isChecked

    updateSettings()
}

window.onload = () => {
	chrome.storage.local.get(['settings']).then((settingsJSON) => {
        
		if (Object.keys(settingsJSON).length) {
			console.log(settingsJSON)
            commonSettings = settingsJSON

			Object.keys(channelIDs).forEach((channel, channelIndex) => {
				const isFavourite = commonSettings['settings']['favourites'].includes(channel)
				let doc = document.createElement('div')
				doc.innerText = channelIDs[channel]['name']
				doc.setAttribute('channel-id', channel)
				doc.setAttribute('favourite', isFavourite ? '✔️' : '❌')
				doc.addEventListener('click', channelClick)
				doc.classList.add('channel-param')
				document.querySelector('div#listChannels').append(doc)
			})


            document.querySelector('input#boxIP').value = commonSettings['settings']['boxIP']
            document.querySelector('input#boxIP').addEventListener('change',ipChange)

            document.querySelectorAll('input[type="checkbox"]').forEach((param,index)=>{
                const isChecked = param.checked
                const paramName = param.name
                param.checked = commonSettings['settings'][paramName]
                param.addEventListener('change',checkboxChanged)
            })

		} else {
			chrome.storage.local.set(commonSettings).then((r) => {
				console.log('Settings have been successfully resetted')
			})
		}
	})
}
