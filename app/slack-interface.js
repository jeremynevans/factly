const tracer = require('tracer')
const http = require('http')
const schedule = require('node-schedule')
const logger = tracer.colorConsole({level: 'trace'})
const request = require('request')
const axios = require('axios')
const SlackBot = require('slackbots')
const RtmClient = require('@slack/client').RtmClient
const { WebClient } = require('@slack/client');
const put = require('101/put')
const clone = require('101/clone')

const facts = require('./facts.js')

const SlackAuthIndex = process.env.ALGOLIA_ORG_INDEX

const verifySlack = token => {
  const verified = token === process.env.VERIFICATION_TOKEN
  logger.trace(verified ? '✔️ Slack Verification Token = Verified' : '📛 Slack Verification Token = Failed!!!')
  return verified
}


const countries = [
  {
    key: 'always',
    name: 'Always',
    channel: 'C8W8SSJUW'
  },
  {
    key: 'france',
    name: 'France',
    channel: 'C8TD1NJF4'
  },
  {
    key: 'norway',
    name: 'Norway',
    channel: 'C8VSUE3DL'
  },
]

const getCountry = countryKey => countries.filter(country => country.key === countryKey)[0]
const getCountryByChannel = channel => countries.filter(country => country.channel === channel)[0]

const sendFact = (bot, countryKey) => {
  const country = getCountry(countryKey)
  const channel = country.channel
  const fact = facts.getRandomFact(countryKey)
  console.log('Sending to ' + country.name + ' (channel ' + channel + '):', fact)
  bot.postMessage(channel, fact)
}

const startFacts = (bot, channel) => {
  const country = getCountryByChannel(channel)
  sendFact(bot, country.key)
  country.scheduler = schedule.scheduleJob('*/10 * * * *', function(){
    http.get("http://factly.herokuapp.com")
    sendFact(bot, country.key)
  })
}

const stopFacts = (bot, channel) => {
  const country = getCountryByChannel(channel)
  // Stop the scheduler
  // schedule.unschedule(country.scheduler)
  console.log('Pausing on ' + country.name + ' (channel ' + channel + ')')
  bot.postMessage(country.channel, '🚦 OK I am now paused until you say "go" 🙂')
}


const initateSlackBot = async (slackTeam, onboarding) => {
	logger.trace(initateSlackBot, slackTeam)

	// create a bot
	const bot = new SlackBot({ token: slackTeam.__botAccessToken })
	const rtm = new RtmClient(slackTeam.__botAccessToken)
  const web = new WebClient(slackTeam.__accessToken)
	rtm.start()

	logger.info('New Slackbot connecting.')

  logger.debug(bot)

	bot.on('open', () => logger.info("Slackbot opened websocket."))
	bot.on('errror', () => logger.info("Slackbot 👺 ERR'D OUT while connecting."))
	bot.on('close', () => logger.info("Slackbot 👺 CLOSED a websocket."))

	bot.on('start', async () => {
		logger.info('slackbot has 🙏 connected to team ' + slackTeam.name)
    startFacts(bot, 'C8W8SSJUW')
	})

	bot.on('message', async message => {
    const messageTypesToIgnore = ['hello', 'reconnect_url', 'presence_change', 'desktop_notification', 'user_typing', 'channel_joined', 'channel_created', 'member_joined_channel']
    const messageSubTypesToIgnore = ['bot_message', 'channel_join']
    if (messageTypesToIgnore.indexOf(message.type) === -1 && messageSubTypesToIgnore.indexOf(message.subtype) === -1) {
      logger.trace('slack event:', message)

      if (message.text && message.text.match(/^(<@\w+>)?\s*stop\S?\s*$/))
        stopFacts(bot, message.channel)
      else if (message.text && message.text.match(/^(<@\w+>)?\s*go\S?\s*$/))
        startFacts(bot, message.channel)
    }
	})
}


const bootUp = async () => {
  const slackTeam = {
    name: 'Factly',
    __accessToken: 'xoxp-300231421750-298827208657-299279124803-4a5dcd337fcdc959a963b058cb9dc9b8',
    __botAccessToken: 'xoxb-299497144469-zgSlkoYqKBqxXbzD1HyevSm3'
  }
  initateSlackBot(slackTeam)
}

bootUp()



// exports.interactive = function(req, res) {
// 	logger.trace('exports.interactive', req.body)
//
// 	var action = JSON.parse(req.body.payload)
//   logger.trace('exports.interactive', action)
//   if (!verifySlack(action.token)) return
//
//   res.sendStatus(200)
//   // slack.interactive(action)
//   // .then(result => {
//   // })
// }
//
//
// exports.events = function(req, res) {
// 	// logger.trace('exports.events', req.body)
// 	// logger.trace('exports.events', req.body.payload)
// 	// logger.trace('exports.events', req.body.payload.token)
//   // if (!verifySlack(req.body.payload.token)) return
//
//   res.send({challenge: req.body.challenge})
// }
//
//
// const setTyping = async (team, channel, on) => {
//   logger.trace(setTyping, team, channel, on)
//   logger.trace(111)
//   const rtm = await getRtm(team)
//   logger.trace(222)
//   rtm.sendTyping(channel)
//   logger.trace(333)
// }
//
// const sendMessage = async messageData => {
//   logger.trace(sendMessage, messageData)
//   logger.trace(JSON.stringify(messageData))
//   const bot = await getBot(messageData.teamID)
//   return bot.postMessage(
// 		// reaction.channel.id.charAt(0) === 'D' ? reaction.user.id : reaction.channel.id, // Identify by user OR by group
// 		// Actually, previous line should be resolved by callback_id specified in the initial message
// 		messageData.recipient,
// 		messageData.text,
//     messageData.params
// 	)
// }
//
// const updateMessage = async messageData => {
//   logger.trace(updateMessage, messageData)
//   const bot = await getBot(messageData.teamID)
//   return bot.updateMessage(
// 		// reaction.channel.id.charAt(0) === 'D' ? reaction.user.id : reaction.channel.id, // Identify by user OR by group
// 		// Actually, previous line should be resolved by callback_id specified in the initial message
// 		messageData.recipient,
// 		messageData.ts,
// 		messageData.text,
//     messageData.params
// 	)
// }
//
// /**
//  * Takes message id-related data and returns message data (docs: https://api.slack.com/methods/channels.history)
//  *
//  * @param  {Object} messageSpecs
//  * @param  {String} messageSpecs.ts
//  * @param  {String} messageSpecs.channel
//  * @return {Object}
//  */
// const getMessageData = async (messageSpecs) => {
//   logger.trace(getMessageData, messageSpecs)
//   const web = await getWeb(messageSpecs.team)
//   logger.trace(web)
//   logger.trace(messageSpecs)
//   const res = await web.channels.history(messageSpecs.channel, { latest: messageSpecs.ts, count: messageSpecs.count || 1, inclusive: true })
//   logger.trace(res)
//   if (res.ok && res.messages && res.messages.length) {
//     const messageData = res.messages
//     messageData.forEach(m => m.channel = messageSpecs.channel)
//     logger.trace(messageData)
//     return messageData
//   } else {
//     logger.error(res.error)
//     return res.error
//   }
// }
//
// /**
//  * Takes team ID and returns team info (docs: https://api.slack.com/methods/team.info)
//  *
//  * @param  {String} teamID
//  * @return {Object}
//  */
// const getTeamInfo = async (teamID, auth) => {
//   logger.trace(getTeamInfo, teamID)
//   const org = auth ? { slack: auth } : await getOrg(teamID)
//   const web = new WebClient(org.slack.__botAccessToken)
//   res = await web.team.info()
//   if (res.ok) {
//     const teamInfo = res.team
//     teamInfo.teamID = teamInfo.id
//     teamInfo.__botUserID = org.slack.__botUserID
//     return teamInfo
//   } else {
//     logger.error(res.error)
//     return res.error
//   }
// }
