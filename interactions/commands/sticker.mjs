import { ApplicationIntegrationType, EmbedBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import got from "got";

export const data = new SlashCommandBuilder()
.setName("sticker")
.setDescription("stckr")
.addSubcommand(command =>
    command.setName("line")
    .setDescription("lineスタンプを取得")
    .addStringOption(option =>
        option.setName("url")
        .setDescription("スタンプのURL")
        .setRequired(true)
    )
)
.addSubcommand(command =>
    command.setName("guild")
    .setDescription("サーバーのスタンプを取得")
    .addStringOption(option =>
        option.setName("sticker")
        .setDescription("スタンプを選択")
        .setAutocomplete(true)
        .setRequired(true)
    )
)
.setIntegrationTypes(
    ApplicationIntegrationType.GuildInstall
);

/**
 * 
 * @param {import("discord.js").ChatInputCommandInteraction} interaction 
 */
export const run = async (interaction) => {
    if (interaction.options.getSubcommand() === "line") {
        await interaction.deferReply();
        const url = interaction.options.getString("url");
        const matches = url.match(/http(?:s)?:\/\/(?:store.)?line.me\/(?:S\/sticker|stickershop\/product)\/(?<packageId>\d+)/);
        const packageId = matches.groups.packageId;
        const stickerInfo = await got.get(`https://stickershop.line-scdn.net/stickershop/v1/product/${packageId}/IOS/productInfo.meta`).json();
        const baseUri = `https://stickershop.line-scdn.net/stickershop/v1/product/${stickerInfo.packageId}/IOS`;
        let uri;
        if (!stickerInfo.stickerResourceType ||
            stickerInfo.stickerResourceType === "STATIC" ||
            stickerInfo.stickerResourceType === "NAME_TEXT" ||
            stickerInfo.stickerResourceType === "POPUP"
        )
        uri = `${baseUri}/stickers@2x.zip`;
        else 
        uri = `${baseUri}/stickerpack@2x.zip`;
        const embed = new EmbedBuilder()
        .setTitle(stickerInfo.title.ja || stickerInfo.title.en)
        .addFields(
            { name: "Author", value: stickerInfo.author.ja || stickerInfo.author.en, inline: true },
            { name: "File", value: uri, inline: true }
        );
        await interaction.editReply({ embeds: [ embed ] });
    } else if (interaction.options.getSubcommand() === "guild") {
        if (!interaction.guild) {
            return interaction.reply({
                content: "サーバーで実行してください。",
                flags: [ MessageFlags.Ephemeral ]
            });
        }
        await interaction.deferReply();
        try {
            const sticker = await interaction.guild.stickers.fetch(interaction.options.getString("sticker"));
            const embed = new EmbedBuilder()
            .setTitle(sticker.name)
            .setDescription(sticker.description || null)
            .addFields(
                { name: "タグ", value: sticker.tags, inline: true },
                { name: "ユーザー", value: sticker.user.username, inline: true }
            )
            .setImage(`https://media.discordapp.net/stickers/${sticker.id}.png?size=4096`)
            .setColor("Random");
            await interaction.editReply({ embeds: [ embed ] });
        } catch (e) {
            console.error(e);
        }
    }
};

export const runAutocomplete = async (interaction) => {
    const focused = interaction.options.getFocused(true);
    if (focused.name === "sticker") {
        const stickers = await interaction.guild.stickers.fetch();
        const filtered = stickers
        .map((sticker) => ({ name: `${sticker.tags}: ${sticker.name}`, value: sticker.id }))
        .filter((sticker) => (sticker.name.toLowerCase().includes(focused.value.toLowerCase())));
        await interaction.respond(filtered.slice(0, 25));
    }
};