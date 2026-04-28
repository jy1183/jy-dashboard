import { NextResponse } from 'next/server';
import axios from 'axios';

const TRELLO_API_KEY = process.env.TRELLO_API_KEY;
const TRELLO_API_TOKEN = process.env.TRELLO_API_TOKEN;

const DEFAULT_BOARD_ID = 'XOH8XjzB';

export async function GET(request: Request) {
    if (!TRELLO_API_KEY || !TRELLO_API_TOKEN) {
        return NextResponse.json({ error: 'Trello API credentials not configured' }, { status: 500 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const boardId = searchParams.get('boardId') || DEFAULT_BOARD_ID;

        // 1. Fetch board info
        const boardRes = await axios.get(
            `https://api.trello.com/1/boards/${boardId}?key=${TRELLO_API_KEY}&token=${TRELLO_API_TOKEN}&fields=id,name,shortUrl`
        );
        const board = boardRes.data;

        // 2. Fetch Lists for the board
        const listsRes = await axios.get(
            `https://api.trello.com/1/boards/${boardId}/lists?key=${TRELLO_API_KEY}&token=${TRELLO_API_TOKEN}&fields=id,name`
        );
        const lists = listsRes.data;

        // 3. Fetch Cards for the board (include checklists count, members, desc preview)
        const cardsRes = await axios.get(
            `https://api.trello.com/1/boards/${boardId}/cards?key=${TRELLO_API_KEY}&token=${TRELLO_API_TOKEN}&fields=id,name,idList,url,shortUrl,due,labels,desc,idMembers,badges`
        );
        const cards = cardsRes.data;

        // 4. Group cards by list
        const boardData = lists.map((list: any) => ({
            id: list.id,
            name: list.name,
            cards: cards.filter((card: any) => card.idList === list.id)
        }));

        return NextResponse.json({
            boardId: board.id,
            boardName: board.name,
            boardUrl: board.shortUrl,
            lists: boardData
        });

    } catch (error: any) {
        console.error('Error fetching Trello Board:', error.response?.data || error.message);
        return NextResponse.json({ error: 'Failed to fetch Trello board data' }, { status: 500 });
    }
}
