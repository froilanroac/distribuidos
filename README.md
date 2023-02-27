# Proyecto de distribuidos

# PREREQUISITOS:

- Docker 20.10.21 o superior
- **SE TIENE QUE VERIFICAR QUE EN EL DOCKER DESKTOP SE TENGAN PERMISOS PARA COMPARTIR CARPETAS (File Sharing)**
- tener una red local para que los contenedores se puedan comunicar entre si (a continuación el comando para crearla):
  > $ docker network create red

## Comandos para poder levantar los servidores:

**Cada carpeta contiene un servidor, por lo tanto se tiene que hacer esto por cada servidor...**

## en la carpeta "client"

    $ docker build . -t client
    $ docker run --net red --name client -v **path absoluto de la carpeta dist**:/app/data -p 8010:8010 client
    ejemplo del comando de arriba:
    $docker run --net red --name client -v /Users/froilanroac/Desktop/dist:/app/data -p 8010:8010 client

## en la carpeta "proxy"

    $ docker build . -t proxy
    $ docker run --net red --name proxy -v **path absoluto de la carpeta dist**:/app/data -p 8000:8000 proxy
    ejemplo del comando de arriba:
    $docker run --net red --name proxy -v /Users/froilanroac/Desktop/dist:/app/data -p 8000:8000 proxy

## en la carpeta "keys"

    $ docker build . -t keys
    $ docker run --net red --name keys -v **path absoluto de la carpeta dist**:/app/data -p 8001:8001 keys
    ejemplo del comando de arriba:
    $docker run --net red --name keys -v /Users/froilanroac/Desktop/dist:/app/data -p 8001:8001 keys

## en la carpeta "autentication"

    $ docker build . -t autentication
    $ docker run --net red --name autentication -v **path absoluto de la carpeta dist**:/app/data -p 8005:8005 autentication
    ejemplo del comando de arriba:
    $docker run --net red --name autentication -v /Users/froilanroac/Desktop/dist:/app/data -p 8005:8005 autentication

# Para cada ejecución:

Todas las solicitudes las manejar el sistema dependiendo de la información en entrada.txt. Para que el valide y envie solicitudes, solo se le tiene que hacer una petición vacía al servidor cliente (con Postman o el comando curl).

## Ejemplo

Se quiere firmar un mensaje: para eso se debe llenar el archivo entrada.txt con la siguiente información:

> FIRMAR
> FROILAN
> mensaje a firmar

Luego se hará una petición al servidor del cliente con el comando curl:

> curl localhost:8010

Y se obtendra la respuesta en el archivo salida.txt
