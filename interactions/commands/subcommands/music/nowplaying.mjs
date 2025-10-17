import { data as command } from "../../music.mjs";
import { EmbedBuilder, MessageFlags } from "discord.js";
import { useQueue } from "discord-player";

command.addSubcommand(subcmd =>
    subcmd.setName("nowplaying")
    .setDescription("再生中の曲を表示")
);

/**
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 */
export const run = async (interaction) => {
    const queue = useQueue(interaction.guildId);
    if (!queue || (!queue.tracks.at(0) && !queue.currentTrack)) return interaction.reply({ content: "音楽が再生されていません。", flags: [ MessageFlags.Ephemeral ] });
    const current = queue.currentTrack;
    const embed = new EmbedBuilder()
    .setAuthor({ name: "再生中" })
    .setTitle(current.title)
    .setURL(current.url)
    .setThumbnail(current.thumbnail)
    .addFields(
        { name: `${queue.node.getTimestamp().progress}%`, value: queue.node.createProgressBar() }
    )
    .setFooter({ text: `${current.requestedBy.username}によるリクエスト`, iconURL: current.requestedBy.displayAvatarURL() })
    .setColor("ff0000");
    await interaction.reply({ embeds: [ embed ] });
};