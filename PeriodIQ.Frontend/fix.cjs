const fs = require('fs');
const path = require('path');

// Function to reverse mojibake
function reverseMojibake(str) {
    // Convert the string back to bytes using latin1
    const buf = Buffer.from(str, 'latin1');
    return buf.toString('utf8');
}

const files = [
    "src/pages/user/workout-plans/components/PlanPreview.jsx",
    "src/pages/user/workout-plans/components/PlanList.jsx",
    "src/pages/user/workout-plans/components/PageHeader.jsx",
    "src/pages/user/workout-plans/components/Metric.jsx",
    "src/pages/user/workout-plans/components/GeneratePlanForm.jsx",
    "src/pages/user/profile/ProfilePage.jsx",
    "src/pages/user/profile/components/TrainingProfileCard.jsx",
    "src/pages/user/profile/components/PersonalInfoCard.jsx",
    "src/pages/user/log-workout/LogWorkout.jsx",
    "src/pages/user/dashboard/UserDashboardPage.jsx",
    "src/pages/user/dashboard/components/WeeklyIntensityChart.jsx",
    "src/pages/user/dashboard/components/RecentPrsCard.jsx",
    "src/pages/user/dashboard/components/NextSessionCard.jsx",
    "src/pages/user/dashboard/components/CnsStatusCard.jsx",
    "src/components/layout/UserSidebar.jsx"
];

for (const file of files) {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        // Check if there are corrupted characters (mojibake)
        if (content.includes('Ã') || content.includes('Á') || content.includes('Ä')) {
            try {
                const reversed = reverseMojibake(content);
                fs.writeFileSync(fullPath, reversed, 'utf8');
                console.log(`Reversed ${file}`);
            } catch (e) {
                console.error(`Error on ${file}`);
            }
        }
    }
}
