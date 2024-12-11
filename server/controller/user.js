const { PrismaClient } = require('@prisma/client');

// Use a global prisma client to prevent multiple instances
const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

const getUserData = async (req, res) => {
    const { userId } = req.params; 
    try {
        // Validate userId
        if (!userId || isNaN(Number(userId))) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        const user = await prisma.user.findUnique({
            where: { id: Number(userId) },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true,
                address: true,
                image: true
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        console.error('Detailed User Retrieval Error:', error);
        res.status(500).json({ 
            message: 'Error retrieving user data', 
            error: error.message || 'Unknown error',
            details: error.code ? { code: error.code } : {}
        });
    }
};

const updateUserData = async (req, res) => {
    const { userId } = req.params; 
    const { firstName, lastName, email, phoneNumber, address } = req.body;
    
    try {
        // Validate userId and input data
        if (!userId || isNaN(Number(userId))) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        const updatedUser = await prisma.user.update({
            where: { id: Number(userId) },
            data: { 
                firstName, 
                lastName, 
                email, 
                phoneNumber: phoneNumber ? Number(phoneNumber) : undefined, 
                address 
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true,
                address: true
            }
        });

        res.json(updatedUser);
    } catch (error) {
        console.error('Detailed User Update Error:', error);
        res.status(500).json({ 
            message: 'Error updating user data', 
            error: error.message || 'Unknown error',
            details: error.code ? { code: error.code } : {}
        });
    }
};

// Add cleanup function for Prisma client
async function main() {
    try {
        await prisma.$connect();
        console.log('Prisma connected successfully');
    } catch (error) {
        console.error('Prisma connection error:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

// Cleanup on process exit
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});

module.exports = {
    getUserData,
    updateUserData,
    prisma  
};