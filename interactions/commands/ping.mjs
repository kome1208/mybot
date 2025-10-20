import { ApplicationIntegrationType, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
.setName("ping")
.setDescription("ぴん")
.setIntegrationTypes(
    ApplicationIntegrationType.GuildInstall,
    ApplicationIntegrationType.UserInstall
);

/**
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 */
export const run = async (interaction) => {
    const now = Date.now();
    await interaction.reply({ content: `BOT: ${now - interaction.createdTimestamp}ms\nAPI: ${interaction.client.ws.ping}ms` });
};