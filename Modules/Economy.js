const Utils = require("./Utils.js");
const { config } = require("../index");

module.exports = class EcoUser {
    guildID; userID; db;

    /**
     * @param mysqlConnection
     * @param {String} userID
     * @param {String} guildID
     */
    constructor(mysqlConnection, guildID, userID) {
        this.db = mysqlConnection;
        this.guildID = guildID;
        this.userID = userID;
    }

    /** @param {Boolean} createIFNotExists*/
    async userExists(createIFNotExists = false) {
        return new Promise(async (resolve) => {
            await this.db.query(`SELECT * FROM coins WHERE guild = ? AND user = ?`, [this.guildID, this.userID], async (error, [result]) => {
                if(error) {
                    Utils.logError(`An error occurred while checking if user ${this.userID} exists.`);
                    if(process.argv.includes("--show-errors")) Utils.logError(error.stack);
                    return resolve(false);
                }

                if(!result && createIFNotExists === true) {
                    const newEntry = await this.createDatabaseEntry();
                    return resolve(!!newEntry);
                }

                return resolve(!!result);
            })
        })
    };

    /** @param {Number} balance */
    async createDatabaseEntry(balance = 0) {
        if(!balance) balance = config.Economy.DefaultCoins;
        return new Promise(async (resolve) => {
            this.db.query(`INSERT INTO coins (guild, user, balance) VALUES (?, ?, ?)`, [this.guildID, this.userID, balance], (error, result) => {
                if (error) {
                    Utils.logError(`An error occurred while creating new economy entry for user ${this.userID}`);
                    if(process.argv.includes("--show-errors")) Utils.logError(error.stack);
                    return resolve(config.Economy.DefaultCoins);
                }

                return resolve(balance);
            });
        });
    };

    async getBalance() {
        return new Promise(async (resolve) => {
            try {
                this.db.query(`SELECT balance FROM coins WHERE guild = ? AND user = ?`, [this.guildID, this.userID], async (error, [result]) => {
                    if(error) {
                        Utils.logError(`An error occurred while getting the balance of ${this.userID}`);
                        if(process.argv.includes("--show-errors")) Utils.logError(error.stack);
                        return resolve(config.Economy.DefaultCoins);
                    }

                    if(!result) {
                        const newEntry = await this.createDatabaseEntry();
                        return resolve(newEntry);
                    }

                    return resolve(result.balance);
                });
            } catch (error) {
                Utils.logError(`An error occurred while getting the balance of ${this.userID}`);
                if(process.argv.includes("--show-errors")) Utils.logError(error.stack);
                return resolve(config.Economy.DefaultCoins);
            }
        });
    }

    /** @param {Number} amount */
    async addCoins(amount = 0) {
        return new Promise(async (resolve) => {
            try {
                this.db.query(`UPDATE coins SET balance = balance + ? WHERE guild = ? AND user = ?`, [amount, this.guildID, this.userID], async (error, result) => {
                    if(error) {
                        Utils.logError(`An error occurred while adding coins to ${this.userID}`);
                        if(process.argv.includes("--show-errors")) Utils.logError(error.stack);
                        return resolve(false);
                    }

                    if(!result) {
                        const newEntry = await this.createDatabaseEntry(config.Economy.DefaultCoins + amount);
                        return resolve(!!newEntry);
                    }

                    return resolve(true);
                });
            } catch (error) {
                Utils.logError(`An error occurred while adding coins to ${this.userID}`);
                if(process.argv.includes("--show-errors")) Utils.logError(error.stack);
                return resolve(false);
            }
        });
    };

    /** @param {Number} amount */
    async removeCoins(amount = 0) {
        return new Promise(async (resolve) => {
            try {
                this.db.query(`UPDATE coins SET balance = balance - ? WHERE guild = ? AND user = ?`, [amount, this.guildID, this.userID], async (error, result) => {
                    if(error) {
                        Utils.logError(`An error occurred while removing coins from ${this.userID}`);
                        if(process.argv.includes("--show-errors")) Utils.logError(error.stack);
                        return resolve(false);
                    }

                    if(!result) {
                        const newEntry = await this.createDatabaseEntry(config.Economy.DefaultCoins - amount);
                        return resolve(!!newEntry);
                    }

                    return resolve(true);
                });
            } catch (error) {
                Utils.logError(`An error occurred while removing coins from ${this.userID}`);
                if(process.argv.includes("--show-errors")) Utils.logError(error.stack);
                return resolve(false);
            }
        });
    };

    /**
     * @param {String} userID
     * @param {Number} amount
     */
    async payUser(userID, amount) {
        return new Promise(async (resolve, reject) => {
            try {
                const currentBalance = await this.getBalance();
                if(currentBalance < amount)
                    throw new Error("Insufficient balance.");

                if(amount < config.Economy.Pay.MinCoins)
                    throw new Error(`Amount must be at least ${config.Economy.Pay.MinCoins} coins.`);
                else if(amount > config.Economy.Pay.MaxCoins)
                    throw new Error(`Amount must be at most ${config.Economy.Pay.MaxCoins} coins.`);


                const targetUser = new EcoUser(this.db, userID, this.guildID);
                const targetResult = await targetUser.addCoins(amount);
                const currentUserResult = await this.removeCoins(amount);

                if(targetResult && currentUserResult)
                    return resolve(true);

                if(!targetResult || !currentUserResult) {
                    await targetUser.removeCoins(amount);
                    await this.addCoins(amount);

                    return resolve(false);
                }
            } catch (error) {
                Utils.logError(`An error occurred while paying ${userID} from ${this.userID}`);
                if(process.argv.includes("--show-errors")) Utils.logError(error.stack);
                return resolve(false);
            }
        })
    };
};

module.exports.fetchAllUsers = (db, guildID) => new Promise(async (resolve) => {
    try {
        await db.query(`SELECT * FROM coins WHERE guild = ?`, [guildID], async (error, result) => {
            if(error) {
                Utils.logError(`An error occurred while fetching all users from ${guildID}`);
                if(process.argv.includes("--show-errors")) Utils.logError(error.stack);
                return resolve(false);
            }

            return resolve(result);
        });
    } catch (error) {
        Utils.logError(`An error occurred while fetching all users`);
        if(process.argv.includes("--show-errors")) Utils.logError(error.stack);
        return resolve(false);
    }
});