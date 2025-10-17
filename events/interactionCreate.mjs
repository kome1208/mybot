import { Events } from "discord.js";

export const name = Events.InteractionCreate;
export const execute = async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = interaction.client.slashCommands.get(interaction.commandName);
    if (!command) return;
    await command.run(interaction);
  } else if (interaction.isMessageContextMenuCommand()) {
    const context = interaction.client.contextMenus.get(interaction.commandName);
    if (!context) return;
    await context.run(interaction);
  } else if (interaction.isAutocomplete()) {
    const autocomplete = interaction.client.slashCommands.get(interaction.commandName);
    await autocomplete.runAutocomplete(interaction);
  } else if (interaction.isStringSelectMenu()) {
    const selectmenu = interaction.client.selectMenus.get(interaction.customId);
    if (!selectmenu) return;
    await selectmenu.run(interaction);
  }
};