require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();

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

//app middleware
app.use(morgan('dev'));
app.use(bodyParser.json());
// app.use(cors()); // allows all origins
if(process.env.NODE_ENV = 'development') {
    app.use(cors({ origin: 'http://localhost:3000' }));
}

// middleware
app.use('/api', authRoutes);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    console.log('API is running on port ' + PORT + ' - ' + process.env.NODE_ENV);
}) 