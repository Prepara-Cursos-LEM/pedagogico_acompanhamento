module.exports = {
    Log: (flag, msg, error) => {
        const date = new Date().toLocaleString().split(", ");
        const filename = date[0].split("/").join("-") + "-" + date[1].split(":").join("-");
        const logEntry = {
            date,
            flag,
            msg,
            error: error ? error.stack || error.toString() : null
        };
        require("fs").writeFileSync(`data/logs/${filename}.log`, JSON.stringify(logEntry, false, 2), {
            encoding: "utf-8",
            recursive: true
        });
        // Keep only lasts 7 days of logs
        const logsDir = require("./config").tmpDir + "/logs";
        const files = require("fs").readdirSync(logsDir);
        const now = Date.now();
        for (const file of files) {
            const filePath = `${logsDir}/${file}`;
            const stats = require("fs").statSync(filePath);
            if (now - stats.mtimeMs > 7 * 24 * 60 * 60 * 1000) {
                require("fs").unlinkSync(filePath);
            }
        }
        console.log(logEntry);
    }
};