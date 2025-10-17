import { data as command } from "../../music.mjs";
import { EmbedBuilder, MessageFlags } from "discord.js";
import { useQueue } from "discord-player";

command.addSubcommand(subcmd =>
    subcmd.setName("queue")
    .setDescription("キュー内の曲を表示")
);

/**
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 */
export const run = async (interaction) => {
    const queue = useQueue(interaction.guildId);
    if (!queue || (!queue.tracks.at(0) && !queue.currentTrack)) return interaction.reply({ content: "音楽が再生されていません。", flags: [ MessageFlags.Ephemeral ] });
    if (queue.tracks.size === 0) {
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
        return await interaction.reply({ embeds: [ embed ] });
    }
    const tracks = queue.tracks.data.slice(0, 10).map((track, i) => {
        return `${i + 1}:[${track.title}](${track.url})`;
    });
    const embed = new EmbedBuilder()
    .setAuthor({ name: "次のコンテンツ" })
    .setDescription(
        `${tracks.join("\n")}${
            queue.tracks.size > tracks.length
                ? `\n...さらに${queue.tracks.size - tracks.length === 1 ? `${queue.tracks.size - tracks.length}個` : `${queue.tracks.size - tracks.length}個`}`
                : ""
        }`
    )
    .addFields(
        { name: "再生中", value: `[${queue.currentTrack.title}](${queue.currentTrack.url})` }
    )
    .setColor("ff0000");
    await interaction.reply({ embeds: [ embed ] });
};