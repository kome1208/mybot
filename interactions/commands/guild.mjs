import { ApplicationIntegrationType, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
.setName("guild")
.setDescription("さば")
.setIntegrationTypes(
    ApplicationIntegrationType.GuildInstall
);

export const run = async (interaction) => {
    import(`./subcommands/guild/${interaction.options.getSubcommand()}.mjs`).then((command) => command.run(interaction));
};