import { ActionRowBuilder, ApplicationIntegrationType, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags, SlashCommandBuilder, StringSelectMenuBuilder } from "discord.js";
import got from "got";

export const data = new SlashCommandBuilder()
.setName("joysound")
.setDescription("joysoundにある曲を検索")
.addStringOption(option =>
    option.setName("query")
    .setDescription("検索クエリ")
    .setRequired(true)
)
.setIntegrationTypes(
    ApplicationIntegrationType.GuildInstall,
    ApplicationIntegrationType.UserInstall
);;

/**
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 */
export const run = async (interaction) => {
    await interaction.deferReply();
    const query = interaction.options.getString("query");
    try {
        const { contentsList } = await got.post("https://mspxy.joysound.com/Common/ContentsList",
        {
            "headers": {
                "X-JSP-APP-NAME": "0000800",
                "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
            },
            "body": `kind1=compound&word1=${query}&match1=front&kindCnt=1&format=group&start=1&count=5&sort=popular&order=desc&apiVer=1.0`
        }).json();
        if (!contentsList.length) return interaction.editReply({ content: "見つかりませんでした。" });

        const embeds = contentsList.map((track) => 
            new EmbedBuilder()
            .setTitle(track.songName)
            .setURL(`https://www.joysound.com/web/search/song/${track.naviGroupId}`)
            .setThumbnail(track.outsideUrlInfo.itunesInfo.songImageUrl?.replace("100x100bb", "256x256bb") || null)
            .addFields(
                { name: "アーティスト", value: `[${track.artistName}](https://www.joysound.com/web/search/artist/${track.artistId})`, inline: true },
                { name: "作詞", value: track.lyricist, inline: true },
                { name: "作曲", value: track.composer, inline: true }
            )
            .setColor("Red")
        );
        const options = embeds.map((embed, i) => ({ label: (`${embed.data.title?.length > 100 ? `${embed.data.title.slice(0, 99)}…` : embed.data.title ?? `${i+1}ページ`}`), value: `${i}` }));
        const menu = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
            .setCustomId("select")
            .setPlaceholder("他の楽曲")
            .addOptions(options)
        );
        const buttons = contentsList.map((track) =>
            new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                .setCustomId(`view_lyrics_${track.naviGroupId}`)
                .setLabel("歌詞を見る")
                .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                .setLabel("iTunesで聴く")
                .setStyle(ButtonStyle.Link)
                .setDisabled(!track.outsideUrlInfo.itunesInfo?.itemUrl)
                .setURL(track.outsideUrlInfo.itunesInfo?.itemUrl || "https://music.apple.com/jp/album/never-gonna-give-you-up/1559523357?i=1559523359"),
                new ButtonBuilder()
                .setLabel("YouTubeで観る")
                .setStyle(ButtonStyle.Link)
                .setDisabled(!track.outsideUrlInfo.youtubeInfo?.movieId)
                .setURL(`https://youtu.be/${track.outsideUrlInfo.youtubeInfo?.movieId || "dQw4w9WgXcQ"}`)
            )
        );

        const reply = await interaction.editReply({
            embeds: [ embeds[0] ],
            components: [
                menu,
                buttons[0]
            ]
        });

        const filter = ({ user }) => {
            return user.id === interaction.user.id;
        };

        const collector = reply.createMessageComponentCollector({ filter, time: 900000 });

        collector.on("collect", async (interaction) => {
            if (interaction.customId === "select") {
                await interaction.update({
                    embeds: [ embeds[interaction.values[0]] ],
                    components: [
                        menu,
                        buttons[interaction.values[0]]
                    ]
                });
            } else if (interaction.customId.startsWith("view_lyrics")) {
                const selSongNo = interaction.customId.split("_").pop();
                const track = await got.post("https://mspxy.joysound.com/Common/Lyric",
                {
                    "headers": {
                        "X-JSP-APP-NAME": "0000800",
                        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
                    },
                    "body": `kind=naviGroupId&selSongNo=${selSongNo}&interactionFlg=0&apiVer=1.0`
                }).json();
                await interaction.deferReply({
                    flags: [ MessageFlags.Ephemeral ]
                });
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                        .setTitle(track.songName)
                        .setDescription(track.lyricList[0].lyric)
                        .setColor("Random")
                    ]
                });
            }
        })
        .on("end", async () => {});
    } catch (err) {
        console.error(err);
        await interaction.editReply({ content: "取得出来ませんでした。" });
    }
};