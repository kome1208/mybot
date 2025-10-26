import { data as command } from "../../canister.mjs";
import { ActionRowBuilder, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";
import got from "got";

command.addSubcommand(subcmd =>
    subcmd.setName("repository")
    .setDescription("リポジトリを検索")
    .addStringOption(option =>
        option.setName("query")
        .setDescription("検索クエリを入力")
        .setRequired(true)
    )
);

/**
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 */
export const run = async (interaction) => {
    await interaction.deferReply();
    const query = interaction.options.getString("query", true);

    try {
        const response = await got.get(`https://api.tale.me/v4/canister-services/jailbreak/repository/search?q=${query}`).json();

        const repos = response.data.slice(0, 25);

        if (!repos.length) return interaction.editReply({ content: "リポジトリが見つかりませんでした。" });

        const embeds = repos.map((repo) =>
            new EmbedBuilder()
            .setTitle(repo.name)
            .setURL(repo.uri)
            .setDescription(repo.description)
            .setThumbnail(`${repo.suite !== "./" ? repo.uri + "/dists/" + repo.suite : repo.uri}/CydiaIcon.png`)
            .setFields(
                { name: "id", value: repo.id, inline: true },
                { name: "version", value: repo.version, inline: true },
                { name: "suite", value: repo.suite, inline: true },
                { name: "component", value: `${repo.component}`, inline: true }
            )
        );

        const selectMenu = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
            .setCustomId("select_repository")
            .setPlaceholder("リポジトリを選択")
            .addOptions(
                repos.map((repo, i) =>
                    new StringSelectMenuOptionBuilder()
                    .setLabel(repo.name)
                    .setDescription(repo.description.length >= 100 ? repo.description.slice(0, 97) + "..." : repo.description)
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
            if (interaction.customId === "select_repository") {
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
        console.error(err);
        interaction.followUp({ content: "パッケージ取得中にエラーが発生しました" });
    }
};