'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ExternalLink, RefreshCw, ChevronRight, Trello, Bell, Link } from 'lucide-react';

const TRELLO_BOARDS = [
  { id: 'zHDWraQl', name: '동천동', url: 'https://trello.com/b/zHDWraQl' },
  { id: 'yFCQoAY5', name: '기타', url: 'https://trello.com/b/yFCQoAY5' },
  { id: 'XOH8XjzB', name: '준비', url: 'https://trello.com/b/XOH8XjzB' },
  { id: 'p4hR5CFc', name: '법인', url: 'https://trello.com/b/p4hR5CFc' },
];

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? '100%' : '-100%', opacity: 0.3 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? '-100%' : '100%', opacity: 0.3 }),
};

export default function Home() {
  const [currentPage, setCurrentPage] = useState(0);
  const [slideDirection, setSlideDirection] = useState(0);
  const [news, setNews] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [todos, setTodos] = useState<any[]>([]);
  const [showWeekly, setShowWeekly] = useState(false);
  const [weeklyTasks, setWeeklyTasks] = useState<any[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [loadingNotices, setLoadingNotices] = useState(false);
  const [loadingTodos, setLoadingTodos] = useState(true);
  const [selectedBoardIdx, setSelectedBoardIdx] = useState(2);
  const [boardData, setBoardData] = useState<any>(null);
  const [loadingBoard, setLoadingBoard] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  useEffect(() => { fetchNews(); fetchTodos(); fetchNotices(); }, []);

  const navigateTo = (page: number) => {
    setSlideDirection(page > currentPage ? 1 : -1);
    setCurrentPage(page);
    if (page === 1 && !boardData) fetchBoardData(TRELLO_BOARDS[selectedBoardIdx].id);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showWeekly) return;
      if (e.key === 'ArrowRight' && currentPage === 0) navigateTo(1);
      if (e.key === 'ArrowLeft' && currentPage === 1) navigateTo(0);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, showWeekly]);

  const fetchBoardData = async (boardId: string) => {
    setLoadingBoard(true);
    try { const res = await fetch('/api/trello/board?boardId=' + boardId); const data = await res.json(); if (data.lists) setBoardData(data); }
    catch (e) { console.error('Failed to fetch board data:', e); }
    finally { setLoadingBoard(false); }
  };
  const switchBoard = (idx: number) => { setSelectedBoardIdx(idx); fetchBoardData(TRELLO_BOARDS[idx].id); };

  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try { const res = await fetch('/api/trello/notifications?limit=25'); const data = await res.json(); if (data.notifications) { setNotifications(data.notifications); setUnreadCount(data.unreadCount || 0); } }
    catch (e) { console.error(e); } finally { setLoadingNotifications(false); }
  };
  const markNotificationsRead = async () => {
    try { await fetch('/api/trello/notifications', { method: 'PUT' }); setUnreadCount(0); setNotifications(prev => prev.map(n => ({ ...n, unread: false }))); }
    catch (e) { console.error(e); }
  };
  const getNotificationText = (n: any) => {
    const m: Record<string, string> = { commentCard:'댓글', addedToCard:'카드에 추가됨', removedFromCard:'카드에서 제거됨', addedToBoard:'보드에 추가됨', addAttachmentToCard:'첨부파일 추가', changeCard:'카드 변경', updateCheckItemStateOnCard:'체크리스트 변경', createdCard:'카드 생성', moveCardToBoard:'카드 이동', mentionedOnCard:'멘션됨', addedMemberToCard:'멤버 추가' };
    return m[n.type] || n.type;
  };
  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '방금'; if (mins < 60) return mins + '분 전';
    const hours = Math.floor(mins / 60);
    if (hours < 24) return hours + '시간 전';
    return Math.floor(hours / 24) + '일 전';
  };

  const fetchNews = async () => { setLoadingNews(true); try { const res = await fetch('/api/news'); const data = await res.json(); if (data.articles) setNews(data.articles); } catch (e) { console.error(e); } finally { setLoadingNews(false); } };
  const fetchNotices = async () => { setLoadingNotices(true); try { const res = await fetch('/api/lh'); const data = await res.json(); if (data.notices) setNotices(data.notices); } catch (e) { console.error(e); } finally { setLoadingNotices(false); } };
  const fetchTodos = async () => { setLoadingTodos(true); try { const res = await fetch('/api/trello/checklists?days=3'); const data = await res.json(); if (data.tasks) setTodos(data.tasks); } catch (e) { console.error(e); } finally { setLoadingTodos(false); } };
  const openWeeklyView = async () => { setShowWeekly(true); try { const res = await fetch('/api/trello/checklists?days=6'); const data = await res.json(); if (data.tasks) setWeeklyTasks(data.tasks); } catch (e) { console.error(e); } };
  const openTrelloPopup = (url: string) => { const w = window.screen.width * 0.7; const h = window.screen.height * 0.7; const l = (window.screen.width - w) / 2; const t = (window.screen.height - h) / 2; window.open(url, '_blank', 'width=' + w + ',height=' + h + ',left=' + l + ',top=' + t + ',scrollbars=yes,resizable=yes'); };

  const handleCheck = async (taskId: string, cardId: string, currentState: string, isWeekly: boolean = false) => {
    const newState = currentState === 'complete' ? 'incomplete' : 'complete';
    const updateTask = (t: any) => t.id === taskId ? { ...t, state: newState } : t;
    if (isWeekly) setWeeklyTasks(prev => prev.map(updateTask)); else setTodos(prev => prev.map(updateTask));
    try { await fetch('/api/trello/checklists', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cardId, itemId: taskId, state: newState }) }); }
    catch (e) { console.error(e); const revertTask = (t: any) => t.id === taskId ? { ...t, state: currentState } : t; if (isWeekly) setWeeklyTasks(prev => prev.map(revertTask)); else setTodos(prev => prev.map(revertTask)); }
  };

  const handleDragStart = (e: React.DragEvent, task: any) => { e.dataTransfer.setData('task', JSON.stringify(task)); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDrop = async (e: React.DragEvent, targetDayOffset: number, isWeekly: boolean = false) => {
    e.preventDefault(); const taskJson = e.dataTransfer.getData('task'); if (!taskJson) return;
    const task = JSON.parse(taskJson); if (task.dayIndex === targetDayOffset) return;
    const currentDue = new Date(task.due); const today = new Date(); today.setHours(0, 0, 0, 0);
    const newDate = new Date(today); newDate.setDate(today.getDate() + targetDayOffset);
    newDate.setHours(currentDue.getHours() || 12, currentDue.getMinutes() || 0, 0);
    const newDueIso = newDate.toISOString();
    const updateTask = (t: any) => t.id === task.id ? { ...t, dayIndex: targetDayOffset, due: newDueIso } : t;
    if (isWeekly) setWeeklyTasks(prev => prev.map(updateTask)); else setTodos(prev => prev.map(updateTask));
    try { await fetch('/api/trello/checklists', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cardId: task.cardId, itemId: task.id, dueDate: newDueIso }) }); }
    catch (err) { console.error(err); if (isWeekly) setWeeklyTasks(prev => prev.map(t => t.id === task.id ? task : t)); else setTodos(prev => prev.map(t => t.id === task.id ? task : t)); }
  };

  const getDayName = (offset: number) => {
    const dates = ['일', '월', '화', '수', '목', '금', '토'];
    const d = new Date(); d.setDate(d.getDate() + offset);
    if (offset === 0) return '오늘 (' + (d.getMonth() + 1) + '/' + d.getDate() + ')';
    return dates[d.getDay()] + ' (' + (d.getMonth() + 1) + '/' + d.getDate() + ')';
  };
  const labelColor = (color: string) => {
    const map: Record<string, string> = { green:'bg-emerald-100 text-emerald-700 border-emerald-200', yellow:'bg-amber-100 text-amber-700 border-amber-200', orange:'bg-orange-100 text-orange-700 border-orange-200', red:'bg-red-100 text-red-700 border-red-200', purple:'bg-purple-100 text-purple-700 border-purple-200', blue:'bg-blue-100 text-blue-700 border-blue-200', sky:'bg-sky-100 text-sky-700 border-sky-200', lime:'bg-lime-100 text-lime-700 border-lime-200', pink:'bg-pink-100 text-pink-700 border-pink-200', black:'bg-slate-200 text-slate-700 border-slate-300' };
    return map[color] || 'bg-slate-100 text-slate-600 border-slate-200';
  };

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col">
      <AnimatePresence initial={false} custom={slideDirection} mode="popLayout">
        {currentPage === 0 && (
          <motion.main key="dashboard" custom={slideDirection} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ type: 'tween', duration: 0.35, ease: 'easeInOut' }} className="dashboard-container relative h-full w-full">
            <header className="dashboard-header flex justify-between items-center px-4">
              <div className="w-24"></div>
              <h1 className="dashboard-title m-0">WELLASSET BOARD</h1>
              <button onClick={() => navigateTo(1)} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold bg-sky-50 border border-sky-200 text-sky-600 hover:bg-sky-100 hover:border-sky-300 transition-all shadow-sm">
                <Trello size={15} /> 트렐로 보드 <ChevronRight size={14} />
              </button>
            </header>
            <div className="dashboard-grid">
              <section className="glass-card">
                <div className="card-header"><h2 className="card-title">스케줄</h2></div>
                <div className="card-content p-0 overflow-hidden relative">
                  <iframe src="https://calendar.google.com/calendar/embed?src=e1l3et8im3hak9mnto6r64da64%40group.calendar.google.com&ctz=Asia%2FSeoul&mode=AGENDA" style={{ border: 0, width: "100%", height: "100%", position: 'absolute', top: 0, left: 0 }} frameBorder="0" scrolling="no"></iframe>
                </div>
              </section>
              <section className="glass-card flex flex-col">
                <div className="card-header shrink-0 flex justify-between items-center">
                  <h2 className="card-title">할일 일정 (오늘 ~ 3일)</h2>
                  <div className="flex items-center gap-2">
                    <button className="refresh-btn text-xs bg-slate-200 hover:bg-slate-300 px-2 py-1 rounded text-slate-600 transition-colors" onClick={fetchTodos} disabled={loadingTodos}>{loadingTodos ? '...' : '새로고침'}</button>
                    <div className="text-xs text-slate-400">Trello API</div>
                  </div>
                </div>
                <div className="card-content flex-1 overflow-hidden relative">
                  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full overflow-y-auto pr-2 custom-scrollbar transition-opacity duration-300 ${loadingTodos ? 'opacity-40' : 'opacity-100'}`}>
                    {[0,1,2,3].map(dayOffset => {
                      const dayTasks = todos.filter(t => t.dayIndex === dayOffset);
                      const isToday = dayOffset === 0;
                      return (
                        <div key={dayOffset} className={`flex flex-col h-full rounded-xl border ${isToday ? 'bg-sky-50/30 border-sky-200' : 'bg-white/40 border-slate-100'} overflow-hidden`} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, dayOffset, false)}>
                          <div className={`py-2 px-3 text-center text-sm font-bold border-b ${isToday ? 'bg-sky-100/50 text-sky-700 border-sky-200' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>{getDayName(dayOffset)}</div>
                          <div className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar">
                            {dayTasks.map(task => (
                              <div key={task.id} draggable onDragStart={(e) => handleDragStart(e, task)} className={`p-2 rounded-lg border shadow-sm transition-all cursor-move ${task.state === 'complete' ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-200 hover:border-sky-300'}`}>
                                <div className="flex items-start gap-2">
                                  <input type="checkbox" checked={task.state === 'complete'} onChange={() => handleCheck(task.id, task.cardId, task.state, false)} className="mt-1 w-4 h-4 accent-sky-500 rounded cursor-pointer" />
                                  <div className="flex-1 min-w-0">
                                    <button onClick={() => openTrelloPopup(task.cardUrl)} className={`block text-left w-full text-[13px] font-bold leading-tight hover:text-sky-600 transition-colors ${task.state === 'complete' ? 'line-through text-slate-400' : 'text-slate-700'}`}>{task.title}</button>
                                    <div className="text-[11px] text-slate-500 mt-1 truncate" title={task.cardName}>{task.cardName}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {dayTasks.length === 0 && <div className="text-center text-slate-400 text-xs py-4 flex items-center justify-center h-full opacity-50 border-2 border-dashed border-transparent hover:border-slate-300 rounded-lg">가져다 놓기 (Drag & Drop)</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {loadingTodos && <div className="absolute inset-0 flex justify-center items-center bg-white/10 backdrop-blur-[1px] z-10"><div className="flex flex-col items-center gap-2"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-500"></div><div className="text-xs font-bold text-sky-600 bg-white/80 px-2 py-0.5 rounded shadow-sm">업데이트 중...</div></div></div>}
                </div>
                <div className="shrink-0 mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                  <div className="flex gap-2">
                    {TRELLO_BOARDS.map((board, idx) => (<button key={board.id} onClick={() => { navigateTo(1); switchBoard(idx); }} className="trello-shortcut-btn">{board.name}</button>))}
                  </div>
                  <button onClick={openWeeklyView} className="text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors tracking-wide">WEEKLY VIEW &rarr;</button>
                </div>
              </section>
              <section className="glass-card">
                <div className="card-header"><h2 className="card-title">부동산 뉴스</h2><div className="text-xs text-slate-400">bdsplanet</div></div>
                <div className="card-content">
                  {loadingNews ? <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-300"></div></div> : <ul>{news.map((item, idx) => (<li key={idx} className="news-item"><a href={item.link} target="_blank" rel="noopener noreferrer" className="news-link">{item.title}</a><span className="news-meta">{item.media}</span></li>))}</ul>}
                </div>
              </section>
              <section className="glass-card">
                <div className="card-header">
                  <h2 className="card-title"><a href="https://apply.lh.or.kr/lhapply/apply/pch/list.do?mi=1076" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">LH 매입공고</a></h2>
                  <button className="refresh-btn text-xs bg-slate-200 hover:bg-slate-300 px-2 py-1 rounded text-slate-600" onClick={fetchNotices} disabled={loadingNotices}>{loadingNotices ? '...' : '새로고침'}</button>
                </div>
                <div className="card-content">
                  {notices.length === 0 && !loadingNotices ? <div className="flex h-full items-center justify-center"><p className="text-slate-500 text-sm">데이터가 없습니다.</p></div> : (
                    <table className="lh-table"><thead><tr><th className="w-14">상태</th><th>공고명</th><th className="w-20">공고일</th><th className="w-20">마감일</th></tr></thead><tbody>
                      {notices.map((notice, idx) => (<tr key={idx}><td><span className={`text-[10px] px-1.5 py-0.5 rounded ${notice.state.includes('접수') || notice.state.includes('공고') ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>{notice.state}</span></td><td className="lh-title-cell"><a href={notice.link} target="_blank" rel="noopener noreferrer">{notice.title}</a></td><td className="text-xs text-slate-400">{notice.noticeDate}</td><td className="text-xs text-slate-400">{notice.deadline}</td></tr>))}
                    </tbody></table>
                  )}
                  {loadingNotices && notices.length === 0 && <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-300"></div></div>}
                </div>
              </section>
            </div>
          </motion.main>
        )}

        {currentPage === 1 && (
          <motion.main key="trello-board" custom={slideDirection} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ type: 'tween', duration: 0.35, ease: 'easeInOut' }} className="h-full w-full flex flex-col" style={{ padding: '1.5rem', maxWidth: '100%', margin: '0 auto' }}>
            <header className="flex items-center justify-between mb-4 shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={() => navigateTo(0)} className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-sky-500 transition-colors"><ArrowLeft size={15} /> 대시보드</button>
                <h1 className="text-xl font-extrabold text-slate-700 tracking-tight">{boardData?.boardName || '트렐로 보드'}</h1>
                {boardData?.boardUrl && <a href={boardData.boardUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-sky-500 transition-colors" title="트렐로에서 열기"><ExternalLink size={14} /></a>}
                <div className="relative">
                  <button onClick={() => { if (!showNotifications) fetchNotifications(); setShowNotifications(!showNotifications); }} className="relative p-1.5 rounded-full text-slate-400 hover:text-sky-500 hover:bg-sky-50 transition-all" title="알림">
                    <Bell size={18} />
                    {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                  </button>
                  {showNotifications && (
                    <div className="absolute top-10 left-0 w-[360px] max-h-[480px] bg-white rounded-xl border border-slate-200 shadow-xl z-50 flex flex-col overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50 shrink-0">
                        <h3 className="text-sm font-bold text-slate-700">알림</h3>
                        <div className="flex items-center gap-2">
                          {unreadCount > 0 && <button onClick={markNotificationsRead} className="text-[11px] text-sky-500 hover:text-sky-700 font-semibold transition-colors">모두 읽음</button>}
                          <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600 text-lg leading-none transition-colors">&times;</button>
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {loadingNotifications ? <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-500"></div></div>
                        : notifications.length === 0 ? <div className="text-center py-8 text-slate-400 text-sm">알림이 없습니다</div>
                        : notifications.map((n) => (
                          <div key={n.id} className={`px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${n.unread ? 'bg-sky-50/30' : ''}`} onClick={() => { if (n.cardUrl) openTrelloPopup(n.cardUrl); }}>
                            <div className="flex items-start gap-2">
                              {n.unread && <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0 mt-1.5"></span>}
                              <div className={`flex-1 min-w-0 ${!n.unread ? 'pl-4' : ''}`}>
                                <div className="text-[12px] font-bold text-slate-600"><span className="text-sky-600">{getNotificationText(n)}</span>{n.cardName && <span className="text-slate-700"> - {n.cardName}</span>}</div>
                                {n.text && <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{n.text}</p>}
                                <div className="flex items-center gap-2 mt-1">{n.boardName && <span className="text-[10px] text-slate-400">{n.boardName}</span>}<span className="text-[10px] text-slate-300">{getTimeAgo(n.date)}</span></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {TRELLO_BOARDS.map((board, idx) => (<button key={board.id} onClick={() => switchBoard(idx)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${selectedBoardIdx === idx ? 'bg-sky-50 border-sky-300 text-sky-600 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'}`}>{board.name}</button>))}
                <button onClick={() => fetchBoardData(TRELLO_BOARDS[selectedBoardIdx].id)} disabled={loadingBoard} className="ml-2 p-1.5 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-sky-500 hover:border-sky-300 transition-all disabled:opacity-40" title="새로고침"><RefreshCw size={14} className={loadingBoard ? 'animate-spin' : ''} /></button>
              </div>
            </header>
            <div className="flex-1 overflow-x-auto overflow-y-hidden min-h-0 relative">
              {loadingBoard && !boardData ? (
                <div className="flex items-center justify-center h-full"><div className="flex flex-col items-center gap-3"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-500"></div><span className="text-sm text-slate-400 font-medium">보드 로딩 중...</span></div></div>
              ) : boardData?.lists ? (
                <div className="flex gap-4 h-full pb-2" style={{ minWidth: boardData.lists.length * 280 + 'px' }}>
                  {boardData.lists.map((list: any) => (
                    <div key={list.id} className="kanban-list flex flex-col rounded-xl border border-slate-200 bg-slate-50/80 w-[272px] shrink-0 overflow-hidden">
                      <div className="px-3 py-2.5 border-b border-slate-200 bg-white/60">
                        <div className="flex items-center justify-between"><h3 className="text-sm font-bold text-slate-700 truncate">{list.name}</h3><span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">{list.cards.length}</span></div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                        {list.cards.map((card: any) => (
                          <div key={card.id} className="kanban-card bg-white rounded-lg border border-slate-150 shadow-sm hover:shadow-md hover:border-sky-200 transition-all cursor-pointer group" onClick={() => openTrelloPopup(card.shortUrl || card.url)}>
                            {card.labels && card.labels.length > 0 && <div className="flex flex-wrap gap-1 px-3 pt-2.5">{card.labels.map((label: any) => <span key={label.id} className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${labelColor(label.color)}`} title={label.name}>{label.name || '   '}</span>)}</div>}
                            <div className="px-3 py-2 overflow-hidden">
                              <p className="text-[13px] font-semibold text-slate-700 leading-snug group-hover:text-sky-600 transition-colors" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                {card.isUrl && card.displayName !== card.name ? (
                                  <span className="flex items-start gap-1"><Link size={12} className="shrink-0 mt-0.5 text-slate-400" /><span>{card.displayName}</span></span>
                                ) : card.isUrl ? (
                                  <span className="flex items-start gap-1 text-[12px] text-slate-500"><Link size={12} className="shrink-0 mt-0.5 text-slate-400" /><span className="line-clamp-2">{card.name}</span></span>
                                ) : (
                                  <span>{card.displayName || card.name}</span>
                                )}
                              </p>
                            </div>
                            {(card.due || (card.badges && (card.badges.checkItems > 0 || card.badges.comments > 0 || card.badges.attachments > 0))) && (
                              <div className="px-3 pb-2 flex items-center gap-2 flex-wrap">
                                {card.due && <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${new Date(card.due) < new Date() ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>{new Date(card.due).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>}
                                {card.badges?.checkItems > 0 && <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${card.badges.checkItemsChecked === card.badges.checkItems ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>&#10003; {card.badges.checkItemsChecked}/{card.badges.checkItems}</span>}
                                {card.badges?.comments > 0 && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">&#128172; {card.badges.comments}</span>}
                                {card.badges?.attachments > 0 && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">&#128206; {card.badges.attachments}</span>}
                              </div>
                            )}
                          </div>
                        ))}
                        {list.cards.length === 0 && <div className="text-center text-slate-400 text-xs py-6 opacity-50">카드 없음</div>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : <div className="flex items-center justify-center h-full"><p className="text-slate-400 text-sm">보드를 선택해주세요.</p></div>}
              {loadingBoard && boardData && <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-[1px] z-10"><div className="flex flex-col items-center gap-2"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div><span className="text-xs text-sky-600 font-bold bg-white/80 px-2 py-0.5 rounded shadow-sm">보드 전환 중...</span></div></div>}
            </div>
          </motion.main>
        )}
      </AnimatePresence>

      {showWeekly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-[#fcfbf7] w-full max-w-[98%] h-[72vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/50 ring-1 ring-black/5">
            <div className="p-6 border-b border-black/5 flex flex-col gap-4 bg-white/60 backdrop-blur-md">
              <div className="flex justify-between items-center w-full">
                <h2 className="text-2xl font-bold text-slate-700 tracking-tight">주간 일정</h2>
                <button onClick={() => setShowWeekly(false)} className="text-slate-400 hover:text-slate-800 text-3xl transition-colors leading-none">&times;</button>
              </div>
              <div className="flex gap-2">{TRELLO_BOARDS.map(board => <button key={board.id} onClick={() => openTrelloPopup(board.url)} className="trello-shortcut-btn">{board.name}</button>)}</div>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-[#f6f5f0]">
              <div className="grid grid-cols-7 gap-4 h-full min-w-[1200px]">
                {[0,1,2,3,4,5,6].map(dayOffset => {
                  const dayTasks = weeklyTasks.filter(t => t.dayIndex === dayOffset);
                  const isToday = dayOffset === 0;
                  return (
                    <div key={dayOffset} className="flex flex-col h-full group" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, dayOffset, true)}>
                      <div className={`p-3 text-center text-sm font-bold rounded-t-xl border-t border-x mb-[-1px] z-10 ${isToday ? 'bg-white border-sky-300 text-sky-600 shadow-sm' : 'bg-[#eaeaea] border-slate-300 text-slate-500'}`}>{getDayName(dayOffset)}</div>
                      <div className={`flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar border rounded-b-xl ${isToday ? 'bg-white border-sky-300 ring-4 ring-sky-50' : 'bg-white border-slate-300'}`}>
                        {dayTasks.map(task => (
                          <div key={task.id} draggable onDragStart={(e) => handleDragStart(e, task)} className={`bg-white p-3 rounded-xl border border-slate-100 shadow-sm hover:border-sky-300 hover:shadow-md transition-all cursor-move ${task.state === 'complete' ? 'opacity-60 bg-slate-50' : ''}`}>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-start gap-2">
                                <input type="checkbox" checked={task.state === 'complete'} onChange={() => handleCheck(task.id, task.cardId, task.state, true)} className="mt-1.5 w-4 h-4 accent-sky-500 rounded-full cursor-pointer" />
                                <div className={`text-[15px] font-bold leading-snug break-keep ${task.state === 'complete' ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                  <button onClick={() => openTrelloPopup(task.cardUrl)} className="hover:text-sky-600 transition-colors text-left">{task.title}</button>
                                </div>
                              </div>
                              <div className="pl-6 text-[13px] text-slate-500 font-medium truncate">[{task.cardName}]</div>
                            </div>
                          </div>
                        ))}
                        {dayTasks.length === 0 && <div className="h-full w-full border-2 border-dashed border-transparent hover:border-slate-300 rounded-xl flex items-center justify-center text-slate-400 text-sm opacity-50">가져다 놓기 (Drag & Drop)</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
