const heartbeats = require('heartbeats')
const V = require('validator')
const to = require('change-case')
const term = require('terminal-kit').terminal

// Library requires
const db = require('^iface/db')

let _line = {}
let _emailList = []
let _inputPrompt

function printResults(count) {
	return term
		.saveCursor()
		.moveTo(1, _line.lookup)
		.eraseDisplayBelow(`@count: ${count} ` + _emailList.join(', '))
		.restoreCursor()
}

function printError({message, input}) {
	term.moveTo(1, 2).eraseLine.red(`Error: ${message}`)
	term.nextLine(1).eraseLine.red(`Your Input was: ${input}`)
}

function clearError() {
	term
		.moveTo(1, _line.error)
		.eraseLine()
		.nextLine(1)
		.eraseLine()
		.moveTo(1, _line.input)
		.eraseLine(_inputPrompt)
}

function acceptCommand({message}) {
	term
		.moveTo(1, _line.input)
		.previousLine(1)
		.eraseLine.green(`Command: ${message}`)
}

async function controlLoop({heart, ..._passthrough}) {
	term.moveTo(1, _line.input).eraseLine(_inputPrompt)
	const input = await term.inputField().promise
	switch (to.lowerCase(input)) {
		case 'start':
			if (heart.event('printResults')) {
				acceptCommand({message: 'start ignored... already polling'})
			} else {
				acceptCommand({message: 'start accepted... polling commencing'})
				heart.createEvent(1, {name: 'printResults'}, printResults)
			}

			await controlLoop({heart, ..._passthrough})
			break
		case 'stop':
			if (heart.event('printResults')) {
				acceptCommand({message: 'stop accepted... polling stopped'})
				heart.killEvent('printResults')
			} else {
				acceptCommand({message: 'stop ignored... already stopped'})
			}

			await controlLoop({heart, ..._passthrough})
			break
		case 'quit':
			acceptCommand({message: 'quit accepted... Cya!'})
			term
				.moveTo(1, _line.lookup)
				.eraseLine()
				.processExit()
			break
		default:
			if (V.isEmail(input)) {
				const emailExists = await db.checkEmail({email: input})
				term(emailExists)
				if (emailExists) {
					acceptCommand({message: `${input} Found`})
					_emailList.push(`${input}: true`)
				} else {
					_emailList.push(`${input}: false`)
				}
			} else {
				printError({
					message: 'Not a Valid email or command',
					input
				})
			}

			await controlLoop({heart, ..._passthrough})
	}
}

async function inputWaitSeconds() {
	term.moveTo(1, _line.input).eraseLine(_inputPrompt)
	const input = await term.inputField().promise
	if (V.isNumeric(input, {no_symbols: true})) {
		return input
	}

	printError({message: 'Input Must be a Number', input})
	return inputWaitSeconds()
}

async function termFlow({
	heart,
	emailList,
	line,
	inputPrompt,
	..._passthrough
}) {
	// Share memory for easier callback access
	_line = line
	_inputPrompt = inputPrompt
	_emailList = emailList

	term.fullscreen()
	await term
		.moveTo(1, _line.message)
		.eraseLine()
		.slowTyping(
			`Welcome to my optizmo coding test. Please enter in seconds how often you would like to receive output alerts`,
			{delay: 5, flashDelay: 200, flashStyle: term.white()}
		)
	const echoInterval = await parseInt(
		await inputWaitSeconds({heart, ..._passthrough}),
		10
	)

	clearError({heart, ..._passthrough})
	// Create heart & beat it
	heart = heartbeats.createHeart(echoInterval * 1000, 'printResults')
	heart.createEvent(1, {name: 'printResults'}, printResults)

	await term
		.moveTo(1, _line.message)
		.eraseLine()
		.slowTyping(
			"Please enter either an 'email address' or a control command of: 'start', 'stop', 'quit'",
			{delay: 5, flashDelay: 200, flashStyle: term.white()}
		)
	await controlLoop({heart, ..._passthrough})
}

module.exports = termFlow
