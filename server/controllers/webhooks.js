import { Webhook } from "svix";
import User from "../models/User.js";

export const clerkWebhooks = async (req, res) => {
  try {
    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    // ✅ IMPORTANT: use raw body, not JSON.stringify
    const payload = req.body; // Buffer
    const headers = {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    };

    const event = whook.verify(payload, headers);

    const { data, type } = event;

    switch (type) {
      case "user.created": {
        const userData = {
          _id: data.id,
          email: data.email_addresses?.[0]?.email_address,
          name: `${data.first_name || ""} ${data.last_name || ""}`.trim() || "User",
          image: data.image_url,
          resume: "",
        };

        // ✅ Prevent duplicate creation
        await User.findByIdAndUpdate(data.id, userData, {
          upsert: true,
          new: true,
        });

        break;
      }

      case "user.updated": {
        const userData = {
          email: data.email_addresses?.[0]?.email_address,
          name: `${data.first_name || ""} ${data.last_name || ""}`.trim() || "User",
          image: data.image_url,
        };

        await User.findByIdAndUpdate(data.id, userData);
        break;
      }

      case "user.deleted": {
        await User.findByIdAndDelete(data.id);
        break;
      }

      default:
        break;
    }

    // ✅ Clerk expects 200 OK
    return res.status(200).json({ success: true });

  } catch (error) {
    console.error("Webhook error:", error.message);
    return res.status(400).json({ success: false, message: error.message });
  }
};