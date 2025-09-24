declare module "turndown" {

    export interface Options {
        headingStyle?: "setext" | "atx" | undefined;
        hr?: string | undefined;
        br?: string | undefined;
        bulletListMarker?: "-" | "+" | "*" | undefined;
        codeBlockStyle?: "indented" | "fenced" | undefined;
        emDelimiter?: "_" | "*" | undefined;
        fence?: "```" | "~~~" | undefined;
        strongDelimiter?: "__" | "**" | undefined;
        linkStyle?: "inlined" | "referenced" | undefined;
        linkReferenceStyle?: "full" | "collapsed" | "shortcut" | undefined;
        preformattedCode?: boolean;

        keepReplacement?: ReplacementFunction | undefined;
        blankReplacement?: ReplacementFunction | undefined;
        defaultReplacement?: ReplacementFunction | undefined;
    }

    export interface Rule {
        filter: Filter;
        replacement?: ReplacementFunction | undefined;

        options: Options;
        array: Rule[];

        blankRule: ReplacementFunction;
        defaultRule: ReplacementFunction;
        keepReplacement: ReplacementFunction;

        add(key: Filter, rule: Rule): void;
        forEach(callback: (rule: Rule, index: number) => unknown): void;
        forNode(node: Node): Rule;
        keep(filter: Filter): void;
        remove(filter: Filter): void;
    }

    export default class TurndownService {
        constructor(options?: Options);

        addRule(key: string, rule: Rule): this;
        keep(filter: Filter): this;
        remove(filter: Filter): this;
        use(plugins: Plugin | Plugin[]): this;
        escape(str: string): string;

        turndown(html: string | Node): string;

        options: Options;
        rules: Rules;
    }

    export type Plugin = (service: TurndownService) => void;
    export type Node = HTMLElement | Document | DocumentFragment;

    export type Filter = TagName | TagName[] | FilterFunction;
    export type FilterFunction = (node: HTMLElement, options: Options) => boolean;

    export type ReplacementFunction = (
        content: string,
        node: Node,
        options: Options,
    ) => string;

    export type TagName = keyof HTMLElementTagNameMap;
}
