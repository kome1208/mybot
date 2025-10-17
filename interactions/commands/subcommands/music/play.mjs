import { data as command } from "../../music.mjs";
import { EmbedBuilder, MessageFlags } from "discord.js";
import { useMainPlayer } from "discord-player";

command.addSubcommand(subcmd =>
    subcmd.setName("play")
    .setDescription("vcで音楽再生")
    .addStringOption(option =>
        option.setName("query")
        .setDescription("再生したい音楽のタイトル")
        .setRequired(true)
    )
);

/**
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 */
export const run = async (interaction) => {
    const player = useMainPlayer();

    if (!interaction.member.voice.channel) return interaction.reply({ content: "ボイスチャンネルに参加してください。", flags: [ MessageFlags.Ephemeral ] });
    await interaction.deferReply();
    const query = interaction.options.getString("query");
    const results = await player.search(query, {
        requestedBy: interaction.user,
        fallbackSearchEngine: "youtubeSearch"
    });
    if (!results.hasTracks()) return interaction.editReply({ content: "見つかりませんでした" });

    const { track } = await player.play(interaction.member.voice.channel.id, results, {
        nodeOptions: {
            metadata: {
                channel: interaction.channel,
                requestedBy: interaction.user
            }
        }
    });
    const embed = new EmbedBuilder()
    .setAuthor({ name: (track.playlist ? `${track.playlist.tracks.length}個` : "1個") + "のトラックを追加" })
    .setTitle(track.playlist?.title || track.title)
    .setURL(track.playlist?.url || track.url)
    .setThumbnail(track.playlist?.thumbnail || track.thumbnail)
    .setDescription(`${track.playlist?.durationFormatted || track.duration}`)
    .setColor("ff0000");
    await interaction.editReply({ embeds: [ embed ] });
};
