import { data as command } from "../../music.mjs";
import { QueueRepeatMode } from "discord-player";
import { useQueue } from "discord-player";
import { MessageFlags } from "discord.js";

command.addSubcommand(subcmd =>
    subcmd.setName("repeat")
    .setDescription("曲をリピート")
    .addStringOption(option => 
        option.setName("mode")
        .setDescription("リピートモードを選択")
        .setRequired(true)
        .addChoices(
            { name: "オフ", value: "OFF" },
            { name: "現在の曲のみ", value: "TRACK" },
            { name: "キュー内の曲", value: "QUEUE" }
        )
    )
);

/**
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 */
export const run = async (interaction) => {
    const queue = useQueue(interaction.guildId);
    if (!interaction.member.voice.channel) return interaction.reply({ content: "ボイスチャンネルに参加してください", flags: [ MessageFlags.Ephemeral ] });
    if (!queue || (!queue.tracks.at(0) && !queue.currentTrack)) return interaction.reply({ content: "音楽が再生されていません。", flags: [ MessageFlags.Ephemeral ] });
    const repeatmode = interaction.options.getString("mode");
    queue.setRepeatMode(QueueRepeatMode[repeatmode]);
    await interaction.reply({ content: `${repeatmode === "TRACK" ? "🔂" : "🔁"}ループモードを${repeatmode}に変更しました。` });
};