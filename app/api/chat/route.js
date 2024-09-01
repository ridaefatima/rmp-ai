import { NextResponse } from "next/server";
import { Pinecone } from '@pinecone-database/pinecone';
import axios from 'axios';

const systemPrompt = `You are a highly intelligent and helpful RateMyProfessor agent designed to assist students in finding the best professors according to their queries. For every student question, you will retrieve and rank the top 3 professors that best match their criteria using Retrieval-Augmented Generation (RAG).

Your responses should include the following details for each professor:

- Professor's Name
- Subject
- Average Rating (out of 5 stars)
- Key Review Highlights (mention any relevant feedback from students)

When responding:

- Prioritize relevance to the student's query.
- If the student asks for specific attributes (e.g., "best for tough courses" or "most approachable"), make sure to filter and rank accordingly.
- Provide a brief summary of why each professor made the top 3 list.
- End each response with a question to keep the conversation going, inviting the student to ask for more details or explore other professors.`;

export async function POST(req) {
    try {
        const data = await req.json();
        const text = data[data.length - 1]?.content;

        if (!text) {
            throw new Error('No content found in the request.');
        }

        // Hugging Face API to get the embedding
        const hf_token = process.env.HUGGINGFACE_API_KEY;
        const model_id = "sentence-transformers/all-MiniLM-L6-v2";
        const api_url = `https://api-inference.huggingface.co/pipeline/feature-extraction/${model_id}`;

        const embeddingResponse = await axios.post(api_url, {
            inputs: text,
            options: { wait_for_model: true }
        }, {
            headers: { Authorization: `Bearer ${hf_token}` }
        });

        // Log the full response to understand its structure
        console.log('Embedding Response:', embeddingResponse.data);

        // Extract the embedding directly from the response
        let embedding = embeddingResponse.data;

        // Validate the embedding dimensions
        const expectedLength = 384; // Check the model's documentation for the expected dimension
        if (Array.isArray(embedding) && embedding.length === expectedLength) {
            embedding = embedding;
        } else {
            throw new Error(`Unexpected embedding dimension: ${embedding.length}`);
        }

        // Initialize Pinecone and query the index
        const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
        const index = pc.Index('rag').namespace('ns1');

        const results = await index.query({
            topK: 3,
            includeMetadata: true,
            vector: embedding
        });

        // Log the results to check the data structure
        console.log('Query Results:', results);

        // Extract and format the metadata
        let resultString = 'Here are the top professors based on your query:\n';
        results.matches.forEach((match) => {
            const metadata = match.metadata || {};
            const professor = metadata.professor || 'N/A';
            const subject = metadata.subject || 'N/A';
            const stars = metadata.stars || 'N/A';
            const review = metadata.review || 'N/A';

            resultString += 
`Professor: ${professor}
Review Highlights: ${review}
Stars: ${stars}
Subject: ${subject}
\n`;
        });

        const lastMessage = data[data.length - 1];
        const lastMessageContent = lastMessage.content + resultString;
        const lastDataWithoutLastMessage = data.slice(0, data.length - 1);

        // Combine system prompt and user message content into a single string
        const combinedInputs = [
            systemPrompt,
            ...lastDataWithoutLastMessage.map((msg) => `User: ${msg.content}`),
            `User: ${lastMessageContent}`
        ].join('\n\n');

        // Generate a natural language response using Mistral
        const mistralModelId = "mistralai/mistral-7b-v0.1"; // Mistral model ID
        const mistralUrl = `https://api-inference.huggingface.co/models/${mistralModelId}`;

        const completionResponse = await axios.post(mistralUrl, {
            inputs: combinedInputs
        }, {
            headers: { Authorization: `Bearer ${hf_token}` }
        });

        return NextResponse.json(completionResponse.data);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
        return NextResponse.json({ error: error.response ? error.response.data : error.message });
    }
}
