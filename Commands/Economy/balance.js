const Discord = require("discord.js"), Utils = require("../../Modules/Utils");
const { lang, config, commands } = require("../../index");
const Economy = require("../../Modules/Economy");

module.exports = {
    name: "balance",
    type: "economy",
    commandData: commands.Economy.Balance,
};

/**
 *
 * @param {Discord.Client} bot
 * @param {Discord.Message} message
 * @param {Array} args
 * @param {Object} config
 */
module.exports.run = async (bot, message, args, config) => {

};

/**
 *
 * @param {Discord.Client} bot
 * @param {Discord.Interaction} interaction
 */
module.exports.runSlash = async (bot, interaction) => {

};
