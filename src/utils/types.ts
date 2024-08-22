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
    category?: string;
    group?: string;
    number?: string;
}

export const CardTypeEndpoints: { [key in CardType]: string } = {
    [CardType.Prompt]: '/api/prompts.json',
    [CardType.Instruction]: '/api/instructions.json',
    [CardType.Knowledgebase]: '/api/knowledge-base.json',
    [CardType.Category]: '/api/categories.json'
};

export const CardTypeRawValue: { [key in CardType]: string } = {
    [CardType.Prompt]: '/api/prompts.json',
    [CardType.Instruction]: '/api/instructions.json',
    [CardType.Knowledgebase]: '/api/knowledge-base.json',
    [CardType.Category]: '/api/categories.json'
};
