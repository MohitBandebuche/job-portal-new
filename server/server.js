import './config/instrument.js'
import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/db.js'
import * as Sentry from "@sentry/node";
import { clerkWebhooks } from './controllers/webhooks.js'
import companyRoutes from './routes/companyRoutes.js'
import connectCloudinary from './config/cloudinary.js'
import jobRoutes from './routes/jobRoutes.js'
import userRoutes from './routes/userRoutes.js'
import { clerkMiddleware } from '@clerk/express'

const app = express()

// ✅ WEBHOOK MUST COME FIRST (RAW BODY)
app.post(
  '/api/webhook/clerk',
  express.raw({ type: 'application/json' }),
  clerkWebhooks
)

// Other middlewares
app.use(cors())
app.use(express.json())
app.use(clerkMiddleware())

// DB
connectDB()
await connectCloudinary()

// Routes
app.get('/', (req, res) => res.send("API Working"))
app.use('/api/company', companyRoutes)
app.use('/api/jobs', jobRoutes)
app.use('/api/users', userRoutes)

// Port
const PORT = process.env.PORT || 5001

Sentry.setupExpressErrorHandler(app)

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})