const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();
const balanceRoutes = require("./src/routes/balanceRoutes");


const userRoutes = require("./src/routes/userRoutes");
const groupRoutes = require("./src/routes/groupRoutes");
const expenseRoutes = require("./src/routes/expenseRoutes");
 const settlementRoutes = require("./src/routes/settlementRoutes");

const app = express();

app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));

console.log("userRoutes:", typeof userRoutes);
console.log("groupRoutes:", typeof groupRoutes);
console.log("expenseRoutes:", typeof expenseRoutes);
console.log("balanceRoutes:", typeof balanceRoutes);

app.use("/users", userRoutes);
app.use("/groups", groupRoutes);
app.use("/expenses", expenseRoutes);
app.use("/balances", balanceRoutes);
app.use("/settlements", settlementRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
module.exports = app;