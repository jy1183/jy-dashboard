import { NextResponse } from 'next/server';
import axios from 'axios';

const TRELLO_API_KEY = process.env.TRELLO_API_KEY;
const TRELLO_API_TOKEN = process.env.TRELLO_API_TOKEN;

export async function POST(request: Request) {
    if (!TRELLO_API_KEY || !TRELLO_API_TOKEN) {
        return NextResponse.json({ error: 'Trello API credentials not configured' }, { status: 500 });
    }

    try {
        const body = await request.json();
        const { cardId, text } = body;

        if (!cardId || !text) {
            return NextResponse.json({ error: 'cardId and text are required' }, { status: 400 });
        }

        const res = await axios.post(
            `https://api.trello.com/1/cards/${cardId}/actions/comments?key=${TRELLO_API_KEY}&token=${TRELLO_API_TOKEN}`,
            { text }
        );

        return NextResponse.json(res.data);
    } catch (error: any) {
        console.error('Error adding comment to Trello Card:', error.response?.data || error.message);
        return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
    }
}
