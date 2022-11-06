import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';
import * as cheerio from 'https://esm.sh/cheerio';
import TurndownService from 'https://cdn.skypack.dev/turndown@7.1.1';

const turndown = new TurndownService();

const base = "https://genshin-impact.fandom.com";
const TRAVELER_ELEMENTS = ["anemo", "geo", "electro", "dendro", "unaligned"];
const reserved = [
  "Energy",
  "Crystallize"
];

const transformRawUrl = (url: string) => {
  url = decodeURIComponent(url);

  return url.substring(0, url.indexOf('/revision/latest'));
}

type MultipleElementCharacter = {
  element: string,
  character: Character
}

type Character = {

}

type PreloadedCharacter = {
  icon: string,
  link: string,
  name: string
}

const preload = async (included: string | undefined = undefined): Promise<PreloadedCharacter> => {
  const response = await (await fetch(base + "/wiki/Characters")).text();
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
      name: linkElement.attr('title')
    }
  }).filter(e => {
    if (!e || !e.name) return false;

    if (!included) return true;

    return e.name.toLowerCase().replace(/_/g, " ") === included.toLowerCase().replace(/_/g, " ");
  });
}

const load = async (character: PreloadedCharacter): Promise<Character | MultipleElementCharacter[]> => {
  const traveler = character.link === "/wiki/Traveler";

  const response = await (await fetch(`${BASE_DOMAIN}${character.link}`)).text();
  const $ = cheerio.load(response);

  const name = $($(".page-header__title")[0]).text().trim();
  const portraitElement = $($(".pi-image-thumbnail")[0]);
  let portrait = portraitElement.attr("data-src");
  if (!portrait || portrait.length <= 0) portrait = portraitElement.attr("src");

  const informationTable = $(".pi-data-value, .pi-font");

  const extraInformationTable = Array.from($(".pi-item, .pi-panel, .pi-border-color, .wds-tabber"));
  const observeProperty = [
    "constellation",
  ];

  const information = {};

  for (let info of extraInformationTable) {
    let element = $(info);
    let dataSource = element.attr('data-source');

    if (observeProperty.includes(dataSource)) {
      let value = element.children('.pi-data-value, .pi-font').first().text().trim();
      if (dataSource === 'sex') {
        dataSource = 'gender';
      }

      if (value === 'Viator (Male)Viatrix (Female)') value = 'Viator / Viatrix'

      information[dataSource] = value;
    }
  }

  // if (information['gender']) information['gender'] = information['gender'] === "Player's Choice" ? 2 : information['gender'] === "Male" ? 0 : 1;
  if (information['constellation']) information['constellation'] = information['constellation'].replace("Story Quest Chapter", "").trim();

  const { constellation } = information;

  const rarity = Number.parseInt($($(informationTable[0]).find("img")[0]).attr("alt").replace(/ Stars/g, ""));
  const weapon = $($(informationTable[1]).find("a")[0]).attr("title").toUpperCase();

  const element = $(informationTable[2]).text().replace(/ /g, "").toUpperCase();
  const titles = Array.from($(".wds-tab__content > .pi-data-value, .pi-font > ul > li")).map(e => $(e).text().replace(/\[\d\]/, "").replace(/(\(|\))/g, "").replace(/by [A-Za-z0-9]*/g, "").trimEnd()).reduce((a, b) => a.concat(b), []);

  const description = $($("p")[2]).text().replace(/\n$/, '');

  const tables = $(".wikitable");

  let talentsElement, constellationsElement;
  let talents = [], constellations = {}, talent_materials = [];

  /*
  if (traveler) {
    let index = 0;
    talents = {};

    for (let ele of TRAVELER_ELEMENTS) {
      talentsElement = $($($(".talent_table")[index]).find("tbody")[0]).children("tr");
      talents[ele] = this.parseTalents($, talentsElement);

      if (ele !== 'unaligned') {
        constellationsElement = $($(".tdc1")[index]).find("tr");
        constellations[ele] = this.parseConstellations($, constellationsElement);
      }
      index++;
    }

    talent_materials = {};

    let totalCost = $("b:contains(Total Cost)"); //.last().parent();

    talent_materials["anemo"] = this.parseTalentMaterials($, $(totalCost[1]));
    talent_materials["geo"] = this.parseTalentMaterials($, $(totalCost[3]));
    talent_materials["electro"] = this.parseTalentMaterials($, $(totalCost[4]));
    let unalignedTotalCost = $(totalCost[totalCost.length - 1]);
    talent_materials["unaligned"] = this.parseTalentMaterials($, unalignedTotalCost);
  } else {

   */
    talentsElement = $($($($("#Talents")[0]).parent().next()).children().children());
    talents = parseTalents($, talentsElement);

    constellationsElement = $($($("#Constellation")[0]).parent().next()).find("tr");
    constellations = parseConstellations($, constellationsElement);

    let totalCost = $("b:contains(Total Cost)").last().parent();
    talent_materials = parseTalentMaterials($, totalCost);
  // }

  const attribute = $($(tables[0]).find("tr").first().find("th")[5]).text().replace("\n", "").replace(/ /g, "_").toUpperCase().replace(/[\(\)]/g, "").replace("SPECIAL_STAT", "").replace(/[^a-z_]/gmi, " ").trim();

  return {
    name,
    // gender,
    portrait,
    rarity,
    weapon,
    constellation,
    element,
    titles,
    description,
    attribute,
    talents,
    constellations,
    thumbnail: transformRawUrl(character.icon),
    talent_materials,
    multiple_elements: traveler
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

type AnyObject = {
  [key: string]: string;
}

const parseConstellations = ($: any, constellationsElement: any) => {
  const constellations: AnyObject = {};

  let index = 1;

  for (let i = 1; i < constellationsElement.length; i += 2) {
    const main = $(constellationsElement[i]);
    const name = $(main.find("td")[1]).text().replace(/[\n\r]/g, "").replace(/\(.*\)/g, "").trimEnd();

    let iconElement = $(main.find("td")[0]).find("img").first();
    let icon = iconElement.attr("data-src");
    if (!icon || icon.length <= 0) icon = iconElement.attr("src");

    // icon = icon.dataset ? icon.dataset.src : icon.src;

    let effect = turndown.turndown($(constellationsElement[i + 1]).html().replace(/<a[^>]*>/g,"<b>").replace(/<\/a>/g,"</b>").replace(/<\/?(?!b)(?!li)(?!ul)\w*\b[^>]*>/ig, "")).replace(/\n\n\n/g, "\n");

    for (const reservedWord of reserved) {
      effect = effect.replace(new RegExp(`[*][*]${reservedWord}[*][*]`, "ig"), reservedWord);
    }

    constellations[("c" + index) as string] = {
      image: icon,
      effect: effect,
      name: name,
    }

    index++;
  }

  return constellations;
}

const parseTalents = ($: any, talentsElement: any) => {
  const talents = [];

  $(talentsElement).find('.mw-collapsible').remove();

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

    let description = turndown.turndown(sub.html().replace(/<\/?(?!b)(?!li)(?!ul)\w*\b[^>]*>/ig, "")).replace(/\n[*][*]/g, "\n**").replace(/:[*][*]/g, "**\n").replace(/\n\n\n/g, "\n");

    for (const reservedWord of reserved) {
      description = description.replace(new RegExp(`[*][*]${reservedWord}[*][*]`, "ig"), reservedWord);
    }

    talents.push({
      image: transformRawUrl(icon),
      info: description,
      name: (type === "NORMAL_ATTACK" ? "Normal Attack: " : "") + name,
      type: type
    })
  }

  return talents;
}

serve(async (req) => {
  if (req.url.endsWith("/")) return new Response(JSON.stringify(await preload()), { headers: { "Content-Type": "application/json" } });

  return new Response("Hello World");
});

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24ifQ.625_WdcF3KHqz5amU0x2X5WWHP-OEs_4qj0ssLNHzTs' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'
