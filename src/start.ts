import * as app from "./server";

var port = process.env.PORT;
if (port == null || port == "") {
    port = "3000";
}
app.listen(port);

console.log('working on ' + port);