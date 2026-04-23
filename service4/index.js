const express = require("express");

const app = express();

app.get("/test", (req, res) => {
  res.json({ service: "service4" });
});

const port = Number(process.env.PORT || 8083);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`service4 listening on ${port}`);
});

