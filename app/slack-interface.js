const tracer = require('tracer')
const schedule = require('node-schedule')
const logger = tracer.colorConsole({level: 'trace'})
const request = require('request')
const axios = require('axios')
const SlackBot = require('slackbots')
const RtmClient = require('@slack/client').RtmClient
const { WebClient } = require('@slack/client');

const put = require('101/put')
const clone = require('101/clone')

// const Encrypt = require('../controller/db_encrypt.js');
const SlackAuthIndex = process.env.ALGOLIA_ORG_INDEX

// const slack = require('../platforms/slack')

const verifySlack = token => {
  const verified = token === process.env.VERIFICATION_TOKEN
  logger.trace(verified ? '✔️ Slack Verification Token = Verified' : '📛 Slack Verification Token = Failed!!!')
  return verified
}

// exports.oauth = function(req, res) {
//   logger.trace('oauth', req)
// 	// When a user authorizes an app, a code query parameter is passed on the oAuth endpoint. If that code is not there, we respond with an error message
//   if (!req.query.code) {
//       res.status(500);
//       res.send({"Error": "Looks like we're not getting code."});
//       console.log("Looks like we're not getting code.");
//   } else {
//     // If it's there...
//
//     // We'll do a GET call to Slack's `oauth.access` endpoint, passing our app's client ID, client secret, and the code we just got as query parameters.
//     request({
//       url: 'https://slack.com/api/oauth.access', //URL to hit
//       qs: {code: req.query.code, client_id: process.env.SLACK_CLIENT_ID, client_secret: process.env.SLACK_CLIENT_SECRET}, //Query string data
//       method: 'GET'
//     }, function (error, response, body) {
//       const slackKeychain = JSON.parse(body)
//       if (!slackKeychain.ok) {
//         logger.trace(slackKeychain);
//         logger.error(slackKeychain.error);
//       } else {
// 				logger.trace("🤓 Bot was authorised", slackKeychain)
//
//         const teamID = slackKeychain.team_id
//         const org = {
//           objectID: teamID,
//           slack: {
//             teamID: teamID,
//             __accessToken: slackKeychain.access_token,
//             __botUserID: slackKeychain.bot.bot_user_id,
//             __botAccessToken: slackKeychain.bot.bot_access_token,
//           }
//         }
//         getTeamInfo(teamID, org.slack)
//         .then(teamInfo => {
//           org.slack.name = teamInfo.name
//           org.slack.domain = teamInfo.domain
//           org.name = teamInfo.domain
//           setOrg(teamID, org)
//         }).then(result => {
//           axios.post('https://savvy-nlp--staging.herokuapp.com/set-up-org', { organisationID: org.name })
//           initateSlackBot(org.slack, { userID: slackKeychain.user_id })
//           res.redirect(`https://${org.slack.domain}.slack.com/`)
//         }).catch(e => {
//           logger.error(e)
//           res.json(e)
//         })
//       }
//     })
//   }
// }

const allRandomFacts = [
  "France is the world's most popular tourist destination – some 83.7 million visitors arrived in France, according to the World Tourism Organization report published in 2014, making it the world's most-visited country.",

  "France is the largest country in the EU, and known as 'the hexagon' – with an area of 551,000 sq km it's almost a fifth of the EU’s total area, and due to its six-sided shape France is sometimes referred to as l’hexagone. About a quarter is covered by forest; only Sweden and Finland have more.",

  "Louis XIX was the king of France for just 20 minutes, the shortest ever reign – he ascended to the French throne in July 1830 after his father Charles X abdicated, and abdicated himself 20 minutes later in favour of his nephew, the Duke of Bordeaux. He shares this record with Crown Prince Luís Filipe, who technically became king of Portugal after his father was assassinated but died from a wound 20 minutes later.  ",

  "Liberté, égalitié, fraternité meaning ‘liberty, equality and fraternity’ (or brotherhood) is the national motto of France – it first appeared around the time of the Revolution (1789–1799), and was written into the constitutions of 1946 and 1958. Today you’ll see it on coins, postage stamps and government logos often alongside ‘Marianne’ who symbolises the ‘triumph of the Republic’. The legal system in France is still largely based on the principles set down in Napoleon Bonaparte’s Code Civil after the revolution, in the 1800s.",

  "The French Army was the first to use camouflage in 1915 (World War I) – the word camouflage came from the French verb ‘to make up for the stage’. Guns and vehicles were painted by artists called camofleurs. ",

  "In France you can marry a dead person – under French law, in exceptional cases you can marry posthumously, as long as you can also prove that the deceased had the intention of marrying while alive and you receive permission from the French president. The most recent approved case was in 2017, when the partner of a gay policeman gunned down on Paris's Champs-Elysees by a jihadist was granted permission to marry his partner posthumously.",

  "The French have produced a number of world-renown inventions: the 'father of canning' confectioner Nicolas Appert came up with the idea to use sealed glass jars placed in boiling water to preserve food in 1809, and the later use of tin cans was the idea of another Frenchman, Pierre Durand; the reading and writing system for the blind, braille, was developed by Louis Braille who was blinded as a child; physician René Laennec invented the stethoscope at a hospital in Paris in 1816, first" +"discovered by rolling up paper into a tube; and Alexandre-Ferdinand Godefroy patented a contraption was the world's first hair dryer in 1888. The Montgolfier brothers Joseph and Etienne became pioneers of hot air flight after the world's first public display of an untethered hot air balloon in 1783. A less known fact is that the popular game Etch-a-Sketch was invented in the 1950s after French electrical technician André Cassagnes peeled a translucent transfer from a light switch plate and"
  + "discovered his pencil marks remained on its underside, a result of the electrostatically charged metallic powder.",

  "France was the first country in the world to ban supermarkets from throwing away or destroying unsold food – since February 2016, shops must donate wastage to food banks or charities.  ",

  "About one million French people living near the border with Italy speak Italian – although French is the official language and the first language of 88 percent of the population, there are various indigenous regional dialects and languages, such as Alsacian, Basque, Breton, Catalan, Occitan and Flemish. On a larger scale, French is the second most spoken mother tongue in Europe, after German and before English, and is predicted to become number one by 2025 due to the country's high birth rate. ",

  "The Académie Française has aimed to preserve the French language since 1634 – by attempting to ban, somewhat unsuccessfully, foreign words such as blog, hashtag, parking, email and weekend. It was started by a small group of French intellects and officially recognised by Louis XIII in 1635.  ",

  "At least 40 percent of the music on private radio stations must be of French origin – since 1996, the country’s top media regulator the Conseil Supérieur de L’Audiovisuel (CSA) has been charged with enforcing this French law. The CSA also requires half of the French music quota to be less than six months old.",

  "The first public screening of a movie was by French brothers Auguste and Louis Lumière on 28 December 1895 – they used their invention the cinématographe (hence ‘cinema’) to show 10 films of about 50 seconds each at the Salon Indien du Grand Café in Paris. They made many more films but predicted that ‘cinema is an invention without any future'. ",

  "A French woman is the world’s oldest ever human – she lived to an incredible 122 years and 164 days, according to the Guinness Book of World Records. Jeanne Louise Calment was born on 21 February 1875 and died on 4 August 1997. She lived through the opening of the Eiffel Tower in 1889, two World Wars and the development of television, the modern motor car and aeroplanes. Her compatriots generally live long longer than most other nationalities: France is rated sixth in the OECD for life expectancy at birth at 82 years: 85 years for women and 79 for men.",

  "France legalised same-sex marriage in 2013 – when President Françoise Holland signed the bill into law on 18 May 2013, France became the ninth country in Europe and 14th in the world to legalise same-sex marriage. Although polls at the time showed that around 50 of French people supported gay marriage, not everyone was happy about it: thousands of people defending the so-called ‘family values’ took to the streets in protest.",

  "Europe’s highest mountain is in the French Alps – Mont Blanc, at 4,810m, takes an arduous 10 to 12 hours to climb to the summit. Alternatively, you can take a leisurely 20-minute trip up on Europe’s highest cable car on the nearby Aiguille du Midi to get a brilliant view of Mont Blanc.",

  "The Louvre Museum in Paris was the most visited museum in the world in 2014 – with an amazing 9.3 million visitors, it received almost the same amount of people as the population of Sweden.",

  "The world’s first artificial heart transplant and face transplant both took place in France – the heart transplant occurred in December 2013 at the Georges Pompidou Hospital in Paris. The bioprosthetic device, which mimics a real heart’s contractions, is powered by external lithium-ion battery, and is about three times the weight of a real organ. French surgeons were also the first to perform a face transplant in 2005.",

  "Totalling around 29,000km, the French rail network is the second largest in Europe (after Germany) and the ninth biggest in the world – France was one of the world's first countries to utilise high-speed technology, introducing the TGV high-speed rail in 1981. The Tours-Bordeaux high-speed project, due for completion in 2017, will add a further 302km to the existing 1,550km. Not-so-forward-thinking, however, was when the French national train operator SNCF ordered 2,000 trains at a cost of EUR 15bn only to discover in 2014 they were too wide for many regional platforms.",

  "Paris Gare du Nord is Europe's busiest railway station – and by far, with some 190 million passengers passing through each year. Inaugurated in 1846, it it also one of the world's oldest stations.",

  "French wines can reach astronommical prices – in 2014, Sotheby’s sold a 114-bottle lot of DCR Romanee-Conti wines in Hong Kong for more than EUR 1.45m to an anonymous Asia-based buyer, a world record for a single wine lot. That works out to about EUR 1,619 per standard glass. ",

  "The French invented the metric system, the decimalised way of counting and weighing, in 1793 – the original prototype kilo, Le Grand K, is a cylinder made in the 1880s out of platinum and iridium and about the size of a plum, and was the only object known to scientists to have a mass of exactly 1kg. Everything else measured in kilograms is defined by Le Grand K. It’s kept locked away under three vacuum-sealed bell jars in a vault in the International Bureau of Weights and Measures (BIPM) in Sevres, France. Duplicate cylinders were sent around the world and every so often they’re compared to the original. But Le Grand K mysteriously seems to be losing weight: The last time it was weighed, in 1988, it was found to be 0.05 milligrams (less than a grain of sugar) lighter than the copies. Did Le Grand K lose mass or have the copies gained it? No one knows.",

  "French gastronomy was awarded UNESCO World Heritage Status in 2010 – when it was added to the list of ‘intangible cultural heritage of humanity’. Experts described the importance of French gastronomy as ‘a social custom aimed at celebrating the most important moments in the lives of individuals and groups’, as well as 'emphasising togetherness' for its function of bringing friends and family closer together and strengthening social ties.   ",

  "The world’s greatest cycle race, the Tour de France, has been around for more than 100 years – with the first event held on 1 July 1903. Every July, cyclists race some 3,200km (2,000 miles) primarily around France in a series of stages over 23 days, with the fastest cyclist at each stage wearing the famous yellow jersey.",

  "France has produced some of the world’s most influential writers and thinkers – Descartes and Pascal in the 17th century, Voltaire in the 18th, Baudelaire and Flaubert in the 19th and Sartre and Camus in the 20th. To date, France has won more Noble Prizes for Literature (15) than any other country.",

  "France produces nearly a billion tons of cheese a year in around 1,200 different varieties – in France it's an ancient art: goats cheese dates back to at least 500AD, the blue-veined Roquefort was mentioned in records of an ancient monastery in Conques as early as 1070, and hard farm cheeses like Emmental started to appear in the 13th century. A French proverb claims 'un fromage par jour de l’année' – there is a different cheese for every day of the year. ",

  "You might get a ‘fish’ stuck on your back on April Fool’s Day – if you’re in France on 1 April, don’t be surprised if children try to stick paper fish to your back and call you a ‘Poisson d’Avril’ (April Fish). This tradition is supposed to have started in the 16th century when King Charles XIV of France changed the calendar and those who continued to celebrate the end of the New Year at the end of March were ridiculed as fools.",

  "The oldest recorded human voice is French – a 10-second fragment of the song Au Clair de la Lune was recorded by French inventor Edouard-Leon Scott de Martinville on paper on 9 April 1860. He used a ‘phonautograph’, which allowed sounds to be recorded visually. The paper recording was discovered in 2008 in Paris, and using modern science the clip was played for the very first time.",

  "The French eat around 30,000 tonnes of snails a year – but only about 1,000 tonnes of the classic French delicacy (served with garlic, parsley and butter) come from France; only some 100 registered snail farms existed in France in 2015. If you've eaten snails in France, chances are they were plucked from the fields and roadsides of Eastern Europe. ",

  "It is against the law to carry live snails on a high-speed train in France without their own tickets – in fact, any domesticated animal under 5kg must be a paying passenger in France. In 2008, a Frenchman was fined when he was caught carrying snails on a TGV, although the fine was later waived.",

  "Marcel Proust’s A la recherche du temps perdu holds the record as the world’s longest novel – his 13-volume masterpiece, translated as Remembrance of things past, is more than 3,000 pages long and has a cast of thousands and hundreds of interwoven plots strands. The first volume was published in 1913.",
]



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

    // const res = await web.users.list()
    // console.log(res)

    // bot.postMessage('U8SQB64KB', `Hello! Welcome to Savvy 🙂 Head over to connect.heysavvy.com to connect up to Google Drive! 🚀`)

    const randomFact = allRandomFacts[Math.floor(Math.random()*allRandomFacts.length)]
    bot.postMessage('C8TD1NJF4', randomFact)
    var j = schedule.scheduleJob('*/10 * * * *', function(){
      const randomFact1 = allRandomFacts[Math.floor(Math.random()*allRandomFacts.length)]
      bot.postMessage('C8TD1NJF4', randomFact1)
    })


    // const another = () => {
    //   const randomFact = allRandomFacts[Math.floor(Math.random()*allRandomFacts.length)]
    //   bot.postMessage('U8SQB64KB', randomFact)
    //   setTimeout(function() {
    //     another()
    //   }, 10 * 60 * 1000)
    // }
    // another()
	})

	// bot.on('message', async message => {
  //   const messageTypesToIgnore = ['hello', 'reconnect_url', 'presence_change', 'desktop_notification', 'user_typing', 'channel_joined', 'channel_created', 'member_joined_channel']
  //   const messageSubTypesToIgnore = ['bot_message', 'channel_join']
  //   if (messageTypesToIgnore.indexOf(message.type) === -1 && messageSubTypesToIgnore.indexOf(message.subtype) === -1) {
  //     logger.trace('slack event:', message)
  //
  //     if (message.text && message.text.match(/^(<@\w+>)?\s*integration\S?\s*$/)) {
  //       logger.trace(slackTeam)
  //       const org = await getOrg(slackTeam.teamID)
  //       logger.trace(org)
  //       const messageData = {
  //         teamID: message.team,
  //         recipient: message.channel,
  //         text: 'Ready to connect up your Google Drive and become a Savvy power user? 🚀 Just go here: ' + org.name + '.heysavvy.com'
  //       }
  //       logger.trace(messageData)
  //       sendMessage(messageData)
  //     } else {
  //       // Should send data to Chatbot and return messages for emitting
  //       // TODO: Support postEphemeral(id, user, text, params) for slash commands
  //       // slack.handleMessage(slackTeam, message)
  //     }
  //
  //   }
	// })
}


const bootUp = async () => {
  const slackTeam = {
    name: 'Factly',
    __accessToken: 'xoxp-300231421750-298827208657-299279124803-4a5dcd337fcdc959a963b058cb9dc9b8',
    __botAccessToken: 'xoxb-299497144469-zgSlkoYqKBqxXbzD1HyevSm3'
  }
  initateSlackBot(slackTeam)
  // const allOrgs = await getAllOrgs()
  // allOrgs.forEach(async org => {
  //   if (org.objectID && org.slack && org.slack.__botAccessToken) {
  //     setOrg(org.objectID, org)
  //     initateSlackBot(org.slack)
  //   }
  // })
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
