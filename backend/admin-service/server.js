const express = require('express');
const cors = require('cors');

require("./setup")

const app = express();
const routes = require('./routes/adminRoutes');

app.use(cors());
app.use(express.json());
app.use('/api/admin', routes);

const PORT = 5001;
app.listen(PORT, () => console.log(`Admin Server running at
http://localhost:${PORT}`));

