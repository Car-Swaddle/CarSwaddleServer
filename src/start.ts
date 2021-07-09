import * as app from "./server";

var port = process.env.PORT;
if (port == null || port == "") {
    port = "3000";
}
const server = app.listen(port);

console.log('working on ' + port);

// Gracefully handle heroku reboots
if (process.env.ENV == "production" || process.env.ENV == "staging") {
    process.on('SIGTERM', signalListener()).on('SIGINT', signalListener());

    function signalListener(): (signal: NodeJS.Signals) => void {
        return async (signal) => {
            console.warn(`Received ${ signal }...`);
            setTimeout(() => {
                console.log('...waited 5s, exiting.');
                server.close();
            }, 5000);
        };
    }
}

process.on('uncaughtException', (err: Error) => {
    console.error(err?.stack ?? err);
    process.exit(err ? 1 : 0);
});

process.on('warning', (warning: Error) => {console.warn(warning.message); console.warn(warning.stack)});
