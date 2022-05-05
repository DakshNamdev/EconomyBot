const Discord = require("discord.js"), Utils = require("../../Modules/Utils");
const { lang, config, commands } = require("../../index");
const Economy = require("../../Modules/Economy");
const {message} = require("prompt");

module.exports = {
    name: "balance",
    type: "economy",
    commandData: commands.Economy.Balance,
};

/**
 *
 * @param {Discord.Client} bot
 * @param {Discord.Message} message
 * @param {String[]} args
 * @param {Object} config
 */
module.exports.run = async (bot, message, args, config) => {
    message.reply("Normal Legacy Commands aren't available in this bot. Please use slash command.").then(async msg => {
        setTimeout(() => {
            msg.delete().catch(e => {}); message.delete().catch(e => {});
        }, 5000)
    })
};


/**
 *
 * @param {Discord.Client} bot
 * @param {Discord.CommandInteraction} interaction
 * @param {Object} options
 */
module.exports.runSlash = async (bot, interaction, options) => {
    await interaction.deferReply();
    const member = options.target ? options.target.member : interaction.member;

    const EcoMember = new Economy(require("../../index").mysql, member.guild.id, member.id);
    const userBalance = await EcoMember.getBalance();

    interaction.editReply(Utils.setupMessage({
        configPath: lang.Economy.Balance,
        variables: [
            ...Utils.userVariables(interaction.member, 'user'),
            ...Utils.userVariables(member, 'target'),
            { searchFor: /{target-balance}/g, replaceWith: userBalance || 0 }
        ]
    }))
};
