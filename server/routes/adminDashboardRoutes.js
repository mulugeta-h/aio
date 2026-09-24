// routes/adminDashboardRoutes.js
const express = require('express');
const router = express.Router();
const { getLibaioPool } = require("../config/db");
const userAuth = require("../middleware/userAuth");

// Apply userAuth middleware to all routes
router.use(userAuth);

// =====================================================
// ADMIN DASHBOARD STATS
// =====================================================
router.get("/stats", async (req, res) => {
    console.log("=== Admin Dashboard Stats API Called ===");
    //console.log("User:", req.user);
    
    // User should be set by userAuth middleware
    if (!req.user || !req.user.id) {
        console.log("❌ No user found");
        return res.status(401).json({
            success: false,
            message: 'Unauthorized - User not authenticated'
        });
    }

    const adminId = req.user.id;
    console.log(`✅ Admin ID: ${adminId}, Role: ${req.user.role}`);
    
    try {
        const libaioPool = getLibaioPool();
        
        // Get all data in one query - using your libaioPool
        const result = await libaioPool.query(`
            WITH my_stats AS (
                SELECT 
                    COALESCE(COUNT(*) FILTER (WHERE created_at::DATE = CURRENT_DATE), 0) as today,
                    COALESCE(COUNT(*) FILTER (WHERE created_at::DATE >= CURRENT_DATE - INTERVAL '7 days'), 0) as week,
                    COALESCE(COUNT(*) FILTER (WHERE created_at::DATE >= CURRENT_DATE - INTERVAL '30 days'), 0) as month,
                    COALESCE(COUNT(*), 0) as total
                FROM status_history
                WHERE changed_by = $1
            ),
            system_stats AS (
                SELECT 
                    COALESCE(COUNT(*) FILTER (WHERE created_at::DATE = CURRENT_DATE), 0) as today,
                    COALESCE(COUNT(*) FILTER (WHERE created_at::DATE >= CURRENT_DATE - INTERVAL '7 days'), 0) as week,
                    COALESCE(COUNT(*) FILTER (WHERE created_at::DATE >= CURRENT_DATE - INTERVAL '30 days'), 0) as month,
                    COALESCE(COUNT(*), 0) as total
                FROM status_history
            ),
            ranking AS (
                SELECT 
                    COALESCE(RANK() OVER (ORDER BY COUNT(*) DESC), 0) as rank,
                    COALESCE(COUNT(*) OVER (), 1) as total_admins
                FROM status_history
                WHERE created_at::DATE >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY changed_by
                HAVING changed_by = $1
            ),
            recent AS (
                SELECT 
                    account_number,
                    old_status,
                    new_status,
                    created_at,
                    COALESCE(reason, '-') as reason
                FROM status_history
                WHERE changed_by = $1
                ORDER BY created_at DESC
                LIMIT 5
            ),
            status_dist AS (
                SELECT 
                    new_status,
                    COUNT(*) as count
                FROM status_history
                WHERE changed_by = $1 
                    AND created_at::DATE = CURRENT_DATE
                GROUP BY new_status
                ORDER BY count DESC
            ),
            admin_info AS (
                SELECT username, name, role
                FROM users
                WHERE id = $1 AND enabled = true
            )
            SELECT 
                (SELECT row_to_json(admin_info) FROM admin_info) as admin,
                (SELECT row_to_json(my_stats) FROM my_stats) as stats,
                (SELECT row_to_json(system_stats) FROM system_stats) as system,
                (SELECT row_to_json(ranking) FROM ranking) as ranking,
                (SELECT json_agg(recent) FROM recent) as recent,
                (SELECT json_agg(status_dist) FROM status_dist) as status_distribution
        `, [adminId]);

        const data = result.rows[0];

        // Check if admin exists
        if (!data || !data.admin) {
            console.log("❌ Admin not found");
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        // Calculate percentages
        const stats = data.stats || { today: 0, week: 0, month: 0, total: 0 };
        const system = data.system || { today: 0, week: 0, month: 0, total: 0 };
        const rank = data.ranking || { rank: 0, total_admins: 1 };

        const calcPercent = (my, total) => {
            if (!total || total === 0) return 0;
            return Math.round((my / total) * 100);
        };

        const responseData = {
            admin: data.admin,
            stats: stats,
            system: system,
            percentages: {
                today: calcPercent(stats.today, system.today),
                week: calcPercent(stats.week, system.week),
                month: calcPercent(stats.month, system.month),
                total: calcPercent(stats.total, system.total)
            },
            ranking: {
                rank: rank.rank || 0,
                total: rank.total_admins || 1
            },
            recent: data.recent || [],
            statusDistribution: data.status_distribution || []
        };

        console.log("✅ Dashboard data sent successfully");
        res.json({
            success: true,
            data: responseData
        });

    } catch (error) {
        console.error('❌ Dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data',
            error: error.message
        });
    }
});

module.exports = router;