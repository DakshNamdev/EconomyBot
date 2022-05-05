const Discord = require("discord.js"), Utils = require("../../Modules/Utils");
const { lang, config, commands } = require("../../index");
const Economy = require("../../Modules/Economy");

module.exports = {
    name: "leaderboard",
    type: "economy",
    commandData: commands.Economy.LeaderBoard,
};

const pages = (array, itemsperpage, page = 1) => {
    const maxPages = Math.ceil(array.length / itemsperpage);
    if (page < 1 || page > maxPages) return null;
    return array.slice((page - 1) * itemsperpage, page * itemsperpage)
}

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

    const databaseUsers = await Economy.fetchAllUsers(require("../../index").mysql, interaction.guild.id);
    if(databaseUsers && Array.isArray(databaseUsers)) {
        const users = databaseUsers.sort((a, b) => b.balance - a.balance);

        const embedsArray = users.map((x, i) => {
            const user = Utils.parseUser(x.user, interaction.guild);
            if(user) return `**${++i}**. ` + `\`${x.balance.toLocaleString()}\` <@${user.id}>`
        });

        let embeds = [], maxPages = Math.ceil(embedsArray.length / 10), pageIndex = 0;

        for (let i = 0; i < maxPages; i++) {
            const queuePage = pages(embedsArray, 10, (i + 1));
            embeds.push(Utils.setupMessage({
                configPath: lang.Economy.LeaderBoard,
                variables: [
                    ...Utils.userVariables(interaction.member, 'user'),
                    { searchFor: /{queue}/g, replaceWith: queuePage && queuePage[0] ? queuePage.join("\n") : "> No Users Found." },
                    { searchFor: /{max-page}/g, replaceWith: maxPages },
                    { searchFor: /{current-page}/g, replaceWith: i + 1 }
                ]
            }))
        }

        const getRow = () => new Discord.MessageActionRow().addComponents([
            new Discord.MessageButton({ customId: "economy_leaderboard_before", style: "PRIMARY", emoji: "⏮" }).setDisabled(pageIndex == 0),
            new Discord.MessageButton({ customId: "economy_leaderboard_next", style: "PRIMARY", emoji: "⏭" }).setDisabled(pageIndex == embeds.length - 1),
        ]);

        interaction.editReply({
            ...embeds[pageIndex],
            components: [getRow()],
            fetchReply: true
        }).then(/** @param {Discord.Message} message */ async message => {
            const collector = await message.createMessageComponentCollector({
                filter: (i) => ["economy_leaderboard_before", "economy_leaderboard_next"].includes(i.customId),
                time: 2 * 60 * 1000
            });

            collector.on("collect", async (i) => {
                if(i.user.id != interaction.user.id)  return i.reply({
                    content: "This interaction isn't for you.", ephemeral: true
                });

                if (i.customId === "economy_leaderboard_before" && pageIndex > 0) --pageIndex;
                else if (i.customId === "economy_leaderboard_next" && pageIndex < maxPages - 1) ++pageIndex;

                await i.update({...embeds[pageIndex], components: [getRow()]})
            })

            collector.on('end', async () => await message.edit({ ...embeds[pageIndex], components: [] }))
        })

    } else {
        return interaction.editReply(Utils.setupMessage({
            configPath: lang.Presets.Error,
            variables: [
                ...Utils.userVariables(interaction.member, 'user'),
                { searchFor: /{error}/g, replaceWith: `Unable to fetch leaderboard for this guild, please contact an adminstrator.` }
            ]
        }));
    }
};
