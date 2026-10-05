// Usar xss para limpar as entradas do usuário

import { Request, Response } from "express";
import db from "../database";
// Biblioteca que limpa HTML/JS malicioso de textos
import xss from "xss";

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const query =
        // Deixei a linha como string
        // $1 e $2 no lugar de concatenar email e senha
        "SELECT * FROM usuario WHERE email = $1 AND senha = $2";

    console.log(`Query Executada: ${query}`);

    // Valores de $1 e $2
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
    // email e nome são limpos com xss
    // A senha não passa pelo xss, porque poderia ser alterado e quebrar o login
    const { password } = req.body;
    const email = xss(String(req.body.email ?? ""));
    const nome = xss(String(req.body.nome ?? ""));

    const queryNomeIpuExiste =
        // Deixei a linha como string
        // $1 no lugar do nome
        "SELECT * FROM iptu WHERE nome = $1";

    console.log(`Query Executada: ${queryNomeIpuExiste}`);

    // Valor de $1
    const iptuResult = await db.query(queryNomeIpuExiste, [nome]);

    if (iptuResult.rowCount && iptuResult.rowCount > 0) {

        const query =
            // $1, $2 e $3 no lugar de concatenar os valores
            `INSERT INTO usuario (email, senha, nome, tipo_usuario_id)
             VALUES ($1, $2, $3, 3)`;

        console.log(`Query Executada: ${query}`);

        // Valores de $1, $2 e $3
        const result = await db.query(query, [email, password, nome]);

        const queryIdUsuario =
            // $1 e $2 no lugar de email e senha
            `SELECT id FROM usuario  
             WHERE email = $1 AND senha = $2`;

        console.log(`Query Executada: ${queryIdUsuario}`);

        // Valores de $1 e $2
        const resultIdUsuario = await db.query(queryIdUsuario, [email, password]);

        const queryUpdateTabelaIptu =
            // Vincula o usuario criado ao registro de iptu
            // Parametrizado com $1 e $2
            `UPDATE iptu
             SET usuario_id = $1
             WHERE nome = $2;`

        console.log(`Query Executada: ${queryUpdateTabelaIptu}`);

        // Valores de $1 e $2
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
        // Nome aqui já foi limpo pelo xss no início da função
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
        // $1 e $2 no lugar de valor e id
        `UPDATE iptu
         SET valor = $1
         WHERE usuario_id = $2`;

    console.log(`Query Executada: ${query}`);

    try {
        // Valores de $1 e $2
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
        // $1 no lugar do id do usuário
        `SELECT * FROM iptu WHERE usuario_id = $1`;

    console.log(`Query Executada: ${query}`);

    try {
        // Valor de $1
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

    // Sem "as string", para validar o tipo real do valor
    const tipo = req.query.tipo;

    // Só aceita os dois valores esperados, qualquer outro é recusado
    if (tipo !== "codigoDeBarras" && tipo !== "qrcode") {
        res.status(400).send("Tipo inválido");
        return;
    }


    let codigoHtml = "";

    if (tipo === "codigoDeBarras") {

        codigoHtml =
            `<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=123456789" />`;

    } else if (tipo === "qrcode") {

        codigoHtml =
            `<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=QRCodeDemo" />`;
    }

    // Segunda camada, o xss escapa o valor antes de colocarno HTML
    res.send(`
        <h2>Tipo selecionado: ${xss(tipo)}</h2>
        ${codigoHtml}
    `);
};