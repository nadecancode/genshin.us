import fetch from "app/lib/fetch/index.ts";
import { API_URL } from "app/lib/url/index.ts";
import { Image, Input, Table, Text, useInput, useTheme } from "@geist-ui/core";
import Markdown from "app/component/markdown/index.tsx";
import { capitalize, getHighlightColor, getImageLoader } from "app/lib/helper/index.ts";
import { useEffect, useState } from "react";
import routes from "app/config/routes.ts";
import Head from "next/head";
import { NextSeo } from "next-seo";

export default function Weapons(props) {
    const theme = useTheme();

    const weaponsRaw = props.weapons;
    weaponsRaw.sort((a, b) => -(a.rarity - b.rarity));
    const { state, bindings } = useInput("");

    const [weapons, setWeapons] = useState(weaponsRaw);

    useEffect(() => {
        if (state.length > 0) setWeapons(weaponsRaw.filter(element => element.name.toLowerCase().includes(state.toLowerCase())));
        else setWeapons(weaponsRaw);
    }, [state]);

    const weaponInformation = weapons.map(weapon => {
        return {
            ...weapon,
            name: <Text style={{ color: theme.palette.accents_7 }}>{weapon.name}</Text>,
            attribute:  <Text style={{ color: theme.palette.accents_7 }}>{capitalize(weapon.attribute.type)}</Text>,
            rarity: <Text style={{ color: theme.palette.accents_7 }}>{weapon.rarity}</Text>,
            effect: weapon.refine?['1'] ? (<Markdown text={weapon.refine['1']}/>) : null : null,
            thumbnail: <Image draggable={false} width="36px" height="36px" src={getImageLoader(weapon.thumbnail)}/>
        }
    });

    return (
        <>
            <Head>
                <title>{routes.weapons.label}</title>
            </Head>
            <NextSeo
                {...routes.weapons.seo}
            />
            <Input my={2} clearable width="100%" scale={4/3} placeholder="Type here to search for a weapon.." {...bindings}/>
            <Table data={weaponInformation}>
                <Table.Column prop="thumbnail" label="Icon"/>
                <Table.Column prop="rarity" label="Rarity"/>
                <Table.Column prop="attribute" label="Attribute"/>
                <Table.Column prop="name" label="Name"/>
                <Table.Column prop="effect" label="Effect"/>
            </Table>
        </>
    )
}

export async function getStaticProps({ params }) {
    let response = await (await fetch(`${API_URL}/weapon/list`)).json();

    return {
        props: {
            weapons: response
        },
        revalidate: 60 * 60 * 12
    }
}
