import { data as command } from "../../music.mjs";
import { EmbedBuilder, MessageFlags } from "discord.js";
import { useQueue } from "discord-player";

command.addSubcommand(subcmd =>
    subcmd.setName("history")
    .setDescription("再生した曲の履歴")
);

/**
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 */
export const run = async (interaction) => {
    const queue = useQueue(interaction.guildId);
    if (!queue || (!queue.tracks.at(0) && !queue.currentTrack)) return interaction.reply({ content: "音楽が再生されていません。", flags: [ MessageFlags.Ephemeral ] });
    const history = queue.history;
    const embed = new EmbedBuilder()
    .setAuthor({ name: "再生履歴" })
    .setDescription(history.tracks.map((track, i) => `${i + 1}:[${track.title}](${track.url})`).slice(0, 10).join("\n") || null)
    .addFields(
        { name: "再生中", value: `[${queue.currentTrack.title}](${queue.currentTrack.url})` }
    )
    .setColor("ff0000");
    await interaction.reply({ embeds: [ embed ] });
};