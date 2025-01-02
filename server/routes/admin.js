const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
// fetch('http://localhost:5000/admin/user/count'),
// fetch('http://localhost:5000/admin/bookings/count'),
// fetch('http://localhost:5000/admin/posts/count'),
// fetch('http://localhost:5000/admin/posts/pending/count'),
// fetch('http://localhost:5000/admin/notifications/recent')
// ]);

// Get total users count
router.get('/user/count', async (req, res) => {
  try {
    const count = await prisma.user.count();
    res.json({ count });
  } catch (error) {
    console.error('Error fetching user count:', error);
    res.status(500).json({ error: 'Error fetching user count' });
  }
});

// Get total bookings count
router.get('/bookings/count', async (req, res) => {
  try {
    const count = await prisma.booking.count();
    res.json({ count });
  } catch (error) {
    console.error('Error fetching booking count:', error);
    res.status(500).json({ error: 'Error fetching booking count' });
  }
});

// Get total posts count
router.get('/posts/count', async (req, res) => {
  try {
    const count = await prisma.post.count();
    res.json({ count });
  } catch (error) {
    console.error('Error fetching post count:', error);
    res.status(500).json({ error: 'Error fetching post count' });
  }
});

// Get recent notifications
router.get('/notifications/recent', async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      where: {
        isRead: false
      }
    });
    res.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Error fetching notifications' });
  }
});

// Get paginated users list with search
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    // Build the where clause for search
    const whereClause = search ? {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    } : {};

    // Get total count for pagination
    const totalUsers = await prisma.user.count({
      where: whereClause
    });

    // Get users for current page
    const users = await prisma.user.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        type: true,
        bannedUntil: true,
        createdAt: true
      }
    });

    res.json({
      users,
      pagination: {
        page,
        pages: Math.ceil(totalUsers / limit),
        total: totalUsers
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// Get single user details
router.get('/users/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        posts: true,
        bookings: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Error fetching user details' });
  }
});

// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    });
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Error updating user' });
  }
});

// Ban user
router.post('/users/:id/ban', async (req, res) => {
  const { duration } = req.body; // duration in days
  const bannedUntil = new Date();
  bannedUntil.setDate(bannedUntil.getDate() + duration);

  try {
    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { bannedUntil }
    });
    res.json(user);
  } catch (error) {
    console.error('Error banning user:', error);
    res.status(500).json({ error: 'Error banning user' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    await prisma.$transaction(async (prisma) => {
      // 1. First, delete message translations
      await prisma.messageTranslation.deleteMany({
        where: {
          message: {
            userId: userId
          }
        }
      });

      // 2. Delete messages
      await prisma.message.deleteMany({
        where: { userId: userId }
      });

      // 3. Delete chats
      await prisma.chat.deleteMany({
        where: {
          OR: [
            { userId: userId },
            { receiverId: userId }
          ]
        }
      });

      // 4. Delete images from posts
      await prisma.image.deleteMany({
        where: {
          post: {
            userId: userId
          }
        }
      });

      // 5. Delete maps from posts
      await prisma.map.deleteMany({
        where: {
          post: {
            userId: userId
          }
        }
      });

      // 6. Delete notifications
      await prisma.notification.deleteMany({
        where: { userId: userId }
      });

      // 7. Delete comments
      await prisma.comment.deleteMany({
        where: { userId: userId }
      });

      // 8. Delete reports
      await prisma.report.deleteMany({
        where: { userId: userId }
      });

      // 9. Delete favourites
      await prisma.favourite.deleteMany({
        where: { userId: userId }
      });

      // 10. Delete history
      await prisma.history.deleteMany({
        where: { userId: userId }
      });

      // 11. Delete cart and related cart posts
      const userCart = await prisma.cart.findUnique({
        where: { userId: userId }
      });
      
      if (userCart) {
        await prisma.cartPost.deleteMany({
          where: { cartId: userCart.id }
        });
        await prisma.cart.delete({
          where: { userId: userId }
        });
      }

      // 12. Delete calendar entries for user's posts
      await prisma.calendar.deleteMany({
        where: {
          post: {
            userId: userId
          }
        }
      });

      // 13. Delete bookings
      await prisma.booking.deleteMany({
        where: { 
          OR: [
            { userId: userId },
            { post: { userId: userId } }
          ]
        }
      });

      // 14. Delete posts
      await prisma.post.deleteMany({
        where: { userId: userId }
      });

      // 15. Finally delete the user
      await prisma.user.delete({
        where: { id: userId }
      });
    });

    res.json({ 
      success: true,
      message: 'User and all related data deleted successfully' 
    });
  } catch (error) {
    console.error('Detailed deletion error:', {
      message: error.message,
      stack: error.stack
    });
    
    res.status(500).json({ 
      success: false,
      error: 'Error deleting user',
      details: error.message 
    });
  }
});

// Get all posts with pagination and search
router.get('/posts', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';
  const status = req.query.status || 'ALL';

  try {
    const skip = (page - 1) * limit;
    
    const whereClause = {
      OR: [
        { title: { contains: search } },
        { description: { contains: search } },
        { location: { contains: search } }
      ],
      ...(status !== 'ALL' && { status: status })
    };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          images: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.post.count({ where: whereClause })
    ]);

    res.json({
      posts,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({
      error: 'Error fetching posts',
      details: error.message
    });
  }
});

// Get pending posts count
router.get('/posts/pending/count', async (req, res) => {
  try {
    const count = await prisma.post.count({
      where: {
        status: 'PENDING'
      }
    });
    res.json({ count });
  } catch (error) {
    console.error('Error fetching pending post count:', error);
    res.status(500).json({ error: 'Error fetching pending post count' });
  }
});

// Get a single post by ID
router.get('/posts/:id', async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        images: true
      }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({
      error: 'Error fetching post details',
      details: error.message
    });
  }
});

// Delete a post
router.delete('/posts/:id', async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    
    await prisma.post.delete({
      where: { id: postId }
    });

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({
      success: false,
      error: 'Error deleting post',
      details: error.message
    });
  }
});

// Add new route for approving/rejecting posts
router.put('/posts/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    const post = await prisma.post.update({
      where: { id: parseInt(id) },
      data: { 
        status,
        rejectionReason: status === 'REJECTED' ? rejectionReason : null
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            email: true
          }
        }
      }
    });

    // Create notification for the user
    await prisma.notification.create({
      data: {
        userId: post.user.id,
        type: status === 'APPROVED' ? 'POST_APPROVED' : 'POST_REJECTED',
        message: status === 'APPROVED' 
          ? `Your post "${post.title}" has been approved`
          : `Your post "${post.title}" has been rejected: ${rejectionReason}`,
        isRead: false
      }
    });

    res.json(post);
  } catch (error) {
    console.error('Error updating post status:', error);
    res.status(500).json({ 
      error: 'Error updating post status',
      details: error.message 
    });
  }
});

module.exports = router; 