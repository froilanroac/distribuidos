const express = require("express");
const fs = require("fs");
var request = require("request");
var crypto = require("crypto");

const app = express();
port = 8001;

app.use(express.urlencoded());
app.use(express.json());

app.listen(port, () => {
  console.log(`Keys server listening on port ${port}`);
});

app.put("/sign", (req, res) => {
  console.log("Request for signing received ");
  sign(req.body.name, req.body.hash, res);
});

function sign(name, hash, callback) {
  var key = randomSign();
  var ciphered = cipher(hash, key);
  var toSaveSalida = key + "\n" + ciphered + "\n";
  var toSaveIdentidades = key + "\n" + name + "\n";

  fs.writeFile("../salida.txt", toSaveSalida, function (error) {
    if (error) {
      callback.send(err);
    }
    fs.appendFile("../identidades.txt", toSaveIdentidades, function (error) {
      if (error) {
        callback.send(error);
      }
      callback.send("Sign successfuly done");
    });
  });
}

function randomSign() {
  return (Math.floor(Math.random() * 90000000) + 10000000).toString();
}

function cipher(message, key) {
  var mykey = crypto.createCipher("aes-128-cbc", key);
  var mystr = mykey.update(message, "utf8", "hex");
  mystr += mykey.final("hex");

  return mystr;
}
