import { useQueue } from "discord-player";
import { ApplicationIntegrationType, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
.setName("music")
.setDescription("音楽ず")
.setIntegrationTypes(
    ApplicationIntegrationType.GuildInstall
);

export const run = async (interaction) => {
    import(`./subcommands/music/${interaction.options.getSubcommand()}.mjs`).then((command) => command.run(interaction));
};

export const runAutocomplete = async (interaction) => {
    const focused = interaction.options.getFocused(true);
    const queue = useQueue(interaction.guildId);
    if (focused.name === "track") {
        if (!queue) return;
        const tracks = queue.tracks.map((track, i) => ({ name: `${i+1}:${track.title}`, value: `${i+1}` }));
        const filtered = tracks.filter(track => 
            (track.name.toLowerCase().includes(focused.value.toLowerCase()) || track.value.startsWith(focused.value))
        );
        await interaction.respond(filtered.slice(0, 25));
    }
};