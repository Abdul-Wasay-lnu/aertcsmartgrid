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
const dbURI = process.env.MONGODB_URI; // replace with your MongoDB URI if using a cloud provider
mongoose.connect(dbURI,{
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
app.post('/receive-data', async (req, res) => {
    const labviewData = req.body;
console.log(labviewData);
try {
    const insertPromises = Object.entries(labviewData).map(([key, value]) => {
        const batteryData = new BatteryData({
            BatteryIndex: parseInt(key, 10),
            value: parseFloat(value)
        });

        return batteryData.save();
    });
    await Promise.all(insertPromises);
    res.status(201).json({ message: 'Data saved to database', data: labviewData });
} catch (err) {
    console.error('Error inserting data:', err.message);
    res.status(500).json({ message: 'Error saving data to database', error: err.message });
}
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

// Endpoint to retrieve data based on two keys to be used by checkbox buttons
app.post('/control', (req, res) => {
    const { btid, cn } = req.body;
    value[0] = btid;
    value[1] = cn;
    console.log(value);
    res.json({ message: 'keys received', data: value });
});

let buttonstate = 0;  // Declare a global variable to store the button state as a string

// Endpoint to update the radio button state
app.post('/update-radio', (req, res) => {
    const { buttonstate: newButtonState } = req.body;  // Extract buttonstate from the request body
    console.log('Received req.body state:', req.body);

    // Update the global buttonstate (no parsing to integer, just store the value as is)
    buttonstate = newButtonState;
    console.log('Updated button state:', buttonstate);

    // Respond with the updated state
    res.json({ message: 'Power button state updated', data: buttonstate });
});

// Endpoint to get the button state
app.post('/get-btcontrol', (req, res) => {
    console.log('Current button state:', buttonstate);

    // Respond with the current button state
    res.json(buttonstate);
});


app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
