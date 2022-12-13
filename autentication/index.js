const express = require("express");
const fs = require("fs");
const request = require("request");

const app = express();
port = 8005;

app.use(express.urlencoded());
app.use(express.json());

app.listen(port, () => {
  console.log(`Autentication server listening on port ${port}`);
});

app.put("/autenticate", (req, res) => {
  console.log("Request for autentication received ");
  autenticate(req.body.name, req.body.key, res);
});

function autenticate(name, key, callback) {
  try {
    const identidades = fs
      .readFileSync("./data/identidades.txt")
      .toString()
      .split("\n");

    var toSave = "CLAVE INVALIDA";

    for (var i = 0; i <= identidades.length; i++) {
      if (identidades[i] == key) {
        if (identidades[i + 1] == name) {
          toSave = "CLAVE VALIDA";
        }
      }
    }
    const body = { action: "autenticate", result: toSave };
    callback.send(body);
  } catch (error) {
    console.error(`Unexpected error: ${error.message}`);
    callback
      .status(500)
      .send(`Unexpected error in autentication server -> ${error}`);
  }
}
