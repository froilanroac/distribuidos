const express = require("express");
const fs = require("fs");
var request = require("request");

const app = express();
port = 8000;

app.use(express.urlencoded());
app.use(express.json());

app.listen(port, () => {
  console.log(`Proxy server listening on port ${port}`);
});

app.post("/sign", (req, res) => {
  console.log("Request for signing received ");
  sign(req.body, res);
});

app.post("/autenticate", (req, res) => {
  console.log("Request for autenticate received ");
  autenticate(req.body, res);
});

function sign(data, callback) {
  makeRequest("PUT", data, "http://localhost:8001/sign", callback);
}

function autenticate(data, callback) {
  makeRequest("PUT", data, "http://localhost:8005/autenticate", callback);
}

function makeRequest(method, data, url, callback) {
  var response = request(
    {
      headers: { "content-type": "application/json" },
      url: url,
      form: data,
      method: method,
    },
    function (error, response, body) {
      if (!error) {
        callback.send(body);
      } else {
        callback.send(`Unexpected error: ${error}`);
      }
    }
  );
}
