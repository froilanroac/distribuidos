const express = require("express");
const fs = require("fs");
const request = require("request");
var lockFile = require("proper-lockfile");
const docker = true;

const app = express(); //Se crea la aplicación
port = 8005;

app.use(express.urlencoded());
app.use(express.json());

//Se asigna el puerto en el cual escuchará la aplicación
app.listen(port, () => {
  console.log(`Autentication server listening on port ${port}`);
});

//Se asigna la ruta para recibir las peticiones de autenticación
app.put("/autenticate", async (req, res) => {
  console.log("Request for autentication received ");
  autenticate(req.body.name, req.body.key, res);
});

//Función que asegura la exclusividad mutua revisando si el archivo esta bloqueado(en uso)
async function checkLockFile() {
  return lockFile
    .check(docker ? "./data/identidades.txt" : "../identidades.txt")
    .catch((err) => {
      console.error(`Unexpected error: ${err.message}`);
      return "Error";
    });
}

//Función que lee el .txt para verificar las credenciales de un usuario
function checkIdentity(name, key) {
  const identidades = fs
    .readFileSync(docker ? "./data/identidades.txt" : "../identidades.txt")
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
  return toSave;
}

//Función que se encarga de autenticar las credenciales de un usuario
async function autenticate(name, key, callback) {
  var counter = 0;
  const interval = setInterval(async () => {
    const locked = await checkLockFile();
    if (!locked) {
      clearInterval(interval);
      try {
        console.log("File unlocked, reading...");
        const toSave = checkIdentity(name, key);
        const body = { action: "autenticate", result: toSave };
        callback.send(body);
      } catch (error) {
        callback
          .status(500)
          .send("Error en el servidor de autenticacion " + error);
      }
    } else if (locked == "Error" || counter > 20) {
      console.log("Error in lock file");
      callback
        .status(500)
        .send("Error de lectura en el servidor de autenticacion");
      clearInterval(interval);
    } else {
      console.log("File Locked, trying again...");
      counter++;
    }
  }, 1000);
}
