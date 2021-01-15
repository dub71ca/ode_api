require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const fs = require('fs');
const util = require('util');

//redirect console logging to debug.log if in production
if (process.env.NODE_ENV === 'production') {
    let logFile = fs.createWriteStream(__dirname + '/debug.log', { flags: 'a' });

    console.log = function() { //
        logFile.write(util.format.apply(null, arguments) + '\n');
    };
    console.error = console.log;
}

// db connect
mongoose
    .connect(process.env.DATABASE, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true,
        })
    .then(() => console.log('DB Connected'))
    .catch(err => console.log('DB CONNECTION ERROR: ', err)
);

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');

//app middleware
app.use(morgan('dev'));
app.use(bodyParser.json());
// app.use(cors()); // allows all origins
if(process.env.NODE_ENV = 'development') {
    app.use(cors({ origin: 'http://localhost:3000' }));
}

// middleware
app.use('/api', authRoutes);
app.use('/api', userRoutes);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    console.log('API is running on port ' + PORT + ' - ' + process.env.NODE_ENV);
}) 