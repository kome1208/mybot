import { ActionRowBuilder, EmbedBuilder, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";
import { ClientType, Innertube } from "youtubei.js";

export const data = new SlashCommandBuilder()
.setName("youtube")
.setDescription("youtube検索")
.addStringOption(option =>
    option.setName("query")
    .setDescription("検索クエリ")
    .setRequired(true)
);

/**
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 */
export const run = async (interaction) => {
    const query = interaction.options.getString("query");

    await interaction.deferReply();

    try {

        const innertube = await Innertube.create({
            lang: "ja",
            client_type: ClientType.WEB
        });

        const result = await innertube.search(query, { type: "video" });

        const embeds = result.videos
        .filter((video) => video.type === "Video")
        .slice(0, 25)
        .map((video) =>
            new EmbedBuilder()
            .setAuthor({ iconURL: video.author.thumbnails[0].url, name: video.author.name, url: video.author.url })
            .setTitle(video.title.text)
            .setURL(`https://www.youtube.com/watch?v=${video.video_id}`)
            .setDescription(video.description || null)
            .setImage(video.best_thumbnail.url)
            .setColor("#ff0000")
        );

        const selectMenu = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
            .setCustomId("select_video")
            .setPlaceholder("動画を選択")
            .addOptions(
                result.videos
                .filter((video) => video.type === "Video")
                .slice(0, 25)
                .map((video, i) =>
                    new StringSelectMenuOptionBuilder()
                    .setLabel(video.title.text)
                    .setDescription(video.author.name)
                    .setValue(`${i}`)
                )
            )
        );

        const reply = await interaction.editReply({
            embeds: [ embeds[0] ],
            components: [ selectMenu ]
        });

        const controller = reply.createMessageComponentCollector({
            filter: (i) => i.user.id === interaction.user.id,
            time: 900_000
        });

        controller.on("collect", async (interaction) => {
            if (interaction.customId === "select_video") {
                interaction.update({
                    embeds: [ embeds[interaction.values[0]] ]
                });
            }
        }).on("end", async () => {
            interaction.editReply({
                components: []
            });
        });
    } catch (err) {
        interaction.editReply({
            content: "取得中にエラーが発生しました。"
        });
        console.error(err);
    }
};