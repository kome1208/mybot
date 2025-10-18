import { data as command } from "../../guild.mjs";
import { EmbedBuilder } from "discord.js";

command.addSubcommand(subcmd =>
    subcmd.setName("splash")
    .setDescription("サーバーのスプラッシュ画像")
);

/**
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 */
export const run = async (interaction) => {
    await interaction.deferReply();
    try {
        const guild = await interaction.guild.fetch();

        if (!guild.splash) return interaction.editReply({ content: "このサーバーにはスプラッシュが設定されていません。" });
        
        const embed = new EmbedBuilder()
        .setTitle(`${guild.name}のスプラッシュ画像`)
        .setImage(guild.splashURL({ extension: "png", size: 4096 }));

        await interaction.editReply({ embeds: [ embed ] });
    } catch (err) {
        await interaction.editReply({ content: "サーバー情報の取得に失敗しました。" });
        console.error(err);
    }
};