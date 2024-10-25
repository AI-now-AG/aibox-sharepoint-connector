import fs from "fs/promises";
import path from "path";

const TASKS_DIR = path.resolve("/tmp/tasks");

const ensureTasksDir = async () => {
    try {
        await fs.mkdir(TASKS_DIR, { recursive: true });
    } catch (error) {
        if (error instanceof Error && (error as NodeJS.ErrnoException).code !== "EEXIST") {
            console.error("Error while create directory:", error);
        }
    }
};

export const createTask = async (taskId: string, taskData: any) => {
    await ensureTasksDir();
    const filePath = path.join(TASKS_DIR, `${taskId}.json`);
    await fs.writeFile(filePath, JSON.stringify(taskData));
};

export const updateTask = async (taskId: string, updates: Partial<any>) => {
    await ensureTasksDir();
    const filePath = path.join(TASKS_DIR, `${taskId}.json`);
    try {
        const task = JSON.parse(await fs.readFile(filePath, "utf-8"));
        const updatedTask = { ...task, ...updates };
        await fs.writeFile(filePath, JSON.stringify(updatedTask));
    } catch (error) {
        console.error("Error updating task:", error);
    }
};

export const getTask = async (taskId: string) => {
    await ensureTasksDir();
    const filePath = path.join(TASKS_DIR, `${taskId}.json`);
    try {
        const taskData = await fs.readFile(filePath, "utf-8");
        return JSON.parse(taskData);
    } catch (error) {
        console.error("Error getting task:", error);
        return null;
    }
};