import UserModel from "$data/models/user.model";
import { getSubscriptionAddOnName } from "$utils/common";
import type { APIRoute } from "astro";
import dayjs from "dayjs";
import { writeToString } from "fast-csv";


export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { tenants = [] } = body;
    
    const userCounts: any = {};
    for (let i = 0; i < tenants.length; i++) {
      const tenant = tenants[i];
      const totalActiveUsers = await UserModel.countActiveUsersByTenant(
        tenant._id,
      );
      console.log(`totalActiveUsers of tenant ${tenant.name}`, totalActiveUsers)
      userCounts[tenant._id] = totalActiveUsers
    }



    // Build CSV rows
    const csvData = tenants.map((tenant: any) => {
      const sub = tenant.subscription;
      const billing = tenant.billing_info ?? {};
      const meta = tenant.metadata ?? {};

      return {
        "Tenant Name": tenant.name ?? "-",
        "Status": tenant.active ? "Active" : "Archived",
        "Date created": `${dayjs(tenant.created_at, "DD.MM.YYYY HH-mm-ss").format("DD.MM.YYYY HH-mm-ss")}`,
        "Subscription": sub?.plan_name ?? "-",
        "Audio subscription": getSubscriptionAddOnName('audiototext', sub?.add_ons),
        "Subtitle Subscription": getSubscriptionAddOnName('subtitle', sub?.add_ons),
        "Subscription Price": tenant.totalPrice ?? "-",
        "Number of Users": userCounts[tenant._id] ?? "-",
        "Language": tenant.default_language ?? "-",
        "Company Name": billing.company_name ?? "-",
        "E-Mail": billing.email ?? "-",
        "Street, Nr.": billing.address ?? "-",
        "ZIP": billing.zip_code ?? "-",
        "OpenAI is private key": meta.openaiPrivateKeyEnabled ? "Yes" : "No",
        "Open AI GPT-5 is private key": meta.openaiGpt5PrivateKeyEnabled ? "Yes" : "No",
        "Azure OpenAI is private key": meta.azureOpenaiPrivateKeyEnabled ? "Yes" : "No",
        "Azure OpenAI ressource name": tenant.azure_openai_instance_name ?? "-",
        "Perplexitiy is private key": meta.perplexityPrivateKeyEnabled ? "Yes" : "No",
        "Claude is private key": meta.claudePrivateKeyEnabled ? "Yes" : "No",
        "Gemini is private key": meta.geminiPrivateKeyEnabled ? "Yes" : "No",
        "Azure Speech is private key": meta.speechPrivateKeyEnabled ? "Yes" : "No",
        "Eleven Labs is private key": meta.elevenLabsPrivateKeyEnabled ? "Yes" : "No",
        "Flux is private key": meta.fluxPrivateKeyEnabled ? "Yes" : "No",
      };
    });

    // Convert to CSV
    const csvString = await writeToString(csvData, { headers: true });

    // Return CSV as a downloadable file
    return new Response(csvString, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="Tenants-Export-${dayjs(new Date(), "DD.MM.YYYY HH-mm-ss").format("DD.MM.YYYY HH-mm-ss")}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting tenants:", error);
    return new Response(
      JSON.stringify({ error: "Failed to export tenant data." }),
      { status: 500 }
    );
  }
};
