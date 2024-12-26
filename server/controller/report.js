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
                        id: true,
                        images: {
                            select: {
                                url: true
                            },
                            take: 1
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.status(200).json({
            success: true,
            data: reports
        });
    } catch (error) {
        console.error('Error fetching user property reports:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch property reports',
            error: error.message
        });
    }
};

module.exports = {
    createReport,
    getUserReports,
    authenticateToken
};
