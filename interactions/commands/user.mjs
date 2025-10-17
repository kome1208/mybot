import { ApplicationIntegrationType, SlashCommandBuilder } from "discord.js";
export const data = new SlashCommandBuilder()
.setName("user")
.setDescription("user")
.setIntegrationTypes(
    ApplicationIntegrationType.GuildInstall
);

export const run = async (interaction) => {
    import(`./subcommands/user/${interaction.options.getSubcommand()}.mjs`).then((command) => command.run(interaction));
};