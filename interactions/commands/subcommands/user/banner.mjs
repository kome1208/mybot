import { data as command } from "../../user.mjs";
import { EmbedBuilder } from "discord.js";

command.addSubcommand(subcmd =>
    subcmd.setName("banner")
    .setDescription("user banner")
    .addUserOption(option =>
        option.setName("user")
        .setDescription("ユーザーを選択")
    )
);

/**
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 */
export const run = async (interaction) => {
    await interaction.deferReply();
    try {
        const id = interaction.options.getUser("user")?.id ?? interaction.user.id;
        const user = await interaction.client.users.fetch(id, { force: true });

        if (!user.banner) return interaction.editReply({ content: "このユーザーにはバナーが設定されていません。" });
        
        const embed = new EmbedBuilder()
        .setTitle(`${user.username}のバナー`)
        .setImage(user.bannerURL({ extension: "png", size: 4096 }))
        .setColor("Random");
        await interaction.editReply({ embeds: [ embed ] });
    } catch (err) {
        await interaction.editReply({ content: "バナーの取得に失敗しました。" });
        console.error(err);
    }
};