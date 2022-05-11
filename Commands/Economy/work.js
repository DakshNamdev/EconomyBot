const Discord = require("discord.js"), Utils = require("../../Modules/Utils");
const { lang, config, commands } = require("../../index");
const Economy = require("../../Modules/Economy");
const moment = require("moment");

module.exports = {
    name: "work",
    type: "economy",
    commandData: commands.Economy.Work,
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

const randomNumber = (min = 10, max = 100) => Math.floor(Math.random() * (max - min + 1)) + min;
const cooldowns = new Discord.Collection(), checkCooldown = (user, setCooldownIfFalse) => {
    const cooldown = config.Economy?.Work?.CoolDown || 5 * 60 * 1000;

    if (!cooldowns.has(user.id)) {
        cooldowns.set(user.id, Date.now() + cooldown);
        setTimeout(() => cooldowns.delete(user.id), cooldown);
        return true;
    } else return false;
}, tasks = ["repeatmsg", "solvemath"];

const randomMsgs = [...config.Economy.Work.Tasks.RepeatMessages];
const mathQuestions = [...config.Economy.Work.Tasks.SolveMath];

/**
 *
 * @param {Discord.Client} bot
 * @param {Discord.CommandInteraction} interaction
 * @param {Object} options
 */
module.exports.runSlash = async (bot, interaction, options) => {
    await interaction.deferReply();

    const isOnCooldown = checkCooldown(interaction.user, true);
    if (isOnCooldown) {
        const cooldown = moment(cooldowns.get(interaction.user.id)).fromNow();
        return interaction.editReply(Utils.setupMessage({
            configPath: lang.Economy.Work.OnCooldown,
            variables: [
                { searchFor: /{cooldown}/g, replaceWith: cooldown },
                ...Utils.userVariables(interaction.member, 'user'),
            ]
        }))
    };

    const userEco = new Economy(require("../../index").mysql, interaction.guild.id, interaction.user.id);
    const amount = randomNumber(config.Economy.Work.MinCoins, config.Economy.Work.MaxCoins);
    const task = tasks[randomNumber(0, tasks.length - 1)];

    switch(task) {
        case "repeatmsg": {
            const randomMessage = randomMsgs[randomNumber(0, randomMsgs.length - 1)];
            interaction.editReply(Utils.setupMessage({
                configPath: lang.Economy.Work.Tasks.RandomMessage,
                variables: [
                    { searchFor: /{message}/g, replaceWith: randomMessage },
                    ...Utils.userVariables(interaction.member, 'user'),
                ]
            })).then(async msg => {
                const taskMsg = await msg.channel.awaitMessages({
                    filter: m => m.author.id === interaction.user.id,
                    max: 1,
                    time: 30000,
                    errors: ["time"]
                }).catch(e => {
                    msg.channel.send(Utils.setupMessage({
                        configPath: lang.Economy.Work.TaskFailed,
                        variables: Utils.userVariables(interaction.member, 'user')
                    })).then(() => {
                        msg.delete().catch(e => {});
                    })
                }).then((msg) => msg.first());

                if(taskMsg.content.toLowerCase() === randomMessage.toLowerCase()) {
                    await userEco.addCoins(amount);
                    msg.channel.send(Utils.setupMessage({
                        configPath: lang.Economy.Work.Success,
                        variables: [
                            { searchFor: /{amount}/g, replaceWith: amount },
                            ...Utils.userVariables(interaction.member, 'user'),
                        ]
                    }))
                }
            })
            break;
        }

        case "solvemath": {
            const randomQuestion = mathQuestions[randomNumber(0, mathQuestions.length - 1)];
            interaction.editReply(Utils.setupMessage({
                configPath: lang.Economy.Work.Tasks.SolveMath,
                variables: [
                    { searchFor: /{message}/g, replaceWith: randomQuestion.Question },
                    ...Utils.userVariables(interaction.member, 'user'),
                ]
            })).then(async msg => {
                const taskMsg = await msg.channel.awaitMessages({
                    filter: m => m.author.id === interaction.user.id,
                    max: 1,
                    time: 30000,
                    errors: ["time"]
                }).catch(e => {
                    msg.channel.send(Utils.setupMessage({
                        configPath: lang.Economy.Work.TaskFailed,
                        variables: Utils.userVariables(interaction.member, 'user')
                    })).then(() => {
                        msg.delete().catch(e => {});
                    })
                }).then((msg) => msg.first());
                if(taskMsg.content == randomQuestion.Answer) {
                    await userEco.addCoins(amount);
                    msg.channel.send(Utils.setupMessage({
                        configPath: lang.Economy.Work.Success,
                        variables: [
                            { searchFor: /{amount}/g, replaceWith: amount },
                            ...Utils.userVariables(interaction.member, 'user'),
                        ]
                    }))
                }
            })

            break;
        }

        default:
            await userEco.addCoins(amount);
            interaction.editReply(Utils.setupMessage({
                configPath: lang.Economy.Work.Success,
                variables: [
                    { searchFor: /{amount}/g, replaceWith: amount },
                    ...Utils.userVariables(interaction.member, 'user'),
                ]
            }))
            break;
    }
};
