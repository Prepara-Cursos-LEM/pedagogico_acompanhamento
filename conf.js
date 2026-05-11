module.exports = {
    tmpDir: "data",
    port: 9123,
    tokenSecret: "s3cr3tK3yabcdefF0rT0k3nS1gn1ng99",
    params: require("fs").readFileSync("data/params", "utf-8")
};