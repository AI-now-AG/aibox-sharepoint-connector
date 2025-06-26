import { writable } from 'svelte/store';
import type { MessageHistory } from '$types/MessageHistory';

// Store message histories for each promptId
const messageHistories = writable<Record<string, MessageHistory[]>>({});
// Map categoryId to current promptId
const groupPromptMap = writable<Record<string, string>>({});

// Helper functions to manage message histories
export function addMessageToHistory(groupId: string, promptId: string, message: MessageHistory) {
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
    let history: MessageHistory[] = [];
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
}

export { messageHistories, groupPromptMap };
