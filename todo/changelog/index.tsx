import routes from "app/config/routes.ts";
import Head from "next/head";
import { API_URL } from "app/lib/url/index.ts";
import Markdown from "app/component/markdown/index.tsx";
import { Card, Collapse, Text } from "@geist-ui/core";
import dayjs from 'dayjs';
import { NextSeo } from "next-seo";

export default function Changelog(props) {
    const { logs } = props;

    return (
        <>
            <Head>
                <title>{routes.changelog.label}</title>
            </Head>
            <NextSeo
                {...routes.changelog.seo}
            />
            <div className="flex flex-col space-y-5">
                {logs.map(log => {
                    return <div className="w-full">
                        <Card key={log.uuid}>
                            <Card.Content>
                                <Collapse title={`${log.title}`} initialVisible={logs.indexOf(log) === 0}>
                                    <Markdown text={log.description}/>
                                </Collapse>
                            </Card.Content>
                            <Card.Footer>
                                {dayjs(log.date).format("YYYY/MM/DD")}
                            </Card.Footer>
                        </Card>
                    </div>
                })}
            </div>
        </>
    )
}

export async function getStaticProps({ params }) {
    let response = await (await fetch(`${API_URL}/changelog`)).json();

    return {
        props: {
            logs: response
        },
        revalidate: 60 * 60 * 5
    }
}