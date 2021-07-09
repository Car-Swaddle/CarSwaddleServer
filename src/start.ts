import { app } from "./server";

var port = process.env.PORT;
if (port == null || port == "") {
    port = "3000";
}
app.listen(port);

console.log('working on ' + port);

// Gracefully handle heroku reboots
process.on('SIGTERM', signalListener()).on('SIGINT', signalListener());

function signalListener(): (signal: NodeJS.Signals) => void {
    return (signal) => {
        console.warn(`Received ${ signal }...`);
        setTimeout(() => {
            console.log('...waited 10s, exiting.');
            process.exit(0);
        }, 1_000).unref();
    };
}

process.on('uncaughtException', (err: Error) => {
    console.error(err?.stack ?? err);
    process.exit(err ? 1 : 0);
});

process.on('warning', (warning: Error) => {console.warn(warning.message); console.warn(warning.stack)});
