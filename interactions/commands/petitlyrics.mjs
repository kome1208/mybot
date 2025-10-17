import { useQueue } from "discord-player";
import { ActionRowBuilder, EmbedBuilder, MessageFlags, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";
import { XMLParser } from "fast-xml-parser";
import got from "got";
import iconv from "iconv-lite";
import { decodeXML } from "entities";

export const data = new SlashCommandBuilder()
.setName("petitlyrics")
.setDescription("プチリリから歌詞を取得")
.addSubcommand((command) =>
    command.setName("search")
    .setDescription("歌詞を検索")
    .addStringOption((option) =>
        option.setName("query")
        .setDescription("曲名を入力")
        .setRequired(true)
    )
    .addStringOption((option) =>
        option.setName("artist")
        .setDescription("アーティスト名を入力")
    )
)
.addSubcommand((command) =>
    command.setName("sync-player")
    .setDescription("同期歌詞を開始")
    .addStringOption((option) =>
        option.setName("query")
        .setDescription("曲名を入力")
        .setRequired(true)
    )
    .addStringOption((option) =>
        option.setName("artist")
        .setDescription("アーティスト名を入力")
    )
);

/**
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 */
export const run = async (interaction) => {
    const isSync = interaction.options.getSubcommand() === "sync-player";
    
    if (isSync && !interaction.guild) {
        return interaction.reply({
            content: "同期歌詞はここでは利用できません。",
            flags: [ MessageFlags.Ephemeral ]
        });
    }
    
    const queue = useQueue(interaction.guildId);
    const query = interaction.options.getString("query");
    const artistQuery = interaction.options.getString("artist") ?? "<unknown>";

    try {
        if (isSync && !interaction?.member?.voice?.channel) {
            return interaction.reply({
                content: "同期歌詞を開始するには最初にボイスチャンネルに参加してください。",
                flags: [ MessageFlags.Ephemeral ]
            });
        }
        if (isSync && (!queue || !queue.node.isPlaying())) {
            return interaction.reply({
                content: "同期歌詞を開始するには音楽の再生を開始してください。",
                flags: [ MessageFlags.Ephemeral ]
            });
        }
        
        await interaction.deferReply();

        const xmlParser = new XMLParser();

        const searchResponse = await got.post(
            "https://p1.petitlyrics.com/api/GetPetitLyricsData.php",
            {
                form: {
                    "key_artist": `${artistQuery}`,
                    "key_album": "0",
                    "index": "0",
                    "key_title": `${query}`,
                    "clientAppId": "p1110417",
                    "maxCount": "10",
                    "userId": "2faf895e-20ab-4a8b-b27e-5df5a426e488",
                    "terminalType": "10"
                }
            }
        ).text();

        const searchData = xmlParser.parse(searchResponse);
        
        const results = (Array.isArray(searchData.response.songs.song) ? searchData.response.songs.song : [ searchData.response.songs.song ]);
        const syncLyricsResults = results.filter((x) => isSync ? x.availableLyricsType === 3 : true);

        if (!results.length || (isSync && !syncLyricsResults.length)) return interaction.followUp({ content: "歌詞が見つかりませんでした" });

        const selectMenu = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
            .setCustomId("select_song")
            .setPlaceholder("楽曲を選択")
            .addOptions(
                results.map((item, i) => 
                    new StringSelectMenuOptionBuilder()
                    .setLabel(item.title.length >= 100 ? item.title.slice(0, 97) + "..." : item.title)
                    .setDescription(`by ${item.artist.length >= 50 ? item.artist.slice(0, 50) + "..." : item.artist} | Lyrics provided by ${item.postUserName}`)
                    .setValue(`${i}`)
                )
            )
        );

        const reply = await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                .setDescription(`${isSync ? "同期歌詞を開始する" : ""}楽曲を選択してください`)
                .setColor("Grey")
            ],
            components: [ selectMenu ]
        });

        const collector = reply.createMessageComponentCollector({
            filter: ({ user }) => user.id === interaction.user.id,
            time: 900_000
        });

        collector.on("collect", async (interaction) => {
            if (isSync) await interaction.deferReply();

            const selectedLyric = results[interaction.values[0]];

            const lyricDataResponse = await got.post(
                "https://p1.petitlyrics.com/api/GetPetitLyricsData.php",
                {
                    form: {
                        "key_lyricsId": `${selectedLyric.lyricsId}`,
                        "lyricsType": `${isSync ? 3 : 1}`,
                        "clientAppId": "p1110417",
                        "userId": "2faf895e-20ab-4a8b-b27e-5df5a426e488",
                        "key_duration": `${selectedLyric.duration}`,
                        "terminalType": "10"
                    }
                }
            ).text();

            const lyricData = xmlParser.parse(lyricDataResponse);

            const lyric = iconv.decode(Buffer.from(lyricData.response.songs.song.lyricsData, "base64"), "utf8");

            if (isSync) {
                if (queue.metadata.intervalId) clearInterval(queue.metadata.intervalId);

                const lineLyrics = xmlParser.parse(lyric).wsy.line.map((x) => {
                    return {
                        text: decodeXML(x.linestring),
                        startTime: Array.isArray(x.word) ? x.word[0].starttime : x.word.starttime
                    };
                }).filter((x) => !!x.text);

                let currentIndex = lineLyrics.findIndex((x) => x.startTime >= queue.node.getTimestamp().current.value);

                const embed = new EmbedBuilder()
                .setAuthor({ name: selectedLyric.artist, url: `https://petitlyrics.com/lyrics/artist/${selectedLyric.artistId}` })
                .setTitle(selectedLyric.title)
                .setURL(`https://petitlyrics.com/lyrics/${selectedLyric.lyricsId}`)
                .setDescription(`${lineLyrics[currentIndex - 1]?.text ?? ""}\n# ${lineLyrics[currentIndex]?.text ?? ""}\n${lineLyrics[currentIndex + 1]?.text ?? ""}`)
                .setColor("#ff0000");

                const syncLyricReply = await interaction.followUp({
                    embeds: [ embed ],
                    components: []
                });

                queue.setMetadata({
                    ...queue.metadata,
                    intervalId: setInterval(() => {
                        const currentTime = queue.node.getTimestamp()?.current?.value;
                    
                        if (currentTime >= lineLyrics[currentIndex].startTime) {
                            syncLyricReply.edit({
                                embeds: [
                                    new EmbedBuilder()
                                    .setAuthor({ name: selectedLyric.artist, url: `https://petitlyrics.com/lyrics/artist/${selectedLyric.artistId}` })
                                    .setTitle(selectedLyric.title)
                                    .setURL(`https://petitlyrics.com/lyrics/${selectedLyric.lyricsId}`)
                                    .setDescription(`${lineLyrics[currentIndex - 1]?.text ?? ""}\n# ${lineLyrics[currentIndex]?.text ?? ""}\n${lineLyrics[currentIndex + 1]?.text ?? ""}`)
                                    .setFooter({ text: `${queue.node.getTimestamp().current.label} | 歌詞提供:プチリリ(by ${lyricData.response.songs.song.postUserName})` })
                                    .setColor("#ff0000")
                                ]
                            });
                            currentIndex++;
                        }
                        
                        if (lineLyrics.length === currentIndex) clearInterval(queue.metadata.intervalId);
                    }, 100)
                });
            } else {
                const embed = new EmbedBuilder()
                .setAuthor({ name: selectedLyric.artist, url: `https://petitlyrics.com/lyrics/artist/${selectedLyric.artistId}` })
                .setTitle(selectedLyric.title)
                .setURL(`https://petitlyrics.com/lyrics/${selectedLyric.lyricsId}`)
                .setDescription(`${lyric ?? ""}`)
                .setColor("#ff0000");

                await interaction.update({
                    embeds: [ embed ]
                });
            }
        });
    } catch (err) {
        console.log(err);
        interaction.followUp({ content: "取得中にエラーが発生しました" });
    }
};