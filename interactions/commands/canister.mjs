import { ApplicationIntegrationType, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
.setName("canister")
.setDescription("canister")
.setIntegrationTypes(
    ApplicationIntegrationType.GuildInstall,
    ApplicationIntegrationType.UserInstall
);

export const run = async (interaction) => {
    import(`./subcommands/canister/${interaction.options.getSubcommand()}.mjs`).then((command) => command.run(interaction));
};