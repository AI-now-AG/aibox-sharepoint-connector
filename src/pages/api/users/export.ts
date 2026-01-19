import type { APIContext, APIRoute } from "astro";
import dayjs from "dayjs";
import { writeToString } from "fast-csv";
import UserModel from "$data/models/user.model";
import { CsvColumn, type CsvRowRaw } from "$types/UserCsv";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const GET: APIRoute = async (ctx: APIContext) => {
  const filename = `Users-Export-${dayjs().format("YYYY-MM-DD")}.csv`;

  try {
    // Fetch your MongoDB data
    const results = await UserModel.listForExport({ pageSize: 0 });
    const { data: users } = results;

    // Prepare the CSV data with appropriate headers
    const csvData: CsvRowRaw[] = users.map((user) => {
      const tenantName = user.tenant?.name || "-";
      const roles = user.roles?.join(", ");
      const createdTime = user.created_at
        ? dayjs(user.created_at).format("DD.MM.YYYY HH:mm")
        : "-";
      const updatedTime = user.updated_at
        ? dayjs(user.updated_at).format("DD.MM.YYYY HH:mm")
        : "-";

      // Returning the data formatted for CSV
      return {
        [CsvColumn.Name]: user.name,
        [CsvColumn.Email]: user.email,
        [CsvColumn.Tenant]: tenantName,
        [CsvColumn.Roles]: roles,
        [CsvColumn.LastLogin]: user.last_login,
        [CsvColumn.LoginsCount]: user.logins_count,
        [CsvColumn.EmailVerified]: user.email_verified ? "Yes" : "No",
        [CsvColumn.Blocked]: user.blocked ? "Yes" : "No",
        [CsvColumn.Auth0Sub]: user.auth0_sub,
        [CsvColumn.CreatedAt]: createdTime,
        [CsvColumn.UpdatedAt]: updatedTime,
      };
    });

    // Generate the CSV string using fast-csv
    const csvString = await writeToString(csvData, { headers: true });

    // Set the response headers to prompt a download
    return new Response(csvString, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error export data:", error);
    return new Response("Error export data", { status: 500 });
  }
};
