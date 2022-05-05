const installNodeModules = async () => new Promise(async (resolve, reject) => {
    if (!process.argv.includes("--no-install")) {
        const showOutput = process.argv.includes("--show-install-output"),
            package = require("./package.json"),
            { spawn } = require("child_process"),
            modules = [
                ...Object.keys(package.dependencies),
                ...Object.keys(package.optionalDependencies)
            ];

        console.log(`\x1b[34m[Module Installer]`, `\x1b[37mInstalling ${`\x1b[1m${modules.length}\x1b[0m`}\x1b[37m modules, Please wait while we install modules. This may take a few minutes.`);
        let data = spawn(process.platform == "win32" ? "npm.cmd" : "npm", ["install", ...modules]);
        data.stdout.on("data", (data) => {
            showOutput ? console.log(`\x1b[34m[Module Installer: stdout]\x1b[0m`, data.toString().trim()) : "";
        })
        data.stderr.on("data", (data) => {
            showOutput ? console.log(`\x1b[34m[Module Installer: stderr]\x1b[0m`, data.toString().trim()) : ""
        })
        data.on("exit", (code) => {
            console.log(`\x1b[34m[Module Installer]`, `\x1b[37m${`\x1b[1m${modules.length}\x1b[0m`}\x1b[37m were installed. `);
            resolve(code);
        })
    } else resolve();
})

installNodeModules().then(async () => {
    if (!process.argv.includes("--no-install")) {
        try {
            require.resolve("console-stamp");
        } catch (e) {
            if (require("fs").existsSync("node_modules")) {
                console.log(`\x1b[34m[Module Installer]`, `\x1b[37mModules installed, please restart the bot.`);
                process.exit(0);
            } else {
                console.log(`\x1b[34m[Module Installer]`, `\x1b[37mModules are not installed.`);
                process.exit(0);
            }
        }
    }
    require("console-stamp")(console, { format: ":date(HH:MM:ss).bold.grey" });
    const Utils = require("./Modules/Utils")
    if (process.versions.node < 16.6)
        return Utils.logError(`BrayanBot Requires Node.js version 16.6.0 or Higher.`);

    const fs = require("fs"), YAML = require("yaml"),
        Discord = require("discord.js"),
        client = new Discord.Client({
            intents: Object.keys(Discord.Intents.FLAGS).map(x => Discord.Intents.FLAGS[x])
        });

    module.exports["client"] = client;
    ["config.yml", "commands.yml", "lang.yml"].forEach((x) => module.exports[x.replace(".yml", "")] = YAML.parse(fs.readFileSync(x, "utf-8"), { prettyErrors: true }));
    ["config", "lang", "commands"].forEach((x) => (client[x] = module.exports[x]));
    ["Events", "SlashCmds", "SlashCmdsData"].forEach((x) => (client[x] = []));
    ["Commands", "Aliases", "Routes"].forEach((x) => (client[x] = new Discord.Collection()));

    let handlers = ["ErrorHandler.js", "EventHandler.js", "CommandHandler.js", "AddonHandler.js", "ExpressHandler.js"];
    for (let index = 0; index < handlers.length; index++)
        await require(`./Modules/Handlers/${handlers[index]}`).init()

    if (client.config.Settings.Token)
        client.login(client.config.Settings.Token);
    else return Utils.logError("An invalid token was provided.");

    const mysql = require("mysql");
    module.exports.mysql = mysql.createConnection({
        host: client.config.MySQL.Host,
        port : client.config.MySQL.Port,
        user: client.config.MySQL.User,
        password: client.config.MySQL.Password
    });

    module.exports.mysql.connect(async (err) => {
        if (err) {
            if (err.message.startsWith('getaddrinfo ENOTFOUND') || err.message.startsWith("connect ECONNREFUSED")) {
                Utils.logError("MySQL Connection Error: Could not connect to the database. Please check your MySQL settings.");
                return process.exit();
            } else return Utils.logError(err.stack);
        }

        const queries = [
            "CREATE DATABASE IF NOT EXISTS " + client.config.MySQL.Database,
            "USE " + client.config.MySQL.Database,
            "CREATE TABLE IF NOT EXISTS coins (id INT NOT NULL AUTO_INCREMENT, " +
                "guild VARCHAR(50) NOT NULL, user VARCHAR(50) NOT NULL, " +
                `balance INT(255) NOT NULL DEFAULT '${client.config.Economy.DefaultCoins}', PRIMARY KEY (id));`,
        ];

        await Promise.all(
            queries.map(query => new Promise(resolve => module.exports.mysql.query(query, err => err ? resolve(err) : resolve()))
                .catch(err => Utils.logError(err.stack)))
        ).then(() => Utils.logInfo("MySQL Connection Successful.")).catch(err => Utils.logError(err.stack))

    });
});