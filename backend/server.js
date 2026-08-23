const express = require("express");
const routes = require("./src/routes");
const cors = require("cors");
const adminRoutes = require("./src/routes/adminRoutes");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use("/api", routes);
app.use("/api/admins", adminRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
