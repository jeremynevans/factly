// refactored webhook code
// var messengerController = require('../platforms/messenger')
var slackInterface = require('./slack-interface.js')

var express = require('express')
var request = require('request')
var router = express.Router()

// // NB: Should rename these routes '/facebook' or something.
// router.get('/', messengerController.tokenVerification)
// //router.post('/', apiController.createGetStarted) -- this method is no longer needed (i think)
// router.post('/', messengerController.handleMessage)

// router.get('/slack/oauth', slackInterface.oauth)
// router.post('/slack/interactive', slackInterface.interactive)
// router.post('/slack/events', slackInterface.events)

module.exports = router
