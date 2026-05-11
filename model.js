/**
 * Representa uma célula que pode conter um valor simples ou uma estrutura de fórmula.
 * Encapsula a extração do valor efetivo (resultado calculado) e preserva metadados.
 */
class Cell {
    #raw;
    #effectiveValue;

    constructor(rawValue) {
        this.#raw = rawValue;
        this.#effectiveValue = this.#extractEffectiveValue(rawValue);
    }

    #extractEffectiveValue(raw) {
        if (raw == null || raw == undefined) return null;
        if (typeof raw !== 'object') return raw;

        // Se for um objeto com a propriedade "result", usa esse valor.
        if ('result' in raw) {
            const result = raw.result;
            // Trata erros do Excel (ex: { error: "#REF!" })
            if (result && typeof result == 'object' && result.error) {
                return result.error;
            }
            return result;
        }

        // Se for um objeto com "formula" mas sem "result", retorna null ou a própria fórmula?
        // Para consistência, retornamos null, mas poderíamos expor a fórmula.
        if ('formula' in raw) {
            // Poderia retornar raw.formula, mas mantemos o comportamento padrão de valor efetivo.
            return null;
        }

        // Caso genérico: retorna o próprio objeto (pode ocorrer em sharedFormula sem result)
        return raw;
    }

    /** Retorna o valor efetivo da célula (resultado da fórmula, valor bruto ou erro) */
    get value() {
        return this.#effectiveValue;
    }

    /** Retorna o conteúdo original (útil para debug ou exportação) */
    get raw() {
        return this.#raw;
    }

    /** Verifica se a célula contém um erro (ex: "#REF!") */
    isError() {
        return typeof this.#effectiveValue == 'string' && this.#effectiveValue.startsWith('#');
    }

    toJSON() {
        return this.#effectiveValue;
    }
}

/**
 * Representa uma linha da planilha.
 * Armazena internamente um Map (chave → instância de Cell).
 */
class Row {
    #data;

    constructor(data = {}) {
        this.#data = new Map();
        for (const [key, rawValue] of Object.entries(data)) {
            this.#data.set(key, new Cell(rawValue));
        }
    }

    /**
     * Retorna o valor efetivo associado a uma chave.
     * @param {string} key - Nome da coluna.
     * @returns {*} Valor efetivo ou undefined se não existir.
     */
    get(key) {
        const cell = this.#data.get(key);
        return cell ? cell.value : undefined;
    }

    /**
     * Retorna a instância de Cell associada à chave (acesso a metadados).
     * @param {string} key
     * @returns {Cell|undefined}
     */
    getCell(key) {
        return this.#data.get(key);
    }

    /**
     * Define ou atualiza o valor de uma chave na linha.
     * @param {string} key
     * @param {*} value - Valor bruto (será convertido em Cell).
     * @returns {Row}
     */
    set(key, value) {
        this.#data.set(key, new Cell(value));
        return this;
    }

    /**
     * Remove uma chave da linha.
     * @param {string} key
     * @returns {Row}
     */
    remove(key) {
        this.#data.delete(key);
        return this;
    }

    /**
     * Converte a linha em um objeto simples com valores efetivos.
     * @returns {Object<string, *>}
     */
    toObject() {
        const obj = {};
        for (const [key, cell] of this.#data) {
            obj[key] = cell.value;
        }
        return obj;
    }

    /**
     * Exporta a linha com os dados brutos (incluindo metadados de fórmula).
     * Útil para recriar o formato original.
     * @returns {Object<string, *>}
     */
    toRawObject() {
        const obj = {};
        for (const [key, cell] of this.#data) {
            obj[key] = cell.raw;
        }
        return obj;
    }
}

/**
 * Representa uma visão de uma coluna dentro de uma Sheet.
 * Opera diretamente sobre as linhas, retornando valores efetivos.
 */
class Column {
    #sheet;
    #name;

    constructor(sheet, name) {
        this.#sheet = sheet;
        this.#name = name;
        if (!this.#sheet.getHeaders().includes(name)) {
            throw new Error(`Column "${name}" does not exist`);
        }
    }

    /**
     * Retorna o valor efetivo da coluna em uma linha específica.
     * @param {number} index
     * @returns {*}
     */
    get(index) {
        const row = this.#sheet.getRows()[index];
        return row ? row.get(this.#name) : undefined;
    }

    /**
     * Define o valor da coluna em uma linha específica.
     * @param {number} index
     * @param {*} value
     * @returns {Column}
     */
    set(index, value) {
        const row = this.#sheet.getRows()[index];
        if (row) row.set(this.#name, value);
        return this;
    }

    /**
     * Retorna todos os valores efetivos da coluna.
     * @returns {Array<*>}
     */
    getAll() {
        return this.#sheet.getRows().map(r => r.get(this.#name));
    }

    /**
     * Define os valores da coluna em todas as linhas.
     * @param {Array<*>} values
     * @returns {Column}
     */
    setAll(values) {
        this.#sheet.getRows().forEach((row, i) => {
            row.set(this.#name, values[i] ?? null);
        });
        return this;
    }

    /**
     * Aplica uma função de transformação aos valores efetivos.
     * @param {function(*, number): *} fn
     * @returns {Array<*>}
     */
    map(fn) {
        return this.getAll().map(fn);
    }

    /**
     * Itera sobre os valores efetivos da coluna.
     * @param {function(*, number): void} fn
     */
    forEach(fn) {
        this.#sheet.getRows().forEach((row, i) => {
            fn(row.get(this.#name), i);
        });
    }

    /**
     * Remove a coluna da planilha.
     * @returns {Column}
     */
    remove() {
        this.#sheet.removeColumn(this.#name);
        return this;
    }

    /**
     * Renomeia a coluna.
     * @param {string} newName
     * @returns {Column}
     */
    rename(newName) {
        const headers = this.#sheet.getHeaders();
        if (headers.includes(newName)) {
            throw new Error("Column already exists");
        }
        this.#sheet.getRows().forEach(row => {
            const cell = row.getCell(this.#name);
            const rawValue = cell ? cell.raw : null;
            row.set(newName, rawValue);
            row.remove(this.#name);
        });
        this.#sheet.removeColumn(this.#name);
        this.#sheet.addColumn(newName);
        this.#name = newName;
        return this;
    }
}

/**
 * Representa uma planilha (sheet) com cabeçalhos e linhas.
 * Processa dados brutos no formato Excel (A1, B2, ...) extraídos de rawData.json.
 */
class Sheet {
    #name;
    #headers = [];
    #rows = [];

    /**
     * @param {string} name - Nome da planilha.
     * @param {Object[]} [rawData=[]] - Array de objetos representando linhas (ex: rawData.json).
     */
    constructor(name, rawData = []) {
        this.#name = name;
        if (rawData.length == 0) return;
        this.#parse(rawData);
    }

    /**
     * Processa os dados brutos: extrai cabeçalhos da primeira linha e converte as demais em Row.
     * @private
     */
    #parse(raw) {
        if (raw.length == 0) return;

        const headerRow = raw[0];
        // Mapeia letra da coluna → nome do cabeçalho (ex: "A" → "ALUNOS ")
        const columnMap = new Map();
        for (const [cellRef, headerValue] of Object.entries(headerRow)) {
            const colLetter = cellRef.replace(/\d+$/, ''); // "A1" → "A"
            // headerValue pode ser string ou objeto de fórmula; usamos o valor efetivo
            const headerCell = new Cell(headerValue);
            columnMap.set(colLetter, headerCell.value?.toString().trim() || '');
        }

        this.#headers = Array.from(columnMap.values());

        // Processa as linhas de dados (índices 1 em diante)
        for (let i = 1; i < raw.length; i++) {
            const rawRow = raw[i];
            const rowData = {};

            for (const [cellRef, rawValue] of Object.entries(rawRow)) {
                const colLetter = cellRef.replace(/\d+$/, '');
                const header = columnMap.get(colLetter);
                if (header !== undefined) {
                    rowData[header] = rawValue;
                }
                // Se não houver cabeçalho mapeado, ignora (colunas extras)
            }

            // Preenche colunas ausentes com null
            for (const header of this.#headers) {
                if (!(header in rowData)) {
                    rowData[header] = null;
                }
            }

            this.#rows.push(new Row(rowData));
        }
    }

    /** @returns {string} Nome da planilha */
    get name() {
        return this.#name;
    }

    /** @returns {string[]} Lista de cabeçalhos */
    getHeaders() {
        return [...this.#headers];
    }

    /** @returns {Row[]} Lista de linhas */
    getRows() {
        return this.#rows;
    }

    /**
     * Adiciona uma nova linha.
     * @param {Object<string, *>} data
     * @returns {Row}
     */
    addRow(data) {
        const normalized = {};
        for (const header of this.#headers) {
            normalized[header] = data[header] ?? null;
        }
        const row = new Row(normalized);
        this.#rows.push(row);
        return row;
    }

    /**
     * Remove uma linha pelo índice.
     * @param {number} index
     * @returns {Sheet}
     */
    removeRow(index) {
        this.#rows.splice(index, 1);
        return this;
    }

    /**
     * Adiciona uma nova coluna.
     * @param {string} name
     * @param {*} [defaultValue=null]
     * @returns {Sheet}
     */
    addColumn(name, defaultValue = null) {
        if (!this.#headers.includes(name)) {
            this.#headers.push(name);
        }
        this.#rows.forEach(row => {
            row.set(name, defaultValue);
        });
        return this;
    }

    /**
     * Remove uma coluna.
     * @param {string} name
     * @returns {Sheet}
     */
    removeColumn(name) {
        this.#headers = this.#headers.filter(h => h !== name);
        this.#rows.forEach(row => row.remove(name));
        return this;
    }

    /**
     * Obtém uma referência para manipulação de uma coluna específica.
     * @param {string} name
     * @returns {Column}
     */
    column(name) {
        return new Column(this, name);
    }

    /**
     * Exporta a planilha para um array de objetos com valores efetivos.
     * @returns {Object[]}
     */
    toJSON() {
        return this.#rows.map(row => row.toObject());
    }

    /**
     * Exporta a planilha para o formato bruto (similar ao rawData.json).
     * @returns {Object[]}
     */
    toRawJSON() {
        if (this.#rows.length == 0) return [];

        // Reconstrói a linha de cabeçalho no formato "A1", "B1", etc.
        const headerRow = {};
        const colLetters = this.#headers.map((_, idx) => {
            let n = idx;
            let letter = '';
            while (n >= 0) {
                letter = String.fromCharCode((n % 26) + 65) + letter;
                n = Math.floor(n / 26) - 1;
            }
            return letter;
        });

        colLetters.forEach((letter, i) => {
            headerRow[`${letter}1`] = this.#headers[i];
        });

        const result = [headerRow];

        // Adiciona linhas de dados
        for (let i = 0; i < this.#rows.length; i++) {
            const row = this.#rows[i];
            const rawRow = {};
            colLetters.forEach((letter, colIdx) => {
                const header = this.#headers[colIdx];
                const cell = row.getCell(header);
                rawRow[`${letter}${i + 2}`] = cell ? cell.raw : null;
            });
            result.push(rawRow);
        }

        return result;
    }

    /**
     * Converte a planilha para o formato exigido pela função XLSXWriter.
     * @returns {{ name: string, rows: Object[] }} Objeto contendo nome da planilha e array de linhas (objetos planos).
     * @example
     * const sheet = new Sheet("Dados", rawData);
     * const output = sheet.toXLSXFormat();
     * // output = [{ name: "Dados", rows: [ { "ALUNOS ": "MIGUEL PIRES...", ... }, ... ] }]
     * 
     * // Uso com XLSXWriter:
     * await XLSXWriter(sheet.toXLSXFormat(), './output.xlsx');
     */
    toXLSXFormat() {
        return [{
            name: this.#name,
            rows: this.#rows.map(row => row.toObject())
        }];
    }
}

class Cadastro {
    CONTRATO;
    ALUNO;
    INICIOCONTRATO;
    TERMINOCONTRATO;
    PROXIMAMATERIA;
    PARCELASRESTANTES;
    MATERIASRESTANTES;
    QUANTIDADEAGENDAMENTOS;
    MATERIAATUAL;
    AULASMATERIAATUAL;
    AULASCONCLUIDAS;
    DIASAGENDAMENTO;
    HORASAGENDAMENTO;

    // CAMPOS CALCULADOS
    projecaoConclusao;
    terminoContrato;
    diasAteTerminoContrato;
    semanasAteTerminoContrato;
    status;
    atrasado;
    totalAulasRestantes;
    semanasRestantes;

    detalhes = {
        aulasRestantesAtivas: 12,
        aulasProximaConhecida: 10,
        futurasDesconhecidas: 0,
        totalAulasRestantes: 22,
        semanasRestantes: "11.0",
        agendamentosSemana: 2,

        materiasAtivas: [
            {
                materia: "Matemática",
                aulasTotal: 20,
                aulasConcluidas: 8,
                diasAgendamento: "Segunda, Quarta",
                horasAgendamento: "19:00"
            }
        ]
    }
}

module.exports = { Sheet, Cadastro };