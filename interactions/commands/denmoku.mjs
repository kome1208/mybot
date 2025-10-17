import { ActionRowBuilder, EmbedBuilder, SlashCommandBuilder, StringSelectMenuBuilder } from "discord.js";
import moment from "moment";
import { Dam } from "../../utils/dam-api.mjs";

const dam = new Dam({
    deviceName: "Android Pixel 9 Pro",
    osVer: "15",
    deviceId: "d8dcbd2ff1b1993c81d757371b6ac1df4158b5ddd9dd3d090d9d1a288dabaad6",
    appVer: "5.0.0"
});

export const data = new SlashCommandBuilder()
.setName("dam-denmoku")
.setDescription("DAMデンモク")
.addSubcommand(command =>
    command.setName("search")
    .setDescription("楽曲を検索")
    .addStringOption(option =>
        option.setName("query")
        .setDescription("検索クエリを入力")
        .setRequired(true)
        .setAutocomplete(true)
    )
);

/**
 * 
 * @param {import("discord.js").ChatInputCommandInteraction} interaction 
 */
export const run = async (interaction) => {
    const subcommand = interaction.options.getSubcommand(true);
    
    if (subcommand === "search") {
        await interaction.deferReply();
        const query = interaction.options.getString("query");

        const response = await dam.searchVariousByKeyword(query, {
            page: 1
        });

        const { list } = JSON.parse(response);

        const options = list.slice(0, 25).map((track, i) => ({ label: (`${track.title.length > 100 ? `${track.title.slice(0, 99)}…` : track.title}`), value: `${i}` }));
        
        const selectMenu = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
            .setCustomId("select_tracks")
            .setPlaceholder("楽曲を選択")
            .addOptions(options)
        );

        const reply = await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                .setDescription("楽曲を選択してください")
                .setColor("Red")
            ],
            components: [ selectMenu ]
        });

        const filter = ({ user }) => {
            return user.id === interaction.user.id;
        };

        const collector = reply.createMessageComponentCollector({ filter, time: 900000 });
        
        collector
        .on("collect", async (interaction) => {
            if (interaction.customId === "select_tracks") {
                const musicDetailInfoResponse = await dam.getMusicDetailInfo(list[interaction.values[0]].requestNo);

                const musicDetailInfo = JSON.parse(musicDetailInfoResponse);

                console.log(musicDetailInfo.list[0]);

                await interaction.update({
                    embeds: [
                        new EmbedBuilder()
                        .setTitle(musicDetailInfo.data.title)
                        .setURL(`https://www.clubdam.com/karaokesearch/songleaf.html?requestNo=${musicDetailInfo.data.requestNo}`)
                        .addFields(
                            { name: "アーティスト", value: `[${musicDetailInfo.data.artist}](https://www.clubdam.com/karaokesearch/artistleaf.html?artistCode=${musicDetailInfo.data.artistCode})`, inline: true },
                            { name: "再生時間", value: `${moment(musicDetailInfo.list[0].kModelMusicInfoList[0].playbackTime * 1000).format("m:ss")}`, inline: true },
                            { name: "歌いだし", value: `${musicDetailInfo.data.firstLine}`, inline: true }
                        )
                        .setColor("Red")
                    ],
                    components: [ selectMenu ]
                });
            }
        })
        .on("end", async () => {});
    }
};

/**
 * 
 * @param {import("discord.js").AutocompleteInteraction} interaction 
 */
export const runAutocomplete = async (interaction) => {
    if (interaction.options.getSubcommand("search")) {
        const query = interaction.options.getString("query");

        if (query) {
            const response = await dam.autoComplete(query);

            const songs = JSON.parse(response).list.map((song) => ({ name: song.targetWord, value: song.targetWord })).slice(0, 25);

            await interaction.respond(songs);
        }
    }
};