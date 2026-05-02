const express = require('express');
const app = express();
const { filseService } = require("./FileCache");
const port = require("./conf").port;
const router = require('./router');
const cors = require('cors');

// Middleware

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static("public"));
app.use('/app', router);

// Routes

app.get('/', (req, res) => {
  res.sendFile("public/index.html");
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});