const {nSQL} = require('@nano-sql/core')
const {RocksDB} = require('@nano-sql/adapter-rocksdb')

async function initDB() {
	await nSQL().createDatabase({
		id: 'optizmo',
		mode: new RocksDB(),
		tables: [
			{
				name: 'emails',
				model: {
					email: {px: true, type: 'string'}
				}
			}
		]
	})
}

// Always Initialize Database Connection on Load
initDB()

async function addEmail({email}) {
	return nSQL('emails')
		.query('upsert', {email})
		.exec()
}

async function checkEmail({email}) {
	const result = await nSQL('emails')
		.query('select')
		.where(['email', '=', email])
		.exec()
	return result[0]
}

async function allEmail() {
	return nSQL('emails')
		.query('select')
		.exec()
}
// Columbus_Wiza54@yahoo.com

module.exports = {
	addEmail,
	allEmail,
	checkEmail
}
