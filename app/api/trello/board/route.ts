import { NextResponse } from 'next/server';
import axios from 'axios';

const TRELLO_API_KEY = process.env.TRELLO_API_KEY;
const TRELLO_API_TOKEN = process.env.TRELLO_API_TOKEN;

// We can make this dynamic or hardcoded for now as it's the main board
const BOARD_ID = 'XOH8XjzB'; 

export async function GET() {
    if (!TRELLO_API_KEY || !TRELLO_API_TOKEN) {
        return NextResponse.json({ error: 'Trello API credentials not configured' }, { status: 500 });
    }

    try {
        // 1. Fetch Lists for the board
        const listsRes = await axios.get(
            `https://api.trello.com/1/boards/${BOARD_ID}/lists?key=${TRELLO_API_KEY}&token=${TRELLO_API_TOKEN}&fields=id,name`
        );
        const lists = listsRes.data;

        // 2. Fetch Cards for the board
        const cardsRes = await axios.get(
            `https://api.trello.com/1/boards/${BOARD_ID}/cards?key=${TRELLO_API_KEY}&token=${TRELLO_API_TOKEN}&fields=id,name,idList,url,due,labels`
        );
        const cards = cardsRes.data;

        // 3. Group cards by list
        const boardData = lists.map((list: any) => ({
            id: list.id,
            name: list.name,
            cards: cards.filter((card: any) => card.idList === list.id)
        }));

        return NextResponse.json({
            boardName: 'Trello Workspace', // Can fetch board name separately if needed
            lists: boardData
        });

    } catch (error: any) {
        console.error('Error fetching Trello Board:', error.response?.data || error.message);
        return NextResponse.json({ error: 'Failed to fetch Trello board data' }, { status: 500 });
    }
}
