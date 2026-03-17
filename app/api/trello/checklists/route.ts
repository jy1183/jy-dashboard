import { NextResponse } from 'next/server';
import axios from 'axios';

const TRELLO_API_KEY = process.env.TRELLO_API_KEY;
const TRELLO_API_TOKEN = process.env.TRELLO_API_TOKEN;
const TRELLO_WORKSPACE_ID = process.env.TRELLO_WORKSPACE_ID;

export async function GET(request: Request) {
    if (!TRELLO_API_KEY || !TRELLO_API_TOKEN || !TRELLO_WORKSPACE_ID) {
        return NextResponse.json({ error: 'Trello API credentials not configured' }, { status: 500 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const rangeDays = parseInt(searchParams.get('days') || '3', 10);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + rangeDays + 1); // Up to the end of the last day

        // 1. Fetch all boards in the workspace
        const boardsRes = await axios.get(
            `https://api.trello.com/1/organizations/${TRELLO_WORKSPACE_ID}/boards?key=${TRELLO_API_KEY}&token=${TRELLO_API_TOKEN}&fields=id,name`
        );
        const boards = boardsRes.data;

        // 2. Fetch cards with checklists for all boards concurrently
        const promises = boards.map((b: any) => 
            axios.get(`https://api.trello.com/1/boards/${b.id}/cards?checklists=all&fields=id,name,shortUrl&key=${TRELLO_API_KEY}&token=${TRELLO_API_TOKEN}`)
                .catch(e => {
                    console.error(`Error on board ${b.name}: ${e.message}`);
                    return { data: [] };
                })
        );
        
        const results = await Promise.all(promises);
        const allItems: any[] = [];

        // 3. Extract and filter checklist items
        results.forEach(res => {
            res.data.forEach((card: any) => {
                if (card.checklists) {
                    card.checklists.forEach((cl: any) => {
                        cl.checkItems.forEach((item: any) => {
                            if (item.due) {
                                const dueDate = new Date(item.due);
                                if (dueDate >= today && dueDate < endDate) {
                                    // Calculate day offset
                                    const diffTime = dueDate.getTime() - today.getTime();
                                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                                    
                                    allItems.push({
                                        id: item.id,
                                        cardId: card.id,
                                        title: item.name,
                                        cardName: card.name,
                                        cardUrl: card.shortUrl,
                                        listName: cl.name,
                                        due: dueDate,
                                        state: item.state, // 'complete' or 'incomplete'
                                        dayIndex: diffDays
                                    });
                                }
                            }
                        });
                    });
                }
            });
        });

        // 4. Sort items by due date
        allItems.sort((a, b) => a.due.getTime() - b.due.getTime());

        return NextResponse.json({
            date: today.toISOString().split('T')[0],
            tasks: allItems
        });

    } catch (error) {
        console.error('Error fetching Trello Checklists:', error);
        return NextResponse.json({ error: 'Failed to fetch Trello tasks' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    if (!TRELLO_API_KEY || !TRELLO_API_TOKEN) {
        return NextResponse.json({ error: 'Trello API credentials not configured' }, { status: 500 });
    }

    try {
        const body = await request.json();
        const { cardId, itemId, state, dueDate } = body; 

        if (!cardId || !itemId) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        let url = `https://api.trello.com/1/cards/${cardId}/checkItem/${itemId}?key=${TRELLO_API_KEY}&token=${TRELLO_API_TOKEN}`;
        
        if (state) {
            url += `&state=${state}`;
        }
        if (dueDate) {
            // Include due date. Trello expects an ISO string or similar valid date format
            url += `&due=${encodeURIComponent(dueDate)}`;
        }

        const res = await axios.put(url);

        return NextResponse.json({ success: true, item: res.data });
    } catch (error) {
        console.error('Error updating Trello Checklist Item:', error);
        return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
    }
}
