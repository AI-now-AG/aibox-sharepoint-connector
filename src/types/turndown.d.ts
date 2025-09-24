declare module "turndown" {
    export interface Options {
        headingStyle?: "setext" | "atx";
        hr?: string;
        bulletListMarker?: string;
        codeBlockStyle?: "indented" | "fenced";
        fence?: string;
        emDelimiter?: string;
        strongDelimiter?: string;
        linkStyle?: "inlined" | "referenced";
        linkReferenceStyle?: "full" | "collapsed" | "shortcut";
    }

    export interface Rule {
        filter: string | ((node: unknown, options: Options) => boolean);
        replacement: (content: string, node: unknown, options: Options) => string;
    }

    export default class TurndownService {
        constructor(options?: Options);
        turndown(html: string): string;
        addRule(key: string, rule: Rule): this;
        use(plugin: (service: TurndownService) => void): this;
    }
}
