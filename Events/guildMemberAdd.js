const Discord = require("discord.js"), Utils = require("../Modules/Utils");
const EcoUser = require("../Modules/Economy");
/**
 * @param {Discord.Client} bot
 * @param {Discord.GuildMember} member
 */
module.exports = async (bot, member) => {
    const Eco = new EcoUser(require("../index"), member.guild.id, member.id);
    await Eco.userExists(true);
}