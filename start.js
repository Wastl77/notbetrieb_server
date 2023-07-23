import { execSync } from 'child_process';

// Generieren Sie das aktuelle Datum und die Uhrzeit
const sessionName = new Date().toLocaleString('de-DE').replace(/[:.\s]/g, '-');

// Setzen Sie die Environment Variable dynamisch
process.env.SESSION_NAME = sessionName;

// Starten Sie Ihre Hauptanwendung mit Nodemon und ts-node
execSync('nodemon --exec node --loader ts-node/esm src/index.ts', {
	stdio: 'inherit',
});
