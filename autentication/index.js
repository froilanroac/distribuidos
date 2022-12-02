const express = require("express");
const fs = require("fs");
var request = require("request");

const app = express();
port = 8002;

app.use(express.urlencoded());
app.use(express.json());

app.listen(port, () => {
  console.log(`Autentication server listening on port ${port}`);
});

app.put("/autenticate", (req, res) => {
  console.log("Request for autenticate received ");
  autenticate(req.body.name, req.body.key, res);
});

function autenticate(name, key, callback) {
  var identidades = fs
    .readFileSync("../identidades.txt")
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

  fs.writeFile("../salida.txt", toSave, function (error) {
    if (error) {
      callback.send(error);
    }
    callback.send("Autentication successfuly done");
  });
}
