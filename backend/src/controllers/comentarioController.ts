
import { Request, Response } from "express";
import db from "../database";
import xss from "xss";


export const criarComentario = async (
    req: Request,
    res: Response
) => {

    const {
        texto,
        usuarioId
    } = req.body;

    // Limpa o texto antes de salvar, String() garante que seja sempre texto
    const textoLimpo = xss(String(texto ?? ""));

    // Valores trocados por $1 e $2
    const query =
        `INSERT INTO comentario (texto, usuario_id)
        VALUES ($1, $2)`;

    console.log(`Query Executada: ${query}`);


    try {

        // Valores de $1 e $2
        await db.query(query, [textoLimpo, usuarioId]);

        res.status(201).json({
            message: "Comentário criado"
        });

    } catch (err: any) {

        res.status(500).json({
            error: err.message
        });
    }
};


export const listarComentarios = async (
    _req: Request,
    res: Response
) => {

    try {

        const result = await db.query(
            "SELECT * FROM comentario"
        );

        // Limpa o texto ao listar, para pegar comentários maliciosos que já estavam salvos no banco antes da correção
        const comentarios = result.rows.map((c) => ({
            ...c,
            texto: xss(c.texto ?? ""),
        }));

        res.json(comentarios);

    } catch (err: any) {

        res.status(500).json({
            error: err.message
        });
    }
};