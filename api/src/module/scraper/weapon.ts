import * as cheerio from 'cheerio';
import { WIKI_BASE_URL } from './constant.ts';
import { transformRawUrl } from '../../helper/index.ts';

const WEAPON_TYPES = [
    "Swords",
    "Polearms",
    "Catalysts",
    "Claymores",
    "Bows"
];

const RESERVED = [
    ...WEAPON_TYPES
];

const preload = async () => {
    const items = [];

    for (let weaponType of WEAPON_TYPES) {
        const response = await (await fetch(`https://genshin-impact.fandom.com/wiki/Category:${weaponType}`)).text();
        const $ = cheerio.load(response);
        Array.from($(".category-page__member-link")).forEach(element => {
            items.push($(element).attr("href"));
        });
    }

    return items;
}

const weapon = async (href) => {
    const response = await (await fetch(`${WIKI_BASE_URL}${href}`)).text();
    const $ = cheerio.load(response);

    const name = $($(".page-header__title")[0]).text().trim();
    const informationTable = $(".pi-data-value, .pi-font");

    const rarity = Number.parseInt($($(informationTable[1]).find("img")[0]).attr("alt").replace(/ Stars/g, ""));
    const type = $($(informationTable[0]).find("a")[0]).attr("title").toUpperCase();

    let lore = $("#Lore").parent();
    let dummy = lore.next();

    let loreText = [];

    if (lore.length > 0 && dummy.length > 0) {
        try {
            while (dummy && dummy.prop("tagName").toUpperCase() !== "H2") {
                loreText.push(dummy.text());
                dummy = dummy.next();
            }

        } catch (e) {
            console.log(e);
        }
    }

    const attributeElement = $($($(".portable-infobox").children()[3]).children()[1]).find(".pi-data-value");

    let baseAtkTypeString = attributeElement.length === 3 ? $(attributeElement[0]).text().split(" - ") : "";
    let attributeTypeString = attributeElement[1];
    let attributeValueString = attributeElement.length === 3 ? $(attributeElement[2]).text().split(" - ") : "";

    const attribute = {
        atk: {
            from: Number.parseInt(baseAtkTypeString[0]),
            to: Number.parseInt(baseAtkTypeString[1])
        },
        type: attributeElement.length !== 3 ? 'NONE' : $(attributeTypeString).text().replace(/[\d.-]/g, "").replace("\n", "").replace(/ /g, "_").toUpperCase()
    };

    if (attribute.type === 'UNKNOWN') return;

    if (attribute.type !== 'NONE' && attribute.type !== 'UNKNOWN') {
        attribute.value = {
            from: Number.parseFloat(attributeValueString[0].replace(/%/g, "")),
            to: Number.parseFloat(attributeValueString[1].replace(/%/g, "")),
        }
    } else {
        attribute.value = {
            from: NaN,
            to: NaN
        }
    }

    let refineIndex = 1;
    const refine = {};

    Array.from($(".wds-tab__content > .pi-item > .pi-horizontal-group")).forEach(e => {
        let rawRefineElement = $($(e).find(".pi-horizontal-group-item, .pi-data-value, .pi-font, .pi-border-color, .pi-item-spacing").last()).html();

        rawRefineElement = rawRefineElement.replace(/<\/?a(?:(?= )[^>]*)?>/gi, "")

        refine[refineIndex] = turndown.turndown(rawRefineElement);
        refineIndex++;
    });

    let thumbnailSrcElement = $(".pi-image-thumbnail").first();
    let thumbnailSrc = thumbnailSrcElement.attr('src');

    // if (!materialImageSrc || materialImageSrc.length <= 0) materialImageSrc = materialImage.attr('src');


    return {
        name,
        type,
        rarity,
        attribute,
        loreText,
        refine,
        thumbnail: transformRawUrl(thumbnailSrc),
    }
}