const channelIDs = {
	livetv_tf1_ctv: { name: 'TF1', num: 1 },
	livetv_france2_ctv: { name: 'France 2', num: 2 },
	livetv_france3_ctv: { name: 'France 3', num: 3 },
	livetv_france5_ctv: { name: 'France 5', num: 5 },
	livetv_m6_ctv: { name: 'M6', num: 6 },
	livetv_arte_ctv: { name: 'Arte', num: 7 },
	livetv_c8_ctv: { name: 'C8', num: 8 },
	livetv_w9_ctv: { name: 'W9', num: 9 },
	livetv_tmc_ctv: { name: 'TMC', num: 10 },
	livetv_tfx_ctv: { name: 'TFX', num: 11 },
	livetv_nrj12_ctv: { name: 'NRJ12', num: 12 },
	livetv_france4_ctv: { name: 'France 4', num: 14 },
	livetv_cstar_ctv: { name: 'CStar', num: 17 },
	livetv_gulli_ctv: { name: 'Gulli', num: 18 },
	livetv_tf1_series_films_ctv: { name: 'TF1 Séries Films', num: 20 },
	livetv_la_chaine_l_equipe_ctv: { name: "L'équipe", num: 21 },
	livetv_6ter_ctv: { name: '6Ter', num: 22 },
	livetv_rmc_story_ctv: { name: 'RMC Story', num: 23 },
	livetv_rmc_decouverte_ctv: { name: 'RMC Découverte', num: 24 },
	livetv_cherie_25_ctv: { name: 'Cherie 25', num: 25 },
	livetv_tv5monde_ctv: { name: 'TV5 Monde', num: 33 }
}

const whitelistedGenres = [
	'Film'
	/* , 'Série' */
]

function getTimePeriod(new_day_start_time=3) {
	// new_day_start_time → Time at which the current day is actually displayed
	const today = new Date()
	const yesterday = new Date(today)
	const tomorrow = new Date(today)
	
	yesterday.setDate(today.getDate() - 1)
	tomorrow.setDate(today.getDate() + 1)

	if (today.getHours() <= new_day_start_time) {
		tomorrow.setDate(today.getDate())
		today.setDate(yesterday.getDate())
	}
	today.setHours(20,0,0,0)
	tomorrow.setHours(2, 0, 0, 0)

	const periodStart = new Date(today)
	const periodEnd = new Date(tomorrow)
	console.log(`Period Start: ${periodStart.toLocaleString('fr-FR')}\nPeriod End: ${periodEnd.toLocaleString('fr-FR')}\n`)
	return `${periodStart.getTime()},${periodEnd.getTime()}`
}

function getProgramURL() {
	const tvURL = new URL('https://rp-ott-mediation-tv.woopic.com/api-gw/live/v3/applications/STB4PC/programs')
	const timePeriod = getTimePeriod()

	tvURL.searchParams.set('groupBy', 'channel')
	tvURL.searchParams.set('epgIds', 'all')
	tvURL.searchParams.set('mco', 'OFR')
	tvURL.searchParams.set('period', timePeriod)
	// tvURL.searchParams.set('limit', '40')
	tvURL.searchParams.set('includeEmptyChannels', 'false')
	return tvURL.href
}

async function getTvProgram() {
	const jsonURL = getProgramURL()
	return await $.getJSON(jsonURL).done((json) => {
		return json
	})
}

Number.prototype.leadingZero = function () {
	return `${this >= 10 ? '' : '0'}${this.toString()}`
}

function formatDuration(dur) {
	const seconds = dur % 60
	const minutes = Math.floor((dur / 60) % 60)
	const hours = Math.floor((dur / 3600) % 24)
	return `${hours.leadingZero()}h${minutes.leadingZero()}`
}
function formatDate(date) {
	const fDate = new Date(date * 1e3)
	return `On ${fDate.toDateString()} at ${fDate.getHours()}h${fDate.getMinutes().leadingZero()}`
}

function sortProgram(tvProgs) {
	// var ret = { sorted: [], list: {} }
	var ret = { list: {} }
	Object.keys(tvProgs).forEach((key, keyIndex) => {
		tvProgs[key].forEach((prog, progIndex) => {
			if (channelIDs.hasOwnProperty(prog['externalId'])) {
				if (whitelistedGenres.includes(prog['genre'])) {
					if (!ret['list'].hasOwnProperty(prog['externalId'])) ret['list'][prog['externalId']] = []
					
					var title = prog['title']
					if (prog.hasOwnProperty('season')) {
						const episodeDetails = [
							prog['season']['number'] < 10 ? `0${prog['season']['number'].toString()}` : prog['season']['number'],
							prog['season']['episodesCount'] < 10 ? `0${prog['season']['episodesCount'].toString()}` : prog['season']['episodesCount']
						]

						title = `${prog['season']['serie']['title']} S${episodeDetails[0]}:E${episodeDetails[1]}`
					}
					const tv_program = {
						type: prog['genre'],
						title: title,
						duration: prog['duration'],
						rawId: key,
						formatted: {
							duration: formatDuration(prog['duration']),
							diffusionDate: formatDate(prog['diffusionDate'])
						},
						channelNumber: prog['channelZappingNumber'],
						diffusionDate: prog['diffusionDate'],
						synopsis: prog['synopsis'],
						cover: prog['covers'][0],
						channelNumber: channelIDs[prog['externalId']]['num'],
						externalId: prog['externalId']
					}
					ret['list'][prog['externalId']].push(tv_program)
					console.log(`Pushing ${title} into ${prog['externalId']} → ${ret['list'][prog['externalId']].length}`)
					// ret['sorted'].push(tv_program)
				}
			}
		})
	})
	
	// ret['sorted'].sort((chanX,chanY)=>{return chanX['channelNumber'] - chanY['channelNumber']})
	return ret
}

function synopsisMaker(text, nMaxWord = 25) {
	var retText = text
	var splitText = text.split(' ')
	if (splitText.length > nMaxWord) {
		retText = ''
		for (var i = 0; i <= nMaxWord; i++) {
			retText += `${splitText[i]} `
			if (i == nMaxWord && !splitText[i].endsWith('.')) retText += '...'
		}
	}
	return retText
}

function makeKeyList(n) {
	var list = []
	do {
		list.push(Math.floor(n % 10))
	} while ((n /= 10) >= 1)
	list = list.reverse()
	console.log(list)
	for (var i = 0; i < list.length; i++) list[i] = remoteActions['number'] + list[i]
	return list
}

async function onLoadTVProgram() {
	const programs = await getTvProgram()
	const sortedPrograms = sortProgram(programs)['list']
	Object.keys(channelIDs).forEach((channel, chanIndex) => {
		if (sortedPrograms.hasOwnProperty(channel)){
			let new_channel = document.querySelector('template[data-temp="channel"]').content.cloneNode(true)
			new_channel.querySelector('[data-name="channelId"]').innerText = channelIDs[channel]['name']
			new_channel.querySelector('[data-channel-num]').setAttribute('data-channel-num', channelIDs[channel]['num'])

			sortedPrograms[channel].forEach((prog, progIndex) => {
				let new_prog = document.querySelector('template[data-temp="tv-program"]').content.cloneNode(true)
				new_prog.querySelector('[data-name="thumbnail"]').style.backgroundImage = `url("${prog['cover']['url']}")`
				new_prog.querySelector('[data-name="title"]').innerText = prog['title']
				new_prog.querySelector('[data-name="duration"]').innerText = prog['formatted']['duration']
				new_prog.querySelector('[data-name="diffusion"]').innerText = prog['formatted']['diffusionDate']
				new_prog.querySelector('[data-name="synopsis"]').innerText = synopsisMaker(prog['synopsis'], 10)
				if (progIndex + 1 <= 3) new_channel.querySelector('[data-name="list-programs"]').appendChild(new_prog)
			})
			document.querySelector('div#tv').appendChild(new_channel)
		}
	})
	document.querySelectorAll('div[data-name="channel"]').forEach((channel, index) => {
		$(channel).click((event) => {
			const keyList = makeKeyList(parseInt(channel.getAttribute('data-channel-num')))
			console.log(keyList)
			macroKeys(keyList, 300)
		})
	})
}
