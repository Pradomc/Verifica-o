import { MongoClient } from 'mongodb';

// A Vercel vai ler essa variável que você configurou no painel dela
const uri = process.env.MONGODB_URI; 
const client = new MongoClient(uri);

export default async function handler(req, res) {
    // 1. Só aceita requisições POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    // 2. Pega os dados enviados pelo Front-end
    const { ip, email, userAgent, timestamp } = req.body;

    if (!ip || !email) {
        return res.status(400).json({ error: 'Dados insuficientes' });
    }

    try {
        // 3. Conecta ao MongoDB
        await client.connect();
        const database = client.db('meu_projeto_db'); 
        const collection = database.collection('capturas'); 

        // 4. Salva o registro
        const novoRegistro = {
            ip,
            email,
            userAgent,
            timestamp: timestamp || new Date().toISOString(),
            data_coleta: new Date()
        };

        await collection.insertOne(novoRegistro);

        // 5. Responde ao Front-end
        return res.status(200).json({ 
            status: 'sucesso', 
            message: 'Dados salvos!' 
        });

    } catch (error) {
        console.error("Erro no MongoDB:", error);
        return res.status(500).json({ error: 'Erro interno no servidor' });
    } finally {
        // 6. Fecha a conexão
        await client.close();
    }
}