const fs = require('fs').promises;
const path = require('path');

class File {
    constructor(ttlMs = 5000) {
        this.cache = new Map(); // path -> { data, expiresAt }
        this.locks = new Map();
        this.ttlMs = ttlMs;
    }

    async read(filePath, encoding = "utf-8") {
        const fullPath = path.resolve(filePath);
        const now = Date.now();

        if (this.cache.has(fullPath)) {
            const entry = this.cache.get(fullPath);
            if (entry.expiresAt > now) {
                return entry.data;
            }
            this.cache.delete(fullPath); // TTL expirado
        }

        if (this.locks.has(fullPath)) {
            return await this.locks.get(fullPath);
        }

        const promise = fs.readFile(fullPath, encoding ?? undefined)
            .then(data => {
                this.cache.set(fullPath, {
                    data,
                    expiresAt: Date.now() + this.ttlMs
                });
                return data;
            }).finally(() => {
                this.locks.delete(fullPath);
            });

        this.locks.set(fullPath, promise);
        return await promise;
    }

    async write(filePath, data, encoding = "utf-8") {
        const fullPath = path.resolve(filePath);

        if (this.locks.has(fullPath)) {
            await this.locks.get(fullPath);
        }

        const promise = (async () => {
            const dir = path.dirname(fullPath);
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(fullPath, data, encoding ?? undefined);
        })();

        this.locks.set(fullPath, promise);

        try {
            await promise;
            this.cache.set(fullPath, {
                data,
                expiresAt: Date.now() + this.ttlMs
            });
            return true;
        } finally {
            this.locks.delete(fullPath);
        }
    }

    async delete(filePath) {
        const fullPath = path.resolve(filePath);

        if (this.locks.has(fullPath)) {
            await this.locks.get(fullPath);
        }

        const promise = fs.unlink(fullPath).catch(err => {
            if (err.code !== 'ENOENT') throw err;
        });

        this.locks.set(fullPath, promise);

        try {
            await promise;
            this.cache.delete(fullPath);
            return true;
        } finally {
            this.locks.delete(fullPath);
        }
    }

    clearCache() {
        const size = this.cache.size;
        this.cache.clear();
        return size;
    }
}

class Parser {
    /**
     * Reads a Buffer from a file and returns an object
     * @param {Buffer<ArrayBuffer>} raw 
     * @returns {Object} [ { name: 'Ana', age: '20' }, { name: 'Bob', age: '30' } ]
     */
    read(raw) {
        let lines = Buffer.from(raw).toString("utf8").split("\n").filter(Boolean);

        if (lines.length === 0) return [];

        const headers = lines[0]
            .replaceAll("\r", "")
            .split(",");

        const result = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i]
                .replaceAll("\r", "")
                .split(",");

            const row = {};

            for (let j = 0; j < headers.length; j++) {
                row[headers[j]] = (values[j] || "")
                    .replaceAll("&#44;", ",")
                    .replaceAll("&#10;", "\n")
                    .trim();
            }

            result.push(row);
        }
        return result;
    }

    /**
     * 
     * @param {String} data 
     * @returns {Buffer<ArrayBuffer>}
     */
    write(data = []) {
        if (!Array.isArray(data) || data.length == 0) {
            return Buffer.from("");
        }

        const headers = Object.keys(data[0]);
        const lines = [];
        // Header
        lines.push(headers.join(","));
        // Rows
        for (const row of data) {
            const line = headers.map(header =>
                String(row[header] ?? "")
                    .replaceAll(",", "&#44;")
                    .replaceAll("\n", "&#10;")
                    .trim()
            );
            lines.push(line.join(","));
        }

        const csv = lines.join("\n") + "\n";

        return Buffer.from(csv, "utf8");
    }
}

class Query {
    constructor(baseDir) {
        this.baseDir = path.resolve(baseDir);
        this.cache = new FileCache();
        this.parser = new Parser();
    }
    async Check(id) {
        try {
            await this.cache.read(path.join(this.baseDir, `${id}.bin`));
            return true;
        } catch {
            return false;
        }
    }
    async Get(id) {
        const data = await this.cache.read(path.join(this.baseDir, `${id}.bin`));
        return this.parser.read(data);
    }
    async Create(id, payload) {
        const filePath = path.join(this.baseDir, `${id}.bin`);

        if (await this.Check(id)) {
            throw new Error("Registro já existe");
        }

        const data = this.parser.write(payload);
        await this.cache.write(filePath, data);
        return payload;
    }
    async Modify(id, payload) {
        const filePath = path.join(this.baseDir, `${id}.bin`);

        if (!(await this.Check(id))) {
            throw new Error("Registro não existe");
        }

        const data = this.parser.write(payload);
        await this.cache.write(filePath, data);
        return payload;
    }
    async Remove(id) {
        try {
            await this.cache.delete(path.join(this.baseDir, `${id}.bin`));
            return true;
        } catch (error) {
            return false;
        }
    }
}

module.exports = {
    filseService: new File()
};