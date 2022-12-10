const express = require("express");
const fs = require("fs");
const crypto = require("crypto");
var request = require("request");

const app = express();
port = 8010;

app.use(express.urlencoded());
app.use(express.json());

app.listen(port, () => {
  console.log(`Client server listening on port ${port}`);
});

app.get("/", (req, res) => {
  var array = fs.readFileSync("../entrada.txt").toString().split("\n");
  array = array.filter((item) => item);

  if (array[0].toUpperCase() == "FIRMAR") {
    console.log("Request for signing received");
    if (array.length == 3) {
      sign(array[1], array[2], res);
    } else {
      res.send("Error en la entrada");
    }
  } else if (array[0].toUpperCase() == "AUTENTICAR") {
    console.log("Request for autenticate received");
    if (array.length == 3) {
      autenticate(array[1], array[2], res);
    } else {
      res.send("Error en la entrada");
    }
  } else if (array[0].toUpperCase() == "INTEGRIDAD") {
    console.log("Request for integrity received");
    if (array.length == 4) {
      checkIntegrity(array[1], array[2], array[3], res);
    } else {
      res.send("Error en la entrada");
    }
  } else {
    res.send("Error en la entrada");
  }
});

function checkIntegrity(key, message, cipheredHash, callback) {
  // cambiar esta funcion asap
  var toSave;
  try {
    var decipheredHash = decipher(cipheredHash, key);
    // problemas con decipher
    var hash = calculateHash(message);

    if (decipheredHash == hash) {
      toSave = "INTEGRO";
    }
    fs.writeFile("../salida.txt", toSave, function (error) {
      if (error) {
        callback.send(error);
      }
      callback.send("Integrity check successfuly done");
    });
  } catch (error) {
    toSave = "NO INTEGRO";
    fs.writeFile("../salida.txt", toSave, function (error) {
      if (error) {
        callback.send(error);
      }
      callback.send("Integrity check successfuly done");
    });
  }
}

function autenticate(key, name, callback) {
  var data = `{ "key" : "${key}" , "name" : "${name}" }`;
  makeRequest("POST", data, "http://localhost:8000/autenticate", callback);
}

function sign(name, message, callback) {
  var hash = calculateHash(message);
  var data = `{ "hash" : "${hash}" , "name" : "${name}" }`;
  makeRequest("POST", data, "http://localhost:8000/sign", callback);
}

function makeRequest(method, data, url, callback) {
  var jsonData = JSON.parse(data);
  var response = request(
    {
      headers: { "content-type": "application/json" },
      url: url,
      form: jsonData,
      method: method,
    },
    function (error, response, body) {
      if (!error) {
        callback.send(body);
      } else {
        callback.send(`Error Inesperado  ${error}`);
      }
    }
  );
}

function calculateHash(message) {
  const hash = crypto.createHash("sha256").update(message).digest("hex");
  return hash;
}

function decipher(message, key) {
  var decipher = crypto.createDecipher("aes-256-cbc", key);
  var decryptedData = decipher.update(message, "base64", "utf8");
  decryptedData += decipher.final("utf8");
  return decryptedData;
}
