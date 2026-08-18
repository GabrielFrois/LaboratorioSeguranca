// Usar xss para limpar as entradas do usuário

import { Request, Response } from "express";
import db from "../database";

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const query =
        // Deixei a linha como string
        "SELECT * FROM usuario WHERE email = $1 AND senha = $2";

    console.log(`Query Executada: ${query}`);

    // Passei os valores de $1 e $2
    const result = await db.query(query, [email, password]);

    if (result.rowCount && result.rowCount > 0) {

        res.json({
            success: true,
            user: result.rows[0]
        });

    } else {
        res.status(401).json({
            success: false,
            message: "Falha no login"
        });
    }
};


export const novoLogin = async (req: Request, res: Response) => {
    const { email, password, nome } = req.body;

    const queryNomeIpuExiste =
        // Tirei as variaveis
        "SELECT * FROM iptu WHERE nome = $1";

    console.log(`Query Executada: ${queryNomeIpuExiste}`);

    // Defini o valor de $1
    const iptuResult = await db.query(queryNomeIpuExiste, [nome]);

    if (iptuResult.rowCount && iptuResult.rowCount > 0) {

        const query =
            // Parametrizei para inserir novo usuario
            `INSERT INTO usuario (email, senha, nome, tipo_usuario_id)
             VALUES ($1, $2, $3, 3)`;

        console.log(`Query Executada: ${query}`);

        // Passei os valores de $1, $2 e $3
        const result = await db.query(query, [email, password, nome]);

        const queryIdUsuario =
            // Busca o id do usuario recem criado
            `SELECT id FROM usuario  
             WHERE email = $1 AND senha = $2`;

        console.log(`Query Executada: ${queryIdUsuario}`);

        // Passei os valores de $1 e $2
        const resultIdUsuario = await db.query(queryIdUsuario, [email, password]);

        const queryUpdateTabelaIptu =
            // Vincula o usuario criado ao registro de iptu usando os parametros
            `UPDATE iptu
             SET usuario_id = $1
             WHERE nome = $2;`

        console.log(`Query Executada: ${queryUpdateTabelaIptu}`);

        // Passei os valores de $1 e $2
        const resultUpdate = await db.query(queryUpdateTabelaIptu, [resultIdUsuario.rows[0].id, nome]);

        if (
            result.rowCount &&
            result.rowCount > 0 &&
            resultUpdate.rowCount &&
            resultUpdate.rowCount > 0
        ) {

            res.json({
                success: true,
                user: result.rows[0]

            });

        } else {
            res.status(401).json({
                success: false,
                message: "Falha no login"
            });
        }

    } else {
        res.status(404).json({
            success: false,
            message: `Nome '${nome}' não encontrado no cadastro de municipes`
        });
    }
};


export const atualizarIptu = async (req: Request, res: Response) => {

    const {
        usuarioId,
        novoValor
    } = req.body;

    const query =
        // Parametrizei a atualização do valor do iptu
        `UPDATE iptu
         SET valor = $1
         WHERE usuario_id = $2`;

    console.log(`Query Executada: ${query}`);

    try {
        // Passei os valores de $1 e $2
        await db.query(query, [novoValor, usuarioId]);

        res.json({
            message: "IPTU atualizado"
        });

    } catch (err: any) {
        res.status(500).json({
            error: err.message
        });
    }
};


export const getIptuPorIdUsuario = async (
    req: Request,
    res: Response
) => {

    const {
        usuarioId,
    } = req.body;
    const query =
        // Query parametrizada
        `SELECT * FROM iptu WHERE usuario_id = $1`;

    console.log(`Query Executada: ${query}`);

    try {
        // Passei o valor de $1
        const result = await db.query(query, [usuarioId]);

        console.log(`Retorno: ${JSON.stringify(result.rows)}`);

        res.json({
            iptu: result.rows
        });

    } catch (err: any) {

        res.status(500).json({
            error: err.message
        });
    }
};


export const getIptus = async (
    req: Request,
    res: Response
) => {


    const query = `SELECT * FROM iptu`;

    console.log(`Query Executada: ${query}`);

    try {

        const result = await db.query(query);

        res.json({
            iptu: result.rows
        });

    } catch (err: any) {

        res.status(500).json({
            error: err.message
        });
    }
};


export const getQRCodeOrCodBarras = async (
    req: Request,
    res: Response
) => {

    const tipo = req.query.tipo as string;


    let codigoHtml = "";

    if (tipo === "codigoDeBarras") {

        codigoHtml =
            `<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=123456789" />`;

    } else if (tipo === "qrcode") {

        codigoHtml =
            `<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=QRCodeDemo" />`;
    }

    res.send(`
        <h2>Tipo selecionado: ${tipo}</h2>
        ${codigoHtml}
    `);
};