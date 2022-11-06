import fetch from 'app/lib/fetch/index.ts';
import { API_URL } from 'app/lib/url/index.ts';
import { Card, Grid, Image, Input, Text, useInput, useTheme } from '@geist-ui/core';
import { getImageLoader, transformName } from 'app/lib/helper/index.ts';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import routes from 'app/config/routes.ts';
import NextLink from 'next/link';
import CharacterPreview from "app/component/container/character/character-preview.tsx";
import { NextSeo } from "next-seo";

export default function Characters(props) {
    const theme = useTheme();
    const { state, bindings } = useInput("");

    const [characters, setCharacters] = useState(props.characters);

    useEffect(() => {
        if (state.length > 0) setCharacters(props.characters.filter(element => element.name.toLowerCase().includes(state.toLowerCase())));
        else setCharacters(props.characters);
    }, [state]);

    return (
        <>
            <Head>
                <title>{routes.characters.label}</title>
            </Head>
            <NextSeo
                {...routes.characters.seo}
            />
            <Input my={2} clearable width="100%" scale={4/3} placeholder="Type here to search for a character.." {...bindings}/>
            <Grid.Container gap={2} justify="center">
                {characters.map(character => {
                    return (
                        <>
                            <Grid key={character.canonical} xs={12} sm={8} md={6} lg={4}>
                                <CharacterPreview character={character}/>
                            </Grid>
                        </>
                    )
                })}
            </Grid.Container>
        </>
    )
}

export async function getStaticProps({ params }) {
    let response = await (await fetch(`${API_URL}/character/list`)).json();

    const baseTraveler = response.find(element => element.canonical === "traveler");

    response = response.filter(element => element.canonical !== "traveler");

    /*
    ["ANEMO", "GEO", "ELECTRO"].forEach(element => {
        response.push({
            ...baseTraveler,
            canonical: `traveler-${element.toLowerCase()}`,
            element: element,
            // name: `Traveler (${element.substring(0, 1).toUpperCase() + element.substring(1).toLowerCase()})`,
            link: `/character/traveler-${element.toLowerCase()}`
        })
    });
     */


    return {
        props: {
            characters: response
        },
        revalidate: 60 * 60 * 12
    }
}
