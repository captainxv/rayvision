const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 443; // HTTPS port

// SSL certificates - you'll need to get these
const options = {
    key: fs.readFileSync('path/to/key.pem'),
    cert: fs.readFileSync('path/to/cert.pem')
};

app.use(express.static(path.join(__dirname)));

// Add security headers
app.use((req, res, next) => {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
});

https.createServer(options, app).listen(port, () => {
    console.log(`Server running at https://localhost:${port}`);
}); 