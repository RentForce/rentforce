const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";

// Create a new report

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  console.log("Received Authorization Header:", authHeader);
  console.log("Extracted Token:", token);

  if (token == null) {
    return res.status(401).json({
      message: "No token provided",
      details: "Authorization header is missing or incorrectly formatted",
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error("Token Verification Error:", err);
      return res.status(403).json({
        message: "Invalid or expired token",
        error: err.message,
      });
    }
    req.user = user;
    next();
  });
};
const createReport = async (req, res) => {
    try {
        const { postId, reasons, details } = req.body;
        const userId = req.user.id;

        // Convert reasons object to JSON string
        const reasonsJson = JSON.stringify(reasons);

        const report = await prisma.report.create({
            data: {
                userId,
                postId,
                reasons: reasonsJson,
                details,
                status: 'PENDING'
            },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                post: {
                    select: {
                        title: true,
                        id: true
                    }
                }
            }
        });

        res.status(201).json({
            success: true,
            message: 'Report created successfully',
            data: report
        });
    } catch (error) {
        console.error('Error creating report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create report',
            error: error.message
        });
    }
};


const getUserReports = async (req, res) => {
    try {
        const userId = req.user.id;

        // First get all posts owned by this user
        const userPosts = await prisma.post.findMany({
            where: {
                userId: userId
            },
            select: {
                id: true
            }
        });

        const postIds = userPosts.map(post => post.id);

        // Then get all reports for these posts
        const reports = await prisma.report.findMany({
            where: {
                postId: {
                    in: postIds
                }
            },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                post: {
                    select: {
                        title: true,
                        id: true
                    }
                }
            }
        });

        // Parse the reasons JSON string for each report
        const parsedReports = reports.map(report => ({
            ...report,
            reasons: JSON.parse(report.reasons)
        }));

        res.json(parsedReports);
    } catch (error) {
        console.error('Error getting user reports:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user reports',
            error: error.message
        });
    }
};

const getAllReports = async (req, res) => {
    try {
        const reports = await prisma.report.findMany({
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                post: {
                    select: {
                        title: true,
                        id: true
                    }
                }
            }
        });

        // Parse the reasons JSON string for each report
        const parsedReports = reports.map(report => ({
            ...report,
            reasons: report.reasons
        }));

        res.json(parsedReports);
    } catch (error) {
        console.error('Error getting all reports:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get reports',
            error: error.message
        });
    }
};

const resolveReport = async (req, res) => {
    try {
        const reportId = parseInt(req.params.reportId);
        
        if (isNaN(reportId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid report ID',
                error: 'Report ID must be a number'
            });
        }

        const report = await prisma.report.update({
            where: {
                id: reportId
            },
            data: {
                status: 'RESOLVED'
            },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                post: {
                    select: {
                        title: true,
                        id: true
                    }
                }
            }
        });

        res.status(200).json({
            success: true,
            message: 'Report resolved successfully',
            data: report
        });
    } catch (error) {
        console.error('Error resolving report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to resolve report',
            error: error.message
        });
    }
};

const deleteReport = async (req, res) => {
    try {
        const reportId = parseInt(req.params.reportId);
        
        if (isNaN(reportId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid report ID',
                error: 'Report ID must be a number'
            });
        }

        await prisma.report.delete({
            where: {
                id: reportId
            }
        });

        res.status(200).json({
            success: true,
            message: 'Report deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete report',
            error: error.message
        });
    }
};

module.exports = {
    createReport,
    getUserReports,
    getAllReports,
    authenticateToken,
    resolveReport,
    deleteReport
};
