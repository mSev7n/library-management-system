// index.js
const mode = process.argv[2]; // "cli" or "server"

if (mode === "cli") {
  require("./cli");
} else {
  require("./src/server");
}
// You can run the application in CLI mode using: node index.js cli
// Or in server mode using: node index.js server