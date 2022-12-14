const express = require("express");
const fs = require("fs");
var request = require("request");
const docker = true;

const app = express(); //Se crea la aplicación
port = 8000;

app.use(express.urlencoded());
app.use(express.json());

//Se asigna el puerto en el cual escuchará la aplicación
app.listen(port, () => {
  console.log(`Proxy server listening on port ${port}`);
});

//Se asigna la ruta para recibir las peticiones de firma
app.post("/sign", (req, res) => {
  console.log("Request for signing received ");
  sign(req.body, res);
});

//Se asigna la ruta para recibir las peticiones de autenticación
app.post("/autenticate", (req, res) => {
  console.log("Request for autenticate received ");
  autenticate(req.body, res);
});

//Función que redirecciona la llamada a la función de firma
function sign(data, callback) {
  makeRequest(
    "PUT",
    data,
    `http://${docker ? "keys" : "localhost"}:8001/sign`,
    callback
  );
}

//Función que redirecciona la llamada a la función de autenticación
function autenticate(data, callback) {
  makeRequest(
    "PUT",
    data,
    `http://${docker ? "autentication" : "localhost"}:8005/autenticate`,
    callback
  );
}

//Función que se encarga de realizar las peticiones
function makeRequest(method, data, url, callback) {
  var response = request(
    {
      headers: { "content-type": "application/json" },
      url: url,
      form: data,
      method: method,
    },
    function (error, response, body) {
      if (!error && response.statusCode == 200) {
        callback.send(body);
      } else {
        console.error(`Unexpected error in ${url}`);
        callback.status(500).send(body);
      }
    }
  );
}
