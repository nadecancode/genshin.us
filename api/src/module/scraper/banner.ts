import { WIKI_BASE_URL } from './constant.ts';
import * as cheerio from 'cheerio';
import dayjs from 'dayjs';
import { transformRawUrl } from '../../helper/index.ts';

const preload = async (): Promise<string[][]> => {
    const response = await (await fetch(WIKI_BASE_URL)).text();
    let $ = cheerio.load(response);

    const banners = $($(".events-gallery")[1]).find("tr").last().find(".wikia-gallery-item");

    const characters = [], weapons = [];

    if (banners.length >= 5) {
        characters.push(banners[0]);
        characters.push(banners[1]);
        weapons.push(banners[2]);
    } else {
        characters.push(banners[0]);
        weapons.push(banners[1]);
    }

    const link = (element: any): string => $($(element).find("a")[0]).attr("href") as string;

    return [characters.map(c => link(c)), weapons.map(w => link(w))];
};

const parse = async (links: string[]) => {
    const information = [];

    let index = 0;
    for (let link of links) {
        const response = await ((await fetch(WIKI_BASE_URL + link)).text());
        let $ = cheerio.load(response);

        let name = $("#firstHeading").text().trim().split(" ").map(a => a.replace(/^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/ig, "")).join(" ").trim();

        let range = $("div .nomobile :contains('Duration')").first().text().split("\n")[0].replace("Duration: ", "").split(" – ");

        let format = 'MMMM DD, YYYY HH:mm:ss A';
        let from = dayjs(range[0], format).toDate(), to = dayjs(range[1], format).toDate();

        let image = $(".image").first().attr("href");

        information[index] = {
            link,
            name: name,
            image: transformRawUrl(image),
            time: {
                from: from.getTime(),
                to: to.getTime()
            },
            promotional: Array.from($($(".wikitable").first().find("tr")[1]).find("td").first().find(".card_image")).map(e => $(e).find("a").first().attr("title"))
        };

        index++;
    }

    return information;
}

export const banners = async () => {
    const [character, weapon] = await preload();
    const [parsedCharacter, parsedWeapon] = await Promise.all([parse(character), parse(weapon)]);

    return { character: parsedCharacter, weapon: parsedWeapon };
}