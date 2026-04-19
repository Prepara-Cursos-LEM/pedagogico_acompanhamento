const express = require('express');
const app = express();
const port = 9123;



app.get('/', (req, res) => {
  res.sendFile("public/index.html");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});