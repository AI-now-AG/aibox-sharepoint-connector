import type { APIContext, APIRoute } from "astro";
import dayjs from "dayjs";
import { writeToString } from "fast-csv";
import { getRoleString } from "$utils/roles";
import UserModel from "$data/models/user.model";
import { CsvColumn, type CsvRowRaw } from "$types/UserCsv";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const GET: APIRoute = async (ctx: APIContext) => {
  const filename = `Users-Export-${dayjs().format("YYYY-MM-DD")}.csv`;

  try {
    // Util fucnitons
    const formatDateTime = (value?: string | Date) =>
      value ? dayjs(value).format("DD.MM.YYYY HH:mm") : "-";

    const yesNo = (value?: boolean) => (value ? "Yes" : "No");

    // Fetch your MongoDB data
    const results = await UserModel.listForExport({ pageSize: 0 });
    const { data: users } = results;

    // Prepare the CSV data with appropriate headers
    const csvData: CsvRowRaw[] = users.map((user) => {
      // Returning the data formatted for CSV
      return {
        [CsvColumn.Email]: user.email ?? "-",
        [CsvColumn.Name]: user.name ?? "-",
        [CsvColumn.Tenant]: user.tenant?.name || "-",
        [CsvColumn.Roles]: getRoleString(user.roles),
        [CsvColumn.LastLogin]: formatDateTime(user.last_login),
        [CsvColumn.LoginsCount]: user.logins_count ?? 0,
        [CsvColumn.EmailVerified]: yesNo(user.email_verified),
        [CsvColumn.Blocked]: yesNo(user.blocked),
        [CsvColumn.Auth0Sub]: user.auth0_sub ?? "-",
        [CsvColumn.CreatedAt]: formatDateTime(user.created_at),
        [CsvColumn.UpdatedAt]: formatDateTime(user.updated_at),
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
