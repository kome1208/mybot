import { data as command } from "../../canister.mjs";
import { ActionRowBuilder, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";
import got from "got";

command.addSubcommand(subcmd =>
    subcmd.setName("package")
    .setDescription("パッケージを検索")
    .addStringOption(option =>
        option.setName("query")
        .setDescription("検索クエリを入力")
        .setRequired(true)
    )
    .addStringOption(option =>
        option.setName("architecture")
        .setDescription("アーキテクチャを選択(デフォルト:iphoneos-arm)")
        .addChoices(
            { name: "iphoneos-arm", value: "iphoneos-arm" },
            { name: "iphoneos-arm64", value: "iphoneos-arm64" }
        )
    )
);

/**
 * @param {import("discord.js").ChatInputCommandInteraction} interaction
 */
export const run = async (interaction) => {
    await interaction.deferReply();
    const query = interaction.options.getString("query", true);
    const arch = interaction.options.getString("architecture") ?? "iphoneos-arm";

    try {
        const response = await got.get(`https://api.tale.me/v4/canister-services/jailbreak/package/search?q=${query}`).json();

        const packages = response.data.filter((pkg) => pkg.architecture === arch || pkg.architecture === "all").slice(0, 25);

        if (!packages.length) return interaction.editReply({ content: "パッケージが見つかりませんでした。" });

        const embeds = packages.map((pkg) =>
            new EmbedBuilder()
            .setAuthor({ name: pkg.repository.name, url: pkg.repository.uri, iconURL: `${pkg.repository.suite !== "./" ? pkg.repository.uri + "/dists/" + pkg.repository.suite : pkg.repository.uri}/CydiaIcon.png` })
            .setTitle(pkg.name ?? pkg.package)
            .setDescription(pkg.description)
            .setImage(pkg.header_url)
            .setThumbnail(pkg.icon_url?.startsWith("http") ? pkg.icon_url : null)
            .setFields(
                { name: "package", value: pkg.package, inline: true },
                { name: "version", value: pkg.version, inline: true },
                { name: "author", value: `${pkg.author}`, inline: true },
                { name: "maintainer", value: `${pkg.maintainer}`, inline: true },
                { name: "price", value: `${pkg.price}`, inline: true },
                { name: "section", value: `${pkg.section}`, inline: true }
            )
        );

        const selectMenu = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
            .setCustomId("select_package")
            .setPlaceholder("パッケージを選択")
            .addOptions(
                packages.map((pkg, i) =>
                    new StringSelectMenuOptionBuilder()
                    .setLabel(pkg.name ?? pkg.package)
                    .setDescription(pkg.description.length >= 100 ? pkg.description.slice(0, 97) + "..." : pkg.description)
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
            if (interaction.customId === "select_package") {
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