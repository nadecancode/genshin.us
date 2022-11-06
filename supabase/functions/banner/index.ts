import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';
import * as cheerio from 'https://esm.sh/cheerio';
import dayjs from 'https://cdn.skypack.dev/dayjs';

const base = "https://genshin-impact.fandom.com";

const preload = async (): Promise<string[][]> => {
  const response = await (await fetch(base)).text();
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
    const response = await ((await fetch(base + link)).text());
    let $ = cheerio.load(response);

    let name = $("#firstHeading").text().trim().split(" ").map(a => a.replace(/^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/ig, "")).join(" ").trim();

    let range = $("div .nomobile :contains('Duration')").first().text().split("\n")[0].replace("Duration: ", "").split(" – ");

    let format = 'MMMM DD, YYYY HH:mm:ss A';
    let from = dayjs(range[0], format).toDate(), to = dayjs(range[1], format).toDate();

    let image = $(".image").first().attr("href");
    information[index] = {
      link,
      name: name,
      image: image,
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

serve(async () => {
  const [character, weapon] = await preload();
  const [parsedCharacter, parsedWeapon] = await Promise.all([parse(character), parse(weapon)]);

  return new Response(
      JSON.stringify({ character: parsedCharacter, weapon: parsedWeapon }),
    { headers: { "Content-Type": "application/json" } },
  )
})

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24ifQ.625_WdcF3KHqz5amU0x2X5WWHP-OEs_4qj0ssLNHzTs' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'
