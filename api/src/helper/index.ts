export const transformRawUrl = (url: string) => {
    url = decodeURIComponent(url);

    return url.substring(0, url.indexOf('/revision/latest'));
}