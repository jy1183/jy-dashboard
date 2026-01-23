'use client';

import { useState, useEffect } from 'react';

export default function Home() {
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
      const res = await fetch('/api/todo?days=1'); // Default to today
      const data = await res.json();
      if (data.tasks) setTodos(data.tasks);
    } catch (e) { console.error(e); } finally { setLoadingTodos(false); }
  };

  const openWeeklyView = async () => {
    setShowWeekly(true);
    try {
      const res = await fetch('/api/todo?days=7');
      const data = await res.json();
      if (data.tasks) setWeeklyTasks(data.tasks);
    } catch (e) { console.error(e); }
  };

  const getDayName = (offset: number) => {
    const dates = ['일', '월', '화', '수', '목', '금', '토'];
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return `${dates[d.getDay()]} (${d.getMonth() + 1}/${d.getDate()})`;
  };

  return (
    <main className="dashboard-container relative">
      <header className="dashboard-header">
        <h1 className="dashboard-title">JY BOARD</h1>
      </header>

      <div className="dashboard-grid">

        {/* Top Left: Today's Schedule */}
        <section className="glass-card">
          <div className="card-header">
            <h2 className="card-title">오늘 스케줄</h2>
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

        {/* Top Right: Today's To-Do */}
        <section className="glass-card">
          <div className="card-header">
            <h2 className="card-title">오늘 할일</h2>
            <div className="text-xs text-slate-400">Trello</div>
          </div>
          <div className="card-content flex flex-col">
            {loadingTodos ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-300"></div>
              </div>
            ) : (
              <div className="todo-list flex-1">
                {todos.map((todo, idx) => (
                  <div key={idx} className="todo-item">
                    <input type="checkbox" className="todo-checkbox" />
                    <span className="todo-title" title={todo.title}>{todo.title}</span>
                    <span className="todo-time">
                      {todo.start ? new Date(todo.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                ))}
                {todos.length === 0 && <p className="text-center text-slate-500 py-4 text-sm">오늘 예정된 할일이 없습니다.</p>}
              </div>
            )}
            <div className="mt-3 text-right">
              <button
                onClick={openWeeklyView}
                className="text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors tracking-wide"
              >
                WEEKLY VIEW →
              </button>
            </div>
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
                    <div key={dayOffset} className="flex flex-col h-full group">
                      <div className={`p-3 text-center text-sm font-bold rounded-t-xl border-t border-x mb-[-1px] z-10 
                                      ${isToday ? 'bg-white border-sky-300 text-sky-600 shadow-sm' : 'bg-[#eaeaea] border-slate-300 text-slate-500'}`}>
                        {getDayName(dayOffset)}
                      </div>
                      <div className={`flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar border rounded-b-xl 
                                      ${isToday ? 'bg-white border-sky-300 ring-4 ring-sky-50' : 'bg-white border-slate-300'}`}>
                        {dayTasks.map((task, i) => {
                          // Robust Regex Parsing for Trello Checklist Items
                          let displayDesc = '';
                          const originalDesc = task.description || '';

                          // Regex to capture: [On [CaptureMe] checklist...]
                          // Case insensitive, handles potentially missing 'checklist' word if format varies slightly
                          const match = originalDesc.match(/\[On \[(.*?)\]/i);

                          if (match && match[1]) {
                            displayDesc = match[1].trim();
                          } else {
                            // Fallback cleanup if regex doesn't match specific structure
                            displayDesc = originalDesc
                              .replace(/Assigned to.*/gi, '')
                              .replace(/\[On .*\]/gi, '')
                              .trim();
                          }

                          return (
                            <div key={i} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm hover:border-sky-300 hover:shadow-md transition-all">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-start gap-2">
                                  <input type="checkbox" className="mt-1.5 w-4 h-4 accent-sky-500 rounded-full cursor-pointer opacity-50 hover:opacity-100 transition-opacity" />
                                  <div className="text-[15px] font-bold text-slate-700 leading-snug break-keep">
                                    {task.title}
                                  </div>
                                </div>
                                {displayDesc && (
                                  <div className="pl-6 text-[13px] text-slate-500 font-medium truncate">
                                    [{displayDesc}]
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
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
  );
}
