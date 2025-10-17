import { Events } from "discord.js";
export const name = Events.ClientReady;
export const once = true;
export const execute = async (client) => {
    console.log(`Ready! Logged in ${client.user.tag}`);
};