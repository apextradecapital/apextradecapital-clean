import fs from "fs";
import express from "express";

const app = express();
app.get("/", (req, res) => {
  res.send("ApexTradeCapital backend is running successfully 🚀");
});

app.listen(3000, () => {
  console.log("✅ Server started on port 3000");
});
