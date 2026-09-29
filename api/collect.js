import { MongoClient } from 'mongodb';

// 1. A URI deve vir da Vercel (Variável de Ambiente)
const uri = process.env.MONGODB_URI; 

// Variável global para reutilizar a conexão (cache)
let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  // Se já tiver uma conexão, retorna ela (economiza tempo e recursos)
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  // Se não tiver, cria uma nova conexão
  const client = await MongoClient.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const db = client.db('meu_projeto_db'); // Nome do seu banco

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export default async function handler(req, res) {
  // 2. Só aceita POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // 3. Desestruturação dos dados (Certifique-se que o front envia isso)
  const { ip, email, userAgent, timestamp } = req.body;

  if (!ip || !email) {
    return res.status(400).json({ error: 'Dados insuficientes (IP ou Email faltando)' });
  }

  try {
    // 4. Conecta ao banco usando a função otimizada
    const { db } = await connectToDatabase();
    const collection = db.collection('capturas');

    // 5. Prepara o objeto para salvar
    const novoRegistro = {
      ip,
      email,
      userAgent,
      timestamp: timestamp || new Date().toISOString(),
      data_coleta: new Date()
    };

    // 6. Insere no MongoDB
    const result = await collection.insertOne(novoRegistro);

    // 7. Responde ao seu site (Front-end)
    return res.status(200).json({ 
      status: 'sucesso', 
      message: 'Dados salvos com sucesso!',
      id: result.insertedId 
    });

  } catch (error) {
    console.error("ERRO NO BACKEND:", error.message);
    return res.status(500).json({ error: 'Erro interno no servidor ao salvar dados' });
  }
}
