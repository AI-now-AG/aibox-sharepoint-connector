import { writable } from 'svelte/store';
import type { Message } from '$types/MessageHistory';

// Store message histories for each promptId
const messageHistories = writable<Record<string, Message[]>>({});
// Map categoryId to current promptId
const groupPromptMap = writable<Record<string, string>>({});
// Store previousResponseId for each promptId
const previousResponseIds = writable<Record<string, string | null>>({});

// Helper functions to manage message histories
export function addMessageToHistory(groupId: string, promptId: string, message: Message) {
    console.log("Adding message to history:", groupId, promptId, message);
    // let oldPromptId: string | undefined;
    // groupPromptMap.update(map => {
    //     oldPromptId = map[groupId];
    //     // If the category already has a different promptId, remove its history
    //     if (oldPromptId && oldPromptId !== promptId) {
    //         clearMessageHistory(oldPromptId);
    //     }
    //     return { ...map, [groupId]: promptId };
    // });
    // Add message to the new promptId's history
    messageHistories.update(histories => {
        const currentHistory = histories[promptId] || [];
        return {
            ...histories,
            [promptId]: [...currentHistory, message]
        };
    });
}

export function getMessageHistory(promptId: string) {
    let history: Message[] = [];
    messageHistories.subscribe(histories => {
        history = histories[promptId] || [];
    })();
    return history;
}

export function clearMessageHistory(promptId: string) {
    messageHistories.update(histories => {
        const newHistories = { ...histories };
        delete newHistories[promptId];
        return newHistories;
    });
    previousResponseIds.update(ids => {
        const newIds = { ...ids };
        delete newIds[promptId];
        return newIds;
    });
}

export function setPreviousResponseId(promptId: string, responseId: string | null) {
    previousResponseIds.update(ids => ({ ...ids, [promptId]: responseId }));
}

export function getPreviousResponseId(promptId: string): string | null {
    let id: string | null = null;
    previousResponseIds.subscribe(ids => {
        id = ids[promptId] ?? null;
    })();
    return id;
}

export { messageHistories, groupPromptMap, previousResponseIds };
