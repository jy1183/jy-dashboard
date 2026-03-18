'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);

  const [news, setNews] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [todos, setTodos] = useState<any[]>([]);

  // Weekly View State
  const [showWeekly, setShowWeekly] = useState(false);
  const [weeklyTasks, setWeeklyTasks] = useState<any[]>([]);

  const [loadingNews, setLoadingNews] = useState(true);
  const [loadingNotices, setLoadingNotices] = useState(false);
  const [loadingTodos, setLoadingTodos] = useState(true);

  useEffect(() => {
    fetchNews();
    fetchTodos();
    fetchNotices();
  }, []);

  const fetchNews = async () => {
    setLoadingNews(true);
    try {
      const res = await fetch('/api/news');
      const data = await res.json();
      if (data.articles) setNews(data.articles);
    } catch (e) { console.error(e); } finally { setLoadingNews(false); }
  };

  const fetchNotices = async () => {
    setLoadingNotices(true);
    try {
      const res = await fetch('/api/lh');
      const data = await res.json();
      if (data.notices) setNotices(data.notices);
    } catch (e) { console.error(e); } finally { setLoadingNotices(false); }
  };

  const fetchTodos = async () => {
    setLoadingTodos(true);
    try {
      const res = await fetch('/api/trello/checklists?days=3'); 
      const data = await res.json();
      if (data.tasks) setTodos(data.tasks);
    } catch (e) { console.error(e); } finally { setLoadingTodos(false); }
  };

  const openWeeklyView = async () => {
    setShowWeekly(true);
    try {
      const res = await fetch('/api/trello/checklists?days=6'); // 7 days (today + 6)
      const data = await res.json();
      if (data.tasks) setWeeklyTasks(data.tasks);
    } catch (e) { console.error(e); }
  };

  const handleCheck = async (taskId: string, cardId: string, currentState: string, isWeekly: boolean = false) => {
    const newState = currentState === 'complete' ? 'incomplete' : 'complete';
    
    // Optimistic update
    const updateTask = (t: any) => t.id === taskId ? { ...t, state: newState } : t;
    if (isWeekly) setWeeklyTasks(prev => prev.map(updateTask));
    else setTodos(prev => prev.map(updateTask));

    try {
      await fetch('/api/trello/checklists', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId, itemId: taskId, state: newState })
      });
    } catch (e) {
      console.error(e);
      // Revert on error
      const revertTask = (t: any) => t.id === taskId ? { ...t, state: currentState } : t;
      if (isWeekly) setWeeklyTasks(prev => prev.map(revertTask));
      else setTodos(prev => prev.map(revertTask));
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, task: any) => {
    e.dataTransfer.setData('task', JSON.stringify(task));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetDayOffset: number, isWeekly: boolean = false) => {
    e.preventDefault();
    const taskJson = e.dataTransfer.getData('task');
    if (!taskJson) return;
    
    const task = JSON.parse(taskJson);
    if (task.dayIndex === targetDayOffset) return; // No change

    // Calculate new due date: preserve original time if possible, or default
    const currentDue = new Date(task.due);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newDate = new Date(today);
    newDate.setDate(today.getDate() + targetDayOffset);
    newDate.setHours(currentDue.getHours() || 12, currentDue.getMinutes() || 0, 0);
    const newDueIso = newDate.toISOString();

    // Optimistic update
    const updateTask = (t: any) => t.id === task.id ? { ...t, dayIndex: targetDayOffset, due: newDueIso } : t;
    if (isWeekly) setWeeklyTasks(prev => prev.map(updateTask));
    else setTodos(prev => prev.map(updateTask));

    try {
      await fetch('/api/trello/checklists', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: task.cardId, itemId: task.id, dueDate: newDueIso })
      });
    } catch (err) {
      console.error(err);
      // Revert if error
      if (isWeekly) setWeeklyTasks(prev => prev.map(t => t.id === task.id ? task : t));
      else setTodos(prev => prev.map(t => t.id === task.id ? task : t));
    }
  };

  const getDayName = (offset: number) => {
    const dates = ['일', '월', '화', '수', '목', '금', '토'];
    const d = new Date();
    d.setDate(d.getDate() + offset);
    if(offset === 0) return `오늘 (${d.getMonth() + 1}/${d.getDate()})`;
    return `${dates[d.getDay()]} (${d.getMonth() + 1}/${d.getDate()})`;
  };

  const scrollToPanel = (index: number) => {
    if (containerRef.current) {
      const panelWidth = containerRef.current.clientWidth;
      containerRef.current.scrollTo({
        left: panelWidth * index,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div 
      ref={containerRef}
      className="w-screen h-screen overflow-x-auto overflow-y-hidden snap-x snap-mandatory flex custom-scrollbar-hide"
      style={{ scrollBehavior: 'smooth' }}
    >
      {/* =========================================
          PANEL 1: MAIN DASHBOARD 
          ========================================= */}
      <section className="w-screen h-screen flex-shrink-0 snap-center relative">
        <main className="dashboard-container relative h-full">
          <header className="dashboard-header flex justify-between items-center px-4">
            <div className="w-24"></div> {/* Spacer for centering */}
            <h1 className="dashboard-title m-0">WELLASSET BOARD</h1>
            <button 
              onClick={() => scrollToPanel(1)}
              className="group flex items-center gap-2 px-4 py-2 bg-white/50 hover:bg-white/80 border border-slate-200 rounded-full shadow-sm backdrop-blur-md transition-all text-sm font-semibold text-slate-600 hover:text-sky-600"
            >
              Trello Workspace
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </header>

      <div className="dashboard-grid">

        {/* Top Left: Today's Schedule */}
        <section className="glass-card">
          <div className="card-header">
            <h2 className="card-title">스케줄</h2>
          </div>
          <div className="card-content p-0 overflow-hidden relative">
            <iframe
              src="https://calendar.google.com/calendar/embed?src=e1l3et8im3hak9mnto6r64da64%40group.calendar.google.com&ctz=Asia%2FSeoul&mode=AGENDA"
              style={{ border: 0, width: "100%", height: "100%", position: 'absolute', top: 0, left: 0 }}
              frameBorder="0"
              scrolling="no"
            ></iframe>
          </div>
        </section>

        {/* Top Right: Tasks (Today + 3 Days) */}
        <section className="glass-card flex flex-col">
          <div className="card-header shrink-0">
            <h2 className="card-title">할일 일정 (오늘 ~ 3일)</h2>
            <div className="text-xs text-slate-400">Trello API</div>
          </div>
          <div className="card-content flex-1 overflow-hidden">
            {loadingTodos ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-300"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full overflow-y-auto pr-2 custom-scrollbar">
                {[0, 1, 2, 3].map(dayOffset => {
                  const dayTasks = todos.filter(t => t.dayIndex === dayOffset);
                  const isToday = dayOffset === 0;
                  return (
                    <div 
                      key={dayOffset} 
                      className={`flex flex-col h-full rounded-xl border ${isToday ? 'bg-sky-50/30 border-sky-200' : 'bg-white/40 border-slate-100'} overflow-hidden`}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, dayOffset, false)}
                    >
                      <div className={`py-2 px-3 text-center text-sm font-bold border-b ${isToday ? 'bg-sky-100/50 text-sky-700 border-sky-200' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                        {getDayName(dayOffset)}
                      </div>
                      <div className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar">
                        {dayTasks.map((task) => (
                           <div 
                             key={task.id} 
                             draggable
                             onDragStart={(e) => handleDragStart(e, task)}
                             className={`p-2 rounded-lg border shadow-sm transition-all cursor-move ${task.state === 'complete' ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-200 hover:border-sky-300'}`}
                           >
                             <div className="flex items-start gap-2">
                               <input 
                                 type="checkbox" 
                                 checked={task.state === 'complete'} 
                                 onChange={() => handleCheck(task.id, task.cardId, task.state, false)}
                                 className="mt-1 w-4 h-4 accent-sky-500 rounded cursor-pointer" 
                               />
                               <div className="flex-1 min-w-0">
                                 <a href={task.cardUrl} target="_blank" rel="noopener noreferrer" className={`block text-[13px] font-bold leading-tight hover:text-sky-600 transition-colors ${task.state === 'complete' ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                   {task.title}
                                 </a>
                                 <div className="text-[11px] text-slate-500 mt-1 truncate" title={task.cardName}>
                                   {task.cardName}
                                 </div>
                               </div>
                             </div>
                           </div>
                        ))}
                        {dayTasks.length === 0 && (
                          <div className="text-center text-slate-400 text-xs py-4 flex items-center justify-center h-full opacity-50 border-2 border-dashed border-transparent hover:border-slate-300 rounded-lg">가져다 놓기 (Drag & Drop)</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="shrink-0 mt-3 text-right">
            <button
              onClick={openWeeklyView}
              className="text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors tracking-wide"
            >
              WEEKLY VIEW →
            </button>
          </div>
        </section>

        {/* Bottom Left: Real Estate News */}
        <section className="glass-card">
          <div className="card-header">
            <h2 className="card-title">부동산 뉴스</h2>
            <div className="text-xs text-slate-400">bdsplanet</div>
          </div>
          <div className="card-content">
            {loadingNews ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-300"></div>
              </div>
            ) : (
              <ul>
                {news.map((item, idx) => (
                  <li key={idx} className="news-item">
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="news-link">
                      {item.title}
                    </a>
                    <span className="news-meta">{item.media}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Bottom Right: LH Purchase Notice */}
        <section className="glass-card">
          <div className="card-header">
            <h2 className="card-title">
              <a href="https://apply.lh.or.kr/lhapply/apply/pch/list.do?mi=1076" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
                LH 매입공고
              </a>
            </h2>
            <button className="refresh-btn text-xs bg-slate-200 hover:bg-slate-300 px-2 py-1 rounded text-slate-600" onClick={fetchNotices} disabled={loadingNotices}>
              {loadingNotices ? '...' : '새로고침'}
            </button>
          </div>
          <div className="card-content">
            {notices.length === 0 && !loadingNotices ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-slate-500 text-sm">데이터가 없습니다.</p>
              </div>
            ) : (
              <table className="lh-table">
                <thead>
                  <tr>
                    <th className="w-14">상태</th>
                    <th>공고명</th>
                    <th className="w-20">공고일</th>
                    <th className="w-20">마감일</th>
                  </tr>
                </thead>
                <tbody>
                  {notices.map((notice, idx) => (
                    <tr key={idx}>
                      <td>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${notice.state.includes('접수') || notice.state.includes('공고') ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                          {notice.state}
                        </span>
                      </td>
                      <td className="lh-title-cell">
                        <a href={notice.link} target="_blank" rel="noopener noreferrer">
                          {notice.title}
                        </a>
                      </td>
                      <td className="text-xs text-slate-400">{notice.noticeDate}</td>
                      <td className="text-xs text-slate-400">{notice.deadline}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {loadingNotices && notices.length === 0 && (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-300"></div>
              </div>
            )}
          </div>
        </section>

      </div>

      {/* Weekly View Modal */}
      {showWeekly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-[#fcfbf7] w-full max-w-[98%] h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/50 ring-1 ring-black/5">
            <div className="p-6 border-b border-black/5 flex justify-between items-center bg-white/60 backdrop-blur-md">
              <h2 className="text-2xl font-bold text-slate-700 tracking-tight">주간 일정</h2>
              <button onClick={() => setShowWeekly(false)} className="text-slate-400 hover:text-slate-800 text-3xl transition-colors leading-none">&times;</button>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-[#f6f5f0]">
              <div className="grid grid-cols-7 gap-4 h-full min-w-[1200px]">
                {[0, 1, 2, 3, 4, 5, 6].map(dayOffset => {
                  const dayTasks = weeklyTasks.filter(t => t.dayIndex === dayOffset);
                  const isToday = dayOffset === 0;
                  return (
                    <div 
                      key={dayOffset} 
                      className="flex flex-col h-full group"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, dayOffset, true)}
                    >
                      <div className={`p-3 text-center text-sm font-bold rounded-t-xl border-t border-x mb-[-1px] z-10 
                                      ${isToday ? 'bg-white border-sky-300 text-sky-600 shadow-sm' : 'bg-[#eaeaea] border-slate-300 text-slate-500'}`}>
                        {getDayName(dayOffset)}
                      </div>
                      <div className={`flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar border rounded-b-xl 
                                      ${isToday ? 'bg-white border-sky-300 ring-4 ring-sky-50' : 'bg-white border-slate-300'}`}>
                        {dayTasks.map((task) => {
                          return (
                            <div 
                              key={task.id} 
                              draggable
                              onDragStart={(e) => handleDragStart(e, task)}
                              className={`bg-white p-3 rounded-xl border border-slate-100 shadow-sm hover:border-sky-300 hover:shadow-md transition-all cursor-move ${task.state === 'complete' ? 'opacity-60 bg-slate-50' : ''}`}
                            >
                              <div className="flex flex-col gap-1">
                                <div className="flex items-start gap-2">
                                  <input 
                                    type="checkbox" 
                                    checked={task.state === 'complete'}
                                    onChange={() => handleCheck(task.id, task.cardId, task.state, true)}
                                    className="mt-1.5 w-4 h-4 accent-sky-500 rounded-full cursor-pointer hover:opacity-100 transition-opacity" 
                                  />
                                  <div className={`text-[15px] font-bold leading-snug break-keep ${task.state === 'complete' ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                    <a href={task.cardUrl} target="_blank" rel="noopener noreferrer" className="hover:text-sky-600 transition-colors">
                                      {task.title}
                                    </a>
                                  </div>
                                </div>
                                <div className="pl-6 text-[13px] text-slate-500 font-medium truncate">
                                  [{task.cardName}]
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {dayTasks.length === 0 && (
                          <div className="h-full w-full border-2 border-dashed border-transparent hover:border-slate-300 rounded-xl flex items-center justify-center text-slate-400 text-sm opacity-50">
                            가져다 놓기 (Drag & Drop)
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          </div>
        )}
      </main>
    </section>

    {/* =========================================
        PANEL 2: TRELLO WORKSPACE 
        ========================================= */}
    <section className="w-screen h-screen flex-shrink-0 snap-center relative bg-[#fdfbf7]">
      <main className="dashboard-container relative h-full flex flex-col">
          <header className="dashboard-header flex justify-between items-center px-4">
            <button 
              onClick={() => scrollToPanel(0)}
              className="group flex items-center gap-2 px-4 py-2 bg-white/50 hover:bg-white/80 border border-slate-200 rounded-full shadow-sm backdrop-blur-md transition-all text-sm font-semibold text-slate-600 hover:text-sky-600"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Main Board
            </button>
            <h1 className="dashboard-title m-0">TRELLO WORKSPACE</h1>
            <div className="w-32"></div> {/* Spacer for centering */}
          </header>

          <div className="flex-1 mt-4 p-2 glass-card h-full overflow-hidden">
             {/* Trello Embed. Note: since it's mounted, navigation is preserved on swipe! */}
             <iframe 
               src="https://trello.com/b/XOH8XjzB.html" 
               className="w-full h-full rounded-lg border-0"
               allow="clipboard-read; clipboard-write; fullscreen"
             ></iframe>
          </div>
      </main>
    </section>

    </div>
  );
}
