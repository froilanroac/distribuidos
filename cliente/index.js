const express = require("express");
const fs = require("fs");
const crypto = require("crypto");
var request = require("request");
const docker = true;

const app = express(); //Se crea la aplicación
port = 8010;

app.use(express.urlencoded());
app.use(express.json());

//Se asigna el puerto en el cual escuchará la aplicación
app.listen(port, () => {
  console.log(`Client server listening on port ${port}`);
});

app.get("/", (req, res) => {
  //Se define la manera en la que se atenderán las solicitudes
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
  //Función que extrae los datos del .txt de entrada
  try {
    var array = fs
      .readFileSync(docker ? "./data/entrada.txt" : "../entrada.txt")
      .toString()
      .split("\n");
    for (i = 0; i < array.length; i++) {
      array[i] = array[i].replace("\r", "");
    }
    array = array.filter((item) => item);
    return array;
  } catch (error) {
    console.error(`Unexpected error in entry file: ${error.message}`);
    return [];
  }
}

function checkIntegrity(key, message, cipheredHash, callback) {
  var toSave; //Función que revisa la integridad de un mensaje
  try {
    var decipheredHash = decipher(cipheredHash, key);

    var hash = calculateHash(message);

    if (decipheredHash == hash) {
      toSave = "INTEGRO" + "\n" + "0";
    }
    write(
      docker ? "./data/salida.txt" : "../salida.txt",
      toSave,
      callback,
      "Integrity request done"
    );
  } catch (error) {
    toSave = "NO INTEGRO" + "\n" + "0";
    write(
      docker ? "./data/salida.txt" : "../salida.txt",
      toSave,
      callback,
      "Integrity request done"
    );
  }
}

//Función que realiza la llamada al servidor de autenticación
function autenticate(key, name, callback) {
  var data = `{ "key" : "${key}" , "name" : "${name}" }`;
  makeRequest(
    "POST",
    data,
    `http://${docker ? "proxy" : "localhost"}:8000/autenticate`,
    callback
  );
}

//Función que realiza la llamada al proxy para firmar
function sign(name, message, callback) {
  var hash = calculateHash(message);
  var data = `{ "hash" : "${hash}" , "name" : "${name}" }`;
  makeRequest(
    "POST",
    data,
    `http://${docker ? "proxy" : "localhost"}:8000/sign`,
    callback
  );
}

//Función que se encarga de construir las peticiones
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
        var body_;
        try {
          body_ = JSON.parse(body);
        } catch (error) {
          body_ = {};
        }
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

//Función que calcula el hash de un mensaje
function calculateHash(message) {
  const hash = crypto.createHash("sha256").update(message).digest("hex");
  return hash;
}

//Función que decifra un mensaje con su llave
function decipher(message, key) {
  var mykey = crypto.createDecipher("aes-128-cbc", key);
  var mystr = mykey.update(message, "hex", "utf8");
  mystr += mykey.final("utf8");
  return mystr;
}

// chain of responsability pattern
//Clase del manejador abstracto
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

//Clase del manejador para la firma
class SignHandler extends AbstractHandler {
  handle(request, callback) {
    if (
      request.length == 4 &&
      request[0].toUpperCase() == "FIRMAR" &&
      request[3] == "0"
    ) {
      console.log("Request for signing received");
      sign(request[1], request[2], callback);
      return "Signed request done";
    }
    return super.handle(request, callback);
  }
}

//Clase del manejador para la autenticación
class AutenticateHandler extends AbstractHandler {
  handle(request, callback) {
    if (
      request.length == 4 &&
      request[0].toUpperCase() == "AUTENTICAR" &&
      request[3] == "0"
    ) {
      console.log("Request for autentication received");
      autenticate(request[1], request[2], callback);
      return "Autentication request done";
    }
    return super.handle(request, callback);
  }
}

//Clase del manejador para la integridad
class IntegrityHandler extends AbstractHandler {
  handle(request, callback) {
    if (
      request.length == 5 &&
      request[0].toUpperCase() === "INTEGRIDAD" &&
      request[4] == "0"
    ) {
      console.log("Request for integrity received");
      checkIntegrity(request[1], request[2], request[3], callback);
      return "Integrity request done";
    }
    return super.handle(request);
  }
}

//Clase del manejador para la escritura de firma
class SignWriteHandler extends AbstractHandler {
  handle(request, callback) {
    if (request.action == "sign" && request.key && request.ciphered) {
      const toSave = request.key + "\n" + request.ciphered + "\n" + "0";
      write(
        docker ? "./data/salida.txt" : "../salida.txt",
        toSave,
        callback,
        "Sign request done"
      );
      return "Sign request done";
    }
    return super.handle(request, callback);
  }
}

//Clase del manejador para la escritura de autenticación
class AutenticateWriteHandler extends AbstractHandler {
  handle(request, callback) {
    if (request.action == "autenticate" && request.result) {
      const toSave = request.result + "\n" + "0";
      write(
        docker ? "./data/salida.txt" : "../salida.txt",
        toSave,
        callback,
        "Autentication request done"
      );
      return "Autentication request done";
    }
    return super.handle(request, callback);
  }
}

//Función para escribir en los archivos
function write(path, data, callback, message) {
  fs.writeFile(path, data, function (error) {
    if (error) {
      callback.send(error);
    } else {
      callback.send(message);
    }
  });
}
