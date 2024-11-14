const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config(); // Add this at the top
const app = express();
// const port = 3000;
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Connect to MongoDB
const dbURI = process.env.MONGODB_URI;; // replace with your MongoDB URI if using a cloud provider
mongoose.connect(dbURI,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000,  // Increase server selection timeout
    socketTimeoutMS: 45000,         // Increase socket timeout
  })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Define a schema for battery data
const batteryDataSchema = new mongoose.Schema({
    BatteryIndex: { type: Number, required: true },
    value: { type: mongoose.Decimal128, required: true },
    timestamp: { type: Date, default: Date.now }
});

const BatteryData = mongoose.model('BatteryData', batteryDataSchema);

// Endpoint to handle HTTP POST from LabVIEW
app.post('/receive-data', (req, res) => {
    const labviewData = req.body;
console.log(labviewData);
    // Use a Promise to handle database insertion
    const insertPromises = Object.entries(labviewData).map(([key, value]) => {
        const batteryData = new BatteryData({
            BatteryIndex: parseInt(key, 10),
            value: parseFloat(value)
        });

        return batteryData.save();
    });

    // Wait for all insert operations to complete
    Promise.all(insertPromises)
        .then(() => {
            res.json({ message: 'Data saved to database', data: labviewData });
        })
        .catch(err => {
            console.error('Error inserting data:', err);
            res.status(500).json({ message: 'Error saving data to database' });
        });
});

// Endpoint to get the latest data
app.get('/get-latest-data', (req, res) => {
    BatteryData.find().sort({ timestamp: -1 }).limit(5)
        .then(results => {
            res.json(results.map(row => ({
                BatteryIndex: row.BatteryIndex,
                value: row.value.toString(),
                timestamp: row.timestamp.toISOString()
            })));
        })
        .catch(err => {
            console.error('Error fetching data:', err);
            res.status(500).json({ message: 'Error fetching data' });
        });
});

// Endpoint to get the latest data for a specific sensor
app.get('/get-history/:sensor', (req, res) => {
    const sensor = req.params.sensor;
    BatteryData.find({ BatteryIndex: sensor }).sort({ timestamp: -1 })
        .then(results => {
            res.json(results.map(row => ({
                BatteryIndex: row.BatteryIndex,
                value: row.value.toString(),
                timestamp: row.timestamp.toISOString()
            })));
        })
        .catch(err => {
            console.error('Error fetching data:', err);
            res.status(500).json({ message: 'Error fetching data' });
        });
});

// Endpoint to get all historical data
app.get('/get-all-history', (req, res) => {
    BatteryData.find().sort({ timestamp: -1 })
        .then(results => {
            res.json(results.map(row => ({
                BatteryIndex: row.BatteryIndex,
                value: row.value.toString(),
                timestamp: row.timestamp.toISOString()
            })));
        })
        .catch(err => {
            console.error('Error fetching data:', err);
            res.status(500).json({ message: 'Error fetching data' });
        });
});

const value = new Array(2);
const buttonstate = 0;

// Endpoint to retrieve data based on two keys to be used by checkbox buttons
app.post('/control', (req, res) => {
    const { btid, cn } = req.body;
    value[0] = btid;
    value[1] = cn;
    console.log(value);
    res.json({ message: 'keys received', data: value });
});

// Endpoint to get the latest data for control
app.post('/get-btcontrol', (req, res) => {
    res.json(parseInt(buttonstate, 10));
    console.log("in getbt", buttonstate);
});

// Endpoint to update the radio button state
app.post('/update-radio', (req, res) => {
    const radioState = req.body;
    console.log('Received req.body state:', req.body);
    buttonstate = Number(req.body);
   
    console.log('Received button state:', buttonstate);
    res.json({ message: 'Power button state', data: buttonstate });
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
