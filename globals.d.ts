/// <reference types="cheerio" />

declare const Cheerio: {
    load: (html: string) => cheerio.CheerioAPI;
};
