const net = require('net');

const port = process.env.PORT ? Number(process.env.PORT) : 9002;

const server = net.createServer();

server.once('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use.`);
    console.error(`Check which process is using it: 'ss -ltnp | grep :${port}' or 'lsof -i :${port}'`);
    console.error(`Kill it: 'kill <PID>' or choose another port with 'npm run dev:9003'`);
    process.exit(1);
  }
  console.error(err);
  process.exit(1);
});

server.once('listening', () => {
  server.close();
  process.exit(0);
});

server.listen(port, '0.0.0.0');
