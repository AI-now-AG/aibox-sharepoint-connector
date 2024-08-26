export enum CardType {
    Prompt = 'prompts',
    Instruction = 'instructions',
    Knowledgebase = 'knowledge-base',
    Category = 'categories'
}

export interface CardItem {
    id: string;
    title: string;
    description?: string;
    categoryName?: string;
    groupName?: string;
    number?: string;
}