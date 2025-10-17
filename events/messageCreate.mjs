import { Events } from "discord.js";
const prefix = process.env["PREFIX"] || "!";

export const name = Events.MessageCreate;

/**
 * @param {import("discord.js").Message} message
 */
export const execute = async (message) => {
    if (message.author.bot) return;
    if (message.content.toLowerCase().startsWith(prefix)) {
        const args = message.content.slice(prefix.length).trim().split(/\s+/);
        const commandName = args.shift().toLowerCase();
        const command = message.client.commands.filter(cmd => (cmd.data.aliases?.includes(commandName))).first() ?? message.client.commands.get(commandName);
        if (command) {
            try {
                command.run(message);
            } catch (error) {
                console.error(error);
            }
        }
    }
};