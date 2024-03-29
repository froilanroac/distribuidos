const express = require("express");
const fs = require("fs");
var crypto = require("crypto");
var lockFile = require("proper-lockfile");
const docker = true;

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
  try {
    var key = randomSign();
    var ciphered = cipher(hash, key);
    var body = { action: "sign", key: key, ciphered: ciphered };
    var toSaveIdentidades = key + "\n" + name;

    lockFile
      .lock(docker ? "./data/identidades.txt" : "../identidades.txt")
      .then(() => {
        var data = fs
          .readFileSync(
            docker ? "./data/identidades.txt" : "../identidades.txt"
          )
          .toString()
          .split("\n");
        data.pop();
        data.forEach((e) => {
          toSaveIdentidades += "\n" + e;
        });

        toSaveIdentidades += "\n0";

        fs.writeFile(
          docker ? "./data/identidades.txt" : "../identidades.txt",
          toSaveIdentidades,
          function (error) {
            if (error) {
              callback
                .status(500)
                .send("Unexpected error in keys server: " + error);
            } else {
              callback.send(body);
            }
          }
        );
        return lockFile.unlock(
          docker ? "./data/identidades.txt" : "../identidades.txt"
        );
      })
      .catch((err) => {
        console.error(`Unexpected error 1: ${err.message}`);
        callback.status(500).send(`Unexpected error in keys server -> ${err}`);
      });
  } catch (error) {
    console.error(`Unexpected error 2: ${error.message}`);
    callback.status(500).send(`Unexpected error in keys server -> ${error}`);
  }
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
