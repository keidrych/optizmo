require('resquire')

// Library requires
const shell = require('./shell')

const inputPrompt = '\t>>> '
const line = {
	error: 2,
	input: 5,
	lookup: 7,
	message: 1
}

let heart
const emailList = []

shell({heart, emailList, line, inputPrompt})
