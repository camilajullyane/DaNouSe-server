import dgram from "dgram";

const server = dgram.createSocket("udp4");

server.on("message", (msg, rinfo) => {
  console.log(`Mensagem de ${rinfo.address}:${rinfo.port}`);
  console.log(`Dados: ${msg}`);

  server.send("Pong", rinfo.port, rinfo.address);
});

server.on("end", () => {
  console.log(`Cliente desconectado: ${server.remoteAddress}`);
});

server.on("error", (err) => {
  console.error("Erro na conexão:", err);
});

server.bind(8080, () => {
  console.log("Servidor DNS rodando em:", 8080);
});
