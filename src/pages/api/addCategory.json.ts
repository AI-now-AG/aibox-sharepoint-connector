import type { APIRoute } from "astro";
import { addCategory, ObjectId } from "$data/models/category.model";

export const POST: APIRoute = async (ctx) => {
    const params = await ctx.request.json();
    try {
        if (params.title && params.group) {
            let groupList: { _id: ObjectId; title: any; }[] = []
            params.group.forEach((singleObj: any) => {
                let newGroup = {
                    _id: new ObjectId(),
                    title: singleObj
                }
                groupList.push(newGroup);
            });
            let newCategory = {
                title: params.title,
                group: groupList
            }
            const result = await addCategory(newCategory);

            return new Response(
                JSON.stringify({
                    message: "Category added",
                }),
                {
                    status: 200,
                },
            );
        } else {
            return new Response(
                JSON.stringify({
                    message: "Error while add the Category",
                }),
                {
                    status: 400,
                },
            );
        }
    } catch (error) {
        console.debug(error);

        return new Response(
            JSON.stringify({
                message: "Add new category failed....",
                error: error,
            }),
            {
                status: 500,
            },
        );
    }
};
