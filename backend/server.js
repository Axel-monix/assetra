const express = require("express");
const routes = require("./src/routes");

const app = express();
const PORT = 5000;

app.use(express.json());

app.use("/api", routes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
