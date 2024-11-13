const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;
const mysql = require('mysql2');
app.use(bodyParser.urlencoded({
    extended: true
    }));
// Create a MySQL connection
const connection = mysql.createConnection({
    host: 'smartgrid-server',
    user: 'mqvjbukjvl',
    password: '$87quhc3uRXK4rVk',
    database: 'smartgrid-database'
});

// Create a table if it doesn't exist
connection.query(
    `CREATE TABLE IF NOT EXISTS battery_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        BatteryIndex INT(255),
        value DECIMAL(10, 2),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`, (err, results) => {
        if (err) throw err;
        console.log("Table created or already exists");
    }
);

// Serve static HTML file
app.use(express.static('public'));

// Use body-parser to parse incoming JSON
app.use(bodyParser.json());
app.use(express.text());
app.use(express.json());

// Endpoint to handle HTTP POST from LabVIEW
app.post('/receive-data', (req, res) => {
    const labviewData = req.body; // Store the received data
    console.log('Data received:', labviewData);
    
    // Use a Promise to handle database insertion
    const insertPromises = Object.entries(labviewData).map(([key, value]) => {
        return new Promise((resolve, reject) => {
            const query = `INSERT INTO battery_data (BatteryIndex, value) VALUES (?, ?)`;
            connection.query(query, [key, value], (err, result) => {
                if (err) return reject(err); // Reject the promise on error
                // console.log('Data inserted:', result);
                resolve(result);
            });
        });
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
    const query = `SELECT BatteryIndex, value, timestamp FROM battery_data ORDER BY id DESC LIMIT 5`;
    connection.query(query, (err, results) => {
        if (err) {
            res.status(500).json({ message: 'Error fetching data' });
        } else {
            
            results = results.map(row => ({
                BatteryIndex: row.BatteryIndex,
                value: row.value,
                timestamp: row.timestamp.toISOString() // Convert to a string
            }));
            console.log('Results from database:', results); // Log the results
            res.json(results); // Return the latest record
          
        }
    });
});

// Endpoint to get the latest data for a specific sensor
app.get('/get-history/:sensor', (req, res) => {
    const sensor = req.params.sensor;
    const query = `SELECT BatteryIndex, value, timestamp FROM battery_data WHERE BatteryIndex = ? ORDER BY timestamp DESC`;

    connection.query(query, [sensor], (err, results) => {
        if (err) {
            res.status(500).json({ message: 'Error fetching data' });
        } else {
            console.log('Results from database for history of sensor:', results); // Log the results
            
            res.json(results); // Return all records for the specified sensor
        }
    });
});

// Endpoint to get all historical data
app.get('/get-all-history', (req, res) => {
    const query = `SELECT BatteryIndex, value, timestamp FROM battery_data ORDER BY timestamp DESC`;

    connection.query(query, (err, results) => {
        if (err) {
            res.status(500).json({ message: 'Error fetching data' });
        } else {
            console.log('Results from database for all history:', results); // Log the results
            res.json(results); // Return all historical records
        }
    });
});

const value = new Array(2);
let buttonstate = 0;
// GET endpoint to retrieve data based on two keys to be used by checkbox buttons
app.post('/control/', (req, res) => {
    console.log(req.body); 
    // const btid = req.body.btid;
    const cn = req.body.cn;
    // var receiveddata = req.body; 
    value[0]=btid;
    value[1]=cn;
    console.log(value);
    // Send a response
    res.json({ message: 'keys received ', data: value });
});

// Endpoint to get the latest data
app.post('/get-btcontrol', (req, res) => {
    // value[1]=buttonstate;
    // console.log("in get",value);
    // if(value[0]>= 0 || value[1]>= 0 )
    // {
    // res.json(value); // Return the latest record
    // } 
    // buttonstate = 0;
    res.json(parseInt(buttonstate, 10));
    console.log("in getbt", buttonstate);
});

app.post('/update-radio', (req, res) => {
    const radioState = req.body;
    buttonstate = radioState;
    console.log('Received button state:',buttonstate);
    // res.json({ message: 'Radio state received', buttonstate });
    res.json({ message: 'Power button state', buttonstate: parseInt(buttonstate, 10) });
  });

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
