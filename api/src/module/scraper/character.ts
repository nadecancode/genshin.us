import { WIKI_BASE_URL } from './constant.ts';
import * as cheerio from 'cheerio';
import { NodeHtmlMarkdown } from 'node-html-markdown';
import { transformRawUrl } from '../../helper/index.ts';

const markdown = new NodeHtmlMarkdown();

const reserved = [
    "Energy",
    "Crystallize"
];

type Element = "GEO" | "HYDRO" | "ANEMO" | "PYRO" | "DENDRO" | "ELECTRO" | "CRYO" | "UNALIGNED";
type Weapon = "POLEARM" | "BOW" | "SWORD" | "CLAYMORE";

type Character = {
    name: string,
    element: Element,
    weapon: Weapon,
    portrait: string,
    thumbnail: string,
    constellation: string,
    affiliation: string[],
    rarity: number,
    birthday: string,
    description: string,
    constellations: Constellation[],
    talents: Talent[]
}

type Constellation = {
    level: number,
    name: string,
    unlock: string,
    description: string,
    icon: string
}

type Talent = {
    name: string,
    description: string;
    type: "NORMAL_ATTACK" | "ELEMENTAL_SKILL" | "ELEMENTAL_BURST" | "ALTERNATE_SPRINT" | "PASSIVE",
    icon: string
}

type PreloadedCharacter = {
    icon: string,
    link: string,
    name: string,
    traveler: boolean
}

const preload = async (included: string | undefined = undefined): Promise<PreloadedCharacter> => {
    const response = await (await fetch(WIKI_BASE_URL + "/wiki/Characters")).text();
    const $ = cheerio.load(response);

    $.root()
        .find(".mw-collapsible")
        .contents()
        .remove();

    return Array.from($($(".article-table, .sortable")[0]).find("tr")).map(e => $(e).find("td")[0]).filter(e => e !== undefined).map(e => {
        const image = $(e).find("img").first();
        const linkElement = $(e).find("a").first();

        return {
            icon: image.attr('data-src'),
            link: linkElement.attr('href'),
            name: linkElement.attr('title'),
            traveler: linkElement.attr('title') === "Traveler"
        }
    }).filter(e => {
        if (!e || !e.name) return false;
        if (!included) return true;

        return e.name.toLowerCase().replace(/_/g, " ") === included.toLowerCase().replace(/_/g, " ");
    });
}

const loadTraveler = async (character: PreloadedCharacter, specifiedElement = undefined): Promise<Character> => {
    const response = await (await fetch(WIKI_BASE_URL + character.link)).text();

    const $ = cheerio.load(response);
    $.root()
        .find(".mw-collapsible")
        .contents()
        .remove();

    const name = $("#mw-content-text > div.mw-parser-output > aside > h2.pi-item.pi-item-spacing.pi-title.pi-secondary-background").text();
    const rarity = Number.parseInt($("#mw-content-text > div.mw-parser-output > aside > section.pi-item.pi-group.pi-border-color > table > tbody > tr > td:nth-child(1) > img").attr("title").replace(" Stars", ""));
    const weapon = $("#mw-content-text > div.mw-parser-output > aside > section.pi-item.pi-group.pi-border-color > table > tbody > tr > td:nth-child(2) > span > a:nth-child(2)").text().toUpperCase().replaceAll(" ", "_");
    const portrait = transformRawUrl($("#mw-content-text > div.mw-parser-output > aside > div > div.wds-tab__content.wds-is-current > figure > a > img").attr("src"));
    const constellation = $("#mw-content-text > div.mw-parser-output > aside > section:nth-child(5) > div.wds-tab__content.wds-is-current > div:nth-child(3) > div > a:nth-child(1)").text();
    const birthday = $("#mw-content-text > div.mw-parser-output > aside > section:nth-child(5) > div.wds-tab__content.wds-is-current > div:nth-child(2) > div > a").text();
    const affiliation = [...$("#mw-content-text > div.mw-parser-output > aside > section:nth-child(5) > div.wds-tab__content.wds-is-current > div:nth-child(5) > div a")].map(e => $(e).attr("title"));

    const elementResponse = await (await fetch(WIKI_BASE_URL + character.link + "_(" + specifiedElement + ")")).text();
    const $$ = cheerio.load(elementResponse);

    $$.root()
        .find(".mw-collapsible")
        .contents()
        .remove();

    const constellationElement = $$("#mw-content-text > div.mw-parser-output > table.wikitable.talent_table > tbody > tr");
    const constellations = parseConstellations($$, constellationElement);

    const talentElement = $$("#mw-content-text > div.mw-parser-output > div.talent-table-container > table > tbody > tr");
    const talents = parseTalents($$, talentElement);

    return {
        name,
        rarity,
        element: specifiedElement.toUpperCase(),
        weapon,
        portrait,
        thumbnail: transformRawUrl(character.icon),
        constellation,
        birthday,
        affiliation,
        constellations,
        talents
    }
}

const load = async (character: PreloadedCharacter, specifiedElement = undefined): Promise<Character> => {
    if (!character) return;

    if (character.traveler) return await loadTraveler(character, specifiedElement);

    const response = await (await fetch(WIKI_BASE_URL + character.link)).text();

    const $ = cheerio.load(response);
    $.root()
        .find(".mw-collapsible")
        .contents()
        .remove();

    const name = $("#mw-content-text > div.mw-parser-output > aside > h2.pi-item.pi-item-spacing.pi-title.pi-secondary-background").text();
    const rarity = Number.parseInt($("#mw-content-text > div.mw-parser-output > aside > section.pi-item.pi-group.pi-border-color > table > tbody > tr > td:nth-child(1) > img").attr("title").replace(" Stars", ""));
    const element = $("#mw-content-text > div.mw-parser-output > aside > section.pi-item.pi-group.pi-border-color > table > tbody > tr > td:nth-child(3) > span > a:nth-child(2)").text().toUpperCase().replaceAll(" ", "_");
    const weapon = $("#mw-content-text > div.mw-parser-output > aside > section.pi-item.pi-group.pi-border-color > table > tbody > tr > td:nth-child(2) > span > a:nth-child(2)").text().toUpperCase().replaceAll(" ", "_");
    const portrait = transformRawUrl($("#mw-content-text > div.mw-parser-output > aside > div > div.wds-tab__content.wds-is-current > figure > a > img").attr("src"));
    const constellation = $("#mw-content-text > div.mw-parser-output > aside > section:nth-child(5) > div.wds-tab__content.wds-is-current > div:nth-child(3) > div > a:nth-child(1)").text();
    const birthday = $("#mw-content-text > div.mw-parser-output > aside > section:nth-child(5) > div.wds-tab__content.wds-is-current > div:nth-child(2) > div > a").text();
    const affiliation = [...$("#mw-content-text > div.mw-parser-output > aside > section:nth-child(5) > div.wds-tab__content.wds-is-current > div:nth-child(5) > div a")].map(e => $(e).attr("title"));

    const constellationElement = $("#mw-content-text > div.mw-parser-output > table.wikitable.talent_table > tbody > tr");
    const constellations = parseConstellations($, constellationElement);

    const talentElement = $("#mw-content-text > div.mw-parser-output > div.talent-table-container > table > tbody > tr");
    const talents = parseTalents($, talentElement);

    return {
        name,
        rarity,
        element,
        weapon,
        portrait,
        thumbnail: transformRawUrl(character.icon),
        constellation,
        birthday,
        affiliation,
        constellations,
        talents
    }
}

const parseTalentMaterials = ($: any, materialElement: any) => {
    // let totalCost = $("b:contains(Total Cost)").last().parent();

    let dummy = materialElement.next();

    const talent_materials = [];

    while (dummy && dummy.prop('tagName').toUpperCase() !== 'H3') {
        let linkElement = $(dummy).children('.card_image').first().children('a');
        let materialTitle = linkElement.attr('title');
        let materialImage = $(linkElement).children('img');
        let materialImageSrc = materialImage.attr('data-src');
        if (!materialImageSrc || materialImageSrc.length <= 0) materialImageSrc = materialImage.attr('src');

        talent_materials.push({
            title: materialTitle,
            image: transformRawUrl(materialImageSrc)
        });

        dummy = dummy.next();
        if (dummy.attr('class') === 'mobileHide') dummy = dummy.next();

        // console.log(dummy.html())
    }

    return talent_materials;
}

const parseConstellations = ($: any, constellationsElement: any): Constellation[] => {
    const constellations: Constellation[] = [];

    let index = 1;

    for (let i = 1; i < constellationsElement.length; i += 2) {
        const main = $(constellationsElement[i]);
        const name = $(main.find("td")[1]).text().replace(/[\n\r]/g, "").replace(/\(.*\)/g, "").trimEnd();

        let iconElement = $(main.find("td")[0]).find("img").first();
        let icon = iconElement.attr("data-src");
        if (!icon || icon.length <= 0) icon = iconElement.attr("src");

        const level = Number.parseInt($(main.find("td")[2]).text());
        // icon = icon.dataset ? icon.dataset.src : icon.src;

        let effect = markdown.translate($(constellationsElement[i + 1]).html().replace(/<a[^>]*>/g,"<b>").replace(/<\/a>/g,"</b>").replace(/<\/?(?!b)(?!li)(?!ul)\w*\b[^>]*>/ig, "")).replace(/\n\n\n/g, "\n");

        for (const reservedWord of reserved) {
            effect = effect.replace(new RegExp(`[*][*]${reservedWord}[*][*]`, "ig"), reservedWord);
        }

        constellations.push({
            icon: transformRawUrl(icon),
            description: effect,
            name: name,
            level: level
        });

        index++;
    }

    return constellations;
}

const parseTalents = ($: any, talentsElement: any) => {
    const talents = [];

    for (let i = 1; i < talentsElement.length - 1; i += 2) {
        const main = $(talentsElement[i]), sub = $(talentsElement[i + 1]);
        const name = $(main.find("td")[1]).text().replace(/[\n\r]/g, "").replace(/\(.*\)/g, "").trimEnd();

        if (name.trimEnd() === "Default Sprint") continue;

        let iconElement = $(main.find("td")[0]).find("img").first();
        let icon = iconElement.attr("data-src");
        if (!icon || icon.length <= 0) icon = iconElement.attr("src");

        // icon = icon.dataset ? icon.dataset.src : icon.src;

        let type = $(main.find("td")[2]).text().replace(/[\n\r]/g, "");
        if (type.includes("Passive")) type = "PASSIVE";
        else type = type.replace(/ /g, "_").toUpperCase();

        let description = markdown.translate(sub.html().replace(/<\/?(?!b)(?!li)(?!ul)\w*\b[^>]*>/ig, "")).replace(/\n[*][*]/g, "\n**").replace(/:[*][*]/g, "**\n").replace(/\n\n\n/g, "\n");

        for (const reservedWord of reserved) {
            description = description.replace(new RegExp(`[*][*]${reservedWord}[*][*]`, "ig"), reservedWord);
        }

        talents.push({
            icon: transformRawUrl(icon),
            description: description,
            name: (type === "NORMAL_ATTACK" ? "Normal Attack: " : "") + name,
            type: type
        })
    }

    return talents;
}

export const characters = preload;

export const character = async (name, element) => {
    const preloaded = await preload(name);
    const character = await load(preloaded[0], element);

    return character;
}