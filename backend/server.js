const express = require("express");
const routes = require("./src/routes");
const cors = require("cors");
const adminRoutes = require("./src/routes/adminRoutes");
const assetRoutes = require("./src/routes/assetRoutes");
const categoryRoutes = require("./src/routes/categoryRoutes");
const uploadRoutes = require("./src/routes/uploadRoutes");
const userRoutes = require("./src/routes/userRoutes");
const path = require("path");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use("/api", routes);
app.use("/api/admins", adminRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/users", userRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
