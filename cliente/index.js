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
  const data = getEntry();

  const signHandler = new SignHandler();
  const autenticateHandler = new AutenticateHandler();
  const integrityHandler = new IntegrityHandler();

  signHandler.setNext(autenticateHandler).setNext(integrityHandler);
  const result = signHandler.handle(data, res);

  if (result == null) {
    res.send("Data error in entry file");
  }
});

function getEntry() {
  var array = fs
    .readFileSync("../entrada.txt")
    .toString()
    .replace("\\r", "")
    .split("\n");
  array = array.filter((item) => item);
  return array;
}

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
    write("../salida.txt", toSave, callback, "Integrity request done");
  } catch (error) {
    toSave = "NO INTEGRO";
    write("../salida.txt", toSave, callback, "Integrity request done");
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
      if (!error && response.statusCode == 200 && body) {
        const body_ = JSON.parse(body);
        const signWriteHandler = new SignWriteHandler();
        const autenticateWriteHandler = new AutenticateWriteHandler();
        signWriteHandler.setNext(autenticateWriteHandler);
        const result = signWriteHandler.handle(body_, callback);
        if (result == null) {
          callback.send("Error inesperado en el manejo de las respuestas");
        }
      } else {
        console.error(`Unexpected error in ${url}`);
        callback
          .status(500)
          .send(body ? body : "Unexpected error without body");
      }
    }
  );
}

function calculateHash(message) {
  const hash = crypto.createHash("sha256").update(message).digest("hex");
  return hash;
}

function decipher(message, key) {
  var mykey = crypto.createDecipher("aes-128-cbc", key);
  var mystr = mykey.update(message, "hex", "utf8");
  mystr += mykey.final("utf8");
  return mystr;
}

// chain of responsability pattern

class AbstractHandler {
  setNext(handler) {
    this.nextHandler = handler;
    return handler;
  }
  handle(request, callback) {
    if (this.nextHandler) {
      return this.nextHandler.handle(request, callback);
    }
    return null;
  }
}
class SignHandler extends AbstractHandler {
  handle(request, callback) {
    if (request.length == 3 && request[0].toUpperCase() == "FIRMAR") {
      console.log("Request for signing received");
      sign(request[1], request[2], callback);
      return "Signed request done";
    }
    return super.handle(request, callback);
  }
}
class AutenticateHandler extends AbstractHandler {
  handle(request, callback) {
    if (request.length == 3 && request[0].toUpperCase() == "AUTENTICAR") {
      console.log("Request for autenticate received");
      autenticate(request[1], request[2], callback);
      return "Autenticate request done";
    }
    return super.handle(request, callback);
  }
}
class IntegrityHandler extends AbstractHandler {
  handle(request, callback) {
    if (request.length == 4 && request[0].toUpperCase() === "INTEGRIDAD") {
      console.log("Request for integrity received");
      checkIntegrity(request[1], request[2], request[3], callback);
      return "Integrity request done";
    }
    return super.handle(request);
  }
}

class SignWriteHandler extends AbstractHandler {
  handle(request, callback) {
    if (request.action == "sign" && request.key && request.ciphered) {
      const toSave = request.key + "\n" + request.ciphered + "\n";
      write("../salida.txt", toSave, callback, "Sign request done");
      return "Sign request done";
    }
    return super.handle(request, callback);
  }
}
class AutenticateWriteHandler extends AbstractHandler {
  handle(request, callback) {
    if (request.action == "autenticate" && request.result) {
      const toSave = request.result + "\n";
      write("../salida.txt", toSave, callback, "Autenticate request done");
      return "Autentication request done";
    }
    return super.handle(request, callback);
  }
}

function write(path, data, callback, message) {
  fs.writeFile(path, data, function (error) {
    if (error) {
      callback.send(error);
    } else {
      callback.send(message);
    }
  });
}
