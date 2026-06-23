import fs from 'fs';
import path from 'path';

export default async () => {
    const resultsDir = 'allure-results';
    const reportDir = 'allure-report';
    const historySrc = path.join(reportDir, 'history');
    const historyDest = path.join(resultsDir, 'history');

    // Clean previous results
    if (fs.existsSync(resultsDir)) {
        fs.rmSync(resultsDir, { recursive: true, force: true });
    }

    // Restore history if it exists
    if (fs.existsSync(historySrc)) {
        fs.mkdirSync(historyDest, { recursive: true });
        fs.cpSync(historySrc, historyDest, { recursive: true });
    }
};