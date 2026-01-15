import { Webhook } from "svix"
import User from "../models/User.js"

export const clerkWebhooks = async (req, res) => {
  try {
    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET)

    const payload = req.body.toString()

    const evt = whook.verify(payload, {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    })

    const { data, type } = evt

    if (type === "user.created") {
      await User.create({
        _id: data.id,
        email: data.email_addresses[0].email_address,
        name: `${data.first_name ?? ""} ${data.last_name ?? ""}`,
        image: data.image_url,
        resume: "",
      })
    }

    if (type === "user.updated") {
      await User.findByIdAndUpdate(data.id, {
        email: data.email_addresses[0].email_address,
        name: `${data.first_name ?? ""} ${data.last_name ?? ""}`,
        image: data.image_url,
      })
    }

    if (type === "user.deleted") {
      await User.findByIdAndDelete(data.id)
    }

    res.status(200).json({ received: true })
  } catch (err) {
    console.error("❌ Clerk webhook error:", err.message)
    res.status(400).json({ error: err.message })
  }
}