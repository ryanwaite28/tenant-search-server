import * as dotenv from 'dotenv';
dotenv.config();

// @ts-ignore
import * as express from 'express';
import * as path from 'path';
import * as cors from 'cors';
import * as socket_io from 'socket.io';
import * as http from 'http';
import * as client_sessions from 'client-sessions';
// @ts-ignore
import * as express_device from 'express-device';
// @ts-ignore
import * as express_fileupload from 'express-fileupload';
// @ts-ignore
import * as body_parser from 'body-parser';
import {
  APP_SECRET,
  corsOptions,
} from './chamber';
import { MainController } from './controllers/_main';
import { IRequest } from './interfaces/express-request.interface';



const PORT: string | number = process.env.PORT || 8000;
const app: express.Application = express();

app.use(express_fileupload({ safeFileNames: true, preserveExtension: true }));
app.use(express_device.capture());
app.use(body_parser.json());
app.use(body_parser.urlencoded({ extended: false }));
app.use(client_sessions({
  cookieName: 'session',
  secret: APP_SECRET,
  duration: 5 * 30 * 60 * 1000,
  activeDuration: 2 * 5 * 60 * 1000,
  cookie: {
	  httpOnly: false,
	  secure: false,
  }
}));

const server: http.Server = http.createServer(app);
const io: socket_io.Server = socket_io(server);

io.on('connection', (socket) => {
  console.log('new socket:', socket);
});

app.use((request: express.Request, response: express.Response, next: express.NextFunction) => {
  (<IRequest> request).io = io;
  next();
});

app.options('*', cors(corsOptions));
app.use('/main', cors(corsOptions), MainController);



/* --- Static file declaration --- */

const binPath = path.join(__dirname, '../_bin');
app.use(express.static(binPath));



/* --- Start Server --- */

server.listen(PORT);
console.log(`Listening on port ${PORT}...`);
