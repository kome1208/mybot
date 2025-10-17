import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ApplicationIntegrationType } from "discord.js";
import { createCanvas, loadImage } from "canvas";

export const data = new SlashCommandBuilder()
.setName("iei")
.setDescription("遺影を作成します")
.addUserOption(option => 
    option.setName("user")
    .setDescription("ユーザーを指定"))
.addBooleanOption(option => 
    option.setName("mono")
    .setDescription("画像をモノクロにするか")
)
.setIntegrationTypes(
    ApplicationIntegrationType.GuildInstall
);

/**
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 */
export const run = async (interaction) => {
    await interaction.deferReply();
    const selectedUser = interaction.options.getUser("user") || interaction.user;
    const canvas = createCanvas(709, 800);
    const ctx = canvas.getContext("2d");
    const avatar = await loadImage((await (interaction.guild.members.fetch(selectedUser.id))).displayAvatarURL({ extension: "png", size: 4096 }));
    const iei = await loadImage("./assets/ieibase.png");
    ctx.drawImage(avatar, 82.5, 146, 544, 544);
    if (interaction.options.getBoolean("mono")) {
        const imgData = ctx.getImageData(0, 0, 709, 800);
        const pixels = imgData.data;
        for (let i = 0; i < pixels.length; i += 4) {
        
            let lightness = parseInt((pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3);
        
            pixels[i] = lightness;
            pixels[i + 1] = lightness;
            pixels[i + 2] = lightness;
        }
        ctx.putImageData(imgData, 0, 0);
    }
    ctx.drawImage(iei, 0, 0);
    const data = canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, "");
    const row = new ActionRowBuilder()
    .addComponents(
        new ButtonBuilder()
        .setLabel("削除")
        .setStyle(ButtonStyle.Danger)
        .setCustomId("DELETE_IEI")
    );
    const reply = await interaction.editReply({ files: [ { attachment: Buffer.from(data, "base64"), name: "iei.png" } ], components: [ row ] });
    reply.awaitMessageComponent({ filter: ({ user }) => (user.id === selectedUser.id || user.id === interaction.user.id), time: 90000 })
    .then((interaction) => {
        interaction.message.edit({ content: `${interaction.member.displayName}によって削除済み`, files: [], components: [] });
    })
    .catch(() => {});
};