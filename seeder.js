const fs = require('fs');
const mongoose = require('mongoose');
const colors = require('colors');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: './config/config.env'} );

// Load models

const Set = require('./models/Set');

// Conect to DB

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
});

// Read JSON files
const sets = JSON.parse(fs.readFileSync(`${__dirname}/_data/sets.json`, 'utf-8'));

const importData = async () => {
    try {
        await Set.create(sets)

        console.log('Data imported...'.green.inverse)
        process.exit()
    } catch(err) {
        console.log(err)
    }
}

// Delete data

const deleteData = async () => {
    try {
        await Set.deleteMany()

        console.log('Data destroyed...'.red.inverse)
        process.exit()
    } catch(err) {
        console.log(err)
    }
}

if (process.argv[2] === '-i') {
    importData()
} else if (process.argv[2] === '-d') {
    deleteData()
}
