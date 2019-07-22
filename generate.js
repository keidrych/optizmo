const {nSQL} = require('@nano-sql/core')
const {RocksDB} = require('@nano-sql/adapter-rocksdb')
const f = require('faker')

async function generateData() {
	try {
		const emailRecords = []
		for (let r = 0; r < 50000; r++) {
			emailRecords.push({email: f.unique(f.internet.email)})
		}

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
		await nSQL('emails')
			.query('upsert', emailRecords)
			.exec()
	} catch (error) {
		// Deal with the fact the chain failed
	}
}

generateData()
