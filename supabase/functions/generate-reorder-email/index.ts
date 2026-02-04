import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ReorderEmailRequest {
  itemName: string;
  currentQuantity: number;
  reorderQuantity: number;
  supplierName: string;
  supplierEmail?: string;
  sku?: string;
  unitPrice?: number;
  companyName?: string;
  senderName?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const body: ReorderEmailRequest = await req.json();
    const {
      itemName,
      currentQuantity,
      reorderQuantity,
      supplierName,
      supplierEmail,
      sku,
      unitPrice,
      companyName = "Our Company",
      senderName = "Procurement Team",
    } = body;

    console.log("Generating reorder email for:", itemName, "from supplier:", supplierName);

    const systemPrompt = `You are a professional procurement specialist writing business emails. 
Generate concise, professional reorder emails that are polite but direct. 
Always include all provided details (item name, quantity, SKU, pricing if available).
Format the email with proper greeting, body, and closing.
Keep the tone professional and courteous.`;

    const userPrompt = `Generate a professional reorder email with these details:

Item: ${itemName}${sku ? ` (SKU: ${sku})` : ""}
Current Stock: ${currentQuantity} units
Quantity to Order: ${reorderQuantity} units${unitPrice ? `
Unit Price: $${unitPrice.toFixed(2)}
Estimated Total: $${(unitPrice * reorderQuantity).toFixed(2)}` : ""}

Supplier: ${supplierName}${supplierEmail ? ` (${supplierEmail})` : ""}

Sender: ${senderName}, ${companyName}

Write a professional email requesting this reorder. Include:
1. Clear subject line (prefixed with "Subject: ")
2. Professional greeting
3. Clear statement of the order request
4. All item details
5. Request for order confirmation and expected delivery date
6. Professional closing

Keep the email concise but complete.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const emailContent = data.choices?.[0]?.message?.content;

    if (!emailContent) {
      throw new Error("No email content generated");
    }

    console.log("Successfully generated reorder email");

    return new Response(
      JSON.stringify({ email: emailContent }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating reorder email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
