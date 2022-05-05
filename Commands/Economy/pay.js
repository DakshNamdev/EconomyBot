const Discord = require("discord.js"), Utils = require("../../Modules/Utils");
const { lang, config, commands } = require("../../index");
const Economy = require("../../Modules/Economy");

module.exports = {
    name: "pay",
    type: "economy",
    commandData: commands.Economy.Pay,
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
    const member = options.target.member;
    const amount = options.amount ? options.amount.content : 0;
    const EcoMember = new Economy(require("../../index").mysql, interaction.guild.id, interaction.user.id);
    try {
        const paySuccesfull = await EcoMember.payUser(member.id, amount)
        if(paySuccesfull) {
            return interaction.editReply(Utils.setupMessage({
                configPath: lang.Economy.Pay,
                variables: [
                    ...Utils.userVariables(interaction.member, 'user'),
                    ...Utils.userVariables(member, 'target'),
                    {searchFor: /{amount}/g, replaceWith: amount || 0}
                ]
            }))
        } else {
            return interaction.editReply(Utils.setupMessage({
                configPath: lang.Presets.Error,
                variables: [
                    ...Utils.userVariables(interaction.member, 'user'),
                    { searchFor: /{error}/g, replaceWith: `Unable to pay <@${member.id}>, please contact an adminstrator.` }
                ]
            }));
        }
    } catch(error) {
        switch(error.toString()) {
            case "Amount must be a whole number.": return interaction.editReply(Utils.setupMessage({
                configPath: lang.Presets.Error,
                variables: [
                    ...Utils.userVariables(interaction.member, 'user'),
                    { searchFor: /{error}/g, replaceWith: `Amount must be a whole number.` }
                ]
            }));

            case "Insufficient balance.": return interaction.editReply(Utils.setupMessage({
                configPath: lang.Presets.Error,
                variables: [
                    ...Utils.userVariables(interaction.member, 'user'),
                    { searchFor: /{error}/g, replaceWith: `You don't have enough balance to pay <@${member.id}>` }
                ]
            }));

            case "Amount less then MinCoins.": return interaction.editReply(Utils.setupMessage({
                configPath: lang.Presets.Error,
                variables: [
                    ...Utils.userVariables(interaction.member, 'user'),
                    { searchFor: /{error}/g, replaceWith: `You can't pay less then **${config.Economy.Pay.MinCoins}** coins.` }
                ]
            }));

            case "Amount more then MaxCoins.": return interaction.editReply(Utils.setupMessage({
                configPath: lang.Presets.Error,
                variables: [
                    ...Utils.userVariables(interaction.member, 'user'),
                    { searchFor: /{error}/g, replaceWith: `You can't pay more then **${config.Economy.Pay.MaxCoins}** coins.` }
                ]
            }));

            case "ZeroOrNegativeAmount": return interaction.editReply(Utils.setupMessage({
                configPath: lang.Presets.Error,
                variables: [
                    ...Utils.userVariables(interaction.member, 'user'),
                    { searchFor: /{error}/g, replaceWith: `You can't pay 0 or a negative amount of coins.` }
                ]
            }));
        }
    }
};
