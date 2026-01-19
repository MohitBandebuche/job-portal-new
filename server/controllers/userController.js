import Job from "../models/Job.js"
import JobApplication from "../models/JobApplication.js"
import User from "../models/User.js"
import { v2 as cloudinary } from "cloudinary"

// Get User Data
export const getUserData = async (req, res) => {
    try {
        const userId = req.auth.userId;
        let user = await User.findById(userId);

        if (!user) {
            // Check sessionClaims first, then fallback to a placeholder to prevent the 'email required' error
            const email = req.auth.sessionClaims?.email || `user_${userId}@placeholder.com`;
            const name = req.auth.sessionClaims?.name || "User";

            user = await User.create({
                _id: userId,
                name: name,
                email: email, // This ensures 'email' is never empty
                image: req.auth.sessionClaims?.image || "", 
                resume: "",
            });
        }

        res.json({ success: true, user });
    } catch (error) {
        console.error("Validation Error:", error.message);
        res.json({ success: false, message: error.message });
    }
};

// Apply For Job
export const applyForJob = async (req, res) => {
    const { jobId } = req.body
    const userId = req.auth.userId

    try {
        // Use findOne for a cleaner check
        const isAlreadyApplied = await JobApplication.findOne({ jobId, userId })

        if (isAlreadyApplied) {
            return res.json({ success: false, message: 'Already Applied' })
        }

        const jobData = await Job.findById(jobId)

        if (!jobData) {
            return res.json({ success: false, message: 'Job Not Found' })
        }

        await JobApplication.create({
            companyId: jobData.companyId,
            userId,
            jobId,
            date: Date.now()
        })

        res.json({ success: true, message: 'Applied Successfully' })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Get User Applied Applications Data
export const getUserJobApplications = async (req, res) => {
    try {
        const userId = req.auth.userId

        const applications = await JobApplication.find({ userId })
            .populate('companyId', 'name email image')
            .populate('jobId', 'title description location category level salary')
            .exec()

        // Empty array is still a success, just with 0 items
        return res.json({ success: true, applications: applications || [] })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Update User Resume
export const updateUserResume = async (req, res) => {
    try {
        const userId = req.auth.userId
        const resumeFile = req.file
        const userData = await User.findById(userId)

        if (!userData) {
            return res.json({ success: false, message: 'User not found' })
        }

        if (resumeFile) {
            const resumeUpload = await cloudinary.uploader.upload(resumeFile.path)
            userData.resume = resumeUpload.secure_url
        }

        await userData.save()
        return res.json({ success: true, message: 'Resume Updated' })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}